import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity
} from 'react-native';
import { AlertTriangle, Trash2, X } from 'lucide-react-native';
import { MONIQ } from '../theme/colors';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDanger = true,
  onConfirm,
  onCancel
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.closeBtn} onPress={onCancel}>
            <X size={18} color={MONIQ.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, isDanger ? styles.iconDanger : styles.iconNormal]}>
            {isDanger ? (
              <Trash2 size={28} color={MONIQ.negative} />
            ) : (
              <AlertTriangle size={28} color={MONIQ.gold} />
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.confirmBtn, isDanger ? styles.confirmDanger : styles.confirmNormal]} 
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
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
    backgroundColor: '#000000D9',
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
    padding: 4
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  iconDanger: {
    backgroundColor: MONIQ.negative + '15',
    borderWidth: 1,
    borderColor: MONIQ.negative + '33'
  },
  iconNormal: {
    backgroundColor: MONIQ.gold + '15',
    borderWidth: 1,
    borderColor: MONIQ.gold + '33'
  },
  title: {
    color: MONIQ.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8
  },
  message: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between'
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    backgroundColor: MONIQ.card,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  cancelText: {
    color: MONIQ.textSecondary,
    fontSize: 14,
    fontWeight: '700'
  },
  confirmBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6
  },
  confirmDanger: {
    backgroundColor: MONIQ.negative
  },
  confirmNormal: {
    backgroundColor: MONIQ.accent
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  }
});

