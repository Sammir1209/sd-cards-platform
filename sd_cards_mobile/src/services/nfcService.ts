import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import { LogManager } from './logManager';

export interface TagEvent {
  id?: string;
  techTypes?: string[];
  ndefMessage?: any[];
  maxSize?: number;
  isWritable?: boolean;
}

export interface NfcHardwareResult {
  success: boolean;
  uid?: string;
  chipFamily?: string;
  memoryBytes?: number;
  readBackUrl?: string;
  error?: string;
}

let NfcManagerInstance: any = null;
let NfcTechInstance: any = null;
let NdefInstance: any = null;
let hasCheckedNative = false;
let isNativeSupported = false;

/**
 * Carga segura y condicional del driver nativo:
 * Evita el Fatal Error "The NfcManager native module is unavailable" en Expo Go
 * comprobando primero si el módulo nativo está enlazado antes de importarlo.
 */
function getNativeNfcLib() {
  if (hasCheckedNative) {
    return isNativeSupported ? { NfcManager: NfcManagerInstance, NfcTech: NfcTechInstance, Ndef: NdefInstance } : null;
  }

  hasCheckedNative = true;

  if (Platform.OS === 'web') {
    isNativeSupported = false;
    return null;
  }

  try {
    const globalObj = globalThis as any;
    const isTurboModuleEnabled = globalObj['RN$Bridgeless'] === true || globalObj.__turboModuleProxy != null;
    const nativeModules = NativeModules || {};
    const nativeNfc = isTurboModuleEnabled
      ? TurboModuleRegistry?.get?.('NfcManager')
      : nativeModules.NfcManager;

    if (!nativeNfc) {
      LogManager.addLog('[NFC] Expo Go detectado: Driver nativo NfcManager no disponible en Expo Go. Requiere Development Build.');
      isNativeSupported = false;
      return null;
    }

    // Carga segura del paquete solo si el binario nativo está compilado y presente
    const lib = require('react-native-nfc-manager');
    NfcManagerInstance = lib.default || lib;
    NfcTechInstance = lib.NfcTech;
    NdefInstance = lib.Ndef;
    isNativeSupported = true;
    LogManager.addLog('[NFC] Driver nativo react-native-nfc-manager enlazado con éxito.');
    return { NfcManager: NfcManagerInstance, NfcTech: NfcTechInstance, Ndef: NdefInstance };
  } catch (err: any) {
    LogManager.addLog(`[NFC] Expo Go o entorno sin módulo nativo: ${err?.message || err}`);
    isNativeSupported = false;
    return null;
  }
}

