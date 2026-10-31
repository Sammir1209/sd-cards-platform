import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import {
  X,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Building,
  ArrowRight,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react-native';
import { MONIQ } from '../theme/colors';
import { api, Business } from '../services/api';

export interface RenewPlanModalProps {
  visible: boolean;
  business: Business | any | null;
  onClose: () => void;
  onSuccess?: (renewedData: { planExpiryDate: string; planMonths: number; isActive: boolean }) => void;
}

export const RenewPlanModal: React.FC<RenewPlanModalProps> = ({
  visible,
  business,
  onClose,
  onSuccess
}) => {
  const [selectedMonths, setSelectedMonths] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSelectedMonths(12);
      setErrorMessage(null);
      setLoading(false);
    }
  }, [visible, business]);

  if (!business) return null;

  const bizName = business.name || 'Cliente';
  const ownerName = business.ownerName || 'Titular';
  const currentExpiryStr = business.planExpiryDate;

  // Determinar estado de expiración y formatear fecha
  let isExpired = false;
  let isExpiringSoon = false;
  let daysRemaining = 0;
  let formattedCurrentDate = 'Sin fecha registrada';
  let currentExpiryDate: Date | null = null;

  if (currentExpiryStr) {
    const d = new Date(currentExpiryStr);
    if (!isNaN(d.getTime())) {
      currentExpiryDate = d;
      formattedCurrentDate = d.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysRemaining < 0) {
        isExpired = true;
      } else if (daysRemaining <= 30) {
        isExpiringSoon = true;
      }
    }
  } else {
    // Si no tiene fecha aún, por defecto consideramos que inicia hoy
    formattedCurrentDate = 'Pendiente de inicio';
  }

  // Calcular la nueva fecha estimada tras renovar
  const calculateProjectedExpiry = (additional: number): string => {
    const now = new Date();
    const base = (currentExpiryDate && currentExpiryDate > now) ? new Date(currentExpiryDate) : new Date(now);
    base.setMonth(base.getMonth() + additional);
    return base.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleConfirmRenewal = async () => {
    if (!business?.id) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.renewPlan(business.id, selectedMonths);
      if (res.success && res.data) {
        if (onSuccess) {
          onSuccess({
            planExpiryDate: res.data.planExpiryDate,
            planMonths: res.data.planMonths,
            isActive: res.data.isActive
          });
        }
        onClose();
      } else {
        setErrorMessage(res.error || 'No se pudo procesar la renovación en el servidor.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const durationOptions = [
    { months: 6, label: '+6 Meses', tag: 'Semestral' },
    { months: 12, label: '+12 Meses (1 Año)', tag: 'Recomendado' },
    { months: 24, label: '+24 Meses (2 Años)', tag: 'Bienal' }
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.headerIconBadge}>
                <Calendar size={20} color={MONIQ.cyan} />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.modalTitle}>Renovación de Plan</Text>
                <Text style={styles.modalSubtitle}>Extiende la vigencia del servicio en sala</Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={loading}>
              <X size={20} color={MONIQ.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ERROR BANNER */}
          {errorMessage ? (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color={MONIQ.negative} style={{ marginRight: 8 }} />
              <Text style={styles.errorBannerText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* BUSINESS SUMMARY */}
            <View style={styles.businessSummaryCard}>
              <View style={styles.bizIconWrap}>
                <Building size={18} color={MONIQ.cyan} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.bizName} numberOfLines={1}>{bizName}</Text>
                <Text style={styles.bizSub}>Titular: {ownerName}</Text>
              </View>

              {/* STATUS BADGE */}
              {isExpired ? (
                <View style={[styles.statusBadge, styles.badgeExpired]}>
                  <AlertTriangle size={11} color={MONIQ.negative} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusBadgeText, { color: MONIQ.negative }]}>Vencido</Text>
                </View>
              ) : isExpiringSoon ? (
                <View style={[styles.statusBadge, styles.badgeExpiringSoon]}>
                  <Clock size={11} color={MONIQ.gold} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusBadgeText, { color: MONIQ.gold }]}>Por Vencer</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.badgeActive]}>
                  <ShieldCheck size={11} color={MONIQ.positive} style={{ marginRight: 4 }} />
                  <Text style={[styles.statusBadgeText, { color: MONIQ.positive }]}>Activo</Text>
                </View>
              )}
            </View>

            {/* EXPIRATION TIMELINE PREVIEW */}
            <View style={styles.timelineBox}>
              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>EXPIRACIÓN ACTUAL</Text>
                <Text style={[styles.timelineValue, isExpired && { color: MONIQ.negative }]}>
                  {formattedCurrentDate}
                </Text>
                <Text style={styles.timelineHint}>
                  {isExpired
                    ? `Venció hace ${Math.abs(daysRemaining)} días`
                    : daysRemaining > 0
                    ? `Quedan ${daysRemaining} días`
                    : 'Sin fecha de vencimiento'}
                </Text>
              </View>

              <View style={styles.timelineArrowWrap}>
                <ArrowRight size={18} color={MONIQ.cyan} />
              </View>

              <View style={styles.timelineItem}>
                <Text style={styles.timelineLabel}>NUEVA FECHA PROYECTADA</Text>
                <Text style={[styles.timelineValue, { color: MONIQ.cyan }]}>
                  {calculateProjectedExpiry(selectedMonths)}
                </Text>
                <Text style={styles.timelineHint}>+{selectedMonths} meses adicionales</Text>
              </View>
            </View>

            {/* DURATION SELECTION OPTIONS */}
            <Text style={styles.sectionLabel}>SELECCIONA EL PERÍODO A EXTENDER</Text>
            <View style={styles.optionsList}>
              {durationOptions.map((opt) => {
                const isSelected = selectedMonths === opt.months;
                return (
                  <TouchableOpacity
                    key={opt.months}
                    style={[styles.durationOptionCard, isSelected && styles.durationOptionCardActive]}
                    onPress={() => setSelectedMonths(opt.months)}
                    disabled={loading}
                  >
                    <View style={styles.durationLeft}>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected ? <View style={styles.radioDot} /> : null}
                      </View>
                      <View style={{ marginLeft: 12 }}>
                        <Text style={[styles.durationLabel, isSelected && styles.durationLabelActive]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.durationSub}>
                          Extiende la vigencia continua de las tarjetas de este local
                        </Text>
                      </View>
                    </View>

                    {opt.tag ? (
                      <View
                        style={[
                          styles.optionTag,
                          opt.months === 12 && styles.recommendedTag,
                          isSelected && styles.optionTagActive
                        ]}
                      >
                        {opt.months === 12 && (
                          <Sparkles size={10} color={isSelected ? '#0B132B' : MONIQ.cyan} style={{ marginRight: 3 }} />
                        )}
                        <Text
                          style={[
                            styles.optionTagText,
                            opt.months === 12 && styles.recommendedTagText,
                            isSelected && styles.optionTagTextActive
                          ]}
                        >
                          {opt.tag}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* ACTIONS ROW */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
              onPress={handleConfirmRenewal}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0B132B" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#0B132B" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>Confirmar Renovación</Text>
                </>
              )}
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
    maxHeight: '92%',
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12
  },
  errorBannerText: {
    color: MONIQ.negative,
    fontSize: 12,
    fontWeight: '700',
    flex: 1
  },
  bodyScroll: {
    maxHeight: 460
  },
  businessSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginBottom: 14
  },
  bizIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bizName: {
    color: MONIQ.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  bizSub: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)'
  },
  badgeExpiringSoon: {
    backgroundColor: 'rgba(250, 204, 21, 0.15)',
    borderColor: 'rgba(250, 204, 21, 0.35)'
  },
  badgeExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  timelineBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11, 19, 43, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    padding: 12,
    marginBottom: 16
  },
  timelineItem: {
    flex: 1
  },
  timelineLabel: {
    color: MONIQ.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 4
  },
  timelineValue: {
    color: MONIQ.textPrimary,
    fontSize: 13,
    fontWeight: '800'
  },
  timelineHint: {
    color: MONIQ.textMuted,
    fontSize: 10,
    marginTop: 2
  },
  timelineArrowWrap: {
    paddingHorizontal: 8
  },
  sectionLabel: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 8
  },
  optionsList: {
    gap: 8,
    marginBottom: 6
  },
  durationOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: MONIQ.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    padding: 12
  },
  durationOptionCardActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: MONIQ.cyan
  },
  durationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: MONIQ.cardBorder,
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioCircleActive: {
    borderColor: MONIQ.cyan
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MONIQ.cyan
  },
  durationLabel: {
    color: MONIQ.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  },
  durationLabelActive: {
    color: MONIQ.cyan,
    fontWeight: '800'
  },
  durationSub: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    marginTop: 2
  },
  optionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)'
  },
  recommendedTag: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)'
  },
  optionTagActive: {
    backgroundColor: MONIQ.cyan
  },
  optionTagText: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '700'
  },
  recommendedTagText: {
    color: MONIQ.cyan,
    fontWeight: '800'
  },
  optionTagTextActive: {
    color: '#0B132B',
    fontWeight: '900'
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: MONIQ.cardBorder
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    backgroundColor: MONIQ.card,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  cancelBtnText: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    fontWeight: '700'
  },
  confirmBtn: {
    flex: 2,
    height: 46,
    backgroundColor: MONIQ.cyan,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4
  },
  confirmBtnText: {
    color: '#0B132B',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3
  }
});
