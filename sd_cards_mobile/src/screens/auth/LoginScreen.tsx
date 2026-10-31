import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
  Dimensions
} from 'react-native';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react-native';
import { MONIQ } from '../../theme/colors';
import { api } from '../../services/api';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
  onLogin: (email: string, role: 'superadmin' | 'buyer', businessId?: number) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMsg('Ingresa tu identificador o correo.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Ingresa tu clave de acceso.');
      return;
    }
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await api.login({ email: email.trim(), password: password.trim() });
      setLoading(false);

      if (res.success && res.data) {
        onLogin(res.data.email || email.trim(), res.data.role, res.data.businessId);
      } else {
        setErrorMsg(res.error || 'Credenciales invalidas o cuenta suspendida.');
      }
    } catch (e: any) {
      setLoading(false);
      setErrorMsg(e?.message || 'Error de conexion con el servidor.');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.contentWrap}>
        
        {/* LOGO E IDENTIFICADOR MINIMALISTA */}
        <View style={styles.headerSection}>
          <View style={styles.logoRing}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>Acceso al Sistema</Text>
          <Text style={styles.headerSubtitle}>
            Administracion de tarjetas fisicas y servicios
          </Text>
        </View>

        {/* TARJETA DE FORMULARIO CON ESTILO FINTECH */}
        <View style={styles.formCard}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* INPUT: CORREO */}
          <Text style={styles.inputLabel}>USUARIO / CORREO</Text>
          <View style={[styles.inputContainer, isEmailFocused && styles.inputFocused]}>
            <Mail size={18} color={isEmailFocused ? MONIQ.cyan : MONIQ.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={styles.textInput}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              placeholder="admin o usuario@negocio.com"
              placeholderTextColor={MONIQ.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* INPUT: CONTRASEÑA */}
          <Text style={[styles.inputLabel, { marginTop: 18 }]}>CLAVE DE SEGURIDAD</Text>
          <View style={[styles.inputContainer, isPassFocused && styles.inputFocused]}>
            <Lock size={18} color={isPassFocused ? MONIQ.cyan : MONIQ.textSecondary} style={{ marginRight: 12 }} />
            <TextInput
              style={styles.textInput}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setIsPassFocused(true)}
              onBlur={() => setIsPassFocused(false)}
              secureTextEntry={!showPassword}
              placeholder="Clave de acceso"
              placeholderTextColor={MONIQ.textMuted}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={18} color={MONIQ.textSecondary} />
              ) : (
                <Eye size={18} color={MONIQ.textSecondary} />
              )}
            </TouchableOpacity>
          </View>

          {/* BOTON DE ACCION PRINCIPAL */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Entrar al Sistema</Text>
                <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* PIE DE SEGURIDAD */}
        <View style={styles.footerWrap}>
          <Text style={styles.footerText}>
            Canal Seguro • Encriptacion de Hardware
          </Text>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MONIQ.bg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  contentWrap: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center'
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28
  },
  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: MONIQ.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
    shadowColor: MONIQ.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 16
  },
  headerTitle: {
    color: MONIQ.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  headerSubtitle: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center'
  },
  formCard: {
    width: '100%',
    backgroundColor: MONIQ.surface,
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  errorText: {
    color: MONIQ.negative,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  inputLabel: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 8
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.bg,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  inputFocused: {
    borderColor: MONIQ.cyan,
    backgroundColor: 'rgba(0, 229, 255, 0.02)'
  },
  textInput: {
    flex: 1,
    color: MONIQ.textPrimary,
    fontSize: 14,
    fontWeight: '600'
  },
  eyeBtn: {
    padding: 6
  },
  submitBtn: {
    backgroundColor: MONIQ.accent,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: MONIQ.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  footerWrap: {
    marginTop: 28,
    alignItems: 'center'
  },
  footerText: {
    color: MONIQ.textMuted,
    fontSize: 11,
    fontWeight: '600'
  }
});
