import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Linking,
  ScrollView
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  X,
  Building,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  MessageSquare,
  KeyRound,
  ShieldCheck,
  Smartphone
} from 'lucide-react-native';
import { MONIQ } from '../theme/colors';
import { Business } from '../services/api';

export interface ClientCredentialsModalProps {
  visible: boolean;
  business: Business | any | null;
  onClose: () => void;
}

export const ClientCredentialsModal: React.FC<ClientCredentialsModalProps> = ({
  visible,
  business,
  onClose
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | 'full' | null>(null);

  if (!business) return null;

  const email = business.ownerEmail || business.email || business.slug || 'Sin usuario';
  const password = business.accessPassword || 'Pass#2026';
  const ownerName = business.ownerName || 'Titular';
  const bizName = business.name || 'Cliente';
  const phone = business.ownerPhone || business.phone || '';

  const buildWhatsAppMessage = () => {
    return (
      `Hola *${ownerName}* de *${bizName}*:\n\n` +
      `Te compartimos tus credenciales para acceder al Portal de Gestión:\n\n` +
      `🌐 *Plataforma:* Reseñas Cards & Menú Digital\n` +
      `📧 *Usuario:* ${email}\n` +
      `🔑 *Contraseña:* ${password}\n\n` +
      `Desde tu portal podrás visualizar las lecturas de tus tarjetas NFC en tiempo real y actualizar tus cartas digitales.`
    );
  };

  const copyToClipboard = async (text: string, field: 'email' | 'password' | 'full') => {
    await Clipboard.setStringAsync(text);
    setCopiedField(field);
    setTimeout(() => {
      setCopiedField(prev => (prev === field ? null : prev));
    }, 2500);
  };

  const handleShareWhatsApp = () => {
    const message = buildWhatsAppMessage();
    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const targetUrl = cleanPhone.length > 0
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    Linking.openURL(targetUrl).catch(() => {
      // Fallback: copy full message if WhatsApp couldn't be opened
      copyToClipboard(message, 'full');
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.headerIconBadge}>
                <KeyRound size={20} color={MONIQ.cyan} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.modalTitle}>Credenciales de Acceso</Text>
                <Text style={styles.modalSubtitle}>Portal de Clientes & Comprador</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={MONIQ.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* BUSINESS BANNER */}
            <View style={styles.businessBanner}>
              <View style={styles.bizAvatar}>
                <Building size={18} color={MONIQ.cyan} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.businessNameText} numberOfLines={1}>
                  {bizName}
                </Text>
                <Text style={styles.businessSubText}>
                  Titular: {ownerName} {phone ? `• +51 ${phone}` : ''}
                </Text>
              </View>
              <View style={styles.secureTag}>
                <ShieldCheck size={12} color={MONIQ.positive} style={{ marginRight: 4 }} />
                <Text style={styles.secureTagText}>Activo</Text>
              </View>
            </View>

            {/* FIELD 1: LOGIN EMAIL */}
            <View style={styles.credentialFieldContainer}>
              <View style={styles.fieldLabelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Mail size={13} color={MONIQ.cyan} style={{ marginRight: 6 }} />
                  <Text style={styles.fieldLabel}>USUARIO / CORREO DE ACCESO</Text>
                </View>
                {copiedField === 'email' ? (
                  <View style={styles.copiedFeedbackBadge}>
                    <Check size={11} color={MONIQ.positive} style={{ marginRight: 3 }} />
                    <Text style={styles.copiedFeedbackText}>¡Copiado!</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.fieldValueBox}>
                <Text style={styles.fieldValueText} selectable numberOfLines={1}>
                  {email}
                </Text>
                <TouchableOpacity
                  style={[styles.miniCopyBtn, copiedField === 'email' && styles.miniCopyBtnActive]}
                  onPress={() => copyToClipboard(email, 'email')}
                >
                  {copiedField === 'email' ? (
                    <Check size={15} color={MONIQ.positive} />
                  ) : (
                    <Copy size={15} color={MONIQ.cyan} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* FIELD 2: ACCESS PASSWORD */}
            <View style={styles.credentialFieldContainer}>
              <View style={styles.fieldLabelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Lock size={13} color={MONIQ.gold} style={{ marginRight: 6 }} />
                  <Text style={styles.fieldLabel}>CONTRASEÑA DE ACCESO</Text>
                </View>
                {copiedField === 'password' ? (
                  <View style={styles.copiedFeedbackBadge}>
                    <Check size={11} color={MONIQ.positive} style={{ marginRight: 3 }} />
                    <Text style={styles.copiedFeedbackText}>¡Copiada!</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.fieldValueBox}>
                <Text
                  style={[styles.fieldValueText, !showPassword && styles.passwordMaskedText]}
                  selectable={showPassword}
                  numberOfLines={1}
                >
                  {showPassword ? password : '••••••••••••'}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={styles.miniEyeBtn}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={MONIQ.textSecondary} />
                    ) : (
                      <Eye size={16} color={MONIQ.textSecondary} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.miniCopyBtn, copiedField === 'password' && styles.miniCopyBtnActive]}
                    onPress={() => copyToClipboard(password, 'password')}
                  >
                    {copiedField === 'password' ? (
                      <Check size={15} color={MONIQ.positive} />
                    ) : (
                      <Copy size={15} color={MONIQ.cyan} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ACTION 1: COPY FULL FORMATTED MESSAGE */}
            <TouchableOpacity
              style={[styles.fullCopyButton, copiedField === 'full' && styles.fullCopyButtonActive]}
              onPress={() => copyToClipboard(buildWhatsAppMessage(), 'full')}
            >
              {copiedField === 'full' ? (
                <Check size={16} color={MONIQ.positive} style={{ marginRight: 8 }} />
              ) : (
                <Copy size={16} color={MONIQ.cyan} style={{ marginRight: 8 }} />
              )}
              <Text
                style={[styles.fullCopyButtonText, copiedField === 'full' && { color: MONIQ.positive }]}
              >
                {copiedField === 'full'
                  ? '¡Mensaje Completo Copiado!'
                  : 'Copiar Mensaje Formateado'}
              </Text>
            </TouchableOpacity>

            {/* ACTION 2: WHATSAPP SHARE */}
            <TouchableOpacity
              style={styles.whatsAppButton}
              onPress={handleShareWhatsApp}
            >
              <MessageSquare size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.whatsAppButtonText}>
                {phone ? 'Enviar por WhatsApp (+51)' : 'Compartir vía WhatsApp'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* FOOTER */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.closeFooterBtn} onPress={onClose}>
              <Text style={styles.closeFooterBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000D9',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: MONIQ.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: MONIQ.cardBorder
  },
  headerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalTitle: {
    color: MONIQ.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  modalSubtitle: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)'
  },
  bodyScroll: {
    maxHeight: 460
  },
  businessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginBottom: 16
  },
  bizAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  businessNameText: {
    color: MONIQ.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  businessSubText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  secureTagText: {
    color: MONIQ.positive,
    fontSize: 10,
    fontWeight: '800'
  },
  credentialFieldContainer: {
    marginBottom: 14
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  fieldLabel: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4
  },
  copiedFeedbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6
  },
  copiedFeedbackText: {
    color: MONIQ.positive,
    fontSize: 10,
    fontWeight: '800'
  },
  fieldValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MONIQ.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    paddingHorizontal: 12,
    height: 48
  },
  fieldValueText: {
    color: MONIQ.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    marginRight: 8
  },
  passwordMaskedText: {
    letterSpacing: 3,
    fontSize: 15
  },
  miniEyeBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginRight: 6
  },
  miniCopyBtn: {
    padding: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)'
  },
  miniCopyBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: MONIQ.positive
  },
  fullCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    borderRadius: 14,
    height: 46,
    marginTop: 8,
    marginBottom: 10
  },
  fullCopyButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)'
  },
  fullCopyButtonText: {
    color: MONIQ.cyan,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  whatsAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 14,
    height: 46,
    marginBottom: 6
  },
  whatsAppButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3
  },
  footerRow: {
    paddingTop: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: MONIQ.cardBorder
  },
  closeFooterBtn: {
    height: 44,
    backgroundColor: MONIQ.card,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  closeFooterBtnText: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    fontWeight: '700'
  }
});
