import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity
} from 'react-native';
import { AlertCircle, Info, X } from 'lucide-react-native';
import { MONIQ } from '../theme/colors';

interface NoticeModalProps {
  visible: boolean;
  title: string;
  message: string;
  isError?: boolean;
  buttonText?: string;
  onClose: () => void;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  visible,
  title,
  message,
  isError = false,
  buttonText = 'Entendido',
  onClose
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={18} color={MONIQ.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, isError ? styles.iconError : styles.iconInfo]}>
            {isError ? (
              <AlertCircle size={30} color={MONIQ.negative} />
            ) : (
              <Info size={30} color={MONIQ.gold} />
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity 
            style={[styles.actionBtn, isError ? styles.actionError : styles.actionInfo]} 
            onPress={onClose}
          >
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
    borderColor: MONIQ.cardBorder
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  iconError: {
    backgroundColor: '#FF4D6A1A',
    borderWidth: 1,
    borderColor: '#FF4D6A33'
  },
  iconInfo: {
    backgroundColor: '#FFB8001A',
    borderWidth: 1,
    borderColor: '#FFB80033'
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
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionError: {
    backgroundColor: MONIQ.negative
  },
  actionInfo: {
    backgroundColor: MONIQ.primary
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  }
});

