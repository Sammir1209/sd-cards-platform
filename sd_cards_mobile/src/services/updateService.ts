import { Linking, Platform } from 'react-native';
import { api } from './api';
import { LogManager } from './logManager';

export const CURRENT_APP_VERSION = '1.0.0';
export const CURRENT_BUILD_NUMBER = 1;

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseDate: string;
  apkUrl: string;
  directDownloadUrl: string;
  changelog: string[];
  forceUpdate: boolean;
}

export const UpdateService = {
  getCurrentVersion(): string {
    return CURRENT_APP_VERSION;
  },

  getCurrentBuild(): number {
    return CURRENT_BUILD_NUMBER;
  },

  /**
   * Compara dos versiones semánticas (ej. '1.1.0' vs '1.0.0')
   * Retorna true si v1 > v2
   */
  isNewerVersion(remoteVer: string, localVer: string): boolean {
    const parse = (v: string) => v.split('.').map(n => parseInt(n, 10) || 0);
    const r = parse(remoteVer);
    const l = parse(localVer);

    for (let i = 0; i < Math.max(r.length, l.length); i++) {
      const rNum = r[i] || 0;
      const lNum = l[i] || 0;
      if (rNum > lNum) return true;
      if (rNum < lNum) return false;
    }
    return false;
  },

  /**
   * Consulta al backend si existe una nueva versión compilada lista para descargar
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    try {
      LogManager.addLog('[ACTUALIZACION] Comprobando disponibilidad de nueva version...');
      const serverData = await api.getAppVersionInfo();

      if (!serverData) {
        return {
          hasUpdate: false,
          currentVersion: CURRENT_APP_VERSION,
          latestVersion: CURRENT_APP_VERSION,
          releaseDate: '',
          apkUrl: '',
          directDownloadUrl: '',
          changelog: [],
          forceUpdate: false
        };
      }

      const remoteVer = serverData.version || CURRENT_APP_VERSION;
      const hasUpdate = this.isNewerVersion(remoteVer, CURRENT_APP_VERSION);

      if (hasUpdate) {
        LogManager.addLog(`[ACTUALIZACION] ¡Nueva version detectada: v${remoteVer}! (Actual: v${CURRENT_APP_VERSION})`);
      } else {
        LogManager.addLog('[ACTUALIZACION] El sistema se encuentra en la version mas reciente.');
      }

      return {
        hasUpdate,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: remoteVer,
        releaseDate: serverData.releaseDate || '',
        apkUrl: serverData.apkUrl || '',
        directDownloadUrl: serverData.directDownloadUrl || serverData.apkUrl || '',
        changelog: serverData.changelog || [
          'Mejoras generales de rendimiento.',
          'Optimizacion de velocidad en saltos directos.'
        ],
        forceUpdate: !!serverData.forceUpdate
      };
    } catch (e: any) {
      LogManager.addLog(`[ACTUALIZACION] Error consultando version: ${e?.message || e}`);
      return {
        hasUpdate: false,
        currentVersion: CURRENT_APP_VERSION,
        latestVersion: CURRENT_APP_VERSION,
        releaseDate: '',
        apkUrl: '',
        directDownloadUrl: '',
        changelog: [],
        forceUpdate: false
      };
    }
  },

  /**
   * Inicia la descarga e instalación del archivo APK directamente sin fricción
   */
  async downloadAndInstall(url: string): Promise<boolean> {
    if (!url) return false;
    try {
      LogManager.addLog(`[ACTUALIZACION] Abriendo enlace de descarga directa: ${url}`);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (e: any) {
      LogManager.addLog(`[ACTUALIZACION] Error al iniciar descarga: ${e?.message || e}`);
      return false;
    }
  }
};
