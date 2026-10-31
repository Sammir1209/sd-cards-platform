import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Mail, Lock, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import { MONIQ } from '../../theme/colors';
import { api } from '../../services/api';

interface LoginScreenProps {
  onLogin: (email: string, role: 'superadmin' | 'buyer', businessId?: number) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setErrorMsg('Ingresa tu correo o identificador de acceso.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Ingresa tu contrasena de acceso.');
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
      <View style={styles.brandBox}>
        <View style={styles.brandBadge}>
          <ShieldCheck size={14} color={MONIQ.cyan} />
          <Text style={styles.brandBadgeText}>S & D PLATFORM</Text>
        </View>
        <Text style={styles.brandTitle}>Bienvenido</Text>
        <Text style={styles.brandSub}>
          Ingresa tus credenciales para acceder a la gestión de las Tarjetas NFC y servicios.
        </Text>
      </View>

      <View style={styles.formCard}>
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <Text style={styles.inputLabel}>CORREO ELECTRÓNICO</Text>
        <View style={styles.inputWrap}>
          <Mail size={18} color={MONIQ.textSecondary} style={{ marginRight: 12 }} />
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="usuario@negocio.com"
            placeholderTextColor={MONIQ.textMuted}
            autoCapitalize="none"
          />
        </View>

        <Text style={[styles.inputLabel, { marginTop: 16 }]}>CONTRASEÑA</Text>
        <View style={styles.inputWrap}>
          <Lock size={18} color={MONIQ.textSecondary} style={{ marginRight: 12 }} />
          <TextInput
            style={styles.textInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            placeholder="••••••••"
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

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Iniciar Sesión</Text>
              <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerText}>
          Ecosistema Seguro S & D • Conexión Cifrada
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center'
  },
  brandBox: {
    marginBottom: 28
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    alignSelf: 'flex-start',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  brandBadgeText: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 6
  },
  brandTitle: {
    color: MONIQ.textPrimary,
    fontSize: 32,
    fontWeight: '900'
  },
  brandSub: {
    color: MONIQ.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  },
  formCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  errorText: {
    color: MONIQ.negative,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12
  },
  inputLabel: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.bg,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  textInput: {
    flex: 1,
    color: MONIQ.textPrimary,
    fontSize: 14
  },
  eyeBtn: {
    padding: 6
  },
  submitBtn: {
    backgroundColor: MONIQ.accent,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800'
  },
  footerNote: {
    marginTop: 32,
    alignItems: 'center'
  },
  footerText: {
    color: MONIQ.textMuted,
    fontSize: 11
  }
});
