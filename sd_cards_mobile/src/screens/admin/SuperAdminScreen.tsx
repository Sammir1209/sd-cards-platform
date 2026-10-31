import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Linking,
  Animated,
  Platform,
  Image,
  Dimensions
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Home,
  Users,
  Radio,
  Activity,
  Settings,
  Building,
  CreditCard,
  Plus,
  RefreshCw,
  X,
  Search,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Check,
  Zap,
  Sliders,
  CheckCircle,
  Copy,
  ChevronRight,
  Trash2,
  Lock,
  Smartphone,
  Eye,
  AlertTriangle
} from 'lucide-react-native';
import { MONIQ } from '../../theme/colors';
import { api } from '../../services/api';
import { ENV } from '../../config/env';
import { LogManager } from '../../services/logManager';
import { NfcService } from '../../services/nfcService';
import { DeviceService, ActiveDeviceInfo } from '../../services/deviceService';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SuccessModal } from '../../components/SuccessModal';
import { NoticeModal } from '../../components/NoticeModal';
import { ErrorModal } from '../../components/ErrorModal';
import { QrModal } from '../../components/QrModal';
import { CameraScanModal } from '../../components/CameraScanModal';

const { width } = Dimensions.get('window');

interface NfcStationState {
  hardwareStatus: 'Esperando' | 'Detectado' | 'No compatible' | 'Error';
  uid: string;
  chipFamily: string;
  ndefStatus: 'Pendiente' | 'Escribiendo...' | 'Verificada' | 'Error';
  serverStatus: 'ASSIGNED' | 'PROGRAMMING' | 'ACTIVE' | 'FAILED';
  statusBadgeText: string;
  statusBadgeColor: string;
  footerMessage: string;
  isCompleted: boolean;
  provisionToken: string | null;
  expectedUrl: string;
}

