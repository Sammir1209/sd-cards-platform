import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Linking,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { X, Camera, Zap, ZapOff, Settings } from 'lucide-react-native';
import { MONIQ } from '../theme/colors';

interface CameraScanModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  onScanned: (scannedValue: string) => void;
}

export const CameraScanModal: React.FC<CameraScanModalProps> = ({
  visible,
  title = 'ESCANEAR CÓDIGO DE TARJETA',
  onClose,
  onScanned
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [enableTorch, setEnableTorch] = useState(false);
  const [scanned, setScanned] = useState(false);

  // Reset al abrir
  React.useEffect(() => {
    if (visible) {
      setScanned(false);
      setEnableTorch(false);
    }
  }, [visible]);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned || !data) return;
    setScanned(true);
    onScanned(data.trim());
  };

  const handleOpenAppSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      // Ignorar
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Camera size={18} color={MONIQ.cyan} style={{ marginRight: 8 }} />
              <Text style={styles.headerTitle}>{title}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={MONIQ.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* CUERPO: PERMISOS O CÁMARA */}
          {!permission ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={MONIQ.cyan} />
              <Text style={styles.statusText}>Inicializando sensor óptico...</Text>
            </View>
          ) : !permission.granted ? (
            <View style={styles.permissionBox}>
              <Camera size={48} color={MONIQ.gold} style={{ marginBottom: 14 }} />
              <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
              <Text style={styles.permissionDesc}>
                Para escanear el código QR o código físico de la tarjeta necesitas autorizar el acceso a la cámara en Android / iOS.
              </Text>

              <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
                <Text style={styles.grantBtnText}>Autorizar Acceso a Cámara</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingsBtn} onPress={handleOpenAppSettings}>
                <Settings size={15} color={MONIQ.cyan} style={{ marginRight: 6 }} />
                <Text style={styles.settingsBtnText}>Abrir Ajustes de la App</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraContainer}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={enableTorch}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'upc_a']
                }}
                onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              />

              {/* RETÍCULA DE ENFOQUE */}
              <View style={styles.reticleOverlay}>
                <View style={styles.reticleBox}>
                  <View style={styles.cornerTL} />
                  <View style={styles.cornerTR} />
                  <View style={styles.cornerBL} />
                  <View style={styles.cornerBR} />
                </View>
                <Text style={styles.reticleGuideText}>
                  Apunta la cámara al código QR o código de barras de la tarjeta
                </Text>
              </View>

              {/* BOTÓN FLASH / LINTERNA */}
              <TouchableOpacity
                style={styles.torchBtn}
                onPress={() => setEnableTorch(prev => !prev)}
              >
                {enableTorch ? (
                  <ZapOff size={20} color={MONIQ.gold} />
                ) : (
                  <Zap size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* FOOTER */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cerrar Escáner</Text>
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
    backgroundColor: '#000000EB',
    justifyContent: 'center',
    padding: 16
  },
  container: {
    height: 520,
    backgroundColor: '#0E1017',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#25293B',
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTitle: {
    color: MONIQ.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  closeBtn: {
    padding: 4
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusText: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    marginTop: 12
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24
  },
  permissionTitle: {
    color: MONIQ.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center'
  },
  permissionDesc: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  grantBtn: {
    width: '100%',
    height: 46,
    backgroundColor: MONIQ.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  grantBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    paddingHorizontal: 16
  },
  settingsBtnText: {
    color: MONIQ.cyan,
    fontSize: 12,
    fontWeight: '700'
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden'
  },
  reticleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)'
  },
  reticleBox: {
    width: 220,
    height: 220,
    position: 'relative'
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 26,
    height: 26,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: MONIQ.cyan
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 26,
    height: 26,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: MONIQ.cyan
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 26,
    height: 26,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: MONIQ.cyan
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: MONIQ.cyan
  },
  reticleGuideText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 24,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3
  },
  torchBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)'
  },
  cancelBtn: {
    height: 42,
    backgroundColor: '#1C1F2B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  cancelBtnText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  }
});
