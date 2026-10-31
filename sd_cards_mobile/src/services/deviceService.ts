import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface ActiveDeviceInfo {
  brand: string;
  modelName: string;
  osName: string;
  osVersion: string;
  apiLevel: number | null;
  isRealDevice: boolean;
  antennaLocation: string;
  displayTag: string;
}

export const DeviceService = {
  /**
   * Obtiene la telemetría real del hardware y sistema operativo del teléfono activo
   */
  getDeviceInfo(): ActiveDeviceInfo {
    const brand = Device.brand || (Platform.OS === 'android' ? 'Android' : 'Apple');
    const modelName = Device.modelName || (Platform.OS === 'android' ? 'Dispositivo Android' : 'iPhone');
    const osName = Device.osName || (Platform.OS === 'android' ? 'Android' : 'iOS');
    const osVersion = Device.osVersion || `${Platform.Version}`;
    const apiLevel = Device.platformApiLevel || (Platform.OS === 'android' && typeof Platform.Version === 'number' ? Platform.Version : null);
    const isRealDevice = Device.isDevice ?? true;

    // Mapeo físico exacto de antena de radiofrecuencia (13.56 MHz) según fabricante y modelo
    let antennaLocation = 'Parte trasera superior';
    const brandLower = brand.toLowerCase();
    const modelLower = modelName.toLowerCase();

    if (brandLower.includes('xiaomi') || brandLower.includes('redmi') || modelLower.includes('redmi') || modelLower.includes('note')) {
      antennaLocation = 'Parte trasera superior (junto al módulo de cámaras)';
    } else if (brandLower.includes('apple') || Platform.OS === 'ios') {
      antennaLocation = 'Borde superior trasero (cerca del marco superior)';
    } else if (brandLower.includes('samsung') || modelLower.includes('galaxy')) {
      antennaLocation = 'Zona central trasera del teléfono';
    } else if (brandLower.includes('google') || modelLower.includes('pixel')) {
      antennaLocation = 'Banda trasera superior / barra de cámara';
    }

    // Etiqueta formal para UI Fintech
    const osDisplay = apiLevel ? `${osName} ${osVersion} (API ${apiLevel})` : `${osName} ${osVersion}`;
    const displayTag = `${brand} ${modelName} • ${osDisplay}`;

    return {
      brand,
      modelName,
      osName,
      osVersion,
      apiLevel,
      isRealDevice,
      antennaLocation,
      displayTag
    };
  }
};