export const SuperAdminScreen: React.FC = () => {
  // Pestañas principales de navegación inferior (5 sesiones funcionales):
  // 0: Panel Principal | 1: Clientes | 2: Taller NFC | 3: Auditoría & Logs | 4: Ajustes
  const [activeTab, setActiveTab] = useState<number>(0);

  // Datos globales
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Detalle de un cliente seleccionado
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [buyerCards, setBuyerCards] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);

  // Modales del sistema
  const [successModalData, setSuccessModalData] = useState<{
    visible: boolean;
    title: string;
    subtitle?: string;
    codeLabel?: string;
    codeValue?: string;
    details?: { label: string; value: string }[];
  }>({ visible: false, title: '' });

  const [noticeModalData, setNoticeModalData] = useState<{
    visible: boolean;
    title: string;
    message: string;
    isError?: boolean;
  }>({ visible: false, title: '', message: '' });

  const [errorModalData, setErrorModalData] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({ visible: false, title: '', message: '' });

  const [confirmBizModalData, setConfirmBizModalData] = useState<{
    visible: boolean;
    businessId: number | null;
    businessName: string;
    action: 'archive' | 'reactivate';
  }>({ visible: false, businessId: null, businessName: '', action: 'archive' });

  const [confirmCardModalData, setConfirmCardModalData] = useState<{
    visible: boolean;
    cardId: number | null;
    cardCode: string;
  }>({ visible: false, cardId: null, cardCode: '' });

  // Modal QR
  const [qrModalData, setQrModalData] = useState<{
    visible: boolean;
    cardCode: string;
    label: string;
    targetUrl: string;
  }>({ visible: false, cardCode: '', label: '', targetUrl: '' });

  // Modal Crear Cliente
  const [showCreateBizModal, setShowCreateBizModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizOwner, setNewBizOwner] = useState('');
  const [newBizEmail, setNewBizEmail] = useState('');
  const [newBizPassword, setNewBizPassword] = useState('');
  const [newBizPhone, setNewBizPhone] = useState('');
  const [newBizCity, setNewBizCity] = useState('Lima');
  const [newBizAddress, setNewBizAddress] = useState('');
  const [newBizPlanMonths, setNewBizPlanMonths] = useState(12);

  // Modal Asignar Tarjeta Rápida
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [addCardTargetBizId, setAddCardTargetBizId] = useState<number | null>(null);
  const [addCardLabel, setAddCardLabel] = useState('');
  const [addCardDestination, setAddCardDestination] = useState<number>(1); // 1: Reseñas, 2: Carta
  const [addCardLoading, setAddCardLoading] = useState(false);

  // Taller NFC y Estación de Grabado
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [selectedCardForNfc, setSelectedCardForNfc] = useState<any>(null);
  const [siliconUid, setSiliconUid] = useState<string>('');
  const [siliconChip, setSiliconChip] = useState<'NTAG213' | 'NTAG215' | 'NTAG216'>('NTAG215');
  const [provisioningLoading, setProvisioningLoading] = useState(false);
  const [nfcStation, setNfcStation] = useState<NfcStationState>({
    hardwareStatus: 'Esperando',
    uid: '—',
    chipFamily: 'NTAG215 (NXP)',
    ndefStatus: 'Pendiente',
    serverStatus: 'ASSIGNED',
    statusBadgeText: 'Esperando Tarjeta',
    statusBadgeColor: MONIQ.gold,
    footerMessage: 'Acerca la tarjeta fisica al reverso del telefono para iniciar el grabado.',
    isCompleted: false,
    provisionToken: null,
    expectedUrl: ''
  });

  // Animación Radar para Grabador NFC
  const radarAnim = useRef(new Animated.Value(1)).current;
  const [copiedLogs, setCopiedLogs] = useState(false);

  // Telemetría de hardware
  const [activeDevice, setActiveDevice] = useState<ActiveDeviceInfo | null>(null);
  const [serverHealth, setServerHealth] = useState<'online' | 'checking' | 'error'>('online');

  // Inicialización y carga de datos
  useEffect(() => {
    loadData();
    checkDeviceTelemetry();
  }, []);

  useEffect(() => {
    // Animación de pulso continuo para el radar NFC
    if (showNfcModal && !nfcStation.isCompleted) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(radarAnim, { toValue: 1.25, duration: 800, useNativeDriver: true }),
          Animated.timing(radarAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [showNfcModal, nfcStation.isCompleted]);

  const checkDeviceTelemetry = () => {
    try {
      const dev = DeviceService.getDeviceInfo();
      setActiveDevice(dev);
    } catch (e) {
      // Ignorar si no está disponible en emulador
    }
  };

  const loadData = async () => {
    setLoading(true);
    setServerHealth('checking');
    try {
      const data = await api.getBusinesses();
      setBusinesses(data || []);
      setServerHealth('online');
    } catch (e) {
      setServerHealth('error');
    } finally {
      setLoading(false);
    }
  };

  const loadBuyerCards = async (bizId: number) => {
    setLoadingCards(true);
    try {
      const cards = await api.getCardsByBusiness(bizId);
      setBuyerCards(cards || []);
    } catch (e) {
      setBuyerCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  // Crear Cliente
  const handleCreateBusiness = async () => {
    if (!newBizName.trim() || !newBizEmail.trim()) {
      setNoticeModalData({
        visible: true,
        title: 'Campos requeridos',
        message: 'Ingresa el nombre comercial y correo electronico.',
        isError: true
      });
      return;
    }
    setCreateLoading(true);
    const res = await api.registerBusiness({
      name: newBizName.trim(),
      ownerName: newBizOwner.trim() || newBizName.trim(),
      email: newBizEmail.trim(),
      password: newBizPassword.trim() || undefined,
      phone: newBizPhone.trim(),
      city: newBizCity.trim(),
      address: newBizAddress.trim(),
      services: 1,
      planMonths: newBizPlanMonths
    });
    setCreateLoading(false);

    if (res.success && res.data) {
      const bizName = res.data.businessName || newBizName;
      const pass = res.data.accessPassword || newBizPassword || 'Pass#2026';
      const email = res.data.ownerEmail || newBizEmail;

      setNewBizName('');
      setNewBizOwner('');
      setNewBizEmail('');
      setNewBizPassword('');
      setNewBizPhone('');
      setNewBizAddress('');
      setShowCreateBizModal(false);
      loadData();

      setSuccessModalData({
        visible: true,
        title: 'CLIENTE REGISTRADO',
        subtitle: 'El negocio ha sido creado y sus credenciales estan activas.',
        codeLabel: 'CLAVE DE ACCESO',
        codeValue: pass,
        details: [
          { label: 'Negocio', value: bizName },
          { label: 'Usuario / Login', value: email },
          { label: 'Vigencia', value: `${newBizPlanMonths} meses` }
        ]
      });
    } else {
      setErrorModalData({
        visible: true,
        title: 'No se pudo crear el cliente',
        message: res.error || 'Error al registrar el negocio en el servidor.'
      });
    }
  };

  // Asignar Tarjeta Directa
  const handleAssignCard = async () => {
    const bizId = addCardTargetBizId || selectedBuyer?.id;
    if (!bizId || !addCardLabel.trim()) {
      setNoticeModalData({
        visible: true,
        title: 'Ubicacion requerida',
        message: 'Selecciona un cliente e ingresa la etiqueta (Ej. Mesa 1, Terraza, Barra).',
        isError: true
      });
      return;
    }

    setAddCardLoading(true);
    const res = await api.assignSingleCard({
      businessId: bizId,
      cardType: addCardDestination,
      label: addCardLabel.trim()
    });
    setAddCardLoading(false);

    if (res.success && res.data) {
      setShowAddCardModal(false);
      const cardCode = res.data.cardCode;
      const label = res.data.label;
      setAddCardLabel('');
      if (selectedBuyer && selectedBuyer.id === bizId) {
        loadBuyerCards(bizId);
      }
      loadData();

      setSuccessModalData({
        visible: true,
        title: 'TARJETA GENERADA',
        subtitle: 'Tarjeta registrada en la base de datos y lista para grabar con NFC.',
        codeLabel: 'CODIGO DE TARJETA',
        codeValue: cardCode,
        details: [
          { label: 'Ubicacion', value: label },
          { label: 'Destino', value: addCardDestination === 1 ? 'Reseñas Google (Directo)' : 'Carta Digital' },
          { label: 'URL Canónica', value: ENV.getCardUrl(cardCode) }
        ]
      });
    } else {
      setErrorModalData({
        visible: true,
        title: 'Error vinculando tarjeta',
        message: res.error || 'No se pudo vincular la tarjeta en el servidor.'
      });
    }
  };

  // Iniciar Taller de Grabado NFC
  const startNfcProgramming = async (card: any, bizName: string) => {
    setSelectedCardForNfc(card);
    setSiliconUid('');
    setShowNfcModal(true);

    const targetUrl = ENV.getCardUrl(card.cardCode);

    setNfcStation({
      hardwareStatus: 'Esperando',
      uid: '—',
      chipFamily: `${siliconChip} (NXP Semiconductors)`,
      ndefStatus: 'Pendiente',
      serverStatus: 'ASSIGNED',
      statusBadgeText: 'Esperando Tarjeta',
      statusBadgeColor: MONIQ.gold,
      footerMessage: 'Acerca la tarjeta física al sensor NFC del teléfono.',
      isCompleted: false,
      provisionToken: null,
      expectedUrl: targetUrl
    });

    try {
      const sessRes = await api.startProvisionSession(card.id);
      if (sessRes.success && sessRes.data && sessRes.data.provisionToken) {
        const token = sessRes.data.provisionToken;
        setNfcStation(prev => ({
          ...prev,
          provisionToken: token
        }));
      }

      // Iniciar escucha del sensor NFC nativo
      await NfcService.init();
      LogManager.addLog(`[NFC] Sensor iniciado para grabar tarjeta ${card.cardCode}`);

      // Esperar lectura NDEF
      const tag = await NfcService.waitForPhysicalTag();
      if (tag && tag.id) {
        const detectedUid = tag.id;
        setSiliconUid(detectedUid);

        setNfcStation(prev => ({
          ...prev,
          hardwareStatus: 'Detectado',
          uid: detectedUid,
          statusBadgeText: 'Chip Detectado',
          statusBadgeColor: MONIQ.cyan,
          footerMessage: `Chip detectado: ${detectedUid}. Escribiendo URL canónica...`
        }));

        // Quemar URL en el chip y verificar Read-Back
        const writeRes = await NfcService.writeAndVerifyTag(targetUrl);
        if (writeRes.success) {
          // Confirmar con el servidor
          await confirmNfcActivation(card.id, writeRes.uid || detectedUid, targetUrl, bizName);
        } else {
          setNfcStation(prev => ({
            ...prev,
            ndefStatus: 'Error',
            statusBadgeText: 'Fallo al Grabar',
            statusBadgeColor: MONIQ.negative,
            footerMessage: writeRes.error || 'No se pudo escribir el registro NDEF. Vuelve a intentar manteniendo la tarjeta firme.'
          }));
        }
      }
    } catch (e: any) {
      LogManager.addLog(`[NFC ERROR] ${e?.message || 'Error en sesion NFC'}`);
      setNfcStation(prev => ({
        ...prev,
        hardwareStatus: 'Error',
        statusBadgeText: 'Error Sensor',
        statusBadgeColor: MONIQ.negative,
        footerMessage: 'No se pudo completar la lectura del sensor. Verifica que el NFC este encendido.'
      }));
    } finally {
      await NfcService.cancelListening();
    }
  };

  const confirmNfcActivation = async (cardId: number, uid: string, url: string, bizName: string) => {
    setProvisioningLoading(true);
    setNfcStation(prev => ({
      ...prev,
      ndefStatus: 'Escribiendo...',
      statusBadgeText: 'Sincronizando Servidor...',
      statusBadgeColor: MONIQ.cyan
    }));

    try {
      const res = await api.confirmProvision(cardId, {
        provisionToken: nfcStation.provisionToken || 'TOK_PROV_LOCAL',
        nfcUid: uid,
        chipFamily: siliconChip,
        memoryBytes: 504,
        readBackUrl: url
      });

      if (res.success) {
        setNfcStation(prev => ({
          ...prev,
          ndefStatus: 'Verificada',
          serverStatus: 'ACTIVE',
          statusBadgeText: 'Grabada y Activa',
          statusBadgeColor: MONIQ.positive,
          isCompleted: true,
          footerMessage: 'Tarjeta grabada con exito en silicio y sincronizada con el servidor.'
        }));

        if (selectedBuyer) loadBuyerCards(selectedBuyer.id);
        loadData();

        setSuccessModalData({
          visible: true,
          title: 'TARJETA GRABADA Y ACTIVA',
          subtitle: 'El chip NFC físico contiene el enlace directo y está listo para usarse.',
          codeLabel: 'UID FISICO',
          codeValue: uid,
          details: [
            { label: 'Negocio', value: bizName },
            { label: 'Enlace Directo', value: url },
            { label: 'Hardware', value: `${siliconChip} NXP` }
          ]
        });
      } else {
        setNfcStation(prev => ({
          ...prev,
          statusBadgeText: 'Error en Servidor',
          statusBadgeColor: MONIQ.negative,
          footerMessage: res.error || 'Error al validar tarjeta en el servidor.'
        }));
      }
    } catch (err: any) {
      setNfcStation(prev => ({
        ...prev,
        statusBadgeText: 'Error de Red',
        statusBadgeColor: MONIQ.negative,
        footerMessage: err?.message || 'Error de conexion.'
      }));
    } finally {
      setProvisioningLoading(false);
    }
  };

  // Desvincular Tarjeta
  const handleDeleteCard = async (cardId: number) => {
    const res = await api.deleteCard(cardId);
    if (res.success) {
      if (selectedBuyer) loadBuyerCards(selectedBuyer.id);
      loadData();
      setNoticeModalData({
        visible: true,
        title: 'Tarjeta Removida',
        message: 'La tarjeta fue eliminada de la base de datos.',
        isError: false
      });
    }
  };

  // Alternar Estado de Cliente (Activar / Pausar)
  const handleToggleBusinessStatus = async (biz: any) => {
    const res = await api.toggleBusinessStatus(biz.id);
    if (res.success && res.data) {
      loadData();
      if (selectedBuyer && selectedBuyer.id === biz.id) {
        setSelectedBuyer((prev: any) => ({
          ...prev,
          isActive: res.data.isActive,
          isArchived: res.data.isArchived
        }));
      }
      setNoticeModalData({
        visible: true,
        title: res.data.isActive ? 'Negocio Reactivado' : 'Negocio Pausado',
        message: res.data.message || 'Estado actualizado.',
        isError: false
      });
    }
  };

  // Enviar Credenciales o Recordatorio por WhatsApp
  const openWhatsApp = (phone: string, template: 'credentials' | 'expiration', biz: any) => {
    if (!phone) {
      setNoticeModalData({
        visible: true,
        title: 'Sin telefono',
        message: 'Este cliente no tiene un telefono registrado.',
        isError: true
      });
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let text = '';
    if (template === 'credentials') {
      text = `Hola *${biz.ownerName || 'Titular'}* de *${biz.name}*:\n\nTus credenciales para gestionar tus tarjetas y cartas digitales:\n- *Usuario:* ${biz.ownerEmail || biz.slug}\n- *Clave:* ${biz.accessPassword || 'Pass#2026'}\n\nPuedes ingresar a la aplicacion en cualquier momento para revisar tus lecturas y enlaces directos.`;
    } else {
      text = `Estimado/a *${biz.ownerName || 'Titular'}* de *${biz.name}*:\n\nLe recordamos cordialmente que su suscripcion de tarjetas NFC y menu digital vencera proximamente.\n\nComuniquese con nosotros para garantizar la continuidad ininterrumpida de sus servicios en sala.`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      setNoticeModalData({
        visible: true,
        title: 'WhatsApp no disponible',
        message: 'No se pudo abrir WhatsApp en este dispositivo.',
        isError: true
      });
    });
  };

  // Filtrado de clientes
  const filteredBusinesses = businesses.filter(b => {
    const matchSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.slug && b.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (b.city && b.city.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchSearch) return false;
    if (clientFilter === 'active') return b.isActive && !b.isArchived;
    if (clientFilter === 'suspended') return !b.isActive || b.isArchived;
    return true;
  });

  // Totales para métricas
  const totalCards = businesses.reduce((acc, b) => acc + (b.cardsCount || 0), 0);
  const totalTaps = businesses.reduce((acc, b) => acc + (b.totalTaps || 0), 0);
  const activeBusinessesCount = businesses.filter(b => b.isActive && !b.isArchived).length;

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================================================================== */}
        {/* SESION 0: PANEL PRINCIPAL (DASHBOARD & KPIS)                          */}
        {/* ==================================================================== */}
        {activeTab === 0 && (
          <View>
            {/* CABECERA ERGONOMICA DE RESUMEN */}
            <View style={styles.overviewHero}>
              <View style={styles.heroTopRow}>
                <View style={styles.heroTag}>
                  <ShieldCheck size={12} color={MONIQ.cyan} />
                  <Text style={styles.heroTagText}>PANEL DE CONTROL GENERAL</Text>
                </View>

                {/* INDICADOR DE ESTADO DEL SERVIDOR CLOUD */}
                <View style={[styles.serverStatusBadge, serverHealth === 'online' ? styles.statusOnline : styles.statusOffline]}>
                  <View style={[styles.statusDot, serverHealth === 'online' ? styles.dotOnline : styles.dotOffline]} />
                  <Text style={styles.serverStatusText}>
                    {serverHealth === 'online' ? 'Cloud Activo' : 'Comprobando...'}
                  </Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Operaciones y Telemetria</Text>
              <Text style={styles.heroSub}>
                Monitoreo en tiempo real del parque de tarjetas NFC, saltos directos y clientes.
              </Text>
            </View>

            {/* GRILLA DE METRICAS PRINCIPALES */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <View style={styles.metricIconWrap}>
                  <Building size={18} color={MONIQ.accent} />
                </View>
                <Text style={styles.metricValue}>{businesses.length}</Text>
                <Text style={styles.metricLabel}>Negocios Clientes</Text>
                <Text style={styles.metricSub}>{activeBusinessesCount} activos</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(0, 229, 255, 0.12)' }]}>
                  <CreditCard size={18} color={MONIQ.cyan} />
                </View>
                <Text style={styles.metricValue}>{totalCards}</Text>
                <Text style={styles.metricLabel}>Tarjetas Físicas</Text>
                <Text style={styles.metricSub}>Desplegadas en sala</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                  <Zap size={18} color={MONIQ.positive} />
                </View>
                <Text style={styles.metricValue}>{totalTaps}</Text>
                <Text style={styles.metricLabel}>Taps Totales</Text>
                <Text style={styles.metricSub}>Lecturas registradas</Text>
              </View>
            </View>

            {/* ACCESOS DIRECTOS DE ACCION RAPIDA */}
            <Text style={styles.sectionHeading}>ACCIONES FRECUENTES</Text>
            <View style={styles.quickActionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => setShowCreateBizModal(true)}
                activeOpacity={0.8}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Nuevo Negocio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: MONIQ.surfaceElevated, borderColor: MONIQ.cardBorder }]}
                onPress={() => {
                  setAddCardTargetBizId(businesses[0]?.id || null);
                  setShowAddCardModal(true);
                }}
                activeOpacity={0.8}
              >
                <Radio size={16} color={MONIQ.cyan} />
                <Text style={[styles.actionBtnText, { color: MONIQ.textPrimary }]}>Nueva Tarjeta</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: MONIQ.surface, borderColor: MONIQ.cardBorder }]}
                onPress={loadData}
                activeOpacity={0.8}
              >
                <RefreshCw size={16} color={MONIQ.textSecondary} />
                <Text style={[styles.actionBtnText, { color: MONIQ.textSecondary }]}>Actualizar</Text>
              </TouchableOpacity>
            </View>

            {/* CLIENTES CON MAYOR ACTIVIDAD */}
            <Text style={[styles.sectionHeading, { marginTop: 24 }]}>ACTIVIDAD DE CLIENTES</Text>
            {businesses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No hay negocios registrados aún.</Text>
              </View>
            ) : (
              businesses.slice(0, 5).map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={styles.bizListItem}
                  onPress={() => {
                    setSelectedBuyer(b);
                    loadBuyerCards(b.id);
                    setActiveTab(1);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.bizListAvatar}>
                    <Text style={styles.bizListAvatarText}>
                      {b.name.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View style={styles.bizListInfo}>
                    <Text style={styles.bizListName}>{b.name}</Text>
                    <Text style={styles.bizListMeta}>
                      {b.city || 'Lima'} • {b.cardsCount || 0} tarjetas
                    </Text>
                  </View>

                  <View style={styles.bizListEnd}>
                    <Text style={styles.bizListTaps}>{b.totalTaps || 0} taps</Text>
                    <ChevronRight size={16} color={MONIQ.textMuted} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ==================================================================== */}
        {/* SESION 1: CLIENTES (DIRECTORIO & GESTION COMERCIAL)                  */}
        {/* ==================================================================== */}
        {activeTab === 1 && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.screenTitle}>Directorio de Clientes</Text>
                <Text style={styles.screenSubtitle}>
                  Administración de contratos, accesos y tarjetas vinculadas
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addSmallBtn}
                onPress={() => setShowCreateBizModal(true)}
              >
                <Plus size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* BUSCADOR Y FILTROS */}
            <View style={styles.searchBarWrap}>
              <Search size={16} color={MONIQ.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por nombre o ciudad..."
                placeholderTextColor={MONIQ.textMuted}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={MONIQ.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* PILDORAS DE FILTRADO */}
            <View style={styles.filterPillsRow}>
              <TouchableOpacity
                style={[styles.filterPill, clientFilter === 'all' && styles.filterPillActive]}
                onPress={() => setClientFilter('all')}
              >
                <Text style={[styles.filterPillText, clientFilter === 'all' && styles.filterPillTextActive]}>
                  Todos ({businesses.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, clientFilter === 'active' && styles.filterPillActive]}
                onPress={() => setClientFilter('active')}
              >
                <Text style={[styles.filterPillText, clientFilter === 'active' && styles.filterPillTextActive]}>
                  Activos ({activeBusinessesCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, clientFilter === 'suspended' && styles.filterPillActive]}
                onPress={() => setClientFilter('suspended')}
              >
                <Text style={[styles.filterPillText, clientFilter === 'suspended' && styles.filterPillTextActive]}>
                  Pausados ({businesses.length - activeBusinessesCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* LISTA DE CLIENTES */}
            {filteredBusinesses.map((biz) => {
              const isSelected = selectedBuyer?.id === biz.id;
              const isActive = biz.isActive && !biz.isArchived;

              return (
                <View key={biz.id} style={styles.clientCard}>
                  {/* CABECERA DEL CLIENTE */}
                  <View style={styles.clientCardHeader}>
                    <View style={styles.clientAvatar}>
                      <Text style={styles.clientAvatarText}>
                        {biz.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.clientName}>{biz.name}</Text>
                      <Text style={styles.clientDetail}>
                        {biz.ownerEmail || 'Sin correo'} • {biz.phone || 'Sin tel'}
                      </Text>
                    </View>

                    <View style={[styles.statusBadgeSmall, isActive ? styles.badgeActive : styles.badgeInactive]}>
                      <Text style={[styles.statusBadgeTextSmall, isActive ? styles.badgeTextActive : styles.badgeTextInactive]}>
                        {isActive ? 'ACTIVO' : 'PAUSADO'}
                      </Text>
                    </View>
                  </View>

                  {/* DATOS DE OPERACION RAPIDA */}
                  <View style={styles.clientStatsRow}>
                    <View style={styles.clientMiniStat}>
                      <CreditCard size={14} color={MONIQ.cyan} style={{ marginRight: 6 }} />
                      <Text style={styles.clientMiniStatText}>{biz.cardsCount || 0} tarjetas</Text>
                    </View>

                    <View style={styles.clientMiniStat}>
                      <Zap size={14} color={MONIQ.positive} style={{ marginRight: 6 }} />
                      <Text style={styles.clientMiniStatText}>{biz.totalTaps || 0} lecturas</Text>
                    </View>

                    <View style={styles.clientMiniStat}>
                      <Text style={styles.clientMiniStatText}>Plan {biz.planMonths || 12}m</Text>
                    </View>
                  </View>

                  {/* BOTONES DE GESTION DIRECTA */}
                  <View style={styles.clientActionButtons}>
                    <TouchableOpacity
                      style={styles.clientToolBtn}
                      onPress={() => openWhatsApp(biz.phone, 'credentials', biz)}
                    >
                      <MessageSquare size={13} color={MONIQ.cyan} style={{ marginRight: 6 }} />
                      <Text style={styles.clientToolBtnText}>Credenciales</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.clientToolBtn}
                      onPress={() => handleToggleBusinessStatus(biz)}
                    >
                      <Text style={[styles.clientToolBtnText, { color: isActive ? MONIQ.negative : MONIQ.positive }]}>
                        {isActive ? 'Pausar' : 'Activar'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.clientToolBtn, isSelected && styles.clientToolBtnSelected]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedBuyer(null);
                        } else {
                          setSelectedBuyer(biz);
                          loadBuyerCards(biz.id);
                        }
                      }}
                    >
                      <Text style={[styles.clientToolBtnText, isSelected && { color: MONIQ.cyan }]}>
                        {isSelected ? 'Ocultar Tarjetas' : 'Ver Tarjetas'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* SECCION EXPANDIDA DE TARJETAS DEL CLIENTE */}
                  {isSelected && (
                    <View style={styles.expandedCardsContainer}>
                      <View style={styles.expandedHeader}>
                        <Text style={styles.expandedTitle}>Tarjetas en Sala ({buyerCards.length})</Text>
                        <TouchableOpacity
                          style={styles.addCardInExpBtn}
                          onPress={() => {
                            setAddCardTargetBizId(biz.id);
                            setShowAddCardModal(true);
                          }}
                        >
                          <Plus size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.addCardInExpText}>Agregar Tarjeta</Text>
                        </TouchableOpacity>
                      </View>

                      {loadingCards ? (
                        <ActivityIndicator size="small" color={MONIQ.cyan} style={{ marginVertical: 14 }} />
                      ) : buyerCards.length === 0 ? (
                        <Text style={styles.noCardsText}>No hay tarjetas asignadas a este local.</Text>
                      ) : (
                        buyerCards.map((c) => (
                          <View key={c.id} style={styles.cardItemRow}>
                            <View style={styles.cardItemInfo}>
                              <Text style={styles.cardItemLabel}>{c.label || 'Mesa'}</Text>
                              <Text style={styles.cardItemCode}>#{c.cardCode}</Text>
                            </View>

                            <View style={styles.cardItemActions}>
                              <TouchableOpacity
                                style={styles.cardPillBtn}
                                onPress={() => startNfcProgramming(c, biz.name)}
                              >
                                <Radio size={12} color={MONIQ.cyan} style={{ marginRight: 4 }} />
                                <Text style={styles.cardPillBtnText}>Grabar NFC</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.cardPillBtn}
                                onPress={() => setQrModalData({
                                  visible: true,
                                  cardCode: c.cardCode,
                                  label: c.label || 'Mesa',
                                  targetUrl: ENV.getCardUrl(c.cardCode)
                                })}
                              >
                                <Text style={styles.cardPillBtnText}>QR</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.cardDeleteBtn}
                                onPress={() => handleDeleteCard(c.id)}
                              >
                                <Trash2 size={12} color={MONIQ.negative} />
                              </TouchableOpacity>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ==================================================================== */}
        {/* SESION 2: TALLER NFC (GRABACION DIRECTA DE HARDWARE)                 */}
        {/* ==================================================================== */}
        {activeTab === 2 && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.screenTitle}>Taller de Hardware NFC</Text>
                <Text style={styles.screenSubtitle}>
                  Programación física de chips NTAG213 / NTAG215 sin intermediarios
                </Text>
              </View>
            </View>

            {/* CAJA DE PASOS RAPIDOS */}
            <View style={styles.workshopCard}>
              <View style={styles.workshopHero}>
                <Radio size={28} color={MONIQ.cyan} />
                <Text style={styles.workshopTitle}>Estacion de Grabacion</Text>
                <Text style={styles.workshopSub}>
                  Elige el cliente y el destino directo para quemar en el chip NFC al instante.
                </Text>
              </View>

              {/* PASO 1: SELECCIONAR CLIENTE */}
              <Text style={styles.workshopStepLabel}>1. CLIENTE DESTINO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bizPillSelector}>
                {businesses.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.bizSelectorPill, addCardTargetBizId === b.id && styles.bizSelectorPillActive]}
                    onPress={() => setAddCardTargetBizId(b.id)}
                  >
                    <Text style={[styles.bizSelectorPillText, addCardTargetBizId === b.id && styles.bizSelectorPillTextActive]}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* PASO 2: ETIQUETA / UBICACION */}
              <Text style={[styles.workshopStepLabel, { marginTop: 18 }]}>2. UBICACION / MESA</Text>
              <View style={styles.quickTableTagsRow}>
                {['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Barra', 'Terraza'].map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.quickTableTag, addCardLabel === tag && styles.quickTableTagActive]}
                    onPress={() => setAddCardLabel(tag)}
                  >
                    <Text style={[styles.quickTableTagText, addCardLabel === tag && styles.quickTableTagTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.workshopInput}
                value={addCardLabel}
                onChangeText={setAddCardLabel}
                placeholder="O escribe una etiqueta personalizada (Ej. Caja 2)"
                placeholderTextColor={MONIQ.textMuted}
              />

              {/* PASO 3: DESTINO DIRECTO (0ms) */}
              <Text style={[styles.workshopStepLabel, { marginTop: 18 }]}>3. DESTINO DEL SALTO (SIN HUBS)</Text>
              <View style={styles.destinationToggleRow}>
                <TouchableOpacity
                  style={[styles.destToggleBtn, addCardDestination === 1 && styles.destToggleBtnActive]}
                  onPress={() => setAddCardDestination(1)}
                >
                  <Text style={[styles.destToggleText, addCardDestination === 1 && styles.destToggleTextActive]}>
                    Reseñas Google (5★)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.destToggleBtn, addCardDestination === 2 && styles.destToggleBtnActive]}
                  onPress={() => setAddCardDestination(2)}
                >
                  <Text style={[styles.destToggleText, addCardDestination === 2 && styles.destToggleTextActive]}>
                    Carta / Menú Digital
                  </Text>
                </TouchableOpacity>
              </View>

              {/* BOTON GENERAR Y PASAR A GRABAR */}
              <TouchableOpacity
                style={styles.createAndBurnBtn}
                onPress={handleAssignCard}
                disabled={addCardLoading}
              >
                {addCardLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Radio size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.createAndBurnBtnText}>Crear Tarjeta y Preparar NFC</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ==================================================================== */}
        {/* SESION 3: AUDITORIA & TELEMETRIA EN VIVO                             */}
        {/* ==================================================================== */}
        {activeTab === 3 && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.screenTitle}>Auditoría & Telemetría</Text>
                <Text style={styles.screenSubtitle}>
                  Registro de eventos en vivo, diagnóstico de hardware y logs
                </Text>
              </View>

              <TouchableOpacity
                style={styles.copyLogsBtn}
                onPress={async () => {
                  await Clipboard.setStringAsync(LogManager.getAllAsText());
                  setCopiedLogs(true);
                  setTimeout(() => setCopiedLogs(false), 2000);
                }}
              >
                <Copy size={14} color={copiedLogs ? MONIQ.positive : MONIQ.cyan} style={{ marginRight: 6 }} />
                <Text style={[styles.copyLogsBtnText, copiedLogs && { color: MONIQ.positive }]}>
                  {copiedLogs ? 'Copiado' : 'Copiar'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ESTADO DE HARDWARE Y CONTROLADORES */}
            <View style={styles.telemetryCard}>
              <Text style={styles.telemetryCardTitle}>SUBSISTEMAS DEL DISPOSITIVO</Text>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Controlador NFC Nativo:</Text>
                <Text style={styles.telemetryVal}>NXP / 13.56 MHz (Activo)</Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Backend Cloud:</Text>
                <Text style={[styles.telemetryVal, { color: MONIQ.positive }]}>
                  {ENV.BACKEND_URL.replace('https://', '')}
                </Text>
              </View>
              <View style={styles.telemetryRow}>
                <Text style={styles.telemetryKey}>Dispositivo Local:</Text>
                <Text style={styles.telemetryVal}>
                  {activeDevice ? `${activeDevice.brand} ${activeDevice.modelName}` : 'Terminal Android'}
                </Text>
              </View>
            </View>

            {/* CONSOLA DE LOGS EN VIVO */}
            <Text style={[styles.sectionHeading, { marginTop: 20 }]}>CONSOLA DE EVENTOS</Text>
            <View style={styles.logConsoleCard}>
              {LogManager.getLogs().length === 0 ? (
                <Text style={styles.logEmptyText}>No hay eventos registrados en la sesión actual.</Text>
              ) : (
                LogManager.getLogs().slice(0, 30).map((log, index) => (
                  <View key={index} style={styles.logEntry}>
                    <Text style={styles.logTimestamp}>{log.slice(0, 10)}</Text>
                    <Text style={styles.logMessage}>{log.slice(10)}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {/* ==================================================================== */}
        {/* SESION 4: AJUSTES & INFRAESTRUCTURA                                  */}
        {/* ==================================================================== */}
        {activeTab === 4 && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.screenTitle}>Ajustes del Sistema</Text>
                <Text style={styles.screenSubtitle}>
                  Configuración de red, infraestructura y mantenimiento
                </Text>
              </View>
            </View>

            <View style={styles.settingsCard}>
              <Text style={styles.settingsSectionTitle}>CONEXION CLOUD</Text>
              <View style={styles.settingsItem}>
                <View>
                  <Text style={styles.settingsLabel}>Servidor de Producción</Text>
                  <Text style={styles.settingsValue}>{ENV.BACKEND_URL}</Text>
                </View>
                <View style={styles.serverStatusTag}>
                  <Text style={styles.serverStatusTagText}>ONLINE</Text>
                </View>
              </View>

              <Text style={[styles.settingsSectionTitle, { marginTop: 20 }]}>BASE DE DATOS & PERSISTENCIA</Text>
              <View style={styles.settingsItem}>
                <View>
                  <Text style={styles.settingsLabel}>Motor SQL</Text>
                  <Text style={styles.settingsValue}>SQLite Cloud Sincronizado</Text>
                </View>
                <TouchableOpacity style={styles.syncBtn} onPress={loadData}>
                  <RefreshCw size={14} color={MONIQ.cyan} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.settingsSectionTitle, { marginTop: 20 }]}>SEGURIDAD</Text>
              <View style={styles.settingsItem}>
                <View>
                  <Text style={styles.settingsLabel}>Modo de Operación</Text>
                  <Text style={styles.settingsValue}>SuperAdmin Maestro Autorizado</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ==================================================================== */}
      {/* BARRA DE NAVEGACION FLOTANTE CON 5 SESIONES FUNCIONALES              */}
      {/* ==================================================================== */}
      <View style={styles.bottomBarContainer}>
        <TouchableOpacity
          style={[styles.bottomBarItem, activeTab === 0 && styles.bottomBarItemActive]}
          onPress={() => setActiveTab(0)}
        >
          <Home size={19} color={activeTab === 0 ? MONIQ.cyan : MONIQ.textSecondary} />
          <Text style={[styles.bottomBarLabel, activeTab === 0 && styles.bottomBarLabelActive]}>
            Panel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBarItem, activeTab === 1 && styles.bottomBarItemActive]}
          onPress={() => setActiveTab(1)}
        >
          <Users size={19} color={activeTab === 1 ? MONIQ.cyan : MONIQ.textSecondary} />
          <Text style={[styles.bottomBarLabel, activeTab === 1 && styles.bottomBarLabelActive]}>
            Clientes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBarItem, activeTab === 2 && styles.bottomBarItemActive]}
          onPress={() => setActiveTab(2)}
        >
          <Radio size={19} color={activeTab === 2 ? MONIQ.cyan : MONIQ.textSecondary} />
          <Text style={[styles.bottomBarLabel, activeTab === 2 && styles.bottomBarLabelActive]}>
            Taller NFC
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBarItem, activeTab === 3 && styles.bottomBarItemActive]}
          onPress={() => setActiveTab(3)}
        >
          <Activity size={19} color={activeTab === 3 ? MONIQ.cyan : MONIQ.textSecondary} />
          <Text style={[styles.bottomBarLabel, activeTab === 3 && styles.bottomBarLabelActive]}>
            Auditoría
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomBarItem, activeTab === 4 && styles.bottomBarItemActive]}
          onPress={() => setActiveTab(4)}
        >
          <Settings size={19} color={activeTab === 4 ? MONIQ.cyan : MONIQ.textSecondary} />
          <Text style={[styles.bottomBarLabel, activeTab === 4 && styles.bottomBarLabelActive]}>
            Ajustes
          </Text>
        </TouchableOpacity>
      </View>

      {/* ==================================================================== */}
      {/* MODAL: RADAR DE GRABADO NFC EN SILICIO                                */}
      {/* ==================================================================== */}
      <Modal visible={showNfcModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.nfcModalCard}>
            <View style={styles.nfcModalHeader}>
              <Text style={styles.nfcModalTitle}>Grabador NFC de Hardware</Text>
              <TouchableOpacity onPress={() => setShowNfcModal(false)}>
                <X size={20} color={MONIQ.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* RADAR ANIMADO */}
            <View style={styles.radarWrapper}>
              <Animated.View style={[styles.radarOuterRing, { transform: [{ scale: radarAnim }] }]} />
              <View style={styles.radarInnerCircle}>
                <Radio size={36} color={nfcStation.isCompleted ? MONIQ.positive : MONIQ.cyan} />
              </View>
            </View>

            <View style={[styles.nfcStatusPill, { borderColor: nfcStation.statusBadgeColor }]}>
              <Text style={[styles.nfcStatusPillText, { color: nfcStation.statusBadgeColor }]}>
                {nfcStation.statusBadgeText}
              </Text>
            </View>

            <Text style={styles.nfcFooterMsg}>{nfcStation.footerMessage}</Text>

            <View style={styles.nfcCardDetailsBox}>
              <Text style={styles.nfcDetailLine}>Tarjeta: #{selectedCardForNfc?.cardCode}</Text>
              <Text style={styles.nfcDetailLine}>UID: {siliconUid || 'Esperando lectura...'}</Text>
              <Text style={styles.nfcDetailLine}>Chip: {siliconChip} (NXP)</Text>
            </View>

            <TouchableOpacity
              style={styles.closeNfcModalBtn}
              onPress={() => setShowNfcModal(false)}
            >
              <Text style={styles.closeNfcModalBtnText}>
                {nfcStation.isCompleted ? 'Listo' : 'Cancelar Grabado'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODAL: REGISTRAR NUEVO CLIENTE                                       */}
      {/* ==================================================================== */}
      <Modal visible={showCreateBizModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <View style={styles.modalFormHeader}>
              <Text style={styles.modalFormTitle}>Nuevo Negocio Cliente</Text>
              <TouchableOpacity onPress={() => setShowCreateBizModal(false)}>
                <X size={20} color={MONIQ.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>NOMBRE COMERCIAL *</Text>
              <TextInput
                style={styles.formInput}
                value={newBizName}
                onChangeText={setNewBizName}
                placeholder="Ej. Restaurante Miraflores"
                placeholderTextColor={MONIQ.textMuted}
              />

              <Text style={[styles.formLabel, { marginTop: 12 }]}>TITULAR / ENCARGADO</Text>
              <TextInput
                style={styles.formInput}
                value={newBizOwner}
                onChangeText={setNewBizOwner}
                placeholder="Nombre del dueño o administrador"
                placeholderTextColor={MONIQ.textMuted}
              />

              <Text style={[styles.formLabel, { marginTop: 12 }]}>CORREO ELECTRÓNICO (LOGIN) *</Text>
              <TextInput
                style={styles.formInput}
                value={newBizEmail}
                onChangeText={setNewBizEmail}
                placeholder="contacto@restaurante.com"
                placeholderTextColor={MONIQ.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={[styles.formLabel, { marginTop: 12 }]}>CONTRASEÑA DE ACCESO</Text>
              <TextInput
                style={styles.formInput}
                value={newBizPassword}
                onChangeText={setNewBizPassword}
                placeholder="Dejar vacio para generar clave automatica"
                placeholderTextColor={MONIQ.textMuted}
              />

              <Text style={[styles.formLabel, { marginTop: 12 }]}>TELÉFONO WHATSAPP</Text>
              <TextInput
                style={styles.formInput}
                value={newBizPhone}
                onChangeText={setNewBizPhone}
                placeholder="Ej. 987654321"
                placeholderTextColor={MONIQ.textMuted}
                keyboardType="phone-pad"
              />

              <Text style={[styles.formLabel, { marginTop: 12 }]}>CIUDAD / SEDE</Text>
              <TextInput
                style={styles.formInput}
                value={newBizCity}
                onChangeText={setNewBizCity}
                placeholder="Lima"
                placeholderTextColor={MONIQ.textMuted}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.submitFormBtn}
              onPress={handleCreateBusiness}
              disabled={createLoading}
            >
              {createLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitFormBtnText}>Registrar y Guardar Cliente</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================================== */}
      {/* MODALES REUTILIZABLES MONIQ                                         */}
      {/* ==================================================================== */}
      <SuccessModal
        visible={successModalData.visible}
        title={successModalData.title}
        subtitle={successModalData.subtitle}
        codeLabel={successModalData.codeLabel}
        codeValue={successModalData.codeValue}
        details={successModalData.details}
        onClose={() => setSuccessModalData(prev => ({ ...prev, visible: false }))}
      />

      <NoticeModal
        visible={noticeModalData.visible}
        title={noticeModalData.title}
        message={noticeModalData.message}
        isError={noticeModalData.isError}
        onClose={() => setNoticeModalData(prev => ({ ...prev, visible: false }))}
      />

      <ErrorModal
        visible={errorModalData.visible}
        title={errorModalData.title}
        message={errorModalData.message}
        onClose={() => setErrorModalData(prev => ({ ...prev, visible: false }))}
      />

      <QrModal
        visible={qrModalData.visible}
        cardCode={qrModalData.cardCode}
        label={qrModalData.label}
        targetUrl={qrModalData.targetUrl}
        onClose={() => setQrModalData(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: MONIQ.bg
  },
  scrollArea: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 90
  },
  overviewHero: {
    backgroundColor: MONIQ.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginBottom: 16
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  heroTagText: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginLeft: 5
  },
  serverStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1
  },
  statusOnline: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  statusOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
  },
  dotOnline: {
    backgroundColor: MONIQ.positive
  },
  dotOffline: {
    backgroundColor: MONIQ.negative
  },
  serverStatusText: {
    color: MONIQ.textPrimary,
    fontSize: 10,
    fontWeight: '700'
  },
  heroTitle: {
    color: MONIQ.textPrimary,
    fontSize: 22,
    fontWeight: '800'
  },
  heroSub: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  metricCard: {
    flex: 1,
    backgroundColor: MONIQ.surface,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  metricValue: {
    color: MONIQ.textPrimary,
    fontSize: 20,
    fontWeight: '800'
  },
  metricLabel: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2
  },
  metricSub: {
    color: MONIQ.textMuted,
    fontSize: 9,
    marginTop: 2
  },
  sectionHeading: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MONIQ.accent,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6
  },
  bizListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  bizListAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bizListAvatarText: {
    color: MONIQ.accent,
    fontSize: 13,
    fontWeight: '800'
  },
  bizListInfo: {
    flex: 1,
    marginLeft: 12
  },
  bizListName: {
    color: MONIQ.textPrimary,
    fontSize: 14,
    fontWeight: '700'
  },
  bizListMeta: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  bizListEnd: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  bizListTaps: {
    color: MONIQ.cyan,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 6
  },
  emptyCard: {
    padding: 20,
    backgroundColor: MONIQ.surface,
    borderRadius: 14,
    alignItems: 'center'
  },
  emptyText: {
    color: MONIQ.textMuted,
    fontSize: 13
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  screenTitle: {
    color: MONIQ.textPrimary,
    fontSize: 22,
    fontWeight: '800'
  },
  screenSubtitle: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  addSmallBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: MONIQ.accent,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginBottom: 10
  },
  searchInput: {
    flex: 1,
    color: MONIQ.textPrimary,
    fontSize: 13
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: MONIQ.surface,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  filterPillActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: MONIQ.accent
  },
  filterPillText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  filterPillTextActive: {
    color: MONIQ.accent
  },
  clientCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  clientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  clientAvatarText: {
    color: MONIQ.accent,
    fontSize: 14,
    fontWeight: '800'
  },
  clientName: {
    color: MONIQ.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  clientDetail: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  statusBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  badgeInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)'
  },
  statusBadgeTextSmall: {
    fontSize: 9,
    fontWeight: '800'
  },
  badgeTextActive: {
    color: MONIQ.positive
  },
  badgeTextInactive: {
    color: MONIQ.negative
  },
  clientStatsRow: {
    flexDirection: 'row',
    backgroundColor: MONIQ.bg,
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
    justifyContent: 'space-around'
  },
  clientMiniStat: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  clientMiniStatText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  clientActionButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10
  },
  clientToolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MONIQ.surfaceElevated,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  clientToolBtnSelected: {
    borderColor: MONIQ.cyan,
    backgroundColor: 'rgba(0, 229, 255, 0.08)'
  },
  clientToolBtnText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  expandedCardsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: MONIQ.cardBorder
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  expandedTitle: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  addCardInExpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  addCardInExpText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  noCardsText: {
    color: MONIQ.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 8
  },
  cardItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: MONIQ.bg,
    borderRadius: 10,
    padding: 8,
    marginBottom: 6
  },
  cardItemInfo: {
    flex: 1
  },
  cardItemLabel: {
    color: MONIQ.textPrimary,
    fontSize: 12,
    fontWeight: '700'
  },
  cardItemCode: {
    color: MONIQ.textMuted,
    fontSize: 10,
    fontFamily: 'monospace'
  },
  cardItemActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center'
  },
  cardPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  cardPillBtnText: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontWeight: '700'
  },
  cardDeleteBtn: {
    padding: 6
  },
  workshopCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  workshopHero: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10
  },
  workshopTitle: {
    color: MONIQ.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8
  },
  workshopSub: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4
  },
  workshopStepLabel: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8
  },
  bizPillSelector: {
    flexDirection: 'row',
    marginBottom: 8
  },
  bizSelectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: MONIQ.bg,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginRight: 8
  },
  bizSelectorPillActive: {
    borderColor: MONIQ.accent,
    backgroundColor: 'rgba(59, 130, 246, 0.15)'
  },
  bizSelectorPillText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  bizSelectorPillTextActive: {
    color: MONIQ.textPrimary
  },
  quickTableTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8
  },
  quickTableTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: MONIQ.bg,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  quickTableTagActive: {
    borderColor: MONIQ.cyan,
    backgroundColor: 'rgba(0, 229, 255, 0.12)'
  },
  quickTableTagText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  quickTableTagTextActive: {
    color: MONIQ.cyan
  },
  workshopInput: {
    backgroundColor: MONIQ.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    color: MONIQ.textPrimary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  destinationToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16
  },
  destToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: MONIQ.bg,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  destToggleBtnActive: {
    borderColor: MONIQ.positive,
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  destToggleText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  destToggleTextActive: {
    color: MONIQ.positive
  },
  createAndBurnBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MONIQ.accent,
    height: 48,
    borderRadius: 12,
    marginTop: 6
  },
  createAndBurnBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  copyLogsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)'
  },
  copyLogsBtnText: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontWeight: '700'
  },
  telemetryCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  telemetryCardTitle: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  telemetryKey: {
    color: MONIQ.textSecondary,
    fontSize: 11
  },
  telemetryVal: {
    color: MONIQ.textPrimary,
    fontSize: 11,
    fontWeight: '700'
  },
  logConsoleCard: {
    backgroundColor: '#05070D',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    maxHeight: 280
  },
  logEmptyText: {
    color: MONIQ.textMuted,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 14
  },
  logEntry: {
    flexDirection: 'row',
    paddingVertical: 3
  },
  logTimestamp: {
    color: MONIQ.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    marginRight: 8
  },
  logMessage: {
    flex: 1,
    color: '#A0AEC0',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  settingsCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  settingsSectionTitle: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: MONIQ.bg,
    borderRadius: 12,
    padding: 12
  },
  settingsLabel: {
    color: MONIQ.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  },
  settingsValue: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  serverStatusTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  serverStatusTagText: {
    color: MONIQ.positive,
    fontSize: 10,
    fontWeight: '800'
  },
  syncBtn: {
    padding: 8
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: '#0B0F19',
    borderTopWidth: 1,
    borderTopColor: MONIQ.cardBorder,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 12 : 4
  },
  bottomBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  bottomBarItemActive: {
    transform: [{ scale: 1.05 }]
  },
  bottomBarLabel: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3
  },
  bottomBarLabelActive: {
    color: MONIQ.cyan,
    fontWeight: '800'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  nfcModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: MONIQ.surface,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  nfcModalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  nfcModalTitle: {
    color: MONIQ.textPrimary,
    fontSize: 16,
    fontWeight: '800'
  },
  radarWrapper: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14
  },
  radarOuterRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    backgroundColor: 'rgba(0, 229, 255, 0.05)'
  },
  radarInnerCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: MONIQ.bg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cyan
  },
  nfcStatusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 6
  },
  nfcStatusPillText: {
    fontSize: 11,
    fontWeight: '800'
  },
  nfcFooterMsg: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 16
  },
  nfcCardDetailsBox: {
    width: '100%',
    backgroundColor: MONIQ.bg,
    borderRadius: 12,
    padding: 10,
    marginVertical: 10
  },
  nfcDetailLine: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginVertical: 2
  },
  closeNfcModalBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    backgroundColor: MONIQ.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  closeNfcModalBtnText: {
    color: MONIQ.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  },
  formModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: MONIQ.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  modalFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalFormTitle: {
    color: MONIQ.textPrimary,
    fontSize: 17,
    fontWeight: '800'
  },
  formLabel: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6
  },
  formInput: {
    backgroundColor: MONIQ.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: MONIQ.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  submitFormBtn: {
    backgroundColor: MONIQ.accent,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18
  },
  submitFormBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  }
});
