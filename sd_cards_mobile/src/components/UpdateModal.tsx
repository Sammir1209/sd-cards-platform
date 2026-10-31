import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { ArrowDownCircle, CheckCircle2, X, Sparkles, ExternalLink } from 'lucide-react-native';
import { MONIQ } from '../theme/colors';
import { UpdateService, UpdateCheckResult } from '../services/updateService';

interface UpdateModalProps {
  visible: boolean;
  updateData: UpdateCheckResult | null;
  onClose: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  updateData,
  onClose
}) => {
  if (!updateData) return null;

  const isUpToDate = !updateData.hasUpdate;

  const handleUpdatePress = () => {
    const targetUrl = updateData.directDownloadUrl || updateData.apkUrl;
    UpdateService.downloadAndInstall(targetUrl);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* CABECERA */}
          <View style={styles.headerRow}>
            <View style={styles.headerTag}>
              <Sparkles size={13} color={MONIQ.cyan} style={{ marginRight: 6 }} />
              <Text style={styles.headerTagText}>
                {isUpToDate ? 'SISTEMA AL DIA' : 'NUEVA VERSION LISTA'}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={MONIQ.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* ICONO Y TITULO */}
          <View style={styles.heroSection}>
            <View style={[styles.iconCircle, isUpToDate ? styles.iconCircleGreen : styles.iconCircleBlue]}>
              {isUpToDate ? (
                <CheckCircle2 size={36} color={MONIQ.positive} />
              ) : (
                <ArrowDownCircle size={36} color={MONIQ.cyan} />
              )}
            </View>

            <Text style={styles.titleText}>
              {isUpToDate ? 'Tu aplicacion esta actualizada' : 'Actualizacion Disponible'}
            </Text>
            <Text style={styles.subtitleText}>
              {isUpToDate
                ? `Cuentas con la version mas reciente (v${updateData.currentVersion}).`
                : 'Se han implementado mejoras criticas de velocidad y nuevas funciones.'}
            </Text>
          </View>

          {/* COMPARADOR DE VERSIONES */}
          <View style={styles.versionCompareRow}>
            <View style={styles.versionCol}>
              <Text style={styles.versionLabel}>INSTALADA</Text>
              <Text style={styles.versionValue}>v{updateData.currentVersion}</Text>
            </View>

            <View style={styles.versionDivider} />

            <View style={styles.versionCol}>
              <Text style={styles.versionLabel}>DISPONIBLE</Text>
              <Text style={[styles.versionValue, { color: isUpToDate ? MONIQ.textPrimary : MONIQ.cyan }]}>
                v{updateData.latestVersion}
              </Text>
            </View>
          </View>

          {/* LISTA DE NOVEDADES (CHANGELOG) */}
          <Text style={styles.changelogTitle}>NOVEDADES Y MEJORAS:</Text>
          <ScrollView style={styles.changelogScroll} showsVerticalScrollIndicator={false}>
            {updateData.changelog && updateData.changelog.length > 0 ? (
              updateData.changelog.map((item, index) => (
                <View key={index} style={styles.changelogItem}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.changelogText}>{item}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.changelogText}>Optimizaciones generales del sistema.</Text>
            )}
          </ScrollView>

          {/* BOTONES DE ACCION */}
          {!isUpToDate ? (
            <TouchableOpacity
              style={styles.primaryUpdateBtn}
              onPress={handleUpdatePress}
              activeOpacity={0.85}
            >
              <ArrowDownCircle size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryUpdateBtnText}>Actualizar Ahora (1 Toque)</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={[styles.secondaryBtn, isUpToDate && { marginTop: 14 }]}
            onPress={onClose}
          >
            <Text style={styles.secondaryBtnText}>
              {isUpToDate ? 'Entendido' : 'Recordar mas tarde'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: MONIQ.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  headerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  headerTagText: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  closeBtn: {
    padding: 4
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 16
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  iconCircleBlue: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.3)'
  },
  iconCircleGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  titleText: {
    color: MONIQ.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center'
  },
  subtitleText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    paddingHorizontal: 12
  },
  versionCompareRow: {
    flexDirection: 'row',
    backgroundColor: MONIQ.bg,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  versionCol: {
    flex: 1,
    alignItems: 'center'
  },
  versionDivider: {
    width: 1,
    backgroundColor: MONIQ.cardBorder
  },
  versionLabel: {
    color: MONIQ.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  versionValue: {
    color: MONIQ.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2
  },
  changelogTitle: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8
  },
  changelogScroll: {
    maxHeight: 130,
    backgroundColor: MONIQ.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: MONIQ.cyan,
    marginTop: 6,
    marginRight: 8
  },
  changelogText: {
    flex: 1,
    color: MONIQ.textSecondary,
    fontSize: 12,
    lineHeight: 16
  },
  primaryUpdateBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MONIQ.accent,
    height: 48,
    borderRadius: 14,
    marginBottom: 8
  },
  primaryUpdateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },
  secondaryBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  secondaryBtnText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  }
});

