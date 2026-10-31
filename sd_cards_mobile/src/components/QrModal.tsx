import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Linking
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { X, Copy, ExternalLink, Check } from 'lucide-react-native';
import { MONIQ } from '../theme/colors';

interface QrModalProps {
  visible: boolean;
  cardCode: string;
  label: string;
  targetUrl: string;
  onClose: () => void;
}

export const QrModal: React.FC<QrModalProps> = ({
  visible,
  cardCode,
  label,
  targetUrl,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    await Clipboard.setStringAsync(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestUrl = () => {
    Linking.openURL(targetUrl).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={MONIQ.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.title}>CÓDIGO QR DE ACCESO</Text>
          <Text style={styles.subtitle}>#{cardCode} • {label}</Text>

          {/* CONTENEDOR DEL CÓDIGO QR CON ALTO CONTRASTE */}
          <View style={styles.qrWrapper}>
            <QRCode
              value={targetUrl || 'https://s-d.pe'}
              size={180}
              color="#0D0E13"
              backgroundColor="#FFFFFF"
            />
          </View>

          {/* URL DE SALTO CANÓNICA */}
          <View style={styles.urlBox}>
            <Text style={styles.urlLabel}>URL DESTINO DEL SALTO:</Text>
            <Text style={styles.urlText} numberOfLines={1}>{targetUrl}</Text>
          </View>

          {/* ACCIONES */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyUrl}>
              {copied ? (
                <>
                  <Check size={15} color={MONIQ.positive} />
                  <Text style={[styles.copyBtnText, { color: MONIQ.positive }]}>Copiado</Text>
                </>
              ) : (
                <>
                  <Copy size={15} color="#FFFFFF" />
                  <Text style={styles.copyBtnText}>Copiar Link</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.testBtn} onPress={handleTestUrl}>
              <ExternalLink size={15} color="#0B0B0E" />
              <Text style={styles.testBtnText}>Probar en Navegador</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000E6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  card: {
    width: '100%',
    backgroundColor: MONIQ.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    shadowColor: MONIQ.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 6,
    borderRadius: 12,
    backgroundColor: MONIQ.surfaceElevated
  },
  title: {
    color: MONIQ.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4
  },
  subtitle: {
    color: MONIQ.cyan,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 20
  },
  urlBox: {
    width: '100%',
    backgroundColor: '#0B0C10',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginBottom: 20
  },
  urlLabel: {
    color: MONIQ.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4
  },
  urlText: {
    color: MONIQ.cyan,
    fontSize: 12,
    fontFamily: 'monospace'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  },
  copyBtn: {
    flex: 1,
    backgroundColor: MONIQ.surfaceElevated,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  testBtn: {
    flex: 1,
    backgroundColor: MONIQ.accent,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  testBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  }
});

