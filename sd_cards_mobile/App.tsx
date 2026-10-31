import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LogOut, Sparkles, ArrowRight } from 'lucide-react-native';
import { MONIQ } from './src/theme/colors';
import { SplashScreen } from './src/screens/auth/SplashScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SuperAdminScreen } from './src/screens/admin/SuperAdminScreen';
import { BuyerPortalScreen } from './src/screens/buyer/BuyerPortalScreen';
import { UpdateService, UpdateCheckResult } from './src/services/updateService';
import { UpdateModal } from './src/components/UpdateModal';
import { NotificationService } from './src/services/notificationService';
import { AuthStorage, StoredSession } from './src/services/authStorage';
import { api } from './src/services/api';

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [session, setSession] = useState<StoredSession>({
    isAuthenticated: false,
    email: '',
    role: 'buyer'
  });

  const handleLogout = async () => {
    await AuthStorage.clearSession();
    api.setAuthToken(null);
    setSession({
      isAuthenticated: false,
      email: '',
      role: 'buyer'
    });
  };

  const confirmLogout = () => {
    Alert.alert(
      'Cerrar Sesion',
      'Deseas cerrar tu sesion actual? Solo al presionar Cerrar Sesion se cerrara tu acceso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesion', style: 'destructive', onPress: handleLogout }
      ]
    );
  };

  const handleLogin = async (
    email: string,
    role: 'superadmin' | 'buyer',
    businessId?: number,
    token?: string,
    businessName?: string,
    ownerName?: string,
    slug?: string
  ) => {
    const activeToken = token || api.getAuthToken() || `SD-AUTH-${Date.now()}`;
    api.setAuthToken(activeToken);

    const newSession: StoredSession = {
      isAuthenticated: true,
      email,
      role,
      businessId: businessId || 1,
      token: activeToken,
      businessName,
      ownerName,
      slug
    };

    setSession(newSession);
    await AuthStorage.saveSession(newSession);
  };

  useEffect(() => {
    // Registrar callback ante respuestas 401 Unauthorized
    api.setOnUnauthorized(() => {
      handleLogout();
    });

    // Solicitar permisos nativos de notificaciones en el arranque
    NotificationService.requestNotificationPermissions();

    // Comprobar actualizaciones del sistema en segundo plano
    UpdateService.checkForUpdates().then(res => {
      if (res) {
        setUpdateInfo(res);
      }
    });

    let isMounted = true;

    // Restauración asíncrona de sesión persistente con splash interactivo
    const bootstrapApp = async () => {
      try {
        const [stored] = await Promise.all([
          AuthStorage.getSession(),
          new Promise(resolve => setTimeout(resolve, 1200))
        ]);

        if (isMounted && stored && stored.isAuthenticated) {
          api.setAuthToken(stored.token || null);
          setSession(stored);
        }
      } catch (err) {
        console.error('[App] Error al restaurar sesión persistente:', err);
      } finally {
        if (isMounted) {
          setIsAppLoading(false);
        }
      }
    };

    bootstrapApp();

    return () => {
      isMounted = false;
    };
  }, []);

  // PANTALLA DE CARGA (SPLASH) INTERACTIVA
  if (isAppLoading) {
    return <SplashScreen />;
  }

  // PANTALLA DE LOGIN
  if (!session.isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* HEADER ERGONOMICO CON LOGO MINIMALISTA Y CIERRE DE SESION */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <Image
            source={require('./assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerRoleMicro}>
              {session.role === 'superadmin' ? 'PANEL MAESTRO' : 'PORTAL COMERCIAL'}
            </Text>
            <Text style={styles.headerUserEmail}>{session.email}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={confirmLogout}
          activeOpacity={0.7}
          accessibilityLabel="Cerrar Sesion"
        >
          <LogOut size={13} color={MONIQ.negative} style={{ marginRight: 5 }} />
          <Text style={styles.logoutBtnText}>Cerrar Sesion</Text>
        </TouchableOpacity>
      </View>

      {/* BANNER FLOTANTE DE ACTUALIZACION DISPONIBLE */}
      {updateInfo?.hasUpdate && (
        <TouchableOpacity
          style={styles.updateNoticeBanner}
          onPress={() => setShowUpdateModal(true)}
          activeOpacity={0.85}
        >
          <Sparkles size={13} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.updateNoticeText}>
            Nueva version v{updateInfo.latestVersion} lista. Toca aqui para actualizar.
          </Text>
          <ArrowRight size={13} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      )}

      {/* CONTENIDO REAL SEGÚN EL ROL */}
      <View style={styles.mainContainer}>
        {session.role === 'superadmin' ? (
          <SuperAdminScreen />
        ) : (
          <BuyerPortalScreen businessId={session.businessId || 1} />
        )}
      </View>

      {/* MODAL IN-APP DE INFORMACION Y ACTUALIZACION */}
      <UpdateModal
        visible={showUpdateModal}
        updateData={updateInfo}
        onClose={() => setShowUpdateModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: MONIQ.bg
  },
  appHeader: {
    paddingTop: Platform.OS === 'android' ? 48 : 36,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: MONIQ.cardBorder,
    backgroundColor: MONIQ.bg
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 8
  },
  headerRoleMicro: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  headerUserEmail: {
    color: MONIQ.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.3)'
  },
  logoutBtnText: {
    color: MONIQ.negative,
    fontSize: 11,
    fontWeight: '700'
  },
  updateNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MONIQ.accent,
    paddingVertical: 8,
    paddingHorizontal: 16
  },
  updateNoticeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  mainContainer: {
    flex: 1
  }
});
