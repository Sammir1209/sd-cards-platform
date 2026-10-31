import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  Platform,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LogOut } from 'lucide-react-native';
import { MONIQ } from './src/theme/colors';
import { SplashScreen } from './src/screens/auth/SplashScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { SuperAdminScreen } from './src/screens/admin/SuperAdminScreen';
import { BuyerPortalScreen } from './src/screens/buyer/BuyerPortalScreen';

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [session, setSession] = useState<{
    isAuthenticated: boolean;
    email: string;
    role: 'superadmin' | 'buyer';
    businessId?: number;
  }>({
    isAuthenticated: false,
    email: '',
    role: 'buyer'
  });

  useEffect(() => {
    // Pantalla de carga interactiva con mensajes dinámicos
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (email: string, role: 'superadmin' | 'buyer', businessId?: number) => {
    setSession({
      isAuthenticated: true,
      email,
      role,
      businessId: businessId || 1
    });
  };

  const handleLogout = () => {
    setSession({
      isAuthenticated: false,
      email: '',
      role: 'buyer'
    });
  };

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

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <LogOut size={16} color={MONIQ.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* CONTENIDO REAL SEGÚN EL ROL */}
      <View style={styles.mainContainer}>
        {session.role === 'superadmin' ? (
          <SuperAdminScreen />
        ) : (
          <BuyerPortalScreen businessId={session.businessId || 1} />
        )}
      </View>
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MONIQ.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  mainContainer: {
    flex: 1
  }
});
