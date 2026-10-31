import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity
} from 'react-native';
import { AlertOctagon, RotateCcw, X } from 'lucide-react-native';
import { MONIQ } from '../theme/colors';

interface ErrorModalProps {
  visible: boolean;
  title?: string;
  message: string;
  details?: string;
  retryText?: string;
  cancelText?: string;
  onRetry?: () => void;
  onClose: () => void;
}

export const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  title = 'Error en la Operación',
  message,
  details,
  retryText = 'Reintentar',
  cancelText = 'Cerrar',
  onRetry,
  onClose
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={MONIQ.textSecondary} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <AlertOctagon size={32} color={MONIQ.negative} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {details ? (
            <View style={styles.detailsBox}>
              <Text style={styles.detailsText}>{details}</Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            {onRetry ? (
              <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
                <RotateCcw size={14} color="#FFFFFF" />
                <Text style={styles.retryText}>{retryText}</Text>
              </TouchableOpacity>
            ) : null}
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
    borderColor: '#FF4D6A4D',
    shadowColor: MONIQ.negative,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
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
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FF4D6A1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF4D6A33'
  },
  title: {
    color: MONIQ.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8
  },
  message: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 8
  },
  detailsBox: {
    width: '100%',
    backgroundColor: '#0B0C10',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  detailsText: {
    color: MONIQ.negative,
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: MONIQ.surfaceElevated,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelText: {
    color: MONIQ.textSecondary,
    fontSize: 14,
    fontWeight: '700'
  },
  retryBtn: {
    flex: 1,
    backgroundColor: MONIQ.negative,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center'
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  }
});

