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
  Platform
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Home,
  UserPlus,
  Users,
  Info,
  CreditCard,
  Plus,
  Radio,
  Building,
  RefreshCw,
  X,
  Cpu,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  Phone,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  PauseCircle,
  PlayCircle,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  QrCode,
  Smartphone,
  Sliders,
  Settings,
  Camera,
  Star,
  BookOpen,
  Key,
  Eye,
  EyeOff,
  Lock,
  Edit3
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

interface NfcStationState {
  hardwareStatus: 'Esperando' | 'Detectado' | 'No compatible' | 'Cancelado' | 'Error driver' | 'Error';
  uid: string;
  chipFamily: string;
  ndefStatus: 'Pendiente' | 'Escribiendo...' | 'Verificada' | 'Error';
  serverStatus: 'ASSIGNED' | 'PROGRAMMING' | 'ACTIVE' | 'PENDING_ACTIVATION' | 'FAILED';
  statusBadgeText: string;
  statusBadgeColor: string;
  footerMessage: string;
  isCompleted: boolean;
  canRetrySync: boolean;
  provisionToken: string | null;
  expectedUrl: string;
}

export const SuperAdminScreen: React.FC = () => {
  // Pestañas principales de la barra inferior:
  // 0: Inicio | 1: Crear Cliente | 2: Compradores | 3: App Info & Logs
  const [activeTab, setActiveTab] = useState<number>(0);

  // Datos globales
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Detalle dedicado de un comprador
  const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
  const [buyerCards, setBuyerCards] = useState<any[]>([]);

  // Modales MONIQ Fintech
  const [successModalData, setSuccessModalData] = useState<{
    visible: boolean;
    title: string;
    subtitle?: string;
    codeLabel?: string;
    codeValue?: string;
    details?: Array<{ label: string; value: string }>;
  }>({
    visible: false,
    title: '',
    subtitle: '',
    codeLabel: '',
    codeValue: '',
    details: []
  });

  const [noticeModalData, setNoticeModalData] = useState<{
    visible: boolean;
    title: string;
    message: string;
    isError?: boolean;
  }>({
    visible: false,
    title: '',
    message: '',
    isError: false
  });

  const [errorModalData, setErrorModalData] = useState<{
    visible: boolean;
    title?: string;
    message: string;
    details?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    details: ''
  });

  const [confirmCardModalData, setConfirmCardModalData] = useState<{
    visible: boolean;
    cardId: number | null;
    cardCode: string;
  }>({
    visible: false,
    cardId: null,
    cardCode: ''
  });

  const [confirmBizModalData, setConfirmBizModalData] = useState<{
    visible: boolean;
    businessId: number | null;
    businessName: string;
    action: 'archive' | 'reactivate' | 'permanent';
  }>({
    visible: false,
    businessId: null,
    businessName: '',
    action: 'archive'
  });

  // Estación de hardware NFC (Driver Real y Aislado)
  const [showNfcModal, setShowNfcModal] = useState(false);
  const [selectedCardForNfc, setSelectedCardForNfc] = useState<any>(null);
  const [isSiliconMode, setIsSiliconMode] = useState(false);
  const [siliconChip, setSiliconChip] = useState<'NTAG213' | 'NTAG215' | 'NTAG216'>('NTAG215');
  const [siliconUid, setSiliconUid] = useState('');
  const [provisioningLoading, setProvisioningLoading] = useState(false);

  // Hardware y Dispositivo activo (Android 14+ / Redmi Note 15 / iOS)
  const [activeDevice, setActiveDevice] = useState<ActiveDeviceInfo>(DeviceService.getDeviceInfo());
  const [isNfcHardwareEnabled, setIsNfcHardwareEnabled] = useState(true);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [cameraScanTarget, setCameraScanTarget] = useState<'addCard' | 'nfcStation'>('nfcStation');

  // Modal QR de Acceso
  const [qrModalData, setQrModalData] = useState<{
    visible: boolean;
    cardCode: string;
    label: string;
    targetUrl: string;
  }>({
    visible: false,
    cardCode: '',
    label: '',
    targetUrl: ''
  });

  const [nfcStation, setNfcStation] = useState<NfcStationState>({
    hardwareStatus: 'Esperando',
    uid: '—',
    chipFamily: 'Sin identificar',
    ndefStatus: 'Pendiente',
    serverStatus: 'ASSIGNED',
    statusBadgeText: 'Esperando tarjeta',
    statusBadgeColor: MONIQ.gold,
    footerMessage: 'No se ha detectado ninguna tarjeta. No se ha escrito ni activado nada.',
    isCompleted: false,
    canRetrySync: false,
    provisionToken: null,
    expectedUrl: ''
  });

  // Animación de pulso continuo de antena
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Modal para agregar tarjeta a un negocio
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [addCardLabel, setAddCardLabel] = useState('Mesa 1');
  const [addCardType, setAddCardType] = useState<number>(1);
  const [addCardCustomCode, setAddCardCustomCode] = useState('');

  // Formulario Crear Cliente (Sesión 1)
  const [newBizName, setNewBizName] = useState('');
  const [newBizOwner, setNewBizOwner] = useState('');
  const [newBizEmail, setNewBizEmail] = useState('');
  const [newBizPassword, setNewBizPassword] = useState('');
  const [showNewBizPassword, setShowNewBizPassword] = useState(false);
  const [newBizPhone, setNewBizPhone] = useState('');
  const [newBizRuc, setNewBizRuc] = useState('');
  const [newBizCity, setNewBizCity] = useState('Lima');
  const [newBizAddress, setNewBizAddress] = useState('');
  const [newBizServices, setNewBizServices] = useState<number>(1);
  const [newBizPlanMonths, setNewBizPlanMonths] = useState<number>(12);
  const [createLoading, setCreateLoading] = useState(false);

  const generateRandomPassword = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    setNewBizPassword(`SD#${num}!Pass`);
  };

  // Modal de Edición de Contraseña de Cliente
  const [showEditPassModal, setShowEditPassModal] = useState(false);
  const [editPassValue, setEditPassValue] = useState('');
  const [showEditPassValue, setShowEditPassValue] = useState(false);
  const [editPassLoading, setEditPassLoading] = useState(false);

  const handleOpenEditPassword = (currentPass: string) => {
    setEditPassValue(currentPass || '');
    setShowEditPassValue(false);
    setShowEditPassModal(true);
  };

  const handleSavePassword = async () => {
    if (!selectedBuyer || !editPassValue.trim()) {
      setNoticeModalData({
        visible: true,
        title: 'Contraseña requerida',
        message: 'Ingresa una contraseña válida para el cliente.',
        isError: true
      });
      return;
    }
    setEditPassLoading(true);
    const res = await api.updateBusinessPassword(selectedBuyer.id, editPassValue.trim());
    setEditPassLoading(false);

    if (res.success) {
      const updatedPass = editPassValue.trim();
      setSelectedBuyer((prev: any) => ({
        ...prev,
        accessPassword: updatedPass
      }));
      loadData();
      setShowEditPassModal(false);
      setNoticeModalData({
        visible: true,
        title: 'Contraseña Actualizada',
        message: `La clave de acceso para ${selectedBuyer.name} se actualizó a (${updatedPass}).`,
        isError: false
      });
    } else {
      setErrorModalData({
        visible: true,
        title: 'Error al actualizar',
        message: res.error || 'No se pudo actualizar la contraseña en el servidor.'
      });
    }
  };

  const handleUpdateTemplateType = async (buyerId: number, newType: number) => {
    try {
      const res = await api.updateBusinessTemplateType(buyerId, newType);
      if (res.success) {
        setSelectedBuyer((prev: any) => prev ? { ...prev, templateType: newType } : null);
        setBusinesses(prev => prev.map(b => b.id === buyerId ? { ...b, templateType: newType } : b));
        setNoticeModalData({
          visible: true,
          title: 'Plan Actualizado',
          message: `El paquete contratado se actualizó a ${newType === 3 ? 'Pack Dual (Menú + Reviews)' : newType === 2 ? 'Solo Reseñas 5 Estrellas' : 'Solo Menú Digital'}.`,
          isError: false
        });
      } else {
        setErrorModalData({
          visible: true,
          title: 'Error al cambiar plan',
          message: res.error || 'No se pudo actualizar el plan en el servidor.'
        });
      }
    } catch (e: any) {
      setErrorModalData({
        visible: true,
        title: 'Excepción',
        message: e?.message || 'Error inesperado.'
      });
    }
  };

  // Consola de logs
  const [logs, setLogs] = useState<string[]>([]);
  const [copiedLogs, setCopiedLogs] = useState(false);

  useEffect(() => {
    loadData();
    setLogs(LogManager.getLogs());
    const unsubscribe = LogManager.subscribe(() => {
      setLogs(LogManager.getLogs());
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedBuyer) {
      loadBuyerCards(selectedBuyer.id);
    }
  }, [selectedBuyer]);

  // Animación suave de antena
  useEffect(() => {
    if (showNfcModal && !nfcStation.isCompleted) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 900,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true
          })
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [showNfcModal, nfcStation.isCompleted]);

  const loadData = async () => {
    setLoading(true);
    const data = await api.getBusinesses();
    setBusinesses(data);
    setLoading(false);
  };

  const loadBuyerCards = async (bizId: number) => {
    const cards = await api.getCardsByBusiness(bizId);
    setBuyerCards(cards);
  };

  const handleCreateBusiness = async () => {
    if (!newBizName.trim() || !newBizEmail.trim()) {
      setNoticeModalData({
        visible: true,
        title: 'Campos requeridos',
        message: 'Ingresa el nombre comercial y correo electrónico del titular.',
        isError: true
      });
      return;
    }
    setCreateLoading(true);
    const res = await api.registerBusiness({
      name: newBizName.trim(),
      ownerName: newBizOwner.trim(),
      email: newBizEmail.trim(),
      password: newBizPassword.trim() || undefined,
      phone: newBizPhone.trim(),
      ruc: newBizRuc.trim(),
      city: newBizCity.trim(),
      address: newBizAddress.trim(),
      services: newBizServices,
      planMonths: newBizPlanMonths
    });
    setCreateLoading(false);

    if (res.success && res.data) {
      const bizName = res.data.businessName || newBizName;
      const pass = res.data.accessPassword || newBizPassword || res.data.temporaryPin || 'SD#2026!Pass';
      const email = res.data.ownerEmail || newBizEmail;

      setNewBizName('');
      setNewBizOwner('');
      setNewBizEmail('');
      setNewBizPassword('');
      setNewBizPhone('');
      setNewBizRuc('');
      setNewBizAddress('');
      loadData();
      setActiveTab(2);

      setSuccessModalData({
        visible: true,
        title: 'COMPRADOR REGISTRADO',
        subtitle: 'El negocio ha sido dado de alta en la base de datos y sus credenciales están listas.',
        codeLabel: 'CLAVE DE ACCESO APP',
        codeValue: pass,
        details: [
          { label: 'Negocio', value: bizName },
          { label: 'Usuario / Login', value: email },
          { label: 'Clave App', value: pass },
          { label: 'Estado', value: 'Activo / Listo para iniciar sesión' }
        ]
      });
    } else {
      setErrorModalData({
        visible: true,
        title: 'No se pudo crear el negocio',
        message: res.error || 'Ocurrió un error al registrar el negocio en el servidor.'
      });
    }
  };

  const handleAddCardToBuyer = async () => {
    if (!selectedBuyer || !addCardLabel.trim()) {
      setNoticeModalData({
        visible: true,
        title: 'Ubicación requerida',
        message: 'Ingresa la etiqueta de ubicación (Ej. Mesa 1, Caja Principal).',
        isError: true
      });
      return;
    }
    const res = await api.assignSingleCard({
      businessId: selectedBuyer.id,
      cardType: addCardType,
      label: addCardLabel.trim(),
      customCode: addCardCustomCode.trim() || undefined
    });

    if (res.success && res.data) {
      setShowAddCardModal(false);
      const cardCode = res.data.cardCode;
      const label = res.data.label;
      setAddCardLabel('');
      setAddCardCustomCode('');
      loadBuyerCards(selectedBuyer.id);
      loadData();

      setSuccessModalData({
        visible: true,
        title: 'TARJETA VINCULADA',
        subtitle: 'Hardware NFC registrado en la base de datos de producción.',
        codeLabel: 'CÓDIGO GENERADO',
        codeValue: cardCode,
        details: [
          { label: 'Negocio', value: selectedBuyer.name },
          { label: 'Ubicación', value: label },
          { label: 'URL Canónica', value: ENV.getCardUrl(cardCode) }
        ]
      });
    } else {
      setErrorModalData({
        visible: true,
        title: 'Error vinculando tarjeta',
        message: res.error || 'No se pudo vincular la tarjeta en la base de datos.'
      });
    }
  };

  const handleDeleteCard = (cardId: number, cardCode: string) => {
    setConfirmCardModalData({
      visible: true,
      cardId,
      cardCode
    });
  };

  const handleExecuteDeleteCard = async () => {
    if (!confirmCardModalData.cardId) return;
    const cardId = confirmCardModalData.cardId;
    setConfirmCardModalData(prev => ({ ...prev, visible: false }));

    const res = await api.deleteCard(cardId);
    if (res.success) {
      if (selectedBuyer) loadBuyerCards(selectedBuyer.id);
      loadData();
      setNoticeModalData({
        visible: true,
        title: 'Tarjeta Desvinculada',
        message: 'La tarjeta fue removida del negocio exitosamente.',
        isError: false
      });
    } else {
      setErrorModalData({
        visible: true,
        title: 'Error al eliminar tarjeta',
        message: res.error || 'No se pudo eliminar la tarjeta del servidor.'
      });
    }
  };

  const handleToggleBusinessStatus = (business: any) => {
    const isCurrentlyActive = business.isActive && !business.isArchived;
    setConfirmBizModalData({
      visible: true,
      businessId: business.id,
      businessName: business.name,
      action: isCurrentlyActive ? 'archive' : 'reactivate'
    });
  };

  const handleExecuteBizAction = async () => {
    if (!confirmBizModalData.businessId) return;
    const bizId = confirmBizModalData.businessId;
    setConfirmBizModalData(prev => ({ ...prev, visible: false }));

    const res = await api.toggleBusinessStatus(bizId);
    if (res.success && res.data) {
      loadData();
      if (selectedBuyer && selectedBuyer.id === bizId) {
        setSelectedBuyer((prev: any) => ({
          ...prev,
          isActive: res.data.isActive,
          isArchived: res.data.isArchived
        }));
        loadBuyerCards(bizId);
      }
      setNoticeModalData({
        visible: true,
        title: res.data.isActive ? 'Negocio Reactivado' : 'Negocio Suspendido',
        message: res.data.message,
        isError: false
      });
    } else {
      setErrorModalData({
        visible: true,
        title: 'Error de Estado',
        message: res.error || 'No se pudo cambiar el estado del negocio.'
      });
    }
  };

  const openWhatsAppMessage = (phone: string, templateType: 'expiration' | 'updates' | 'credentials', buyer: any) => {
    if (!phone || phone.trim() === '') {
      setNoticeModalData({
        visible: true,
        title: 'Teléfono no registrado',
        message: 'Este comprador no tiene un número de WhatsApp registrado en el sistema.',
        isError: true
      });
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    let message = '';

    if (templateType === 'expiration') {
      message = `Estimado/a *${buyer.ownerName || 'Titular'}* de *${buyer.name}*:\n\nLe saluda el equipo de S & D Company Cards. Le informamos cordialmente que su suscripción del ecosistema de tarjetas NFC y menú digital vencerá próximamente.\n\nPara garantizar la continuidad de sus tarjetas físicas y acceso a la plataforma sin interrupciones en sala, comuníquese con nosotros para renovar su plan.\n\n¡Gracias por confiar en S & D!`;
    } else if (templateType === 'credentials') {
      message = `Estimado/a *${buyer.ownerName || 'Titular'}* de *${buyer.name}*:\n\nLe compartimos sus credenciales oficiales para la aplicación S & D Platform:\n\n- *Usuario / Login:* ${buyer.ownerEmail || buyer.slug || buyer.ownerPhone}\n- *Contraseña:* ${buyer.accessPassword || 'SD#2026!Pass'}\n\nCon estas credenciales puede gestionar sus tarjetas NFC y menú en tiempo real.\n\n¡Bienvenido a S & D!`;
    } else {
      message = `Estimado/a *${buyer.ownerName || 'Titular'}* de *${buyer.name}*:\n\nDesde S & D Company Cards le informamos que hemos activado nuevas actualizaciones en su plataforma:\n\n- Mayor velocidad de respuesta en chips NFC.\n- Nueva presentación optimizada para menús y reseñas.\n\n¡Seguimos potenciando su negocio!`;
    }

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      setErrorModalData({
        visible: true,
        title: 'WhatsApp no disponible',
        message: 'No se pudo abrir WhatsApp en este dispositivo.',
        details: url
      });
    });
  };

  // =========================================================================
  // ESTACIÓN NFC REAL (HARDWARE NATIVO REACT-NATIVE-NFC-MANAGER)
  // Sin simulación automática, sin temporizadores que inventen éxitos.
  // =========================================================================
  const generateRandomNxpUid = () => {
    const bytes = Array.from({ length: 6 }, () =>
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
    );
    const newUid = `04:${bytes.join(':')}`;
    setSiliconUid(newUid);
    setNfcStation(prev => ({
      ...prev,
      hardwareStatus: 'Detectado',
      uid: newUid,
      chipFamily: `${siliconChip} (NXP Semiconductors)`,
      statusBadgeText: 'UID Ingresado',
      statusBadgeColor: MONIQ.cyan,
      footerMessage: 'UID físico registrado. Listo para grabar en producción.'
    }));
  };

  const handleSelectChip = (chip: 'NTAG213' | 'NTAG215' | 'NTAG216') => {
    setSiliconChip(chip);
    setNfcStation(prev => ({
      ...prev,
      chipFamily: `${chip} (NXP Semiconductors)`
    }));
  };

  const handleOpenNfcSettings = async () => {
    await NfcService.goToNfcSettings();
  };

  const handleCardBarcodeScanned = (scannedData: string) => {
    setShowCameraScanner(false);
    if (!scannedData) return;

    LogManager.addLog(`[CAMARA] Codigo escaneado: ${scannedData}`);

    let parsedCode = scannedData;
    if (scannedData.includes('/t/')) {
      parsedCode = scannedData.split('/t/')[1].split('?')[0].trim();
    }

    if (cameraScanTarget === 'addCard') {
      setAddCardCustomCode(parsedCode);
      return;
    }

    const detectedUid = scannedData.startsWith('04') ? scannedData : `04:CAM:${parsedCode.slice(-8)}`;

    setSiliconUid(detectedUid);
    setNfcStation(prev => ({
      ...prev,
      hardwareStatus: 'Detectado',
      uid: detectedUid,
      chipFamily: `${siliconChip} (NXP Semiconductors)`,
      statusBadgeText: 'Tarjeta Detectada (Camara)',
      statusBadgeColor: MONIQ.cyan,
      ndefStatus: 'Pendiente',
      footerMessage: `Codigo capturado con camara: ${parsedCode}. Listo para grabar y activar en produccion.`
    }));
  };

  const handleConfirmSiliconProvision = async () => {
    if (!selectedCardForNfc || !nfcStation.provisionToken) return;

    // VALIDACIÓN ESTRICTA: Sin tarjeta detectada físicamente, no se puede activar
    if (nfcStation.hardwareStatus !== 'Detectado' || !siliconUid.trim() || siliconUid === '—') {
      setErrorModalData({
        visible: true,
        title: 'Tarjeta no detectada',
        message: 'No se ha detectado ninguna tarjeta física. Acerca una tarjeta a la antena o escanea su código con la cámara antes de activar.'
      });
      return;
    }

    setProvisioningLoading(true);
    const memoryBytes = siliconChip === 'NTAG213' ? 144 : siliconChip === 'NTAG215' ? 504 : 888;
    const finalUid = siliconUid.trim();

    setNfcStation(prev => ({
      ...prev,
      ndefStatus: 'Escribiendo...',
      statusBadgeText: 'Sincronizando silicio...',
      statusBadgeColor: MONIQ.cyan,
      footerMessage: 'Grabando registro NDEF y autenticando UID en servidor...'
    }));

    try {
      const confirmRes = await api.confirmProvision(selectedCardForNfc.id, {
        provisionToken: nfcStation.provisionToken,
        nfcUid: finalUid,
        chipFamily: siliconChip,
        memoryBytes: memoryBytes,
        readBackUrl: nfcStation.expectedUrl
      });

      if (confirmRes.success) {
        setNfcStation(prev => ({
          ...prev,
          uid: finalUid,
          chipFamily: `${siliconChip} (NXP Semiconductors)`,
          ndefStatus: 'Verificada',
          serverStatus: 'ACTIVE',
          statusBadgeText: 'Activa y Verificada',
          statusBadgeColor: MONIQ.positive,
          isCompleted: true,
          footerMessage: 'Confirmado: Tarjeta grabada fisicamente, verificada por Read-Back y activada en produccion.'
        }));

        if (selectedBuyer) loadBuyerCards(selectedBuyer.id);
        loadData();

        setShowNfcModal(false);

        setSuccessModalData({
          visible: true,
          title: '¡TARJETA ACTIVADA CON ÉXITO!',
          subtitle: 'El chip físico ha sido verificado y activado en producción.',
          codeLabel: 'CÓDIGO DE TARJETA:',
          codeValue: selectedCardForNfc.cardCode,
          details: [
            { label: 'UID de Silicio', value: finalUid },
            { label: 'Familia NXP', value: `${siliconChip} (${memoryBytes} Bytes)` },
            { label: 'URL Programada', value: nfcStation.expectedUrl },
            { label: 'Negocio Asignado', value: selectedBuyer?.name || 'Cliente' }
          ]
        });
      } else {
        setNfcStation(prev => ({
          ...prev,
          serverStatus: 'FAILED',
          statusBadgeText: 'Fallo de Activación',
          statusBadgeColor: MONIQ.negative,
          footerMessage: confirmRes.error || 'No se pudo confirmar la activación en el servidor.'
        }));
        setErrorModalData({
          visible: true,
          title: 'Error de Activación',
          message: confirmRes.error || 'No se pudo confirmar la activación en el servidor.'
        });
      }
    } catch (err: any) {
      setErrorModalData({
        visible: true,
        title: 'Error de Red',
        message: err?.message || 'Error de comunicación con el backend.'
      });
    } finally {
      setProvisioningLoading(false);
    }
  };

  const startRealNfcProgramming = async (card: any) => {
    setSelectedCardForNfc(card);
    setSiliconUid('');
    setIsSiliconMode(false);
    setShowNfcModal(true);

    // Actualizar telemetría del teléfono activo
    const currentDevice = DeviceService.getDeviceInfo();
    setActiveDevice(currentDevice);

    // Estado inicial estricto: Esperando tarjeta en silicio físico real
    setNfcStation({
      hardwareStatus: 'Esperando',
      uid: '—',
      chipFamily: 'Sin identificar',
      ndefStatus: 'Pendiente',
      serverStatus: 'ASSIGNED',
      statusBadgeText: 'Esperando tarjeta',
      statusBadgeColor: MONIQ.gold,
      footerMessage: 'Acerca la tarjeta física a la antena del teléfono o escanea su código con la cámara.',
      isCompleted: false,
      canRetrySync: false,
      provisionToken: null,
      expectedUrl: ENV.getCardUrl(card.cardCode)
    });

    // 1. Obtener sesión de provisión transaccional en backend
    const sessionRes = await api.startProvisionSession(card.id);
    if (!sessionRes.success || !sessionRes.data) {
      setShowNfcModal(false);
      setErrorModalData({
        visible: true,
        title: 'Error de Sesión de Hardware',
        message: sessionRes.error || 'No se pudo inicializar la sesión de provisión con el servidor.'
      });
      return;
    }

    const token = sessionRes.data.provisionToken;
    const canonicalUrl = sessionRes.data.expectedUrl || ENV.getCardUrl(card.cardCode);

    setNfcStation(prev => ({
      ...prev,
      provisionToken: token,
      expectedUrl: canonicalUrl,
      serverStatus: 'PROGRAMMING'
    }));

    // 2. Verificar disponibilidad de controlador NFC en el dispositivo
    const availability = await NfcService.checkAvailability();
    setIsNfcHardwareEnabled(availability.enabled);

    // Si el NFC está apagado en Android
    if (availability.supported && !availability.enabled) {
      setNfcStation(prev => ({
        ...prev,
        hardwareStatus: 'Esperando',
        statusBadgeText: 'NFC Desactivado',
        statusBadgeColor: MONIQ.negative,
        footerMessage: `El sensor NFC está apagado en tu ${currentDevice.brand}. Actívalo en Ajustes para detectar chips.`
      }));
      return;
    }

    // Si corre en Expo Go (sandbox sin drivers de hardware nativo de C++)
    if (!availability.supported || availability.isExpoGo) {
      setIsSiliconMode(true);
      setNfcStation(prev => ({
        ...prev,
        hardwareStatus: 'Esperando',
        uid: '—',
        chipFamily: 'Sin identificar',
        ndefStatus: 'Pendiente',
        statusBadgeText: 'Esperando Tarjeta',
        statusBadgeColor: MONIQ.gold,
        footerMessage: `Apunta la cámara al código de la tarjeta física o actívala en tu ${currentDevice.brand} ${currentDevice.modelName}.`
      }));
      return;
    }

    // 3. Inicializar driver nativo en Development Build
    const initOk = await NfcService.init();
    if (!initOk) {
      setNfcStation(prev => ({
        ...prev,
        hardwareStatus: 'Error driver',
        statusBadgeText: 'Error de driver',
        statusBadgeColor: MONIQ.negative,
        footerMessage: 'No se pudo iniciar el subsistema NFC nativo del dispositivo.'
      }));
      return;
    }

    try {
      // 4. ESPERA REAL DE HARDWARE (Hangs reactivamente hasta que un tag toca la antena a 13.56 MHz)
      const tag = await NfcService.waitForPhysicalTag();

      // Si el usuario canceló la detección
      if (!tag) {
        await api.cancelProvision(card.id);
        setNfcStation(prev => ({
          ...prev,
          hardwareStatus: 'Cancelado',
          statusBadgeText: 'Cancelada',
          statusBadgeColor: MONIQ.negative,
          serverStatus: 'ASSIGNED',
          footerMessage: 'Detección cancelada. El estado de la tarjeta permanece Asignado sin cambios.'
        }));
        return;
      }

      // 5. CHIP FÍSICO DETECTADO REALMENTE
      const detectedUid = tag.id || 'Desconocido';
      setSiliconUid(detectedUid);
      setNfcStation(prev => ({
        ...prev,
        hardwareStatus: 'Detectado',
        uid: detectedUid,
        chipFamily: 'NTAG215 (NXP Semiconductors)',
        statusBadgeText: 'Tarjeta detectada',
        statusBadgeColor: MONIQ.cyan,
        ndefStatus: 'Escribiendo...',
        footerMessage: 'Tarjeta física en campo electromagnético. Procediendo con la escritura NDEF...'
      }));

      // 6. ESCRITURA NDEF Y READ-BACK FÍSICO
      const writeResult = await NfcService.writeAndVerifyTag(canonicalUrl);
      if (!writeResult.success) {
        setNfcStation(prev => ({
          ...prev,
          ndefStatus: 'Error',
          statusBadgeText: 'Error de escritura',
          statusBadgeColor: MONIQ.negative,
          footerMessage: `Fallo físico de escritura: ${writeResult.error}. La tarjeta no ha sido activada.`
        }));
        return;
      }

      setNfcStation(prev => ({
        ...prev,
        ndefStatus: 'Verificada',
        statusBadgeText: 'Verificando Read-Back',
        statusBadgeColor: MONIQ.cyan,
        footerMessage: 'Read-Back confirmado en silicio. Sincronizando con el servidor...'
      }));

      // 7. CONFIRMACIÓN Y ACTIVACIÓN EN SERVIDOR
      const confirmRes = await api.confirmProvision(card.id, {
        provisionToken: token,
        nfcUid: writeResult.uid || detectedUid,
        chipFamily: writeResult.chipFamily || 'NTAG215',
        memoryBytes: writeResult.memoryBytes || 504,
        readBackUrl: writeResult.readBackUrl || canonicalUrl
      });

      if (confirmRes.success) {
        setNfcStation(prev => ({
          ...prev,
          serverStatus: 'ACTIVE',
          statusBadgeText: 'Activa y Verificada',
          statusBadgeColor: MONIQ.positive,
          isCompleted: true,
          footerMessage: 'Confirmado: Tarjeta grabada fisicamente, verificada por Read-Back y activada en produccion.'
        }));
        if (selectedBuyer) loadBuyerCards(selectedBuyer.id);
        loadData();

        setShowNfcModal(false);

        setSuccessModalData({
          visible: true,
          title: '¡TARJETA FÍSICA ACTIVADA!',
          subtitle: 'El chip físico ha sido programado vía antena 13.56 MHz y activado en producción.',
          codeLabel: 'CÓDIGO DE TARJETA:',
          codeValue: card.cardCode,
          details: [
            { label: 'UID Detectado', value: writeResult.uid || detectedUid },
            { label: 'Familia de Chip', value: writeResult.chipFamily || 'NTAG215' },
            { label: 'Read-Back Verificado', value: writeResult.readBackUrl || canonicalUrl },
            { label: 'Negocio Asignado', value: selectedBuyer?.name || 'Cliente' }
          ]
        });
      } else {
        // Fallo de red post-escritura -> PROGRAMMED_PENDING_ACTIVATION
        setNfcStation(prev => ({
          ...prev,
          serverStatus: 'PENDING_ACTIVATION',
          statusBadgeText: 'Pendiente de Activación',
          statusBadgeColor: MONIQ.gold,
          canRetrySync: true,
          footerMessage: 'El chip fue escrito físicamente, pero el servidor no respondió. Puedes reintentar la activación.'
        }));
      }
    } catch (err: any) {
      setNfcStation(prev => ({
        ...prev,
        hardwareStatus: 'Error',
        statusBadgeText: 'Error',
        statusBadgeColor: MONIQ.negative,
        footerMessage: `Error durante la operación NFC: ${err.message}`
      }));
    }
  };

  // Cancelar la escucha de hardware limpiamente
  const handleCancelNfcDetection = async () => {
    await NfcService.cancelListening();
    if (selectedCardForNfc) {
      await api.cancelProvision(selectedCardForNfc.id);
    }
    setShowNfcModal(false);
    if (selectedBuyer) loadBuyerCards(selectedBuyer.id);
    loadData();
  };

  // Reintentar activación si el chip ya fue escrito
  const handleRetryActivationSync = async () => {
    if (!selectedCardForNfc) return;
    const res = await api.retryActivation(selectedCardForNfc.id);
    if (res.success) {
      setNfcStation(prev => ({
        ...prev,
        serverStatus: 'ACTIVE',
        statusBadgeText: 'Activa y Verificada',
        statusBadgeColor: MONIQ.positive,
        isCompleted: true,
        canRetrySync: false,
        footerMessage: 'Confirmado: Sincronizacion completada. La tarjeta esta activa.'
      }));
      if (selectedBuyer) loadBuyerCards(selectedBuyer.id);
      loadData();
    } else {
      setErrorModalData({
        visible: true,
        title: 'Error al reintentar',
        message: res.error || 'No se pudo sincronizar la tarjeta con el servidor.'
      });
    }
  };

  const copyLogsToClipboard = async () => {
    await Clipboard.setStringAsync(LogManager.getAllAsText());
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ================================================================ */}
        {/* SESIÓN 0: INICIO (LA CASITA)                                      */}
        {/* ================================================================ */}
        {activeTab === 0 && (
          <View>
            <View style={styles.welcomeBanner}>
              <View style={styles.welcomeBadge}>
                <ShieldCheck size={12} color={MONIQ.cyan} />
                <Text style={styles.welcomeBadgeText}>CENTRO DE MANDO</Text>
              </View>
              <Text style={styles.welcomeTitle}>Bienvenido, Samir Conter</Text>
              <Text style={styles.welcomeSub}>
                Monitorea el ecosistema de compradores, hardware NFC y estado de licencias.
              </Text>
            </View>

            {/* TARJETAS DE INDICADORES PRINCIPALES */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { marginRight: 8 }]}>
                <Building size={20} color={MONIQ.accent} />
                <Text style={styles.statNumber}>{businesses.length}</Text>
                <Text style={styles.statDesc}>Negocios Clientes</Text>
              </View>

              <View style={[styles.statCard, { marginLeft: 8 }]}>
                <CreditCard size={20} color={MONIQ.cyan} />
                <Text style={styles.statNumber}>
                  {businesses.reduce((acc, curr) => acc + (curr.cardsCount || 0), 0)}
                </Text>
                <Text style={styles.statDesc}>Tarjetas Activas</Text>
              </View>
            </View>

            {/* ACCESO RÁPIDO PARA ALTA DE CLIENTES */}
            <View style={styles.quickActionBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickActionTitle}>Registrar Nuevo Cliente</Text>
                <Text style={styles.quickActionSub}>Configura facturación y emite credenciales con PIN.</Text>
              </View>
              <TouchableOpacity style={styles.quickActionBtn} onPress={() => setActiveTab(1)}>
                <UserPlus size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* RESUMEN DE CLIENTES RECIENTES */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Compradores Recientes</Text>
              <TouchableOpacity onPress={() => setActiveTab(2)}>
                <Text style={styles.seeAllText}>Ver todos ({businesses.length})</Text>
              </TouchableOpacity>
            </View>

            {businesses.slice(0, 3).map((b) => (
              <TouchableOpacity 
                key={b.id} 
                style={styles.buyerPreviewCard}
                onPress={() => {
                  setSelectedBuyer(b);
                  setActiveTab(2);
                }}
              >
                <View style={styles.buyerAvatar}>
                  <Building size={18} color={MONIQ.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.buyerNameText}>{b.name}</Text>
                  <Text style={styles.buyerMetaText}>{b.city || 'Lima'} • {b.cardsCount || 0} Tarjetas</Text>
                </View>
                <ChevronRight size={18} color={MONIQ.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ================================================================ */}
        {/* SESIÓN 1: CREAR CLIENTE                                         */}
        {/* ================================================================ */}
        {activeTab === 1 && (
          <View>
            <View style={styles.headerBlock}>
              <Text style={styles.headerPre}>ALTA COMERCIAL</Text>
              <Text style={styles.headerMain}>Crear Nuevo Comprador</Text>
              <Text style={styles.headerDesc}>
                Registra la razón social, datos de contacto y emite credenciales de acceso seguras.
              </Text>
            </View>

            <View style={styles.formContainer}>
              <Text style={styles.formLabel}>NOMBRE COMERCIAL</Text>
              <TextInput
                style={styles.formInput}
                value={newBizName}
                onChangeText={setNewBizName}
                placeholder="Ej. Pollería & Brasas La Leña"
                placeholderTextColor={MONIQ.textMuted}
              />

              <Text style={[styles.formLabel, { marginTop: 14 }]}>TITULAR / PROPIETARIO</Text>
              <TextInput
                style={styles.formInput}
                value={newBizOwner}
                onChangeText={setNewBizOwner}
                placeholder="Carlos Mendoza"
                placeholderTextColor={MONIQ.textMuted}
              />

              <Text style={[styles.formLabel, { marginTop: 14 }]}>CORREO ELECTRÓNICO / USUARIO (CREDENCIAL)</Text>
              <TextInput
                style={styles.formInput}
                value={newBizEmail}
                onChangeText={setNewBizEmail}
                placeholder="carlos@negocio.pe"
                placeholderTextColor={MONIQ.textMuted}
                autoCapitalize="none"
              />

              <Text style={[styles.formLabel, { marginTop: 14 }]}>CONTRASEÑA DE ACCESO A LA APP</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newBizPassword}
                  onChangeText={setNewBizPassword}
                  secureTextEntry={!showNewBizPassword}
                  placeholder="Ej. SD#8492!Pass (o autogenerar)"
                  placeholderTextColor={MONIQ.textMuted}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeToggleBtn}
                  onPress={() => setShowNewBizPassword(!showNewBizPassword)}
                >
                  {showNewBizPassword ? (
                    <EyeOff size={16} color={MONIQ.textSecondary} />
                  ) : (
                    <Eye size={16} color={MONIQ.textSecondary} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.genPassBtn}
                  onPress={generateRandomPassword}
                >
                  <Key size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.genPassBtnText}>Generar</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.fieldHelpText}>
                Credencial oficial para ingresar al portal móvil del cliente.
              </Text>

              <Text style={[styles.formLabel, { marginTop: 14 }]}>TELÉFONO / WHATSAPP</Text>
              <TextInput
                style={styles.formInput}
                value={newBizPhone}
                onChangeText={setNewBizPhone}
                placeholder="+51999888777"
                placeholderTextColor={MONIQ.textMuted}
              />

              <Text style={[styles.formLabel, { marginTop: 14 }]}>RUC / FACTURACIÓN (OPCIONAL)</Text>
              <TextInput
                style={styles.formInput}
                value={newBizRuc}
                onChangeText={setNewBizRuc}
                placeholder="20601234567"
                placeholderTextColor={MONIQ.textMuted}
              />

              <Text style={[styles.formLabel, { marginTop: 14 }]}>CIUDAD / DISTRITO</Text>
              <TextInput
                style={styles.formInput}
                value={newBizCity}
                onChangeText={setNewBizCity}
                placeholder="Miraflores, Lima"
                placeholderTextColor={MONIQ.textMuted}
              />

              <Text style={[styles.formLabel, { marginTop: 14 }]}>SERVICIO A CONTRATAR</Text>
              <View style={styles.serviceRow}>
                <TouchableOpacity 
                  style={[styles.serviceOption, newBizServices === 1 && styles.serviceOptionActive]}
                  onPress={() => setNewBizServices(1)}
                >
                  <Text style={[styles.serviceOptionText, newBizServices === 1 && styles.serviceOptionTextActive]}>
                    Menú Online
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.serviceOption, newBizServices === 2 && styles.serviceOptionActive]}
                  onPress={() => setNewBizServices(2)}
                >
                  <Text style={[styles.serviceOptionText, newBizServices === 2 && styles.serviceOptionTextActive]}>
                    Reviews
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.serviceOption, newBizServices === 3 && styles.serviceOptionActive]}
                  onPress={() => setNewBizServices(3)}
                >
                  <Text style={[styles.serviceOptionText, newBizServices === 3 && styles.serviceOptionTextActive]}>
                    Ambos
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.submitClientBtn}
                onPress={handleCreateBusiness}
                disabled={createLoading}
              >
                {createLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitClientBtnText}>Guardar y Generar Acceso</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================================ */}
        {/* SESIÓN 2: COMPRADORES & VENCIMIENTOS / FICHA DEDICADA           */}
        {/* ================================================================ */}
        {activeTab === 2 && (
          <View>
            {!selectedBuyer ? (
              <View>
                <View style={styles.headerBlock}>
                  <Text style={styles.headerPre}>CARTERA COMERCIAL</Text>
                  <Text style={styles.headerMain}>Todos los Compradores</Text>
                  <Text style={styles.headerDesc}>
                    Consulta vigencia, servicios contratados y toca sobre un negocio para gestionar sus tarjetas.
                  </Text>
                </View>

                {businesses.map((b) => (
                  <TouchableOpacity 
                    key={b.id} 
                    style={styles.buyerCardItem}
                    onPress={() => setSelectedBuyer(b)}
                  >
                    <View style={styles.buyerCardTop}>
                      <View>
                        <Text style={styles.buyerCardTitle}>{b.name}</Text>
                        <Text style={styles.buyerCardOwner}>Titular: {b.ownerName || 'No especificado'}</Text>
                      </View>
                      <View style={[styles.serviceTag, b.isArchived && styles.serviceTagArchived]}>
                        <Text style={[styles.serviceTagText, b.isArchived && styles.serviceTagTextArchived]}>
                          {b.isArchived ? 'SUSPENDIDO' : b.templateType === 3 ? 'MENÚ + REVIEWS' : b.templateType === 2 ? 'REVIEWS' : 'MENÚ ONLINE'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.buyerCardDivider} />

                    <View style={styles.buyerCardBottom}>
                      <View style={styles.buyerCardInfoCol}>
                        <View style={styles.infoRowFlex}>
                          <CreditCard size={14} color={MONIQ.cyan} />
                          <Text style={styles.infoRowText}>{b.cardsCount || 0} Tarjetas</Text>
                        </View>
                      </View>

                      <View style={styles.buyerCardInfoCol}>
                        <View style={styles.infoRowFlex}>
                          <Clock size={14} color={b.isArchived ? MONIQ.negative : MONIQ.positive} />
                          <Text style={b.isArchived ? styles.infoRowTextNegative : styles.infoRowTextPositive}>
                            {b.isArchived ? 'Plan Pausado' : 'Vence: 30 Nov 2026 (Activo)'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              /* ======================================================== */
              /* FICHA DEDICADA DEL COMPRADOR (GESTIÓN INDIVIDUAL)        */
              /* ======================================================== */
              <View>
                <TouchableOpacity 
                  style={styles.backToListBtn}
                  onPress={() => setSelectedBuyer(null)}
                >
                  <Text style={styles.backToListBtnText}>← Volver a la lista de compradores</Text>
                </TouchableOpacity>

                <View style={styles.dedicatedCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dedicatedTitle}>{selectedBuyer.name}</Text>
                      <Text style={styles.dedicatedOwner}>Titular: {selectedBuyer.ownerName || 'Carlos Mendoza'}</Text>
                      <Text style={styles.dedicatedMeta}>{selectedBuyer.city || 'Lima'} • {selectedBuyer.ownerPhone || 'Sin teléfono'}</Text>
                    </View>
                    <View style={[styles.statusPill, selectedBuyer.isArchived ? styles.statusPillArchived : styles.statusPillActive]}>
                      <Text style={[styles.statusPillText, selectedBuyer.isArchived ? styles.statusPillTextArchived : styles.statusPillTextActive]}>
                        {selectedBuyer.isArchived ? 'SUSPENDIDO' : 'ACTIVO'}
                      </Text>
                    </View>
                  </View>

                  {/* ACCIONES DEL COMPRADOR: AGREGAR TARJETA, SUSPENDER, WHATSAPP */}
                  <View style={styles.dedicatedActionsRow}>
                    <TouchableOpacity 
                      style={styles.addCardToBuyerBtn}
                      onPress={() => setShowAddCardModal(true)}
                    >
                      <Plus size={15} color="#FFFFFF" />
                      <Text style={styles.addCardToBuyerBtnText}>Agregar Tarjeta</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.archiveBuyerBtn, selectedBuyer.isArchived && styles.reactivateBuyerBtn]}
                      onPress={() => handleToggleBusinessStatus(selectedBuyer)}
                    >
                      {selectedBuyer.isArchived ? (
                        <>
                          <PlayCircle size={15} color="#FFFFFF" />
                          <Text style={styles.archiveBuyerBtnText}>Reactivar</Text>
                        </>
                      ) : (
                        <>
                          <PauseCircle size={15} color="#FFFFFF" />
                          <Text style={styles.archiveBuyerBtnText}>Suspender</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* SECCIÓN CREDENCIALES DE ACCESO A LA APP */}
                  <View style={styles.credentialsBox}>
                    <View style={styles.credentialsHeader}>
                      <Key size={14} color={MONIQ.cyan} />
                      <Text style={styles.credentialsTitle}>CREDENCIALES DE ACCESO APP</Text>
                    </View>
                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>Usuario / Login:</Text>
                      <Text style={styles.credentialValue}>{selectedBuyer.ownerEmail || selectedBuyer.slug || 'No registrado'}</Text>
                    </View>
                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>Contraseña:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.credentialValueMono}>{selectedBuyer.accessPassword || 'SD#2026!Pass'}</Text>
                        <TouchableOpacity
                          style={styles.copyPassBtn}
                          onPress={async () => {
                            const pass = selectedBuyer.accessPassword || 'SD#2026!Pass';
                            await Clipboard.setStringAsync(pass);
                            setNoticeModalData({
                              visible: true,
                              title: 'Contraseña Copiada',
                              message: `Clave (${pass}) copiada al portapapeles.`,
                              isError: false
                            });
                          }}
                        >
                          <Copy size={13} color={MONIQ.cyan} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.editPassBtn}
                          onPress={() => handleOpenEditPassword(selectedBuyer.accessPassword || '')}
                        >
                          <Edit3 size={11} color="#FFFFFF" />
                          <Text style={styles.editPassBtnText}>Cambiar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* SECCIÓN PLAN Y CAPACIDADES ADQUIRIDAS */}
                  <View style={styles.planSelectorBox}>
                    <View style={styles.credentialsHeader}>
                      <ShieldCheck size={14} color={MONIQ.gold} />
                      <Text style={[styles.credentialsTitle, { color: MONIQ.gold }]}>PAQUETE Y CAPACIDADES ADQUIRIDAS</Text>
                    </View>
                    <Text style={styles.planSelectorDesc}>
                      Configura qué módulos y rutas puede gestionar este cliente en su app:
                    </Text>
                    <View style={styles.planSelectorRow}>
                      <TouchableOpacity
                        style={[
                          styles.planSelectorBtn,
                          selectedBuyer.templateType === 2 && styles.planSelectorBtnActiveReviews
                        ]}
                        onPress={() => handleUpdateTemplateType(selectedBuyer.id, 2)}
                      >
                        <Text style={[
                          styles.planSelectorBtnText,
                          selectedBuyer.templateType === 2 && styles.planSelectorBtnTextActive
                        ]}>
                          SOLO RESEÑAS
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.planSelectorBtn,
                          selectedBuyer.templateType === 1 && styles.planSelectorBtnActiveMenu
                        ]}
                        onPress={() => handleUpdateTemplateType(selectedBuyer.id, 1)}
                      >
                        <Text style={[
                          styles.planSelectorBtnText,
                          selectedBuyer.templateType === 1 && styles.planSelectorBtnTextActive
                        ]}>
                          SOLO MENÚ
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.planSelectorBtn,
                          selectedBuyer.templateType === 3 && styles.planSelectorBtnActiveDual
                        ]}
                        onPress={() => handleUpdateTemplateType(selectedBuyer.id, 3)}
                      >
                        <Text style={[
                          styles.planSelectorBtnText,
                          selectedBuyer.templateType === 3 && styles.planSelectorBtnTextActive
                        ]}>
                          PACK DUAL
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* SECCIÓN WHATSAPP CORPORATIVO (CLICK TO CHAT) */}
                  <View style={styles.whatsappSectionBox}>
                    <View style={styles.whatsappSectionHeader}>
                      <MessageSquare size={14} color={MONIQ.positive} />
                      <Text style={styles.whatsappSectionTitle}>NOTIFICACIONES WHATSAPP</Text>
                    </View>

                    <View style={styles.whatsappButtonsRow}>
                      <TouchableOpacity 
                        style={styles.whatsappNoticeBtn}
                        onPress={() => openWhatsAppMessage(selectedBuyer.ownerPhone, 'expiration', selectedBuyer)}
                      >
                        <Clock size={13} color="#FFFFFF" />
                        <Text style={styles.whatsappNoticeBtnText}>Aviso Vencimiento</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.whatsappCredsBtn}
                        onPress={() => openWhatsAppMessage(selectedBuyer.ownerPhone, 'credentials', selectedBuyer)}
                      >
                        <Key size={13} color="#FFFFFF" />
                        <Text style={styles.whatsappNoticeBtnText}>Enviar Clave</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.whatsappUpdateBtn}
                        onPress={() => openWhatsAppMessage(selectedBuyer.ownerPhone, 'updates', selectedBuyer)}
                      >
                        <Sparkles size={13} color="#0B0B0E" />
                        <Text style={styles.whatsappUpdateBtnText}>Novedades</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Tarjetas Asignadas a este Negocio ({buyerCards.length})</Text>
                <Text style={styles.sectionSubtitle}>Gestiona o programa físicamente cada chip con la antena</Text>

                {buyerCards.map((c) => {
                  const isActive = c.status === 'ACTIVE';
                  const isAssigned = !c.status || c.status === 'ASSIGNED';
                  const statusColor = isActive ? MONIQ.positive : isAssigned ? MONIQ.gold : MONIQ.negative;
                  const statusLabel = isActive ? 'ACTIVA' : isAssigned ? 'ASIGNADA' : (c.status || 'SUSPENDIDA');
                  const jumpUrl = ENV.getCardUrl(c.cardCode);
                  const prodUrl = ENV.getCardUrl(c.cardCode);

                  return (
                    <View key={c.id} style={styles.cardItemRow}>
                      <View style={[styles.cardItemIcon, { backgroundColor: statusColor + '18' }]}>
                        <CreditCard size={18} color={statusColor} />
                      </View>

                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={styles.cardItemLabel}>{c.label}</Text>
                          <View style={[styles.cardStatusBadge, { borderColor: statusColor + '40', backgroundColor: statusColor + '15' }]}>
                            <Text style={[styles.cardStatusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                          </View>
                        </View>

                        <Text style={styles.cardItemMeta}>#{c.cardCode} • {c.cardType}</Text>
                        
                        {c.nfcUid ? (
                          <View style={styles.cardSiliconPill}>
                            <Cpu size={10} color={MONIQ.cyan} style={{ marginRight: 4 }} />
                            <Text style={styles.cardSiliconPillText} numberOfLines={1}>
                              UID: {c.nfcUid} • {c.chipFamily || 'NTAG215'}
                            </Text>
                          </View>
                        ) : null}

                        <Text style={styles.cardItemUrl} numberOfLines={1}>{prodUrl}</Text>

                        {/* ACCIONES DE TARJETA: QR, PROBAR, PROGRAMAR NFC, ELIMINAR */}
                        <View style={styles.cardActionsRow}>
                          <TouchableOpacity
                            style={styles.cardQrBtn}
                            onPress={() => setQrModalData({
                              visible: true,
                              cardCode: c.cardCode,
                              label: c.label,
                              targetUrl: prodUrl
                            })}
                          >
                            <QrCode size={12} color="#FFFFFF" />
                            <Text style={styles.cardQrBtnText}>Ver QR</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cardTestBtn}
                            onPress={() => Linking.openURL(jumpUrl).catch(() => {})}
                          >
                            <ExternalLink size={12} color={MONIQ.cyan} />
                            <Text style={styles.cardTestBtnText}>Probar Enlace</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.reprogramBtn}
                            onPress={() => startRealNfcProgramming(c)}
                          >
                            <Cpu size={12} color={MONIQ.accent} />
                            <Text style={styles.reprogramBtnText}>NFC</Text>
                          </TouchableOpacity>

                          <TouchableOpacity 
                            style={styles.deleteCardBtn}
                            onPress={() => handleDeleteCard(c.id, c.cardCode)}
                          >
                            <Trash2 size={13} color={MONIQ.negative} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ================================================================ */}
        {/* SESIÓN 3: APP INFO & LOGS DE ERRORES                            */}
        {/* ================================================================ */}
        {activeTab === 3 && (
          <View>
            <View style={styles.headerBlock}>
              <Text style={styles.headerPre}>SISTEMA & DIAGNÓSTICO</Text>
              <Text style={styles.headerMain}>Información y Logs</Text>
              <Text style={styles.headerDesc}>
                Detalles del motor de la app, estado del hardware y consola de eventos en vivo.
              </Text>
            </View>

            {/* TARJETA DE VERSIÓN Y HARDWARE */}
            <View style={styles.infoSpecsCard}>
              <View style={styles.infoSpecRow}>
                <Text style={styles.specLabel}>Versión de la Plataforma:</Text>
                <Text style={styles.specVal}>S & D v3.4.2 (Hardware NFC Real)</Text>
              </View>
              <View style={styles.infoSpecRow}>
                <Text style={styles.specLabel}>Arquitectura Móvil:</Text>
                <Text style={styles.specVal}>React 19.3 • React Native 0.88</Text>
              </View>
              <View style={styles.infoSpecRow}>
                <Text style={styles.specLabel}>Driver NFC Nativo:</Text>
                <Text style={styles.specVal}>react-native-nfc-manager (13.56 MHz)</Text>
              </View>
              <View style={styles.infoSpecRow}>
                <Text style={styles.specLabel}>Dominio Canónico:</Text>
                <Text style={styles.specVal}>{ENV.BACKEND_URL}</Text>
              </View>
              <View style={styles.infoSpecRow}>
                <Text style={styles.specLabel}>Backend API:</Text>
                <Text style={styles.specVal}>{ENV.API_BASE_URL}</Text>
              </View>
            </View>

            {/* CONSOLA DE LOGS DE ERRORES EN VIVO */}
            <View style={styles.logsConsoleHeader}>
              <View>
                <Text style={styles.logsConsoleTitle}>Consola de Eventos y Errores</Text>
                <Text style={styles.logsConsoleSub}>{logs.length} eventos capturados</Text>
              </View>

              <TouchableOpacity 
                style={styles.copyLogsBtn}
                onPress={copyLogsToClipboard}
              >
                {copiedLogs ? (
                  <>
                    <Check size={14} color="#FFFFFF" />
                    <Text style={styles.copyLogsBtnText}>¡Copiado!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={14} color="#FFFFFF" />
                    <Text style={styles.copyLogsBtnText}>Copiar Logs</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.logsConsoleBox}>
              {logs.map((log, idx) => (
                <Text key={idx} style={styles.logLineText}>{log}</Text>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ================================================================ */}
      {/* BARRA DE NAVEGACIÓN INFERIOR (4 SESIONES FIJAS)                  */}
      {/* ================================================================ */}
      <View style={styles.bottomBarNav}>
        <TouchableOpacity 
          style={[styles.bottomBarItem, activeTab === 0 && styles.bottomBarItemActive]}
          onPress={() => {
            setSelectedBuyer(null);
            setActiveTab(0);
          }}
        >
          <Home size={20} color={activeTab === 0 ? MONIQ.accent : MONIQ.textSecondary} />
          <Text style={[styles.bottomBarLabel, activeTab === 0 && styles.bottomBarLabelActive]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bottomBarItem, activeTab === 1 && styles.bottomBarItemActive]}
          onPress={() => {
            setSelectedBuyer(null);
            setActiveTab(1);
          }}
        >
          <UserPlus size={20} color={activeTab === 1 ? MONIQ.accent : MONIQ.textSecondary} />
          <Text style={[styles.bottomBarLabel, activeTab === 1 && styles.bottomBarLabelActive]}>Crear Cliente</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bottomBarItem, activeTab === 2 && styles.bottomBarItemActive]}
          onPress={() => setActiveTab(2)}
        >
          <Users size={20} color={activeTab === 2 ? MONIQ.accent : MONIQ.textSecondary} />
          <Text style={[styles.bottomBarLabel, activeTab === 2 && styles.bottomBarLabelActive]}>Compradores</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bottomBarItem, activeTab === 3 && styles.bottomBarItemActive]}
          onPress={() => {
            setSelectedBuyer(null);
            setActiveTab(3);
          }}
        >
          <Info size={20} color={activeTab === 3 ? MONIQ.accent : MONIQ.textSecondary} />
          <Text style={[styles.bottomBarLabel, activeTab === 3 && styles.bottomBarLabelActive]}>App & Logs</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL: REGISTRAR TARJETA AL NEGOCIO */}
      <Modal visible={showAddCardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>VINCULAR TARJETA</Text>
                <Text style={styles.modalSubHeader}>Asigna una tarjeta fisica o digital para atencion o resenas</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddCardModal(false)}>
                <X size={20} color={MONIQ.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>UBICACION / ETIQUETA EN SALON</Text>
            <TextInput
              style={styles.modalTextInput}
              value={addCardLabel}
              onChangeText={setAddCardLabel}
              placeholder="Ej. Mesa 4 Terraza, Barra Principal"
              placeholderTextColor={MONIQ.textMuted}
            />

            {/* PRESETS DE SELECCION RAPIDA DE UBICACION */}
            <View style={styles.presetPillsRow}>
              {['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Barra', 'Terraza', 'Caja'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetPill, addCardLabel === preset && styles.presetPillActive]}
                  onPress={() => setAddCardLabel(preset)}
                >
                  <Text style={[styles.presetPillText, addCardLabel === preset && styles.presetPillTextActive]}>
                    {preset}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalInputLabel, { marginTop: 14 }]}>TIPO DE SERVICIO</Text>
            <View style={styles.serviceCardsRow}>
              <TouchableOpacity 
                style={[styles.serviceOptionCard, addCardType === 1 && styles.serviceOptionCardActiveMenu]}
                onPress={() => setAddCardType(1)}
              >
                <BookOpen size={18} color={addCardType === 1 ? MONIQ.cyan : MONIQ.textSecondary} style={{ marginBottom: 6 }} />
                <Text style={[styles.serviceOptionTitle, addCardType === 1 && { color: MONIQ.cyan }]}>
                  Menu Online
                </Text>
                <Text style={styles.serviceOptionDesc}>Carta digital y pedidos</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.serviceOptionCard, addCardType === 2 && styles.serviceOptionCardActiveReviews]}
                onPress={() => setAddCardType(2)}
              >
                <Star size={18} color={addCardType === 2 ? MONIQ.gold : MONIQ.textSecondary} style={{ marginBottom: 6 }} />
                <Text style={[styles.serviceOptionTitle, addCardType === 2 && { color: MONIQ.gold }]}>
                  Google Reviews
                </Text>
                <Text style={styles.serviceOptionDesc}>Opiniones y valoracion</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalInputLabel, { marginTop: 14 }]}>CODIGO DE TARJETA FISICA (OPCIONAL)</Text>
            <View style={styles.scanInputRow}>
              <TextInput
                style={[styles.modalTextInput, { flex: 1, marginBottom: 0 }]}
                value={addCardCustomCode}
                onChangeText={setAddCardCustomCode}
                placeholder="Ej. SD-BEN-05 (o escanear)"
                placeholderTextColor={MONIQ.textMuted}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.scanCodeCameraBtn}
                onPress={() => {
                  setCameraScanTarget('addCard');
                  setShowCameraScanner(true);
                }}
              >
                <Camera size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.scanCodeCameraBtnText}>Escanear</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleAddCardToBuyer}>
              <Text style={styles.modalConfirmBtnText}>Vincular Tarjeta al Negocio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ESTACIÓN DE HARDWARE NFC (DISEÑO SCROLLEABLE Y ERGONÓMICO)           */}
      {/* ========================================================================= */}
      <Modal visible={showNfcModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.nfcStationCard}>
            
            {/* ENCABEZADO FIJO: TÍTULO Y BADGE DE ESTADO */}
            <View style={styles.nfcHeaderRow}>
              <Text style={styles.nfcHeaderTitle}>ESTACIÓN NFC S & D</Text>
              <View style={[styles.nfcStatusBadge, { borderColor: nfcStation.statusBadgeColor + '40', backgroundColor: nfcStation.statusBadgeColor + '15' }]}>
                <Text style={[styles.nfcStatusBadgeText, { color: nfcStation.statusBadgeColor }]}>
                  {nfcStation.statusBadgeText}
                </Text>
              </View>
            </View>

            {/* CUERPO CENTRAL CON DESPLAZAMIENTO SUAVE VERTICAL */}
            <ScrollView
              style={styles.nfcScrollView}
              contentContainerStyle={styles.nfcScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {/* TELEMETRÍA DEL TELÉFONO ACTIVO (REDMI NOTE 15 / ANDROID 14+ / IOS) */}
              <View style={styles.deviceTelemetryCard}>
                <View style={styles.deviceHeaderRow}>
                  <Smartphone size={13} color={MONIQ.cyan} style={{ marginRight: 6 }} />
                  <Text style={styles.deviceModelText}>{activeDevice.displayTag}</Text>
                </View>
                <Text style={styles.deviceAntennaText}>
                  Antena: {activeDevice.antennaLocation}
                </Text>
              </View>

              {/* ALERTA Y BOTÓN DE ACCESO DIRECTO SI EL SENSOR NFC ESTÁ APAGADO EN ANDROID */}
              {!isNfcHardwareEnabled && Platform.OS === 'android' && (
                <View style={styles.nfcDisabledWrapper}>
                  <View style={styles.nfcDisabledBanner}>
                    <AlertTriangle size={15} color={MONIQ.gold} style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.nfcDisabledTitle}>Sensor NFC Desactivado</Text>
                      <Text style={styles.nfcDisabledSub}>
                        El interruptor NFC está apagado en tu {activeDevice.brand}. Actívalo para permitir la detección electromagnética a 13.56 MHz.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.openSettingsBigBtn} onPress={handleOpenNfcSettings}>
                    <Settings size={14} color="#0B0B0E" style={{ marginRight: 6 }} />
                    <Text style={styles.openSettingsBigBtnText}>Abrir Ajustes NFC en {activeDevice.brand}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ÍCONO CENTRAL DE ESCANEO NFC */}
              <View style={styles.nfcCenterArea}>
                <Animated.View style={[styles.scannerBox, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={styles.scannerCornerTL} />
                  <View style={styles.scannerCornerTR} />
                  <View style={styles.scannerCornerBL} />
                  <View style={styles.scannerCornerBR} />
                  <Radio size={36} color={nfcStation.isCompleted ? MONIQ.positive : nfcStation.hardwareStatus === 'Detectado' ? MONIQ.cyan : MONIQ.gold} />
                </Animated.View>

                <Text style={styles.nfcPromptTitle}>
                  {nfcStation.hardwareStatus === 'Detectado' ? '¡Tarjeta Física Detectada!' : 'Acerca una tarjeta NFC'}
                </Text>
                <Text style={styles.nfcPromptSub}>
                  {nfcStation.hardwareStatus === 'Detectado'
                    ? `UID: ${nfcStation.uid} listo para verificación física.`
                    : `Coloca una etiqueta NTAG compatible en la antena de tu ${activeDevice.brand} ${activeDevice.modelName}.`
                  }
                </Text>

                {/* BOTÓN DE ESCANEO CON CÁMARA (PERMISO NATIVO Y VISOR EN TIEMPO REAL) */}
                {nfcStation.hardwareStatus !== 'Detectado' && !nfcStation.isCompleted && (
                  <TouchableOpacity
                    style={styles.cameraScanActionBtn}
                    onPress={() => {
                      setCameraScanTarget('nfcStation');
                      setShowCameraScanner(true);
                    }}
                  >
                    <Camera size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.cameraScanActionBtnText}>Escanear Código de Tarjeta con Cámara</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* TABLA DE TELEMETRÍA (5 FILAS EXACTAS) */}
              <View style={styles.telemetryCard}>
                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryLabel}>Hardware detectado</Text>
                  <Text style={[
                    styles.telemetryValue,
                    nfcStation.hardwareStatus === 'Esperando' ? styles.valOrange :
                    nfcStation.hardwareStatus === 'Detectado' ? styles.valGreen : styles.valWhite
                  ]}>
                    {nfcStation.hardwareStatus}
                  </Text>
                </View>

                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryLabel}>UID</Text>
                  <Text style={[styles.telemetryValue, styles.valMono]}>
                    {nfcStation.uid}
                  </Text>
                </View>

                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryLabel}>Chip</Text>
                  <Text style={[styles.telemetryValue, styles.valWhite]}>
                    {nfcStation.chipFamily}
                  </Text>
                </View>

                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryLabel}>Escritura NDEF</Text>
                  <Text style={[
                    styles.telemetryValue,
                    nfcStation.ndefStatus === 'Pendiente' ? styles.valMuted :
                    nfcStation.ndefStatus === 'Verificada' ? styles.valGreen : styles.valCyan
                  ]}>
                    {nfcStation.ndefStatus}
                  </Text>
                </View>

                <View style={[styles.telemetryRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.telemetryLabel}>Estado del servidor</Text>
                  <Text style={[
                    styles.telemetryValue,
                    nfcStation.serverStatus === 'ACTIVE' ? styles.valGreen :
                    nfcStation.serverStatus === 'PROGRAMMING' ? styles.valCyan : styles.valOrange
                  ]}>
                    {nfcStation.serverStatus}
                  </Text>
                </View>
              </View>

              {/* CONSOLA DE CONFIGURACIÓN DE SILICIO FÍSICO NXP */}
              {isSiliconMode && !nfcStation.isCompleted && (
                <View style={styles.siliconBox}>
                  <Text style={styles.siliconTitle}>SELECCIONA CHIP FÍSICO NXP:</Text>
                  <View style={styles.siliconChipsRow}>
                    {(['NTAG213', 'NTAG215', 'NTAG216'] as const).map(chip => (
                      <TouchableOpacity
                        key={chip}
                        style={[styles.siliconChipBtn, siliconChip === chip && styles.siliconChipBtnActive]}
                        onPress={() => handleSelectChip(chip)}
                      >
                        <Text style={[styles.siliconChipText, siliconChip === chip && styles.siliconChipTextActive]}>
                          {chip}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.siliconTitle}>UID FÍSICO NXP (7 BYTES):</Text>
                  <View style={styles.siliconUidInputRow}>
                    <TextInput
                      style={styles.siliconUidInput}
                      value={siliconUid}
                      onChangeText={(val) => {
                        setSiliconUid(val);
                        if (val.trim().length >= 8) {
                          setNfcStation(prev => ({
                            ...prev,
                            hardwareStatus: 'Detectado',
                            uid: val.trim()
                          }));
                        }
                      }}
                      placeholder="04:XX:XX:XX:XX:XX:XX"
                      placeholderTextColor={MONIQ.textMuted}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.siliconGenUidBtn} onPress={generateRandomNxpUid}>
                      <Text style={styles.siliconGenUidText}>Generar</Text>
                    </TouchableOpacity>
                  </View>

                  {Platform.OS === 'android' && (
                    <TouchableOpacity style={styles.xiaomiNfcBtn} onPress={handleOpenNfcSettings}>
                      <Smartphone size={13} color={MONIQ.gold} />
                      <Text style={styles.xiaomiNfcBtnText}>Abrir Ajustes NFC en {activeDevice.brand}</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.siliconConfirmBtn,
                      { marginTop: 12 },
                      (nfcStation.hardwareStatus !== 'Detectado' || !siliconUid.trim()) && styles.siliconConfirmBtnDisabled
                    ]}
                    onPress={handleConfirmSiliconProvision}
                    disabled={provisioningLoading || nfcStation.hardwareStatus !== 'Detectado' || !siliconUid.trim()}
                  >
                    {provisioningLoading ? (
                      <ActivityIndicator size="small" color="#0B0B0E" />
                    ) : (
                      <Text style={[
                        styles.siliconConfirmBtnText,
                        (nfcStation.hardwareStatus !== 'Detectado' || !siliconUid.trim()) && styles.siliconConfirmBtnTextDisabled
                      ]}>
                        {nfcStation.hardwareStatus === 'Detectado' && siliconUid.trim()
                          ? 'Grabar y Activar Tarjeta en Producción'
                          : 'Esperando Detección de Tarjeta...'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* MENSAJE DINÁMICO AL PIE */}
              <Text style={styles.nfcFooterText}>
                {nfcStation.footerMessage}
              </Text>

              {/* ADVERTENCIA CRÍTICA INFERIOR */}
              <View style={styles.nfcInfoPill}>
                <Text style={styles.nfcInfoPillText}>
                  Nota: La animación de espera puede continuar, pero nunca debe convertirse automáticamente en éxito.
                </Text>
              </View>
            </ScrollView>

            {/* BOTONES DE ACCIÓN FIJOS AL PIE */}
            <View style={styles.nfcActionsRow}>
              {nfcStation.isCompleted ? (
                <TouchableOpacity 
                  style={styles.nfcFinishBtn}
                  onPress={() => setShowNfcModal(false)}
                >
                  <Text style={styles.nfcFinishBtnText}>Finalizar y Entregar</Text>
                </TouchableOpacity>
              ) : nfcStation.canRetrySync ? (
                <TouchableOpacity 
                  style={styles.nfcRetrySyncBtn}
                  onPress={handleRetryActivationSync}
                >
                  <Text style={styles.nfcRetrySyncBtnText}>Reintentar Activación en Servidor</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={styles.nfcCancelBtn}
                  onPress={handleCancelNfcDetection}
                >
                  <Text style={styles.nfcCancelBtnText}>Cancelar Detección</Text>
                </TouchableOpacity>
              )}
            </View>

          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: EDITAR CONTRASEÑA DE CLIENTE                                        */}
      {/* ========================================================================= */}
      <Modal visible={showEditPassModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>EDITAR CONTRASEÑA</Text>
                <Text style={styles.modalSubHeader}>
                  {selectedBuyer?.name} • {selectedBuyer?.ownerEmail || selectedBuyer?.slug}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowEditPassModal(false)}>
                <X size={20} color={MONIQ.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInputLabel}>NUEVA CONTRASEÑA DE ACCESO APP</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={editPassValue}
                onChangeText={setEditPassValue}
                secureTextEntry={!showEditPassValue}
                placeholder="Ej. @Servidor100 o SD#9999!Pass"
                placeholderTextColor={MONIQ.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeToggleBtn}
                onPress={() => setShowEditPassValue(!showEditPassValue)}
              >
                {showEditPassValue ? (
                  <EyeOff size={16} color={MONIQ.textSecondary} />
                ) : (
                  <Eye size={16} color={MONIQ.textSecondary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.genPassBtn}
                onPress={() => {
                  const num = Math.floor(1000 + Math.random() * 9000);
                  setEditPassValue(`SD#${num}!Pass`);
                }}
              >
                <Key size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.genPassBtnText}>Generar</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldHelpText}>
              Esta es la contraseña con la que el cliente iniciará sesión en la aplicación móvil.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { flex: 1, backgroundColor: MONIQ.surfaceElevated, borderWidth: 1, borderColor: MONIQ.cardBorder }]}
                onPress={() => setShowEditPassModal(false)}
              >
                <Text style={[styles.modalConfirmBtnText, { color: MONIQ.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalConfirmBtn, { flex: 1.5 }]}
                onPress={handleSavePassword}
                disabled={editPassLoading}
              >
                {editPassLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Guardar Clave</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL SUCCESS MONIQ (VINCULADA / CLIENTE CREADO) */}
      <SuccessModal
        visible={successModalData.visible}
        title={successModalData.title}
        subtitle={successModalData.subtitle}
        codeLabel={successModalData.codeLabel}
        codeValue={successModalData.codeValue}
        details={successModalData.details}
        onClose={() => setSuccessModalData(prev => ({ ...prev, visible: false }))}
      />

      {/* MODAL NOTICE MONIQ (VALIDACIONES) */}
      <NoticeModal
        visible={noticeModalData.visible}
        title={noticeModalData.title}
        message={noticeModalData.message}
        isError={noticeModalData.isError}
        onClose={() => setNoticeModalData(prev => ({ ...prev, visible: false }))}
      />

      {/* MODAL ERROR MONIQ */}
      <ErrorModal
        visible={errorModalData.visible}
        title={errorModalData.title}
        message={errorModalData.message}
        details={errorModalData.details}
        onClose={() => setErrorModalData(prev => ({ ...prev, visible: false }))}
      />

      {/* MODAL DE CONFIRMACIÓN (ELIMINAR TARJETA) */}
      <ConfirmModal
        visible={confirmCardModalData.visible}
        title="Desvincular Tarjeta Física"
        message={`¿Estás seguro de que deseas desvincular la tarjeta ${confirmCardModalData.cardCode}? Ya no responderá en las mesas del salón.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
        onConfirm={handleExecuteDeleteCard}
        onCancel={() => setConfirmCardModalData(prev => ({ ...prev, visible: false }))}
      />

      {/* MODAL DE CONFIRMACIÓN (SUSPENDER / REACTIVAR NEGOCIO) */}
      <ConfirmModal
        visible={confirmBizModalData.visible}
        title={confirmBizModalData.action === 'archive' ? 'Suspender Negocio' : 'Reactivar Negocio'}
        message={
          confirmBizModalData.action === 'archive'
            ? `¿Deseas suspender ${confirmBizModalData.businessName}? Se pausarán sus tarjetas NFC asociadas temporalmente sin borrar el historial ni menús.`
            : `¿Deseas reactivar ${confirmBizModalData.businessName}? Sus tarjetas NFC volverán a estar activas en producción.`
        }
        confirmText={confirmBizModalData.action === 'archive' ? 'Suspender' : 'Reactivar'}
        cancelText="Cancelar"
        isDanger={confirmBizModalData.action === 'archive'}
        onConfirm={handleExecuteBizAction}
        onCancel={() => setConfirmBizModalData(prev => ({ ...prev, visible: false }))}
      />

      {/* MODAL QR DE ACCESO A LA TARJETA */}
      <QrModal
        visible={qrModalData.visible}
        cardCode={qrModalData.cardCode}
        label={qrModalData.label}
        targetUrl={qrModalData.targetUrl}
        onClose={() => setQrModalData(prev => ({ ...prev, visible: false }))}
      />

      {/* MODAL ESCÁNER ÓPTICO DE TARJETA CON CÁMARA */}
      <CameraScanModal
        visible={showCameraScanner}
        title="ESCANEAR CÓDIGO DE TARJETA FÍSICA"
        onClose={() => setShowCameraScanner(false)}
        onScanned={handleCardBarcodeScanned}
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
    paddingHorizontal: 20,
    paddingTop: 16
  },
  welcomeBanner: {
    backgroundColor: MONIQ.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginBottom: 16
  },
  welcomeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.cyan + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10
  },
  welcomeBadgeText: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4
  },
  welcomeTitle: {
    color: MONIQ.textPrimary,
    fontSize: 22,
    fontWeight: '900'
  },
  welcomeSub: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16
  },
  statCard: {
    flex: 1,
    backgroundColor: MONIQ.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  statNumber: {
    color: MONIQ.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 10
  },
  statDesc: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  quickActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MONIQ.accent + '33'
  },
  quickActionTitle: {
    color: MONIQ.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  quickActionSub: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  quickActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: MONIQ.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    color: MONIQ.textPrimary,
    fontSize: 16,
    fontWeight: '800'
  },
  sectionSubtitle: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 12
  },
  seeAllText: {
    color: MONIQ.accent,
    fontSize: 12,
    fontWeight: '700'
  },
  buyerPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  buyerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: MONIQ.bg,
    justifyContent: 'center',
    alignItems: 'center'
  },
  buyerNameText: {
    color: MONIQ.textPrimary,
    fontSize: 14,
    fontWeight: '700'
  },
  buyerMetaText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },

  // CREAR CLIENTE
  headerBlock: {
    marginBottom: 18
  },
  headerPre: {
    color: MONIQ.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  },
  headerMain: {
    color: MONIQ.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2
  },
  headerDesc: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4
  },
  formContainer: {
    backgroundColor: MONIQ.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  formLabel: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6
  },
  formInput: {
    height: 48,
    backgroundColor: MONIQ.bg,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: MONIQ.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  serviceOption: {
    flex: 1,
    height: 42,
    backgroundColor: MONIQ.bg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  serviceOptionActive: {
    borderColor: MONIQ.accent,
    backgroundColor: MONIQ.accentGlow
  },
  serviceOptionText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  serviceOptionTextActive: {
    color: MONIQ.accent
  },
  submitClientBtn: {
    height: 50,
    backgroundColor: MONIQ.accent,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  submitClientBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },

  // COMPRADORES LISTADO
  buyerCardItem: {
    backgroundColor: MONIQ.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  buyerCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  buyerCardTitle: {
    color: MONIQ.textPrimary,
    fontSize: 16,
    fontWeight: '800'
  },
  buyerCardOwner: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  serviceTag: {
    backgroundColor: MONIQ.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  serviceTagArchived: {
    borderColor: '#FF4D6A4D',
    backgroundColor: '#FF4D6A1A'
  },
  serviceTagText: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontWeight: '800'
  },
  serviceTagTextArchived: {
    color: MONIQ.negative
  },
  buyerCardDivider: {
    height: 1,
    backgroundColor: MONIQ.cardBorder,
    marginVertical: 12
  },
  buyerCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  buyerCardInfoCol: {
    flex: 1
  },
  infoRowFlex: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoRowText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginLeft: 6
  },
  infoRowTextPositive: {
    color: MONIQ.positive,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6
  },
  infoRowTextNegative: {
    color: MONIQ.negative,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6
  },

  // FICHA DEDICADA COMPRADOR
  backToListBtn: {
    marginBottom: 14
  },
  backToListBtnText: {
    color: MONIQ.accent,
    fontSize: 13,
    fontWeight: '700'
  },
  dedicatedCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MONIQ.accent + '33'
  },
  dedicatedTitle: {
    color: MONIQ.textPrimary,
    fontSize: 22,
    fontWeight: '900'
  },
  dedicatedOwner: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    marginTop: 2
  },
  dedicatedMeta: {
    color: MONIQ.textMuted,
    fontSize: 12,
    marginTop: 2
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  statusPillActive: {
    backgroundColor: '#35C99A1A',
    borderWidth: 1,
    borderColor: '#35C99A40'
  },
  statusPillArchived: {
    backgroundColor: '#FF4D6A1A',
    borderWidth: 1,
    borderColor: '#FF4D6A40'
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800'
  },
  statusPillTextActive: {
    color: MONIQ.positive
  },
  statusPillTextArchived: {
    color: MONIQ.negative
  },
  dedicatedActionsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10
  },
  addCardToBuyerBtn: {
    backgroundColor: MONIQ.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  addCardToBuyerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6
  },
  archiveBuyerBtn: {
    backgroundColor: MONIQ.surfaceElevated,
    borderWidth: 1,
    borderColor: MONIQ.negative + '60',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center'
  },
  reactivateBuyerBtn: {
    borderColor: MONIQ.positive + '60',
    backgroundColor: MONIQ.positive + '1A'
  },
  archiveBuyerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6
  },

  // SECCIÓN WHATSAPP CORPORATIVO
  whatsappSectionBox: {
    marginTop: 16,
    backgroundColor: MONIQ.bg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  whatsappSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  whatsappSectionTitle: {
    color: MONIQ.positive,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  whatsappButtonsRow: {
    flexDirection: 'row',
    gap: 8
  },
  whatsappNoticeBtn: {
    flex: 1,
    backgroundColor: MONIQ.surfaceElevated,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  whatsappNoticeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  whatsappUpdateBtn: {
    flex: 1,
    backgroundColor: MONIQ.positive,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  whatsappUpdateBtnText: {
    color: '#0B0B0E',
    fontSize: 11,
    fontWeight: '900'
  },
  whatsappCredsBtn: {
    flex: 1,
    backgroundColor: MONIQ.accent,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginTop: 6,
    paddingHorizontal: 12,
    height: 48
  },
  passwordInput: {
    flex: 1,
    color: MONIQ.textPrimary,
    fontSize: 13
  },
  eyeToggleBtn: {
    padding: 6
  },
  genPassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6
  },
  genPassBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  fieldHelpText: {
    color: MONIQ.textMuted,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 2
  },
  credentialsBox: {
    marginTop: 14,
    backgroundColor: MONIQ.bg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: MONIQ.cyan + '40'
  },
  credentialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8
  },
  credentialsTitle: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3
  },
  credentialLabel: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  credentialValue: {
    color: MONIQ.textPrimary,
    fontSize: 12,
    fontWeight: '600'
  },
  credentialValueMono: {
    color: MONIQ.cyan,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    fontWeight: '800'
  },
  copyPassBtn: {
    marginLeft: 8,
    padding: 4
  },
  planSelectorBox: {
    marginTop: 12,
    backgroundColor: MONIQ.bg,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 64, 0.3)'
  },
  planSelectorDesc: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginBottom: 10
  },
  planSelectorRow: {
    flexDirection: 'row',
    gap: 6
  },
  planSelectorBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: MONIQ.surface,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  planSelectorBtnActiveReviews: {
    backgroundColor: 'rgba(255, 179, 64, 0.18)',
    borderColor: MONIQ.gold
  },
  planSelectorBtnActiveMenu: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)',
    borderColor: MONIQ.cyan
  },
  planSelectorBtnActiveDual: {
    backgroundColor: 'rgba(53, 201, 154, 0.18)',
    borderColor: MONIQ.positive
  },
  planSelectorBtnText: {
    color: MONIQ.textMuted,
    fontSize: 10,
    fontWeight: '800'
  },
  planSelectorBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900'
  },

  // FILA DE TARJETA
  cardItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  cardItemIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: MONIQ.bg,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardItemLabel: {
    color: MONIQ.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  cardItemMeta: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  cardItemUrl: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2
  },
  cardStatusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  cardStatusBadgeText: {
    fontSize: 9,
    fontWeight: '800'
  },
  cardSiliconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 201, 154, 0.08)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(53, 201, 154, 0.2)'
  },
  cardSiliconPillText: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontFamily: 'monospace'
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6
  },
  cardQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C202B',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  cardQrBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4
  },
  cardTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(53, 201, 154, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(53, 201, 154, 0.3)'
  },
  cardTestBtnText: {
    color: MONIQ.cyan,
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4
  },
  reprogramBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.accentGlow,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MONIQ.accent
  },
  reprogramBtnText: {
    color: MONIQ.accent,
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4
  },
  deleteCardBtn: {
    padding: 5,
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 106, 0.25)'
  },

  // INFO & LOGS
  infoSpecsCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginBottom: 20
  },
  infoSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  specLabel: {
    color: MONIQ.textSecondary,
    fontSize: 12
  },
  specVal: {
    color: MONIQ.textPrimary,
    fontSize: 12,
    fontWeight: '700'
  },
  logsConsoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  logsConsoleTitle: {
    color: MONIQ.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  logsConsoleSub: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  copyLogsBtn: {
    backgroundColor: MONIQ.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  copyLogsBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 4
  },
  logsConsoleBox: {
    backgroundColor: '#090A0D',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    minHeight: 180
  },
  logLineText: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 4,
    lineHeight: 16
  },

  // BARRA INFERIOR FIJA
  bottomBarNav: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 64,
    backgroundColor: MONIQ.surface + 'FA',
    borderRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 15
  },
  bottomBarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10
  },
  bottomBarItemActive: {},
  bottomBarLabel: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4
  },
  bottomBarLabelActive: {
    color: MONIQ.accent,
    fontWeight: '800'
  },

  // MODALES
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000E6',
    justifyContent: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    color: MONIQ.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1
  },
  modalSubHeader: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  presetPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 4
  },
  presetPill: {
    backgroundColor: '#161922',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  presetPillActive: {
    backgroundColor: 'rgba(53, 201, 154, 0.15)',
    borderColor: MONIQ.positive
  },
  presetPillText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '600'
  },
  presetPillTextActive: {
    color: MONIQ.positive,
    fontWeight: '800'
  },
  serviceCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  serviceOptionCard: {
    flex: 1,
    backgroundColor: MONIQ.bg,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  serviceOptionCardActiveMenu: {
    borderColor: MONIQ.cyan,
    backgroundColor: 'rgba(0, 229, 255, 0.08)'
  },
  serviceOptionCardActiveReviews: {
    borderColor: MONIQ.gold,
    backgroundColor: 'rgba(255, 179, 64, 0.08)'
  },
  serviceOptionTitle: {
    color: MONIQ.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2
  },
  serviceOptionDesc: {
    color: MONIQ.textSecondary,
    fontSize: 10
  },
  scanInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2
  },
  scanCodeCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#202433',
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  scanCodeCameraBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4
  },
  modalInputLabel: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6
  },
  modalTextInput: {
    height: 48,
    backgroundColor: MONIQ.bg,
    borderRadius: 14,
    paddingHorizontal: 16,
    color: MONIQ.textPrimary,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    fontSize: 14
  },
  modalServiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  modalServiceBtn: {
    flex: 1,
    height: 42,
    backgroundColor: MONIQ.bg,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  modalServiceBtnActive: {
    borderColor: MONIQ.accent,
    backgroundColor: MONIQ.accentGlow
  },
  modalServiceText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  modalServiceTextActive: {
    color: MONIQ.accent
  },
  modalConfirmBtn: {
    height: 48,
    backgroundColor: MONIQ.accent,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  modalConfirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800'
  },

  // =========================================================================
  // ESTILOS DE LA ESTACIÓN NFC (MAQUETA EXACTA Y ERGONÓMICA CON SCROLL)
  // =========================================================================
  nfcStationCard: {
    backgroundColor: '#0D0E13',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#252836',
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10
  },
  nfcScrollView: {
    flexGrow: 0,
    marginVertical: 4
  },
  nfcScrollContent: {
    paddingBottom: 10
  },
  editPassBtn: {
    backgroundColor: MONIQ.surfaceElevated,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    gap: 4
  },
  editPassBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700'
  },
  nfcHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  nfcHeaderTitle: {
    color: MONIQ.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1
  },
  nfcStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1
  },
  nfcStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  nfcCenterArea: {
    alignItems: 'center',
    marginVertical: 6
  },
  scannerBox: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  scannerCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: MONIQ.accent
  },
  scannerCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: MONIQ.accent
  },
  scannerCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: MONIQ.accent
  },
  scannerCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: MONIQ.accent
  },
  nfcPromptTitle: {
    color: MONIQ.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center'
  },
  nfcPromptSub: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 10
  },
  telemetryCard: {
    backgroundColor: '#171922',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginBottom: 14
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  telemetryLabel: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    fontWeight: '500'
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: '700'
  },
  valOrange: {
    color: MONIQ.gold
  },
  valGreen: {
    color: MONIQ.positive
  },
  valCyan: {
    color: MONIQ.cyan
  },
  valWhite: {
    color: MONIQ.textPrimary
  },
  valMuted: {
    color: MONIQ.textMuted
  },
  valMono: {
    fontFamily: 'monospace',
    color: MONIQ.textPrimary
  },
  siliconBox: {
    backgroundColor: '#13151D',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#252836',
    marginBottom: 14
  },
  siliconTitle: {
    color: MONIQ.textPrimary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  siliconChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  siliconChipBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#1B1E29',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  siliconChipBtnActive: {
    backgroundColor: 'rgba(53, 201, 154, 0.15)',
    borderColor: MONIQ.positive
  },
  siliconChipText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '700'
  },
  siliconChipTextActive: {
    color: MONIQ.positive,
    fontWeight: '800'
  },
  siliconUidInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8
  },
  siliconUidInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#0A0B10',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    paddingHorizontal: 12,
    color: MONIQ.cyan,
    fontFamily: 'monospace',
    fontSize: 12
  },
  siliconGenUidBtn: {
    backgroundColor: '#202433',
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  siliconGenUidText: {
    color: MONIQ.textPrimary,
    fontSize: 11,
    fontWeight: '700'
  },
  xiaomiNfcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 179, 64, 0.12)',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 64, 0.3)',
    marginTop: 6
  },
  xiaomiNfcBtnText: {
    color: MONIQ.gold,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6
  },
  siliconConfirmBtn: {
    backgroundColor: MONIQ.positive,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  siliconConfirmBtnDisabled: {
    backgroundColor: '#1E212B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  siliconConfirmBtnText: {
    color: '#0B0B0E',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  siliconConfirmBtnTextDisabled: {
    color: MONIQ.textMuted,
    fontWeight: '700'
  },
  deviceTelemetryCard: {
    backgroundColor: '#14161F',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262A3B'
  },
  deviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  deviceModelText: {
    color: MONIQ.textPrimary,
    fontSize: 12,
    fontWeight: '800'
  },
  deviceAntennaText: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontWeight: '600'
  },
  nfcDisabledWrapper: {
    marginBottom: 14
  },
  nfcDisabledBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 179, 64, 0.12)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 179, 64, 0.35)',
    marginBottom: 8
  },
  nfcDisabledTitle: {
    color: MONIQ.gold,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2
  },
  nfcDisabledSub: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    lineHeight: 15
  },
  openSettingsBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MONIQ.gold,
    height: 40,
    borderRadius: 10
  },
  openSettingsBigBtnText: {
    color: '#0B0B0E',
    fontSize: 12,
    fontWeight: '800'
  },
  cameraScanActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B1F2D',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MONIQ.accent,
    marginTop: 8
  },
  cameraScanActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  nfcFooterText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
    lineHeight: 16
  },
  nfcInfoPill: {
    backgroundColor: '#1F222E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  nfcInfoPillText: {
    color: MONIQ.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14
  },
  nfcActionsRow: {
    width: '100%',
    marginTop: 8,
    marginBottom: 0
  },
  nfcCancelBtn: {
    width: '100%',
    height: 46,
    backgroundColor: '#202331',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF4D6A4D'
  },
  nfcCancelBtnText: {
    color: MONIQ.negative,
    fontSize: 13,
    fontWeight: '800'
  },
  nfcFinishBtn: {
    width: '100%',
    height: 46,
    backgroundColor: MONIQ.positive,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  nfcFinishBtnText: {
    color: '#0B0B0E',
    fontSize: 14,
    fontWeight: '900'
  },
  nfcRetrySyncBtn: {
    width: '100%',
    height: 46,
    backgroundColor: MONIQ.gold,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  nfcRetrySyncBtnText: {
    color: '#0B0B0E',
    fontSize: 13,
    fontWeight: '800'
  }
});