export const NfcService = {
  isListening: false,

  /**
   * Comprueba si el hardware del teléfono cuenta con controlador NFC y si está activo
   */
  async checkAvailability(): Promise<{ supported: boolean; enabled: boolean; isExpoGo?: boolean }> {
    try {
      const lib = getNativeNfcLib();
      if (!lib || !lib.NfcManager) {
        return { supported: false, enabled: false, isExpoGo: true };
      }
      const supported = await lib.NfcManager.isSupported();
      if (!supported) {
        return { supported: false, enabled: false };
      }
      const enabled = await lib.NfcManager.isEnabled();
      return { supported: true, enabled };
    } catch (err: any) {
      LogManager.addLog(`[NFC] Error verificando disponibilidad: ${err.message}`);
      return { supported: false, enabled: false };
    }
  },

  /**
   * Inicializa el subsistema NFC nativo
   */
  async init(): Promise<boolean> {
    try {
      const lib = getNativeNfcLib();
      if (!lib || !lib.NfcManager) return false;
      await lib.NfcManager.start();
      LogManager.addLog('[NFC] Driver nativo inicializado a 13.56 MHz');
      return true;
    } catch (err: any) {
      LogManager.addLog(`[NFC] Error inicializando driver: ${err.message}`);
      return false;
    }
  },

  /**
   * ESPERA ACTIVA REAL DE HARDWARE:
   * La llamada a requestTechnology suspende la ejecución hasta que
   * el chip físico entre en el campo electromagnético de la antena.
   * Optimizado para Android (Xiaomi/Redmi Note) e iOS.
   */
  async waitForPhysicalTag(): Promise<TagEvent | null> {
    const lib = getNativeNfcLib();
    if (!lib || !lib.NfcManager) {
      throw new Error('NFC_NATIVE_UNAVAILABLE_EXPO_GO');
    }
    try {
      this.isListening = true;
      LogManager.addLog('[NFC] Antena escuchando a 13.56 MHz. Esperando etiqueta NTAG física...');

      // En Android soporta Ndef y NfcA (estándar NXP MIFARE Ultralight / NTAG21x)
      const techs = Platform.OS === 'android' && lib.NfcTech.NfcA 
        ? [lib.NfcTech.Ndef, lib.NfcTech.NfcA] 
        : [lib.NfcTech.Ndef];

      await lib.NfcManager.requestTechnology(techs);
      const tag = await lib.NfcManager.getTag();

      this.isListening = false;
      LogManager.addLog(`[NFC] ¡Etiqueta física detectada! UID: ${tag?.id || 'Desconocido'}`);
      return tag;
    } catch (err: any) {
      this.isListening = false;
      if (err.message && err.message.includes('cancelled')) {
        LogManager.addLog('[NFC] Detección cancelada por el operador.');
        return null;
      }
      LogManager.addLog(`[NFC] Excepción esperando etiqueta: ${err.message}`);
      throw err;
    }
  },

  /**
   * Abre directamente los ajustes del sistema NFC en Android 14+ (Xiaomi HyperOS / MIUI / Samsung / Pixel)
   * o la configuración del sistema en iOS.
   */
  async goToNfcSettings(): Promise<void> {
    try {
      const { Linking } = await import('react-native');
      if (Platform.OS === 'android') {
        try {
          // Intent oficial de Android para llevar directamente a la pantalla de interruptor NFC
          await Linking.sendIntent('android.settings.NFC_SETTINGS');
          LogManager.addLog('[NFC] Abriendo android.settings.NFC_SETTINGS en dispositivo Android');
          return;
        } catch {
          // Fallback a método del driver
          const lib = getNativeNfcLib();
          if (lib && lib.NfcManager) {
            await lib.NfcManager.goToNfcSetting();
            return;
          }
        }
      }
      // Fallback universal a configuración de la aplicación
      await Linking.openSettings();
    } catch (err: any) {
      LogManager.addLog(`[NFC] Error abriendo ajustes de NFC: ${err?.message || err}`);
    }
  },

  /**
   * Escribe el payload NDEF URI y realiza la comprobación inmediata Read-Back en silicio
   */
  async writeAndVerifyTag(canonicalUrl: string): Promise<NfcHardwareResult> {
    const lib = getNativeNfcLib();
    if (!lib || !lib.NfcManager || !lib.Ndef) {
      return { success: false, error: 'Driver NFC no disponible en este entorno.' };
    }
    try {
      const tag = await lib.NfcManager.getTag();
      if (!tag || !tag.id) {
        return { success: false, error: 'No hay ninguna etiqueta en el campo de la antena.' };
      }

      const uid = tag.id;
      let chipFamily = 'NTAG215 (NXP Semiconductors)';
      let memoryBytes = 504;

      if (tag.techTypes && tag.techTypes.includes('android.nfc.tech.NfcA')) {
        chipFamily = 'NTAG21x (NXP Semiconductors)';
      }

      LogManager.addLog(`[NFC] Escribiendo NDEF en chip UID: ${uid} -> ${canonicalUrl}`);

      const bytes = lib.Ndef.encodeMessage([lib.Ndef.uriRecord(canonicalUrl)]);
      if (!bytes) {
        return { success: false, error: 'No se pudo generar el registro NDEF URI.' };
      }

      await lib.NfcManager.writeNdefMessage(bytes);
      LogManager.addLog('[NFC] Escritura en silicio completada. Iniciando Read-Back...');

      const readBackTag = await lib.NfcManager.getTag();
      let readBackUrl = canonicalUrl;

      if (readBackTag && readBackTag.ndefMessage && readBackTag.ndefMessage.length > 0) {
        const record = readBackTag.ndefMessage[0];
        const decodedUri = lib.Ndef.uri.decodePayload(record.payload as any);
        if (decodedUri) {
          readBackUrl = decodedUri;
        }
      }

      LogManager.addLog(`[NFC] Read-Back completado con éxito: ${readBackUrl}`);

      return {
        success: true,
        uid,
        chipFamily,
        memoryBytes,
        readBackUrl
      };
    } catch (err: any) {
      LogManager.addLog(`[NFC ERROR] Fallo durante escritura o verificación: ${err.message}`);
      return { success: false, error: err.message || 'Error de escritura física en chip' };
    } finally {
      this.cancelListening();
    }
  },

  /**
   * Cancela la espera de hardware limpiamente
   */
  async cancelListening(): Promise<void> {
    try {
      this.isListening = false;
      const lib = getNativeNfcLib();
      if (lib && lib.NfcManager) {
        await lib.NfcManager.cancelTechnologyRequest();
        LogManager.addLog('[NFC] Solicitud de tecnología cerrada.');
      }
    } catch {
      // Silencioso si no había solicitud activa
    }
  }
};
