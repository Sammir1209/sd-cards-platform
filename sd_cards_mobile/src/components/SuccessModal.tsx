import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Platform
} from 'react-native';
import { CheckCircle2, Copy, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { MONIQ } from '../theme/colors';

interface DetailItem {
  label: string;
  value: string;
}

interface SuccessModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  codeLabel?: string;
  codeValue?: string;
  details?: DetailItem[];
  buttonText?: string;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  visible,
  title,
  subtitle,
  codeLabel = 'CÓDIGO GENERADO',
  codeValue,
  details = [],
  buttonText = 'Entendido y Continuar',
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = async () => {
    if (codeValue) {
      await Clipboard.setStringAsync(codeValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={MONIQ.textSecondary} />
          </TouchableOpacity>

          {/* Halo Icon */}
          <View style={styles.iconCircle}>
            <CheckCircle2 size={36} color={MONIQ.positive} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {/* Código o PIN destacado */}
          {codeValue ? (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={copyToClipboard}
              style={styles.codeContainer}
            >
              <View style={styles.codeHeader}>
                <Text style={styles.codeLabel}>{codeLabel}</Text>
                <View style={styles.copyBadge}>
                  <Copy size={12} color={copied ? MONIQ.positive : MONIQ.textSecondary} />
                  <Text style={[styles.copyText, copied && { color: MONIQ.positive }]}>
                    {copied ? 'Copiado' : 'Copiar'}
                  </Text>
                </View>
              </View>
              <Text style={styles.codeText}>{codeValue}</Text>
            </TouchableOpacity>
          ) : null}

          {/* Detalles complementarios */}
          {details.length > 0 && (
            <View style={styles.detailsContainer}>
              {details.map((d, index) => (
                <View key={index} style={[styles.detailRow, index > 0 && styles.detailRowBorder]}>
                  <Text style={styles.detailLabel}>{d.label}</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{d.value}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Botón de acción */}
          <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
            <Text style={styles.actionBtnText}>{buttonText}</Text>
          </TouchableOpacity>
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
    borderColor: '#35C99A40',
    shadowColor: MONIQ.positive,
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
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#35C99A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#35C99A33'
  },
  title: {
    color: MONIQ.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 6
  },
  subtitle: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8
  },
  codeContainer: {
    width: '100%',
    backgroundColor: '#0B0C10',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#35C99A4D',
    marginBottom: 16
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  codeLabel: {
    color: MONIQ.positive,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: MONIQ.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  copyText: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '600'
  },
  codeText: {
    color: '#38E5FF',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.5,
    textAlign: 'center'
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: MONIQ.surfaceElevated,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: MONIQ.border
  },
  detailLabel: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '500'
  },
  detailValue: {
    color: MONIQ.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: '60%'
  },
  actionBtn: {
    width: '100%',
    backgroundColor: MONIQ.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: MONIQ.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  }
});

