import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { LogManager } from './logManager';

// Configurar cómo se comportan las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  })
});

export const NotificationService = {
  /**
   * Solicita permisos de notificaciones nativas en el arranque de la app (iOS y Android)
   */
  async requestNotificationPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;

      LogManager.addLog('[NOTIFICACIONES] Solicitando permisos del sistema...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        LogManager.addLog('[NOTIFICACIONES] Permiso denegado por el usuario.');
        return false;
      }

      LogManager.addLog('[NOTIFICACIONES] Permiso concedido exitosamente.');

      // En Android, configurar el canal de alta prioridad para avisos de hardware y actualizaciones
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Notificaciones del Sistema',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#00E5FF'
        });
      }

      return true;
    } catch (e: any) {
      LogManager.addLog(`[NOTIFICACIONES ERROR] ${e?.message || e}`);
      return false;
    }
  },

  /**
   * Envía una notificación local de prueba o alerta de sistema
   */
  async sendLocalNotification(title: string, body: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true
        },
        trigger: null // disparo inmediato
      });
    } catch (e: any) {
      LogManager.addLog(`[NOTIFICACIONES ERROR] No se pudo enviar notificación: ${e?.message}`);
    }
  }
};
