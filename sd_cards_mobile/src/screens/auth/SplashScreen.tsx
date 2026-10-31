import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Cpu, ShieldCheck, CheckCircle2, Radio } from 'lucide-react-native';
import { MONIQ } from '../../theme/colors';

const { width } = Dimensions.get('window');

interface DiagnosticStep {
  id: number;
  label: string;
  status: 'pending' | 'active' | 'done';
}

const INITIAL_STEPS: DiagnosticStep[] = [
  { id: 1, label: 'Criptografia de Hardware NTAG215', status: 'pending' },
  { id: 2, label: 'Servidor de Despacho Dinamico', status: 'pending' },
  { id: 3, label: 'Verificacion de Plan y Licencia', status: 'pending' },
  { id: 4, label: 'Inicializacion de Entorno Seguro', status: 'pending' }
];

export const SplashScreen: React.FC = () => {
  const [steps, setSteps] = useState<DiagnosticStep[]>(INITIAL_STEPS);
  const [progressPercent, setProgressPercent] = useState<number>(10);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0.1)).current;

  useEffect(() => {
    // Animacion de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();

    // Animacion de pulso para el nucleo central
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true
        })
      ])
    ).start();

    // Secuencia de diagnostico estructurada
    const t1 = setTimeout(() => {
      setSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: 'done' } : s.id === 2 ? { ...s, status: 'active' } : s));
      setProgressPercent(35);
      Animated.timing(progressAnim, { toValue: 0.35, duration: 300, useNativeDriver: false }).start();
    }, 450);

    const t2 = setTimeout(() => {
      setSteps(prev => prev.map(s => s.id <= 2 ? { ...s, status: 'done' } : s.id === 3 ? { ...s, status: 'active' } : s));
      setProgressPercent(68);
      Animated.timing(progressAnim, { toValue: 0.68, duration: 300, useNativeDriver: false }).start();
    }, 950);

    const t3 = setTimeout(() => {
      setSteps(prev => prev.map(s => s.id <= 3 ? { ...s, status: 'done' } : s.id === 4 ? { ...s, status: 'active' } : s));
      setProgressPercent(90);
      Animated.timing(progressAnim, { toValue: 0.90, duration: 300, useNativeDriver: false }).start();
    }, 1450);

    const t4 = setTimeout(() => {
      setSteps(prev => prev.map(s => ({ ...s, status: 'done' })));
      setProgressPercent(100);
      Animated.timing(progressAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
    }, 1850);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const progressInterpolate = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* GRADIENTE Y RESPLANDOR AMBIENTAL DE FONDO */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* TELEMETRIA SUPERIOR */}
      <View style={styles.topBar}>
        <View style={styles.topStatusPill}>
          <View style={styles.beaconDot} />
          <Text style={styles.topStatusText}>SAM SERVICES // SISTEMA ACTIVO</Text>
        </View>
        <Text style={styles.versionTag}>v2.6.4 PRO</Text>
      </View>

      <Animated.View style={[styles.mainBox, { opacity: fadeAnim }]}>
        
        {/* NUCLEO TECNOLOGICO CENTRAL */}
        <Animated.View style={[styles.coreWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.coreOuterRing}>
            <View style={styles.coreInnerBox}>
              <Image source={require('../../../assets/logo.png')} style={styles.coreLogo} resizeMode="contain" />
            </View>
          </View>
        </Animated.View>

        {/* TITULO Y SUBTITULO DE MARCA */}
        <View style={styles.titleWrap}>
          <View style={styles.badgeLine}>
            <ShieldCheck size={12} color={MONIQ.accent} />
            <Text style={styles.badgeLineText}>HARDWARE ENCRIPTADO</Text>
          </View>
          <Text style={styles.brandTitle}>SAM SERVICES</Text>
          <Text style={styles.brandSub}>PLATAFORMA NFC & QR DINAMICO INTELIGENTE</Text>
        </View>

        {/* CONSOLA DE DIAGNOSTICO ESTRUCTURADA */}
        <View style={styles.consoleCard}>
          <View style={styles.consoleHeader}>
            <Radio size={12} color={MONIQ.cyan} />
            <Text style={styles.consoleHeaderTitle}>INICIALIZACION DE SUBSISTEMAS</Text>
            <Text style={styles.consolePercent}>{progressPercent}%</Text>
          </View>

          {/* BARRA DE PROGRESO SEGMENTADA */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, { width: progressInterpolate }]} />
          </View>

          {/* LISTA SECUENCIAL DE PASOS */}
          <View style={styles.stepsContainer}>
            {steps.map((st) => (
              <View key={st.id} style={styles.stepRow}>
                <View style={styles.stepIndicatorCol}>
                  {st.status === 'done' ? (
                    <CheckCircle2 size={13} color={MONIQ.positive} />
                  ) : st.status === 'active' ? (
                    <View style={styles.activeDot} />
                  ) : (
                    <View style={styles.pendingDot} />
                  )}
                </View>

                <Text style={[
                  styles.stepLabel,
                  st.status === 'done' && styles.stepLabelDone,
                  st.status === 'active' && styles.stepLabelActive
                ]}>
                  {st.label}
                </Text>

                <Text style={[
                  styles.stepStateBadge,
                  st.status === 'done' && styles.stepStateDone,
                  st.status === 'active' && styles.stepStateActive
                ]}>
                  {st.status === 'done' ? 'OK' : st.status === 'active' ? 'CARGANDO' : 'PENDIENTE'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>

      {/* FOOTER DE TELEMETRIA FISICA */}
      <View style={styles.footerBar}>
        <Text style={styles.footerCode}>NTAG215 // 540 BYTES // ISO-14443A // ENCRIPTACION CLOUD</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090B10',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 44,
    paddingHorizontal: 22
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    width: 320,
    height: 220,
    borderRadius: 160,
    backgroundColor: '#2563EB',
    opacity: 0.12
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    width: 300,
    height: 200,
    borderRadius: 150,
    backgroundColor: '#00E5FF',
    opacity: 0.08
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8
  },
  topStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)'
  },
  beaconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MONIQ.positive,
    marginRight: 7
  },
  topStatusText: {
    color: '#8E99B0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2
  },
  versionTag: {
    color: '#556178',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700'
  },
  mainBox: {
    width: '100%',
    alignItems: 'center'
  },
  coreWrapper: {
    marginBottom: 20
  },
  coreOuterRing: {
    width: 104,
    height: 104,
    borderRadius: 34,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  coreInnerBox: {
    width: 88,
    height: 88,
    borderRadius: 26,
    backgroundColor: '#070C18',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden'
  },
  coreLogo: {
    width: 88,
    height: 88,
    borderRadius: 26
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: 26
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.4)',
    marginBottom: 8
  },
  badgeLineText: {
    color: MONIQ.accent,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5
  },
  brandTitle: {
    color: '#F0F4FC',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2.2
  },
  brandSub: {
    color: '#76859F',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 4,
    textAlign: 'center'
  },
  consoleCard: {
    width: '100%',
    backgroundColor: '#101420',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  consoleHeaderTitle: {
    color: '#A0ADC7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    flex: 1,
    marginLeft: 6
  },
  consolePercent: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'monospace'
  },
  progressTrack: {
    width: '100%',
    height: 5,
    backgroundColor: '#1A2132',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14
  },
  progressBar: {
    height: '100%',
    backgroundColor: MONIQ.cyan,
    borderRadius: 3
  },
  stepsContainer: {
    gap: 9
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stepIndicatorCol: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MONIQ.cyan
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#273147'
  },
  stepLabel: {
    flex: 1,
    color: '#556178',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8
  },
  stepLabelDone: {
    color: '#D8E2F2',
    fontWeight: '700'
  },
  stepLabelActive: {
    color: MONIQ.cyan,
    fontWeight: '800'
  },
  stepStateBadge: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
    color: '#424C60'
  },
  stepStateDone: {
    color: MONIQ.positive
  },
  stepStateActive: {
    color: MONIQ.cyan
  },
  footerBar: {
    alignItems: 'center'
  },
  footerCode: {
    color: '#485368',
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 0.8
  }
});
