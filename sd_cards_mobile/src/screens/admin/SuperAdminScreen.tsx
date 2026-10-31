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
  AlertTriangle,
  Edit3,
  MapPin,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  KeyRound,
  Clock,
  User,
  Mail,
  Phone
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
import { UpdateService, UpdateCheckResult } from '../../services/updateService';
import { UpdateModal } from '../../components/UpdateModal';
import { ClientEditModal } from '../../components/ClientEditModal';
import { ClientCredentialsModal } from '../../components/ClientCredentialsModal';
import { RenewPlanModal } from '../../components/RenewPlanModal';
import { PERU_DEPARTMENTS, parseLocationCity } from '../../data/peruLocations';

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
  const [clientFilter, setClientFilter] = useState<'all' | 'active' | 'suspended' | 'expired' | 'expiring_soon'>('all');

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

  // Modal Crear Cliente con Ubigeo Perú
  const [showCreateBizModal, setShowCreateBizModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizOwner, setNewBizOwner] = useState('');
  const [newBizRuc, setNewBizRuc] = useState('');
  const [newBizEmail, setNewBizEmail] = useState('');
  const [newBizPassword, setNewBizPassword] = useState('');
  const [newBizPhone, setNewBizPhone] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('lima');
  const [selectedProvId, setSelectedProvId] = useState('lima');
  const [selectedDistrictName, setSelectedDistrictName] = useState('Miraflores');
  const [newBizAddress, setNewBizAddress] = useState('');
  const [newBizPlanMonths, setNewBizPlanMonths] = useState(12);
  const [newBizServices, setNewBizServices] = useState<number>(1);

  // Filtros avanzados del directorio de clientes
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<'all' | '1' | '2' | '3'>('all');

  // Modal y formulario de Edición Integral de Clientes
  const [showEditBizModal, setShowEditBizModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);

  // Modal Ver Credenciales
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedCredentialsBiz, setSelectedCredentialsBiz] = useState<any | null>(null);

  // Modal Renovar Plan
  const [showRenewPlanModal, setShowRenewPlanModal] = useState(false);
  const [selectedRenewBiz, setSelectedRenewBiz] = useState<any | null>(null);

  // Expansión interactiva individual de tarjetas de clientes
  const [expandedBizIds, setExpandedBizIds] = useState<Record<number, boolean>>({});
  const [bizCardsMap, setBizCardsMap] = useState<Record<number, any[]>>({});

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

  // Telemetría de hardware y actualizaciones
  const [activeDevice, setActiveDevice] = useState<ActiveDeviceInfo | null>(null);
  const [serverHealth, setServerHealth] = useState<'online' | 'checking' | 'error'>('online');
  const [updateData, setUpdateData] = useState<UpdateCheckResult | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

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
      const safeCards = cards || [];
      setBuyerCards(safeCards);
      setBizCardsMap(prev => ({ ...prev, [bizId]: safeCards }));
    } catch (e) {
      setBuyerCards([]);
      setBizCardsMap(prev => ({ ...prev, [bizId]: [] }));
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
    const currentDept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
    const currentProv = currentDept?.provinces?.find(p => p.id === selectedProvId) || currentDept?.provinces?.[0];
    const deptName = currentDept?.name || 'Perú';
    const provName = currentProv?.name || 'Central';
    const locationCity = `${selectedDistrictName}, ${provName} - ${deptName}`;

    setCreateLoading(true);
    const res = await api.registerBusiness({
      name: newBizName.trim(),
      ownerName: newBizOwner.trim() || newBizName.trim(),
      email: newBizEmail.trim(),
      password: newBizPassword.trim() || undefined,
      phone: newBizPhone.trim(),
      ruc: newBizRuc.trim() || undefined,
      department: deptName,
      province: provName,
      district: selectedDistrictName,
      city: locationCity,
      address: newBizAddress.trim() || selectedDistrictName,
      services: newBizServices,
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
      setNewBizRuc('');
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

  // Abrir Modal de Edición Integral con datos cargados
  const openEditBizModal = (biz: any) => {
    setEditingClient(biz);
    setShowEditBizModal(true);
  };

  // Callback al guardar cambios desde ClientEditModal
  const handleClientEditSuccess = (updatedBiz: any) => {
    setBusinesses(prev =>
      prev.map(b => (b.id === updatedBiz.id ? { ...b, ...updatedBiz } : b))
    );
    if (selectedBuyer && selectedBuyer.id === updatedBiz.id) {
      setSelectedBuyer((prev: any) => ({
        ...prev,
        ...updatedBiz
      }));
    }
    loadData();

    setNoticeModalData({
      visible: true,
      title: 'Cliente Actualizado',
      message: `Los datos comerciales y técnicos de "${updatedBiz.name || 'Cliente'}" fueron guardados exitosamente.`,
      isError: false
    });
  };

  // Abrir Modal de Credenciales de Acceso
  const openCredentialsModal = (biz: any) => {
    setSelectedCredentialsBiz(biz);
    setShowCredentialsModal(true);
  };

  // Abrir Modal de Renovación de Plan
  const openRenewPlanModal = (biz: any) => {
    setSelectedRenewBiz(biz);
    setShowRenewPlanModal(true);
  };

  // Callback al confirmar renovación desde RenewPlanModal
  const handlePlanRenewSuccess = (renewedData: { planExpiryDate: string; planMonths: number; isActive: boolean }) => {
    if (selectedRenewBiz) {
      setBusinesses(prev =>
        prev.map(b => (b.id === selectedRenewBiz.id ? { ...b, ...renewedData } : b))
      );
      if (selectedBuyer && selectedBuyer.id === selectedRenewBiz.id) {
        setSelectedBuyer((prev: any) => ({ ...prev, ...renewedData }));
      }
    }
    loadData();
    setNoticeModalData({
      visible: true,
      title: 'Plan Renovado',
      message: `Se extendió la vigencia para "${selectedRenewBiz?.name || 'Cliente'}".`,
      isError: false
    });
  };

  // Alternar expansión de ficha de cliente
  const toggleExpandBiz = (bizId: number) => {
    setExpandedBizIds(prev => {
      const willBeExpanded = !prev[bizId];
      if (willBeExpanded) {
        loadBuyerCards(bizId);
        setSelectedBuyer(businesses.find(b => b.id === bizId) || null);
      }
      return { ...prev, [bizId]: willBeExpanded };
    });
  };

  // Calcular vigencia y estado en tiempo real para métricas y badges
  const computeClientStatus = (biz: any) => {
    const isOperating = biz.isActive && !biz.isArchived;
    if (!isOperating) {
      return {
        status: 'paused' as const,
        label: 'PAUSADO',
        daysRemaining: null,
        isExpired: false,
        isExpiringSoon: false
      };
    }

    if (biz.planExpiryDate) {
      const expiry = new Date(biz.planExpiryDate);
      if (!isNaN(expiry.getTime())) {
        const now = new Date();
        const diffMs = expiry.getTime() - now.getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffMs <= 0 || days < 0) {
          return {
            status: 'expired' as const,
            label: 'VENCIDO',
            daysRemaining: days <= 0 ? (days === 0 ? -1 : days) : days,
            isExpired: true,
            isExpiringSoon: false
          };
        }
        if (days <= 30) {
          return {
            status: 'expiring_soon' as const,
            label: 'POR VENCER',
            daysRemaining: days,
            isExpired: false,
            isExpiringSoon: true
          };
        }
        return {
          status: 'active' as const,
          label: 'ACTIVO',
          daysRemaining: days,
          isExpired: false,
          isExpiringSoon: false
        };
      }
    }

    return {
      status: 'active' as const,
      label: 'ACTIVO',
      daysRemaining: null,
      isExpired: false,
      isExpiringSoon: false
    };
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

  // Filtrado de clientes con búsqueda instantánea y filtros avanzados
  const filteredBusinesses = businesses.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.slug && b.slug.toLowerCase().includes(q)) ||
      (b.ruc && b.ruc.toLowerCase().includes(q)) ||
      (b.ownerName && b.ownerName.toLowerCase().includes(q)) ||
      (b.phone && b.phone.toLowerCase().includes(q)) ||
      (b.ownerPhone && b.ownerPhone.toLowerCase().includes(q)) ||
      (b.ownerEmail && b.ownerEmail.toLowerCase().includes(q)) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.department && b.department.toLowerCase().includes(q)) ||
      (b.province && b.province.toLowerCase().includes(q)) ||
      (b.district && b.district.toLowerCase().includes(q)) ||
      (b.address && b.address.toLowerCase().includes(q));

    if (!matchSearch) return false;

    const statusInfo = computeClientStatus(b);

    // Filtros de Estado
    if (clientFilter === 'active' && statusInfo.status !== 'active') return false;
    if (clientFilter === 'suspended' && statusInfo.status !== 'paused') return false;
    if (clientFilter === 'expired' && statusInfo.status !== 'expired') return false;
    if (clientFilter === 'expiring_soon' && statusInfo.status !== 'expiring_soon') return false;

    // Filtro de Departamento
    if (deptFilter !== 'all') {
      const targetDept = deptFilter.toLowerCase();
      const matchDept =
        (b.department && b.department.toLowerCase() === targetDept) ||
        (b.city && b.city.toLowerCase().includes(targetDept));
      if (!matchDept) return false;
    }

    // Filtro de Tipo de Servicio
    if (serviceFilter !== 'all') {
      if (String(b.templateType) !== serviceFilter) return false;
    }

    return true;
  });

  // Totales para métricas y badges
  const totalCards = businesses.reduce((acc, b) => acc + (b.cardsCount || 0), 0);
  const totalTaps = businesses.reduce((acc, b) => acc + (b.totalTaps || 0), 0);
  const pausedBusinessesCount = businesses.filter(b => computeClientStatus(b).status === 'paused').length;
  const activeBusinessesCount = businesses.filter(b => computeClientStatus(b).status === 'active').length;
  const expiringSoonBusinessesCount = businesses.filter(b => computeClientStatus(b).status === 'expiring_soon').length;
  const expiredBusinessesCount = businesses.filter(b => computeClientStatus(b).status === 'expired').length;

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

            {/* BUSCADOR Y FILTROS INSTANTANEOS */}
            <View style={styles.searchBarWrap}>
              <Search size={16} color={MONIQ.cyan} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Buscar por nombre, RUC, titular, ciudad, telefono..."
                placeholderTextColor={MONIQ.textMuted}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <X size={16} color={MONIQ.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* FILTROS AVANZADOS 1: ESTADO OPERATIVO */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.pillsScrollRow, { marginBottom: 8 }]}>
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
                style={[styles.filterPill, clientFilter === 'expiring_soon' && styles.filterPillActive]}
                onPress={() => setClientFilter('expiring_soon')}
              >
                <Text style={[styles.filterPillText, clientFilter === 'expiring_soon' && styles.filterPillTextActive]}>
                  Por Vencer ({expiringSoonBusinessesCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, clientFilter === 'expired' && styles.filterPillActive]}
                onPress={() => setClientFilter('expired')}
              >
                <Text style={[styles.filterPillText, clientFilter === 'expired' && styles.filterPillTextActive]}>
                  Vencidos ({expiredBusinessesCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, clientFilter === 'suspended' && styles.filterPillActive]}
                onPress={() => setClientFilter('suspended')}
              >
                <Text style={[styles.filterPillText, clientFilter === 'suspended' && styles.filterPillTextActive]}>
                  Pausados ({pausedBusinessesCount})
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* FILTROS AVANZADOS 2: TIPO DE SERVICIO / MODALIDAD */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.pillsScrollRow, { marginBottom: 8 }]}>
              {[
                { id: 'all', label: 'Todos los Planes' },
                { id: '1', label: 'Menú Digital' },
                { id: '2', label: 'Reseñas Google' },
                { id: '3', label: 'Dual Hub Completo' }
              ].map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.filterPillMini, serviceFilter === s.id && styles.filterPillMiniActive]}
                  onPress={() => setServiceFilter(s.id as any)}
                >
                  <Text style={[styles.filterPillMiniText, serviceFilter === s.id && styles.filterPillMiniTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* FILTROS AVANZADOS 3: UBIGEO (DEPARTAMENTOS DEL PERU) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.pillsScrollRow, { marginBottom: 14 }]}>
              <TouchableOpacity
                style={[styles.filterPillMini, deptFilter === 'all' && styles.filterPillMiniActive]}
                onPress={() => setDeptFilter('all')}
              >
                <Text style={[styles.filterPillMiniText, deptFilter === 'all' && styles.filterPillMiniTextActive]}>
                  Todas las Regiones
                </Text>
              </TouchableOpacity>
              {PERU_DEPARTMENTS.map(dept => (
                <TouchableOpacity
                  key={dept.id}
                  style={[styles.filterPillMini, deptFilter === dept.name && styles.filterPillMiniActive]}
                  onPress={() => setDeptFilter(deptFilter === dept.name ? 'all' : dept.name)}
                >
                  <Text style={[styles.filterPillMiniText, deptFilter === dept.name && styles.filterPillMiniTextActive]}>
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* LISTA DE CLIENTES */}
            {filteredBusinesses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No se encontraron clientes con los filtros aplicados.</Text>
              </View>
            ) : (
              filteredBusinesses.map((biz) => {
                const statusInfo = computeClientStatus(biz);
                const isOperating = biz.isActive && !biz.isArchived;
                const isExpanded = !!expandedBizIds[biz.id];
                const clientCards = bizCardsMap[biz.id] || (selectedBuyer?.id === biz.id ? buyerCards : (biz.cards || []));

                let expiryBadgeText = '';
                if (statusInfo.status === 'paused') {
                  expiryBadgeText = 'Pausado';
                } else if (statusInfo.daysRemaining !== null) {
                  if (statusInfo.daysRemaining < 0) {
                    expiryBadgeText = `Vencido (hace ${Math.abs(statusInfo.daysRemaining)}d)`;
                  } else if (statusInfo.daysRemaining === 0) {
                    expiryBadgeText = 'Vence hoy';
                  } else {
                    expiryBadgeText = `Vence en ${statusInfo.daysRemaining} días`;
                  }
                } else {
                  expiryBadgeText = `Plan ${biz.planMonths || 12}m`;
                }

                const badgeStyle =
                  statusInfo.status === 'active'
                    ? styles.badgeActive
                    : statusInfo.status === 'expiring_soon'
                    ? styles.badgeExpiringSoon
                    : statusInfo.status === 'expired'
                    ? styles.badgeExpired
                    : styles.badgePaused;

                const badgeTextStyle =
                  statusInfo.status === 'active'
                    ? styles.badgeTextActive
                    : statusInfo.status === 'expiring_soon'
                    ? styles.badgeTextExpiringSoon
                    : statusInfo.status === 'expired'
                    ? styles.badgeTextExpired
                    : styles.badgeTextPaused;

                const formattedExpiryFull = biz.planExpiryDate
                  ? new Date(biz.planExpiryDate).toLocaleDateString('es-PE', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })
                  : 'Sin fecha de vencimiento';

                return (
                  <View key={biz.id} style={styles.clientCard}>
                    {/* CABECERA RESUMEN DEL CLIENTE */}
                    <View style={styles.clientCardHeader}>
                      <View style={styles.clientAvatar}>
                        <Text style={styles.clientAvatarText}>
                          {biz.name ? biz.name.substring(0, 2).toUpperCase() : 'SD'}
                        </Text>
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                          <Text style={styles.clientName}>{biz.name}</Text>
                          {biz.ruc ? (
                            <View style={styles.rucBadge}>
                              <Text style={styles.rucBadgeText}>RUC {biz.ruc}</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.clientDetail}>
                          {biz.ownerName || 'Titular'} • {biz.ownerPhone || biz.phone || 'Sin teléfono'}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <View style={[styles.statusBadgeSmall, badgeStyle]}>
                          <Text style={[styles.statusBadgeTextSmall, badgeTextStyle]}>
                            {statusInfo.label}
                          </Text>
                        </View>
                        <View style={styles.daysRemainingBadge}>
                          <Clock size={10} color={MONIQ.textSecondary} style={{ marginRight: 3 }} />
                          <Text style={styles.daysRemainingText}>{expiryBadgeText}</Text>
                        </View>
                      </View>
                    </View>

                    {/* ETIQUETA DE UBICACIÓN */}
                    <View style={styles.clientLocRow}>
                      <MapPin size={12} color={MONIQ.cyan} style={{ marginRight: 5 }} />
                      <Text style={styles.clientLocText} numberOfLines={1}>
                        {biz.district ? `${biz.district}, ` : ''}
                        {biz.province ? `${biz.province} - ` : ''}
                        {biz.department || biz.city || 'Perú'}
                        {biz.address ? ` (${biz.address})` : ''}
                      </Text>
                    </View>

                    {/* RESUMEN DE MÉTRICAS */}
                    <View style={styles.clientStatsRow}>
                      <View style={styles.clientMiniStat}>
                        <CreditCard size={13} color={MONIQ.cyan} style={{ marginRight: 5 }} />
                        <Text style={styles.clientMiniStatText}>{biz.cardsCount || 0} tarjetas</Text>
                      </View>

                      <View style={styles.clientMiniStat}>
                        <Zap size={13} color={MONIQ.positive} style={{ marginRight: 5 }} />
                        <Text style={styles.clientMiniStatText}>{biz.totalTaps || 0} lecturas</Text>
                      </View>

                      <View style={styles.clientMiniStat}>
                        <Calendar size={13} color={MONIQ.gold} style={{ marginRight: 5 }} />
                        <Text style={styles.clientMiniStatText}>Plan {biz.planMonths || 12}m</Text>
                      </View>

                      <View style={styles.clientMiniStat}>
                        <Text style={[styles.clientMiniStatText, { color: MONIQ.cyan }]}>
                          {biz.templateType === 1 ? 'Menú Digital' : biz.templateType === 2 ? 'Reseñas' : 'Dual Hub'}
                        </Text>
                      </View>
                    </View>

                    {/* BARRA DE ACCIONES OPERATIVAS RÁPIDAS (5 ACCIONES) */}
                    <View style={styles.clientActionButtons}>
                      <TouchableOpacity
                        style={[styles.clientToolBtn, { backgroundColor: 'rgba(0, 229, 255, 0.08)', borderColor: 'rgba(0, 229, 255, 0.25)' }]}
                        onPress={() => openEditBizModal(biz)}
                      >
                        <Edit3 size={13} color={MONIQ.cyan} style={{ marginRight: 4 }} />
                        <Text style={[styles.clientToolBtnText, { color: MONIQ.cyan }]}>Editar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.clientToolBtn, { backgroundColor: 'rgba(250, 204, 21, 0.08)', borderColor: 'rgba(250, 204, 21, 0.25)' }]}
                        onPress={() => openRenewPlanModal(biz)}
                      >
                        <Calendar size={13} color={MONIQ.gold} style={{ marginRight: 4 }} />
                        <Text style={[styles.clientToolBtnText, { color: MONIQ.gold }]}>Renovar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.clientToolBtn}
                        onPress={() => openCredentialsModal(biz)}
                      >
                        <KeyRound size={13} color={MONIQ.cyan} style={{ marginRight: 4 }} />
                        <Text style={styles.clientToolBtnText}>Credenciales</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.clientToolBtn}
                        onPress={() => {
                          setAddCardTargetBizId(biz.id);
                          setShowAddCardModal(true);
                        }}
                      >
                        <Plus size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={[styles.clientToolBtnText, { color: '#FFFFFF' }]}>+ Tarjeta</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.clientToolBtn}
                        onPress={() => handleToggleBusinessStatus(biz)}
                      >
                        <Text style={[styles.clientToolBtnText, { color: isOperating ? MONIQ.negative : MONIQ.positive }]}>
                          {isOperating ? 'Pausar' : 'Activar'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* BOTÓN DESPLEGABLE / EXPANDIBLE */}
                    <TouchableOpacity
                      style={[styles.expandToggleBtn, isExpanded && styles.expandToggleBtnActive]}
                      onPress={() => toggleExpandBiz(biz.id)}
                    >
                      <Text style={[styles.expandToggleText, isExpanded && { color: MONIQ.cyan }]}>
                        {isExpanded ? 'Ocultar Ficha y Tarjetas' : `Ver Ficha Completa & Tarjetas (${biz.cardsCount || 0})`}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={15} color={MONIQ.cyan} style={{ marginLeft: 4 }} />
                      ) : (
                        <ChevronDown size={15} color={MONIQ.textSecondary} style={{ marginLeft: 4 }} />
                      )}
                    </TouchableOpacity>

                    {/* SECCIÓN EXPANDIDA: FICHA INTEGRAL Y TARJETAS EN SALA */}
                    {isExpanded && (
                      <View style={styles.expandedCardsContainer}>
                        {/* FICHA DETALLADA DE CLIENTE */}
                        <View style={styles.clientDetailGrid}>
                          <Text style={styles.clientDetailGridTitle}>DATOS Y VIGENCIA COMERCIAL</Text>
                          <View style={styles.clientDetailRow}>
                            <View style={styles.clientDetailItem}>
                              <Text style={styles.clientDetailLabel}>RUC / IDENTIFICADOR</Text>
                              <Text style={styles.clientDetailVal}>{biz.ruc || 'No registrado'}</Text>
                            </View>
                            <View style={styles.clientDetailItem}>
                              <Text style={styles.clientDetailLabel}>TITULAR</Text>
                              <Text style={styles.clientDetailVal}>{biz.ownerName || 'Sin titular'}</Text>
                            </View>
                          </View>

                          <View style={styles.clientDetailRow}>
                            <View style={styles.clientDetailItem}>
                              <Text style={styles.clientDetailLabel}>TELÉFONO WHATSAPP</Text>
                              <Text style={styles.clientDetailVal}>{biz.ownerPhone || biz.phone || 'Sin teléfono'}</Text>
                            </View>
                            <View style={styles.clientDetailItem}>
                              <Text style={styles.clientDetailLabel}>CORREO DE ACCESO</Text>
                              <Text style={styles.clientDetailVal} numberOfLines={1}>{biz.ownerEmail || biz.email || biz.slug || 'Sin correo'}</Text>
                            </View>
                          </View>

                          <View style={styles.clientDetailRow}>
                            <View style={styles.clientDetailItem}>
                              <Text style={styles.clientDetailLabel}>DIRECCIÓN LOCAL</Text>
                              <Text style={styles.clientDetailVal}>{biz.address || 'Sin dirección registrada'}</Text>
                            </View>
                            <View style={styles.clientDetailItem}>
                              <Text style={styles.clientDetailLabel}>VENCIMIENTO DE PLAN</Text>
                              <Text style={[styles.clientDetailVal, statusInfo.isExpired && { color: MONIQ.negative }, statusInfo.isExpiringSoon && { color: MONIQ.gold }]}>
                                {formattedExpiryFull}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* TARJETAS EN SALA */}
                        <View style={styles.expandedHeader}>
                          <Text style={styles.expandedTitle}>Tarjetas en Sala ({clientCards.length})</Text>
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

                        {loadingCards && selectedBuyer?.id === biz.id ? (
                          <ActivityIndicator size="small" color={MONIQ.cyan} style={{ marginVertical: 14 }} />
                        ) : clientCards.length === 0 ? (
                          <Text style={styles.noCardsText}>No hay tarjetas asignadas a este local.</Text>
                        ) : (
                          clientCards.map((c: any) => (
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
              })
            )}
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
                    Reseñas Google (5 Estrellas)
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

              <Text style={[styles.settingsSectionTitle, { marginTop: 20 }]}>INFORMACION Y ACTUALIZACIONES</Text>
              <View style={styles.settingsItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingsLabel}>Version del Sistema</Text>
                  <Text style={styles.settingsValue}>
                    v{UpdateService.getCurrentVersion()} • Build #{UpdateService.getCurrentBuild()}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.checkUpdateBtn}
                  onPress={async () => {
                    setCheckingUpdate(true);
                    const res = await UpdateService.checkForUpdates();
                    setCheckingUpdate(false);
                    setUpdateData(res);
                    setShowUpdateModal(true);
                  }}
                  disabled={checkingUpdate}
                >
                  {checkingUpdate ? (
                    <ActivityIndicator size="small" color={MONIQ.cyan} />
                  ) : (
                    <Text style={styles.checkUpdateBtnText}>Buscar Actualizaciones</Text>
                  )}
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
      {/* BARRA DE NAVEGACION FLOTANTE ESTILO IPHONE (IOS DOCK GLASS)          */}
      {/* ==================================================================== */}
      <View style={styles.floatingDockWrapper} pointerEvents="box-none">
        <View style={styles.floatingDockBar}>
          <TouchableOpacity
            style={[styles.dockTabItem, activeTab === 0 && styles.dockTabItemActive]}
            onPress={() => setActiveTab(0)}
            activeOpacity={0.7}
          >
            <Home size={18} color={activeTab === 0 ? MONIQ.cyan : MONIQ.textSecondary} />
            <Text style={[styles.dockTabLabel, activeTab === 0 && styles.dockTabLabelActive]}>
              Panel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockTabItem, activeTab === 1 && styles.dockTabItemActive]}
            onPress={() => setActiveTab(1)}
            activeOpacity={0.7}
          >
            <Users size={18} color={activeTab === 1 ? MONIQ.cyan : MONIQ.textSecondary} />
            <Text style={[styles.dockTabLabel, activeTab === 1 && styles.dockTabLabelActive]}>
              Clientes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockTabItem, activeTab === 2 && styles.dockTabItemActive]}
            onPress={() => setActiveTab(2)}
            activeOpacity={0.7}
          >
            <Radio size={18} color={activeTab === 2 ? MONIQ.cyan : MONIQ.textSecondary} />
            <Text style={[styles.dockTabLabel, activeTab === 2 && styles.dockTabLabelActive]}>
              Taller NFC
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockTabItem, activeTab === 3 && styles.dockTabItemActive]}
            onPress={() => setActiveTab(3)}
            activeOpacity={0.7}
          >
            <Activity size={18} color={activeTab === 3 ? MONIQ.cyan : MONIQ.textSecondary} />
            <Text style={[styles.dockTabLabel, activeTab === 3 && styles.dockTabLabelActive]}>
              Auditoría
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dockTabItem, activeTab === 4 && styles.dockTabItemActive]}
            onPress={() => setActiveTab(4)}
            activeOpacity={0.7}
          >
            <Settings size={18} color={activeTab === 4 ? MONIQ.cyan : MONIQ.textSecondary} />
            <Text style={[styles.dockTabLabel, activeTab === 4 && styles.dockTabLabelActive]}>
              Ajustes
            </Text>
          </TouchableOpacity>
        </View>
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
      {/* MODAL: REGISTRAR NUEVO CLIENTE CON UBIGEO PERÚ                       */}
      {/* ==================================================================== */}
      <Modal visible={showCreateBizModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCardLarge}>
            <View style={styles.modalFormHeader}>
              <View>
                <Text style={styles.modalFormTitle}>Nuevo Negocio Cliente</Text>
                <Text style={styles.modalFormSubtitle}>Registro comercial con ubicación oficial en Perú</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateBizModal(false)} style={styles.closeBtnSmall}>
                <X size={20} color={MONIQ.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* BLOQUE 1: DATOS COMERCIALES */}
              <View style={styles.formSectionHeader}>
                <Building size={14} color={MONIQ.cyan} style={{ marginRight: 6 }} />
                <Text style={styles.formSectionTitle}>1. IDENTIFICACIÓN COMERCIAL</Text>
              </View>

              <Text style={styles.formLabel}>NOMBRE COMERCIAL DEL NEGOCIO *</Text>
              <TextInput
                style={styles.formInput}
                value={newBizName}
                onChangeText={setNewBizName}
                placeholder="Ej. Restaurante Miraflores"
                placeholderTextColor={MONIQ.textMuted}
              />

              <View style={styles.formRowTwoCols}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.formLabel, { marginTop: 10 }]}>TITULAR / ENCARGADO</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newBizOwner}
                    onChangeText={setNewBizOwner}
                    placeholder="Nombre completo"
                    placeholderTextColor={MONIQ.textMuted}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.formLabel, { marginTop: 10 }]}>RUC (OPCIONAL)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newBizRuc}
                    onChangeText={setNewBizRuc}
                    placeholder="11 dígitos"
                    placeholderTextColor={MONIQ.textMuted}
                    keyboardType="numeric"
                    maxLength={11}
                  />
                </View>
              </View>

              <Text style={[styles.formLabel, { marginTop: 10 }]}>TELÉFONO WHATSAPP (+51) *</Text>
              <TextInput
                style={styles.formInput}
                value={newBizPhone}
                onChangeText={setNewBizPhone}
                placeholder="Ej. 987654321"
                placeholderTextColor={MONIQ.textMuted}
                keyboardType="phone-pad"
              />

              {/* BLOQUE 2: UBICACIÓN GEOGRÁFICA (PERÚ) */}
              <View style={[styles.formSectionHeader, { marginTop: 16 }]}>
                <Text style={styles.formSectionTitle}>2. UBICACIÓN GEOGRÁFICA (PERÚ)</Text>
              </View>

              {/* SELECTOR DE DEPARTAMENTO */}
              <Text style={styles.formLabel}>DEPARTAMENTO *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScrollRow}>
                {PERU_DEPARTMENTS.map((dept) => (
                  <TouchableOpacity
                    key={`${dept.id}`}
                    style={[styles.geoPill, selectedDeptId === dept.id && styles.geoPillActive]}
                    onPress={() => {
                      setSelectedDeptId(dept.id);
                      const firstProv = dept.provinces?.[0];
                      if (firstProv) {
                        setSelectedProvId(firstProv.id);
                        setSelectedDistrictName(firstProv.districts?.[0] || 'Centro');
                      } else {
                        setSelectedProvId('central');
                        setSelectedDistrictName('Centro');
                      }
                    }}
                  >
                    <Text style={[styles.geoPillText, selectedDeptId === dept.id && styles.geoPillTextActive]}>
                      {dept.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* SELECTOR DE PROVINCIA */}
              {(() => {
                const dept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
                const provinces = dept?.provinces || [];
                return (
                  <>
                    <Text style={[styles.formLabel, { marginTop: 10 }]}>PROVINCIA *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScrollRow}>
                      {provinces.map((prov) => (
                        <TouchableOpacity
                          key={`${selectedDeptId}-${prov.id}`}
                          style={[styles.geoPill, selectedProvId === prov.id && styles.geoPillActive]}
                          onPress={() => {
                            setSelectedProvId(prov.id);
                            setSelectedDistrictName(prov.districts?.[0] || 'Centro');
                          }}
                        >
                          <Text style={[styles.geoPillText, selectedProvId === prov.id && styles.geoPillTextActive]}>
                            {prov.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                );
              })()}

              {/* SELECTOR DE DISTRITO */}
              {(() => {
                const dept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
                const prov = dept?.provinces?.find(p => p.id === selectedProvId) || dept?.provinces?.[0];
                const districts = prov?.districts || [];
                return (
                  <>
                    <Text style={[styles.formLabel, { marginTop: 10 }]}>DISTRITO *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScrollRow}>
                      {districts.map((dist) => (
                        <TouchableOpacity
                          key={`${selectedDeptId}-${selectedProvId}-${dist}`}
                          style={[styles.geoPill, selectedDistrictName === dist && styles.geoPillActive]}
                          onPress={() => setSelectedDistrictName(dist)}
                        >
                          <Text style={[styles.geoPillText, selectedDistrictName === dist && styles.geoPillTextActive]}>
                            {dist}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                );
              })()}

              <Text style={[styles.formLabel, { marginTop: 10 }]}>DIRECCIÓN ESPECÍFICA / LOCAL</Text>
              <TextInput
                style={styles.formInput}
                value={newBizAddress}
                onChangeText={setNewBizAddress}
                placeholder="Av. Principal 123, Piso 1"
                placeholderTextColor={MONIQ.textMuted}
              />

              {/* BLOQUE 3: CREDENCIALES Y PLAN */}
              <View style={[styles.formSectionHeader, { marginTop: 16 }]}>
                <Lock size={14} color={MONIQ.cyan} style={{ marginRight: 6 }} />
                <Text style={styles.formSectionTitle}>3. ACCESO AL PORTAL & SUSCRIPCIÓN</Text>
              </View>

              <Text style={styles.formLabel}>CORREO ELECTRÓNICO (USUARIO) *</Text>
              <TextInput
                style={styles.formInput}
                value={newBizEmail}
                onChangeText={setNewBizEmail}
                placeholder="usuario@negocio.com"
                placeholderTextColor={MONIQ.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={[styles.formLabel, { marginTop: 10 }]}>CLAVE DE ACCESO</Text>
              <TextInput
                style={styles.formInput}
                value={newBizPassword}
                onChangeText={setNewBizPassword}
                placeholder="Dejar vacio para clave automática"
                placeholderTextColor={MONIQ.textMuted}
              />

              <Text style={[styles.formLabel, { marginTop: 10 }]}>VIGENCIA DE PLAN</Text>
              <View style={styles.durationPillsRow}>
                {[
                  { m: 6, label: '6 Meses' },
                  { m: 12, label: '1 Año (Recomendado)' },
                  { m: 24, label: '2 Años' }
                ].map((item) => (
                  <TouchableOpacity
                    key={item.m}
                    style={[styles.durationPill, newBizPlanMonths === item.m && styles.durationPillActive]}
                    onPress={() => setNewBizPlanMonths(item.m)}
                  >
                    <Text style={[styles.durationPillText, newBizPlanMonths === item.m && styles.durationPillTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
      {/* MODAL: EDICIÓN INTEGRAL DE CLIENTES (COMPONENTE MODULAR)             */}
      {/* ==================================================================== */}
      <ClientEditModal
        visible={showEditBizModal}
        business={editingClient}
        onClose={() => {
          setShowEditBizModal(false);
          setEditingClient(null);
        }}
        onSuccess={handleClientEditSuccess}
      />

      {/* ==================================================================== */}
      {/* MODAL: AGREGAR TARJETA A LOCAL (REPARADO Y OPERATIVO)                 */}
      {/* ==================================================================== */}
      <Modal visible={showAddCardModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.formModalCard}>
            <View style={styles.modalFormHeader}>
              <View>
                <Text style={styles.modalFormTitle}>Vincular Nueva Tarjeta</Text>
                <Text style={styles.modalFormSubtitle}>Asigna hardware físico a una mesa o zona</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddCardModal(false)} style={styles.closeBtnSmall}>
                <X size={20} color={MONIQ.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* SELECCIONAR NEGOCIO SI HAY VARIOS */}
            <Text style={styles.formLabel}>LOCAL O CLIENTE ASIGNADO *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScrollRow}>
              {businesses.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.bizSelectorPill, (addCardTargetBizId || selectedBuyer?.id) === b.id && styles.bizSelectorPillActive]}
                  onPress={() => setAddCardTargetBizId(b.id)}
                >
                  <Text style={[styles.bizSelectorPillText, (addCardTargetBizId || selectedBuyer?.id) === b.id && styles.bizSelectorPillTextActive]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ETIQUETA / UBICACIÓN */}
            <Text style={[styles.formLabel, { marginTop: 12 }]}>UBICACIÓN / MESA EN SALA *</Text>
            <View style={styles.quickTableTagsRow}>
              {['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Barra', 'Terraza', 'Caja', 'Escritorio'].map((tag) => (
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
              style={styles.formInput}
              value={addCardLabel}
              onChangeText={setAddCardLabel}
              placeholder="O escribe una etiqueta (Ej. Mesa VIP 2)"
              placeholderTextColor={MONIQ.textMuted}
            />

            {/* DESTINO DIRECTO */}
            <Text style={[styles.formLabel, { marginTop: 14 }]}>DESTINO DIRECTO (0ms INTERMEDIARIOS)</Text>
            <View style={styles.destinationToggleRow}>
              <TouchableOpacity
                style={[styles.destToggleBtn, addCardDestination === 1 && styles.destToggleBtnActive]}
                onPress={() => setAddCardDestination(1)}
              >
                <Text style={[styles.destToggleText, addCardDestination === 1 && styles.destToggleTextActive]}>
                  Reseñas Google (5 Estrellas)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.destToggleBtn, addCardDestination === 2 && styles.destToggleBtnActive]}
                onPress={() => setAddCardDestination(2)}
              >
                <Text style={[styles.destToggleText, addCardDestination === 2 && styles.destToggleTextActive]}>
                  Carta / Menú
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.submitFormBtn}
              onPress={handleAssignCard}
              disabled={addCardLoading}
            >
              {addCardLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitFormBtnText}>Crear y Vincular Tarjeta</Text>
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

      <UpdateModal
        visible={showUpdateModal}
        updateData={updateData}
        onClose={() => setShowUpdateModal(false)}
      />

      <ClientCredentialsModal
        visible={showCredentialsModal}
        business={selectedCredentialsBiz}
        onClose={() => {
          setShowCredentialsModal(false);
          setSelectedCredentialsBiz(null);
        }}
      />

      <RenewPlanModal
        visible={showRenewPlanModal}
        business={selectedRenewBiz}
        onClose={() => {
          setShowRenewPlanModal(false);
          setSelectedRenewBiz(null);
        }}
        onSuccess={handlePlanRenewSuccess}
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
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  badgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  badgeExpiringSoon: {
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderColor: 'rgba(250, 204, 21, 0.3)'
  },
  badgeExpired: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  badgeInactive: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.3)'
  },
  badgePaused: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: 'rgba(148, 163, 184, 0.3)'
  },
  statusBadgeTextSmall: {
    fontSize: 9,
    fontWeight: '800'
  },
  badgeTextActive: {
    color: MONIQ.positive
  },
  badgeTextExpiringSoon: {
    color: MONIQ.gold
  },
  badgeTextExpired: {
    color: MONIQ.negative
  },
  badgeTextInactive: {
    color: MONIQ.textSecondary
  },
  badgeTextPaused: {
    color: MONIQ.textSecondary
  },
  daysRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginLeft: 6
  },
  daysRemainingText: {
    fontSize: 9,
    fontWeight: '700',
    color: MONIQ.textSecondary
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    paddingVertical: 7,
    marginTop: 10,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  expandToggleBtnActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderColor: 'rgba(0, 229, 255, 0.3)'
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: MONIQ.textSecondary
  },
  clientDetailGrid: {
    backgroundColor: MONIQ.bg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  clientDetailGridTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: MONIQ.cyan,
    letterSpacing: 0.5,
    marginBottom: 8
  },
  clientDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  clientDetailItem: {
    flex: 1,
    marginRight: 6
  },
  clientDetailLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: MONIQ.textMuted,
    letterSpacing: 0.3,
    marginBottom: 2
  },
  clientDetailVal: {
    fontSize: 11,
    fontWeight: '700',
    color: MONIQ.textPrimary
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
  checkUpdateBtn: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)'
  },
  checkUpdateBtnText: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontWeight: '800'
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
  },
  // =========================================================================
  // ESTILOS ADICIONALES: FLOATING DOCK IPHONE & FORMULARIOS
  // =========================================================================
  floatingDockWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999
  },
  floatingDockBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
    borderRadius: 36,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
    width: '100%',
    maxWidth: 420,
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  dockTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 20
  },
  dockTabItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)'
  },
  dockTabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: MONIQ.textSecondary,
    marginTop: 3
  },
  dockTabLabelActive: {
    color: MONIQ.accent,
    fontWeight: '800'
  },
  formModalCardLarge: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: MONIQ.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  modalFormSubtitle: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  closeBtnSmall: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: MONIQ.surfaceElevated
  },
  formSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: MONIQ.cardBorder,
    paddingBottom: 6
  },
  formSectionTitle: {
    color: MONIQ.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  },
  formRowTwoCols: {
    flexDirection: 'row',
    gap: 10
  },
  pillsScrollRow: {
    marginVertical: 4
  },
  geoPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: MONIQ.bg,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginRight: 6
  },
  geoPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: MONIQ.accent
  },
  geoPillText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  geoPillTextActive: {
    color: MONIQ.accent,
    fontWeight: '800'
  },
  durationPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  durationPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: MONIQ.bg,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    alignItems: 'center'
  },
  durationPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: MONIQ.accent
  },
  durationPillText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  durationPillTextActive: {
    color: MONIQ.accent,
    fontWeight: '800'
  },
  filterPillMini: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: MONIQ.surface,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginRight: 6
  },
  filterPillMiniActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: MONIQ.cyan
  },
  filterPillMiniText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  filterPillMiniTextActive: {
    color: MONIQ.cyan,
    fontWeight: '800'
  },
  rucBadge: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)'
  },
  rucBadgeText: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontWeight: '800'
  },
  clientLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)'
  },
  clientLocText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    flex: 1
  }
});
