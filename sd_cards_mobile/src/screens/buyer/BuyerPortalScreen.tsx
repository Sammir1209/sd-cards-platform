import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  Share,
  Modal,
  Platform,
  Image
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import {
  CreditCard,
  Utensils,
  Star,
  Zap,
  CheckCircle2,
  ExternalLink,
  Globe,
  Save,
  Check,
  AlertCircle,
  QrCode,
  Layers,
  Copy,
  Wifi,
  Share2,
  Printer,
  Lock,
  X,
  FileText,
  ShieldCheck
} from 'lucide-react-native';
import { MONIQ } from '../../theme/colors';
import { api } from '../../services/api';
import { ENV } from '../../config/env';

interface BuyerPortalScreenProps {
  businessId: number;
}

export const BuyerPortalScreen: React.FC<BuyerPortalScreenProps> = ({ businessId }) => {
  const [business, setBusiness] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'cards' | 'qr' | 'routing' | 'menu'>('cards');
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Configuración de Enrutamiento y QR Dinámico
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [autoRedirectReviews, setAutoRedirectReviews] = useState(true);
  const [customDomain, setCustomDomain] = useState('');
  const [activeRoutingMode, setActiveRoutingMode] = useState<number>(1);
  const [wifiPassword, setWifiPassword] = useState('');
  const [savingRouting, setSavingRouting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [routingNotice, setRoutingNotice] = useState<{ message: string; isError: boolean } | null>(null);

  // Impresión Inalámbrica Wi-Fi
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFormat, setPrintFormat] = useState<'stand' | 'sticker' | 'thermal'>('stand');
  const [isPrinting, setIsPrinting] = useState(false);

  // Compartir Imagen QR (PNG)
  const qrSvgRef = useRef<any>(null);
  const [isSharingQr, setIsSharingQr] = useState(false);

  useEffect(() => {
    loadData();
  }, [businessId]);

  const loadData = async () => {
    try {
      const bData = await api.getBusinessById(businessId);
      if (bData) {
        setBusiness(bData);
        setGoogleMapsUrl(bData.googleMapsUrl || '');
        setAutoRedirectReviews(bData.autoRedirectReviews !== false);
        setCustomDomain(bData.customDomain || '');
        setActiveRoutingMode(bData.activeRoutingMode || 1);
        setWifiPassword(bData.wifiPassword || '');
      }
      const cData = await api.getCardsByBusiness(businessId);
      setCards(cData);
      const mData = await api.getMenuByBusiness(businessId);
      setCategories(mData?.categories || []);
    } catch (e) {
      console.log('Error cargando portal comprador:', e);
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleToggleDish = async (dishId: number) => {
    try {
      await api.toggleDish(dishId);
      loadData();
    } catch (e) {
      Alert.alert('Error', 'No se pudo actualizar el plato.');
    }
  };

  const isMenuService = business?.templateType === 1 || business?.templateType === 3;
  const isReviewsService = business?.templateType === 2 || business?.templateType === 3;
  const isHubService = business?.templateType === 3;

  const handleSaveRouting = async (overrideMode?: number) => {
    setSavingRouting(true);
    setRoutingNotice(null);
    const targetMode = overrideMode !== undefined ? overrideMode : activeRoutingMode;

    const res = await api.updateBusinessRouting(businessId, {
      googleMapsUrl: isReviewsService ? googleMapsUrl.trim() : undefined,
      autoRedirectReviews: isReviewsService ? autoRedirectReviews : undefined,
      customDomain: isMenuService ? customDomain.trim() : undefined,
      activeRoutingMode: targetMode,
      wifiPassword: isHubService ? wifiPassword.trim() : undefined
    });
    setSavingRouting(false);

    if (res.success) {
      setRoutingNotice({
        message: 'Configuración guardada exitosamente. Todos los QRs y tarjetas responderán con este modo.',
        isError: false
      });
      loadData();
    } else {
      setRoutingNotice({
        message: res.error || 'No se pudieron guardar los cambios de ruta.',
        isError: true
      });
    }
  };

  const handleTestUrl = (url: string) => {
    if (!url || !url.trim()) {
      Alert.alert('URL requerida', 'Ingresa una URL válida antes de realizar la prueba.');
      return;
    }
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    Linking.openURL(target).catch(() => {
      Alert.alert('Error', 'No se pudo abrir la URL en el navegador de este dispositivo.');
    });
  };

  const qrCanonicalUrl = business?.slug
    ? ENV.getQrUrl(business.slug)
    : ENV.BACKEND_URL;

  const handleCopyQrLink = async () => {
    await Clipboard.setStringAsync(qrCanonicalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareQrImage = async () => {
    if (isSharingQr) return;
    setIsSharingQr(true);
    try {
      if (!qrSvgRef.current) {
        Alert.alert('Error', 'El código QR aún no está listo para exportarse.');
        setIsSharingQr(false);
        return;
      }

      qrSvgRef.current.toDataURL(async (base64Data: string) => {
        try {
          const cleanSlug = business?.slug ? business.slug.replace(/[^a-zA-Z0-9_-]/g, '') : 'sd_qr';
          const filename = `QR_${cleanSlug}.png`;
          const fileUri = `${FileSystem.cacheDirectory}${filename}`;

          await FileSystem.writeAsStringAsync(fileUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64
          });

          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'image/png',
              dialogTitle: `Compartir Código QR - ${business?.name || 'Local'}`,
              UTI: 'public.png'
            });
          } else {
            Alert.alert('No compatible', 'El servicio para compartir imágenes no está disponible en este dispositivo.');
          }
        } catch (err: any) {
          Alert.alert('Error al exportar imagen', err?.message || 'No se pudo generar la imagen del código QR.');
        } finally {
          setIsSharingQr(false);
        }
      });
    } catch (e: any) {
      setIsSharingQr(false);
      Alert.alert('Error', e?.message || 'Ocurrió un error al preparar la imagen QR.');
    }
  };

  const generatePrintHtml = (format: 'stand' | 'sticker' | 'thermal', businessName: string, qrUrl: string, wifiPass?: string) => {
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&margin=10`;

    if (format === 'stand') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: A6 portrait; margin: 0; }
            body {
              margin: 0; padding: 26px 18px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #ffffff; color: #0b0f19; text-align: center;
              display: flex; flex-direction: column; align-items: center; justify-content: space-between;
              min-height: 94vh; box-sizing: border-box;
            }
            .tag { font-size: 10px; font-weight: 800; letter-spacing: 2px; color: #2563eb; text-transform: uppercase; margin-bottom: 2px; }
            .title { font-size: 24px; font-weight: 900; margin: 0 0 2px 0; color: #090d16; }
            .subtitle { font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 16px; }
            .qr-box {
              padding: 12px; background: #ffffff; border: 2.5px solid #0b0f19; border-radius: 18px;
              display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.08); margin-bottom: 14px;
            }
            .qr-box img { width: 210px; height: 210px; display: block; }
            .cta { font-size: 14px; font-weight: 900; color: #0b0f19; margin: 0 0 4px 0; text-transform: uppercase; }
            .instructions { font-size: 10px; color: #475569; max-width: 250px; line-height: 1.4; margin: 0 auto; font-weight: 600; }
            ${wifiPass ? `.wifi-card { margin-top: 12px; padding: 8px 14px; background: #f1f5f9; border-radius: 10px; font-size: 10px; font-weight: 800; color: #1e293b; border: 1px dashed #cbd5e1; }` : ''}
            .footer { margin-top: 14px; font-size: 9px; font-weight: 800; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div>
            <div class="tag">Smart Stand NFC & QR</div>
            <h1 class="title">${businessName}</h1>
            <div class="subtitle">Atención Inteligente Inmediata</div>
          </div>

          <div>
            <div class="qr-box">
              <img src="${qrImg}" alt="QR" />
            </div>
            <div class="cta">Apunta tu cámara o acerca tu teléfono</div>
            <div class="instructions">Escanea este código para calificar nuestro servicio con 5 estrellas o consultar nuestro menú digital.</div>
            ${wifiPass ? `<div class="wifi-card">Red Wi-Fi Clientes • Clave: ${wifiPass}</div>` : ''}
          </div>

          <div class="footer">
            Sam Services Ecosystem
          </div>
        </body>
        </html>
      `;
    } else if (format === 'sticker') {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: 80mm 80mm; margin: 0; }
            body {
              margin: 0; padding: 10px;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              text-align: center; background: #ffffff; color: #000000;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              height: 100vh; box-sizing: border-box;
            }
            .title { font-size: 16px; font-weight: 900; margin-bottom: 2px; }
            .sub { font-size: 9px; font-weight: 800; color: #333; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; }
            .qr-img { width: 160px; height: 160px; display: block; border: 1.5px solid #000; border-radius: 12px; padding: 4px; }
            .footer { margin-top: 6px; font-size: 8px; font-weight: 800; color: #555; letter-spacing: 1px; }
          </style>
        </head>
        <body>
          <div class="title">${businessName}</div>
          <div class="sub">Escanea para Calificar</div>
          <img class="qr-img" src="${qrImg}" alt="QR" />
          <div class="footer">SAM SERVICES SMART QR</div>
        </body>
        </html>
      `;
    } else {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              margin: 0; padding: 14px 6px;
              font-family: "Courier New", Courier, monospace;
              text-align: center; color: #000000; background: #ffffff;
              width: 72mm; margin: 0 auto;
            }
            .header { font-size: 16px; font-weight: 900; margin-bottom: 4px; text-transform: uppercase; }
            .sep { border-top: 1px dashed #000; margin: 8px 0; }
            .msg { font-size: 12px; font-weight: 700; margin: 6px 0; }
            .qr { width: 170px; height: 170px; margin: 8px auto; display: block; }
            .url { font-size: 10px; word-break: break-all; margin: 6px 0; font-weight: bold; }
            .foot { font-size: 9px; margin-top: 10px; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">${businessName}</div>
          <div class="sep"></div>
          <div class="msg">CALIFICA TU EXPERIENCIA</div>
          <div style="font-size: 10px;">Apunta con la cámara de tu celular</div>
          <img class="qr" src="${qrImg}" alt="QR" />
          <div class="url">${qrUrl}</div>
          ${wifiPass ? `<div class="msg">Clave Wi-Fi: ${wifiPass}</div>` : ''}
          <div class="sep"></div>
          <div class="foot">POTENCIADO POR SAM SERVICES</div>
        </body>
        </html>
      `;
    }
  };

  const handleExecutePrint = async () => {
    try {
      setIsPrinting(true);
      const html = generatePrintHtml(printFormat, business?.name || 'Local', qrCanonicalUrl, wifiPassword);
      await Print.printAsync({ html });
      setShowPrintModal(false);
    } catch (e: any) {
      Alert.alert('Error de impresión', e?.message || 'No se pudo conectar con la impresora Wi-Fi.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSelectMode = (mode: number) => {
    if (mode === 1 && !isReviewsService) {
      Alert.alert('Módulo No Contratado', 'Tu plan contratado actual es Solo Menú. No incluye Google Reviews 5 Estrellas.');
      return;
    }
    if (mode === 2 && !isMenuService) {
      Alert.alert('Módulo No Contratado', 'Tu plan contratado actual es Solo Reseñas. No incluye Menú Digital.');
      return;
    }
    if (mode === 3 && !isHubService) {
      Alert.alert('Módulo No Contratado', 'El Smart Hub Multifuncional es una característica exclusiva del Pack Dual Pro.');
      return;
    }
    setActiveRoutingMode(mode);
  };

  if (isLoadingInitial && !business) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={MONIQ.cyan} />
        <Text style={styles.loadingText}>Sincronizando portal del negocio...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* HEADER DE BIENVENIDA DEL COMPRADOR */}
      <View style={styles.buyerHeader}>
        <View style={styles.buyerHeaderTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.buyerHeaderLogo}
              resizeMode="contain"
            />
            <Text style={styles.buyerPreTitle}>PORTAL CLIENTE SAM SERVICES</Text>
          </View>
          <View style={[styles.planBadge, isHubService ? styles.planBadgeDual : isReviewsService ? styles.planBadgeReviews : styles.planBadgeMenu]}>
            <ShieldCheck size={11} color={isHubService ? MONIQ.positive : isReviewsService ? MONIQ.gold : MONIQ.cyan} />
            <Text style={[styles.planBadgeText, { color: isHubService ? MONIQ.positive : isReviewsService ? MONIQ.gold : MONIQ.cyan }]}>
              {isHubService ? 'PACK DUAL' : isReviewsService ? 'SOLO RESEÑAS' : 'SOLO MENÚ'}
            </Text>
          </View>
        </View>
        <Text style={styles.buyerTitle}>{business?.name || 'Cargando local...'}</Text>
        <Text style={styles.buyerMeta}>{business?.city || 'Lima'} • {business?.address || 'Servicio Activo'}</Text>
      </View>

      {/* MÉTRICAS DE OPERACIÓN REAL */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { marginRight: 8 }]}>
          <CreditCard size={18} color={MONIQ.cyan} />
          <Text style={styles.metricVal}>{cards.length}</Text>
          <Text style={styles.metricSub}>Tarjetas en salón</Text>
        </View>

        <View style={[styles.metricCard, { marginLeft: 8 }]}>
          <Zap size={18} color={MONIQ.positive} />
          <Text style={styles.metricVal}>
            {cards.reduce((acc, curr) => acc + (curr.tapCount || 0), 0)}
          </Text>
          <Text style={styles.metricSub}>Taps registrados</Text>
        </View>
      </View>

      {/* SELECTOR DE MÓDULOS DE TRABAJO (CON CONTROL SEGÚN PLAN) */}
      <View style={styles.tabRow}>
        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'cards' && styles.tabBtnActive]}
          onPress={() => setActiveTab('cards')}
        >
          <Text style={[styles.tabText, activeTab === 'cards' && styles.tabTextActive]}>
            Tarjetas
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'qr' && styles.tabBtnActive]}
          onPress={() => setActiveTab('qr')}
        >
          <Text style={[styles.tabText, activeTab === 'qr' && styles.tabTextActive]}>
            QR Inteligente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabBtn, activeTab === 'routing' && styles.tabBtnActive]}
          onPress={() => setActiveTab('routing')}
        >
          <Text style={[styles.tabText, activeTab === 'routing' && styles.tabTextActive]}>
            Rutas
          </Text>
        </TouchableOpacity>

        {isMenuService && (
          <TouchableOpacity 
            style={[styles.tabBtn, activeTab === 'menu' && styles.tabBtnActive]}
            onPress={() => setActiveTab('menu')}
          >
            <Text style={[styles.tabText, activeTab === 'menu' && styles.tabTextActive]}>
              Carta
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* AVISO DE ACCIONES GUARDADAS */}
      {routingNotice && (
        <View style={[styles.noticeCard, routingNotice.isError ? styles.noticeError : styles.noticeSuccess]}>
          {routingNotice.isError ? (
            <AlertCircle size={16} color={MONIQ.negative} style={{ marginRight: 8 }} />
          ) : (
            <CheckCircle2 size={16} color={MONIQ.positive} style={{ marginRight: 8 }} />
          )}
          <Text style={[styles.noticeText, routingNotice.isError ? styles.noticeTextError : styles.noticeTextSuccess]}>
            {routingNotice.message}
          </Text>
        </View>
      )}

      {/* ========================================================================= */}
      {/* VISTA 1: LISTA LIMPIA DE TARJETAS DEL COMPRADOR                           */}
      {/* ========================================================================= */}
      {activeTab === 'cards' && (
        <View>
          <Text style={styles.sectionTitle}>Hardware Vinculado a tu Local</Text>
          <Text style={styles.sectionSubtitle}>
            Ubicación y estado de cada tarjeta física en salón
          </Text>

          {cards.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <CreditCard size={32} color={MONIQ.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyStateTitle}>Sin Tarjetas Asignadas</Text>
              <Text style={styles.emptyStateSub}>
                El administrador aún no ha vinculado tarjetas físicas a tu negocio.
              </Text>
            </View>
          ) : (
            cards.map((c) => (
              <View key={c.id} style={styles.cardItem}>
                <View style={styles.cardIconBox}>
                  <CreditCard size={18} color={MONIQ.cyan} />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.cardLabelText}>{c.label}</Text>
                  <Text style={styles.cardCodeText}>{c.cardCode} • {c.cardType}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.tapBadge}>{c.tapCount || 0} taps</Text>
                  <View style={styles.liveIndicator}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Activa</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: QR MULTIFUNCIONAL CON COMPARTIR E IMPRESIÓN WI-FI                */}
      {/* ========================================================================= */}
      {activeTab === 'qr' && (
        <View>
          <Text style={styles.sectionTitle}>QR Multifuncional Permanente</Text>
          <Text style={styles.sectionSubtitle}>
            Imprime este QR una sola vez. Cambia su destino en vivo cuando quieras.
          </Text>

          {/* CONTENEDOR DEL CÓDIGO QR */}
          <View style={styles.qrDisplayCard}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrCanonicalUrl}
                size={180}
                color="#0D0E13"
                backgroundColor="#FFFFFF"
                getRef={(c) => (qrSvgRef.current = c)}
              />
            </View>

            <View style={styles.canonicalBox}>
              <Text style={styles.canonicalLabel}>URL CANÓNICA PERMANENTE DEL QR:</Text>
              <Text style={styles.canonicalUrl} numberOfLines={1}>{qrCanonicalUrl}</Text>
            </View>

            <View style={styles.qrBadgeNotice}>
              <Text style={styles.qrBadgeNoticeText}>
                Este código QR impreso en tus mesas nunca cambiará. Solo debes elegir abajo qué acción realizará al escanearse.
              </Text>
            </View>

            {/* ACCIONES DEL QR: COPIAR Y PROBAR */}
            <View style={styles.qrActionBtnsRow}>
              <TouchableOpacity style={styles.copyQrBtn} onPress={handleCopyQrLink}>
                {copiedLink ? (
                  <>
                    <Check size={14} color={MONIQ.positive} style={{ marginRight: 4 }} />
                    <Text style={[styles.copyQrBtnText, { color: MONIQ.positive }]}>Enlace Copiado</Text>
                  </>
                ) : (
                  <>
                    <Copy size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.copyQrBtnText}>Copiar Enlace</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.testQrBtn} onPress={() => handleTestUrl(qrCanonicalUrl)}>
                <ExternalLink size={14} color="#0B0B0E" style={{ marginRight: 4 }} />
                <Text style={styles.testQrBtnText}>Probar Escaneo</Text>
              </TouchableOpacity>
            </View>

            {/* ACCIONES AVANZADAS: COMPARTIR E IMPRIMIR WI-FI */}
            <View style={[styles.qrActionBtnsRow, { marginTop: 8 }]}>
              <TouchableOpacity
                style={styles.shareQrBtn}
                onPress={handleShareQrImage}
                disabled={isSharingQr}
              >
                {isSharingQr ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Share2 size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.shareQrBtnText}>Compartir Imagen QR</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.printQrBtn} onPress={() => setShowPrintModal(true)}>
                <Printer size={14} color="#0B0B0E" style={{ marginRight: 6 }} />
                <Text style={styles.printQrBtnText}>Imprimir por Wi-Fi</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* SELECTOR DE MODO ACTIVO EN VIVO SEGÚN PLAN */}
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Selecciona el Modo Activo del QR</Text>
          <Text style={styles.sectionSubtitle}>
            Opciones habilitadas según el paquete contratado por tu empresa
          </Text>

          {/* MODO 1: RESEÑAS DIRECTAS */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              activeRoutingMode === 1 && styles.modeCardActiveReviews,
              !isReviewsService && styles.modeCardLocked
            ]}
            onPress={() => handleSelectMode(1)}
          >
            <View style={[styles.modeIconBox, { backgroundColor: isReviewsService ? 'rgba(255, 179, 64, 0.15)' : 'rgba(255, 255, 255, 0.05)' }]}>
              {isReviewsService ? <Star size={20} color={MONIQ.gold} /> : <Lock size={18} color={MONIQ.textMuted} />}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.modeCardTitle, !isReviewsService && styles.textLocked]}>
                  1. Reseñas 5 Estrellas Directas
                </Text>
                {activeRoutingMode === 1 && isReviewsService ? (
                  <View style={[styles.activePill, { borderColor: MONIQ.gold }]}>
                    <Text style={[styles.activePillText, { color: MONIQ.gold }]}>ACTIVO</Text>
                  </View>
                ) : !isReviewsService ? (
                  <View style={styles.lockedPill}>
                    <Text style={styles.lockedPillText}>NO CONTRATADO</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.modeCardDesc}>
                {isReviewsService
                  ? 'Abre inmediatamente Google Maps para calificar con 5 estrellas en 1 toque.'
                  : 'Este modo no está incluido en tu plan actual (Solo Menú).'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* MODO 2: MENÚ DIGITAL DIRECTO */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              activeRoutingMode === 2 && styles.modeCardActiveMenu,
              !isMenuService && styles.modeCardLocked,
              { marginTop: 10 }
            ]}
            onPress={() => handleSelectMode(2)}
          >
            <View style={[styles.modeIconBox, { backgroundColor: isMenuService ? 'rgba(0, 229, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)' }]}>
              {isMenuService ? <Utensils size={20} color={MONIQ.cyan} /> : <Lock size={18} color={MONIQ.textMuted} />}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.modeCardTitle, !isMenuService && styles.textLocked]}>
                  2. Menú Digital & Carta
                </Text>
                {activeRoutingMode === 2 && isMenuService ? (
                  <View style={[styles.activePill, { borderColor: MONIQ.cyan }]}>
                    <Text style={[styles.activePillText, { color: MONIQ.cyan }]}>ACTIVO</Text>
                  </View>
                ) : !isMenuService ? (
                  <View style={styles.lockedPill}>
                    <Text style={styles.lockedPillText}>PLAN SOLO RESEÑAS</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.modeCardDesc}>
                {isMenuService
                  ? 'Abre directamente tu carta digital con platos y precios, o tu página web externa.'
                  : 'Este modo no está incluido en tu plan actual (Solo Reseñas).'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* MODO 3: SMART HUB MULTIFUNCIONAL */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              activeRoutingMode === 3 && styles.modeCardActiveHub,
              !isHubService && styles.modeCardLocked,
              { marginTop: 10 }
            ]}
            onPress={() => handleSelectMode(3)}
          >
            <View style={[styles.modeIconBox, { backgroundColor: isHubService ? 'rgba(53, 201, 154, 0.15)' : 'rgba(255, 255, 255, 0.05)' }]}>
              {isHubService ? <Layers size={20} color={MONIQ.positive} /> : <Lock size={18} color={MONIQ.textMuted} />}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.modeCardTitle, !isHubService && styles.textLocked]}>
                  3. Smart Hub Multifuncional
                </Text>
                {activeRoutingMode === 3 && isHubService ? (
                  <View style={[styles.activePill, { borderColor: MONIQ.positive }]}>
                    <Text style={[styles.activePillText, { color: MONIQ.positive }]}>ACTIVO</Text>
                  </View>
                ) : !isHubService ? (
                  <View style={styles.lockedPill}>
                    <Text style={styles.lockedPillText}>PACK DUAL REQUERIDO</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.modeCardDesc}>
                {isHubService
                  ? 'Abre un portal rápido con botones para Reseñas Google + Menú Digital + WhatsApp + Clave Wi-Fi.'
                  : 'Disponible exclusivamente para planes con Pack Dual (Menú + Reviews).'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* BOTÓN PARA APLICAR CAMBIOS */}
          <TouchableOpacity
            style={[styles.saveRoutingBtn, { marginTop: 18 }]}
            onPress={() => handleSaveRouting()}
            disabled={savingRouting}
          >
            {savingRouting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveRoutingBtnText}>Aplicar Modo al QR y Tarjetas</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: CONFIGURACIÓN DETALLADA DE ENLACES CON FEATURE GATING             */}
      {/* ========================================================================= */}
      {activeTab === 'routing' && (
        <View>
          <Text style={styles.sectionTitle}>Configuración de Destinos</Text>
          <Text style={styles.sectionSubtitle}>
            Modifica las rutas autorizadas según tu paquete contratado
          </Text>

          {/* BLOQUE GOOGLE REVIEWS */}
          <View style={[styles.routingCard, !isReviewsService && styles.routingCardLocked]}>
            <View style={styles.routingCardHeader}>
              <View style={[styles.routingIconBox, { backgroundColor: isReviewsService ? 'rgba(255, 179, 64, 0.12)' : 'rgba(255, 255, 255, 0.05)' }]}>
                {isReviewsService ? <Star size={18} color={MONIQ.gold} /> : <Lock size={18} color={MONIQ.textMuted} />}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.routingCardTitle}>DESTINO GOOGLE REVIEWS</Text>
                  <View style={[styles.planStatusPill, isReviewsService ? styles.planStatusActiveReviews : styles.planStatusLocked]}>
                    <Text style={[styles.planStatusText, { color: isReviewsService ? MONIQ.gold : MONIQ.textMuted }]}>
                      {isReviewsService ? 'ACTIVO EN TU PLAN' : 'BLOQUEADO: SOLO MENÚ'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.routingCardSub}>Ruta directa a Google Maps para 5 estrellas</Text>
              </View>
            </View>

            {isReviewsService ? (
              <>
                <Text style={styles.routingInputLabel}>URL DIRECTA DE RESEÑA (GOOGLE MAPS)</Text>
                <TextInput
                  style={styles.routingTextInput}
                  value={googleMapsUrl}
                  onChangeText={setGoogleMapsUrl}
                  placeholder="https://g.page/r/.../review o link de Google Maps"
                  placeholderTextColor={MONIQ.textMuted}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={styles.routingHelpText}>
                  Enlace que abre la ventana de 5 estrellas en el celular del cliente.
                </Text>

                <Text style={[styles.routingInputLabel, { marginTop: 14 }]}>MODO DE REDIRECCIÓN DE RESEÑAS</Text>
                <View style={styles.redirectOptionRow}>
                  <TouchableOpacity
                    style={[styles.redirectOption, autoRedirectReviews && styles.redirectOptionActive]}
                    onPress={() => setAutoRedirectReviews(true)}
                  >
                    <Text style={[styles.redirectOptionText, autoRedirectReviews && styles.redirectOptionTextActive]}>
                      Instantánea (0ms) a 5 Estrellas
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.redirectOption, !autoRedirectReviews && styles.redirectOptionActive]}
                    onPress={() => setAutoRedirectReviews(false)}
                  >
                    <Text style={[styles.redirectOptionText, !autoRedirectReviews && styles.redirectOptionTextActive]}>
                      Pantalla Intermedia con Logo
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.testLinkBtn}
                  onPress={() => handleTestUrl(googleMapsUrl)}
                >
                  <ExternalLink size={14} color={MONIQ.gold} style={{ marginRight: 6 }} />
                  <Text style={styles.testLinkBtnText}>Probar Enlace de Reseñas en Navegador</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.lockedBlockMessage}>
                <Lock size={16} color={MONIQ.textMuted} style={{ marginRight: 8 }} />
                <Text style={styles.lockedBlockText}>
                  Tu plan contratado actual es Solo Menú Digital. La configuración de reseñas de Google está restringida.
                </Text>
              </View>
            )}
          </View>

          {/* BLOQUE MENÚ DIGITAL */}
          <View style={[styles.routingCard, !isMenuService && styles.routingCardLocked, { marginTop: 16 }]}>
            <View style={styles.routingCardHeader}>
              <View style={[styles.routingIconBox, { backgroundColor: isMenuService ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 255, 255, 0.05)' }]}>
                {isMenuService ? <Globe size={18} color={MONIQ.cyan} /> : <Lock size={18} color={MONIQ.textMuted} />}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.routingCardTitle}>DESTINO MENÚ DIGITAL</Text>
                  <View style={[styles.planStatusPill, isMenuService ? styles.planStatusActiveMenu : styles.planStatusLocked]}>
                    <Text style={[styles.planStatusText, { color: isMenuService ? MONIQ.cyan : MONIQ.textMuted }]}>
                      {isMenuService ? 'ACTIVO EN TU PLAN' : 'BLOQUEADO: SOLO RESEÑAS'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.routingCardSub}>Ruta de la carta interactiva y pedidos</Text>
              </View>
            </View>

            {isMenuService ? (
              <>
                <View style={styles.canonicalBox}>
                  <Text style={styles.canonicalLabel}>Ruta Nativa en Plataforma Sam Services:</Text>
                  <Text style={styles.canonicalUrl}>
                    {ENV.getMenuUrl(business?.slug || 'menu')}
                  </Text>
                </View>

                <Text style={[styles.routingInputLabel, { marginTop: 14 }]}>
                  DOMINIO O ENLACE WEB PROPIO (OPCIONAL)
                </Text>
                <TextInput
                  style={styles.routingTextInput}
                  value={customDomain}
                  onChangeText={setCustomDomain}
                  placeholder="Ej. https://facisac.pe/carta (dejar vacío para usar ruta nativa)"
                  placeholderTextColor={MONIQ.textMuted}
                  autoCapitalize="none"
                  keyboardType="url"
                />
                <Text style={styles.routingHelpText}>
                  Si dejas este campo vacío, la tarjeta abrirá tu menú en Sam Services. Si colocas un enlace, se redirigirá a tu sitio web.
                </Text>

                <TouchableOpacity
                  style={styles.testLinkBtn}
                  onPress={() => handleTestUrl(customDomain || ENV.getMenuUrl(business?.slug || 'menu'))}
                >
                  <ExternalLink size={14} color={MONIQ.cyan} style={{ marginRight: 6 }} />
                  <Text style={[styles.testLinkBtnText, { color: MONIQ.cyan }]}>
                    Probar Menú Digital en Navegador
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.lockedBlockMessage}>
                <Lock size={16} color={MONIQ.textMuted} style={{ marginRight: 8 }} />
                <Text style={styles.lockedBlockText}>
                  Tu plan contratado actual es Solo Reseñas 5 Estrellas. El módulo de Menú Digital está restringido.
                </Text>
              </View>
            )}
          </View>

          {/* BLOQUE WI-FI DEL ESTABLECIMIENTO */}
          <View style={[styles.routingCard, !isHubService && styles.routingCardLocked, { marginTop: 16 }]}>
            <View style={styles.routingCardHeader}>
              <View style={[styles.routingIconBox, { backgroundColor: isHubService ? 'rgba(53, 201, 154, 0.12)' : 'rgba(255, 255, 255, 0.05)' }]}>
                {isHubService ? <Wifi size={18} color={MONIQ.positive} /> : <Lock size={18} color={MONIQ.textMuted} />}
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.routingCardTitle}>WI-FI PARA CLIENTES</Text>
                  <View style={[styles.planStatusPill, isHubService ? styles.planStatusActiveHub : styles.planStatusLocked]}>
                    <Text style={[styles.planStatusText, { color: isHubService ? MONIQ.positive : MONIQ.textMuted }]}>
                      {isHubService ? 'ACTIVO EN SMART HUB' : 'EXCLUSIVO PACK DUAL'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.routingCardSub}>Visible en el Smart Hub con botón de copia rápida</Text>
              </View>
            </View>

            {isHubService ? (
              <>
                <Text style={styles.routingInputLabel}>CLAVE WI-FI DEL ESTABLECIMIENTO</Text>
                <TextInput
                  style={styles.routingTextInput}
                  value={wifiPassword}
                  onChangeText={setWifiPassword}
                  placeholder="Ej. ClaveLocal2026! (o dejar vacío)"
                  placeholderTextColor={MONIQ.textMuted}
                  autoCapitalize="none"
                />
              </>
            ) : (
              <View style={styles.lockedBlockMessage}>
                <Lock size={16} color={MONIQ.textMuted} style={{ marginRight: 8 }} />
                <Text style={styles.lockedBlockText}>
                  La sincronización de clave Wi-Fi está habilitada únicamente para clientes con Smart Hub (Pack Dual).
                </Text>
              </View>
            )}
          </View>

          {/* BOTÓN PRINCIPAL DE GUARDAR */}
          <TouchableOpacity
            style={styles.saveRoutingBtn}
            onPress={() => handleSaveRouting()}
            disabled={savingRouting}
          >
            {savingRouting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Save size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveRoutingBtnText}>Guardar Rutas Autorizadas</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: GESTIÓN DE CARTA (SOLO SI CONTRATÓ MENÚ)                         */}
      {/* ========================================================================= */}
      {activeTab === 'menu' && isMenuService && (
        <View>
          <Text style={styles.sectionTitle}>Control de Precios & Carta</Text>
          <Text style={styles.sectionSubtitle}>
            Toca sobre un plato para marcarlo como agotado o disponible
          </Text>

          {categories.length === 0 ? (
            <View style={styles.emptyStateBox}>
              <Utensils size={32} color={MONIQ.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyStateTitle}>Sin Categorías ni Platos</Text>
              <Text style={styles.emptyStateSub}>
                Tu menú aún no tiene productos registrados en la carta.
              </Text>
            </View>
          ) : (
            categories.map((cat) => (
              <View key={cat.id} style={styles.categoryBlock}>
                <Text style={styles.categoryTitleText}>{cat.name.toUpperCase()}</Text>

                {cat.dishes?.map((dish: any) => (
                  <View key={dish.id} style={styles.dishCard}>
                    <View style={styles.dishIcon}>
                      <Utensils size={18} color={MONIQ.textSecondary} />
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.dishName}>{dish.name}</Text>
                      <Text style={styles.dishPrice}>S/ {dish.price?.toFixed(2)}</Text>
                    </View>

                    <TouchableOpacity 
                      style={[styles.dishBadge, dish.isAvailable ? styles.dishAvail : styles.dishSoldOut]}
                      onPress={() => handleToggleDish(dish.id)}
                    >
                      <Text style={[styles.dishBadgeText, dish.isAvailable ? styles.dishAvailText : styles.dishSoldOutText]}>
                        {dish.isAvailable ? 'Disponible' : 'Agotado'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>
      )}

      {/* MODAL DE IMPRESIÓN INALÁMBRICA WI-FI */}
      <Modal
        visible={showPrintModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPrintModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.printModalCard}>
            <View style={styles.printModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Printer size={18} color={MONIQ.cyan} />
                <Text style={styles.printModalTitle}>Impresión Inalámbrica Wi-Fi</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPrintModal(false)} style={{ padding: 4 }}>
                <X size={18} color={MONIQ.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.printModalSubtitle}>
              Selecciona el formato de impresión para stands de mesa, stickers o tickets:
            </Text>

            {/* SELECTOR DE FORMATO */}
            <View style={styles.formatSelectorCol}>
              <TouchableOpacity
                style={[styles.formatOptionCard, printFormat === 'stand' && styles.formatOptionActive]}
                onPress={() => setPrintFormat('stand')}
              >
                <View style={styles.formatOptionTop}>
                  <FileText size={16} color={printFormat === 'stand' ? MONIQ.cyan : MONIQ.textSecondary} />
                  <Text style={[styles.formatOptionTitle, printFormat === 'stand' && styles.formatOptionTitleActive]}>
                    Stand de Mesa / Acrílico A6
                  </Text>
                </View>
                <Text style={styles.formatOptionDesc}>105 x 148 mm • Ideal para portafotos o soportes acrílicos de salón.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatOptionCard, printFormat === 'sticker' && styles.formatOptionActive, { marginTop: 8 }]}
                onPress={() => setPrintFormat('sticker')}
              >
                <View style={styles.formatOptionTop}>
                  <QrCode size={16} color={printFormat === 'sticker' ? MONIQ.cyan : MONIQ.textSecondary} />
                  <Text style={[styles.formatOptionTitle, printFormat === 'sticker' && styles.formatOptionTitleActive]}>
                    Sticker Cuadrado de Mostrador
                  </Text>
                </View>
                <Text style={styles.formatOptionDesc}>80 x 80 mm • Formato compacto para pegar en caja, barra o vitrina.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formatOptionCard, printFormat === 'thermal' && styles.formatOptionActive, { marginTop: 8 }]}
                onPress={() => setPrintFormat('thermal')}
              >
                <View style={styles.formatOptionTop}>
                  <Printer size={16} color={printFormat === 'thermal' ? MONIQ.cyan : MONIQ.textSecondary} />
                  <Text style={[styles.formatOptionTitle, printFormat === 'thermal' && styles.formatOptionTitleActive]}>
                    Ticket Térmico POS (80mm)
                  </Text>
                </View>
                <Text style={styles.formatOptionDesc}>80 mm ancho • Diseñado para impresoras térmicas de red o comandas.</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.printNoticeBanner}>
              <Text style={styles.printNoticeText}>
                Al tocar 'Enviar a Impresora', se abrirá el administrador de impresión de Android / Apple AirPrint que buscará automáticamente las impresoras conectadas a tu red Wi-Fi.
              </Text>
            </View>

            <View style={styles.printModalActions}>
              <TouchableOpacity
                style={styles.cancelPrintBtn}
                onPress={() => setShowPrintModal(false)}
                disabled={isPrinting}
              >
                <Text style={styles.cancelPrintBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.executePrintBtn}
                onPress={handleExecutePrint}
                disabled={isPrinting}
              >
                {isPrinting ? (
                  <ActivityIndicator size="small" color="#0B0B0E" />
                ) : (
                  <>
                    <Printer size={15} color="#0B0B0E" style={{ marginRight: 6 }} />
                    <Text style={styles.executePrintBtnText}>Enviar a Impresora</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100
  },
  loadingText: {
    color: MONIQ.cyan,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14
  },
  buyerHeader: {
    marginBottom: 20
  },
  buyerHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  buyerHeaderLogo: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8
  },
  buyerPreTitle: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1
  },
  planBadgeReviews: {
    backgroundColor: 'rgba(255, 179, 64, 0.12)',
    borderColor: 'rgba(255, 179, 64, 0.4)'
  },
  planBadgeMenu: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: 'rgba(0, 229, 255, 0.4)'
  },
  planBadgeDual: {
    backgroundColor: 'rgba(53, 201, 154, 0.12)',
    borderColor: 'rgba(53, 201, 154, 0.4)'
  },
  planBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8
  },
  buyerTitle: {
    color: MONIQ.textPrimary,
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2
  },
  buyerMeta: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 20
  },
  metricCard: {
    flex: 1,
    backgroundColor: MONIQ.surface,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  metricVal: {
    color: MONIQ.textPrimary,
    fontSize: 24,
    fontWeight: '900',
    marginTop: 8
  },
  metricSub: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: MONIQ.surface,
    padding: 4,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10
  },
  tabBtnActive: {
    backgroundColor: MONIQ.surfaceElevated
  },
  tabText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  sectionTitle: {
    color: MONIQ.textPrimary,
    fontSize: 16,
    fontWeight: '900'
  },
  sectionSubtitle: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  cardIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: MONIQ.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cardLabelText: {
    color: MONIQ.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  cardCodeText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  tapBadge: {
    color: MONIQ.positive,
    fontSize: 13,
    fontWeight: '800'
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MONIQ.positive,
    marginRight: 4
  },
  liveText: {
    color: MONIQ.positive,
    fontSize: 10,
    fontWeight: '700'
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1
  },
  noticeSuccess: {
    backgroundColor: 'rgba(53, 201, 154, 0.1)',
    borderColor: 'rgba(53, 201, 154, 0.3)'
  },
  noticeError: {
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    borderColor: 'rgba(255, 77, 106, 0.3)'
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700'
  },
  noticeTextSuccess: {
    color: MONIQ.positive
  },
  noticeTextError: {
    color: MONIQ.negative
  },

  // QR MULTIFUNCIONAL
  qrDisplayCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  qrWrapper: {
    padding: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 16
  },
  canonicalBox: {
    width: '100%',
    backgroundColor: MONIQ.bg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  canonicalLabel: {
    color: MONIQ.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2
  },
  canonicalUrl: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700'
  },
  qrBadgeNotice: {
    backgroundColor: MONIQ.bg,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginTop: 10,
    marginBottom: 14
  },
  qrBadgeNoticeText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16
  },
  qrActionBtnsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  },
  copyQrBtn: {
    flex: 1,
    backgroundColor: MONIQ.surfaceElevated,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  copyQrBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  testQrBtn: {
    flex: 1,
    backgroundColor: MONIQ.cyan,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  testQrBtnText: {
    color: '#0B0B0E',
    fontSize: 12,
    fontWeight: '800'
  },
  shareQrBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  shareQrBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  printQrBtn: {
    flex: 1,
    backgroundColor: MONIQ.positive,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  printQrBtnText: {
    color: '#0B0B0E',
    fontSize: 12,
    fontWeight: '800'
  },

  // MODOS DE ENRUTAMIENTO
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  modeCardLocked: {
    opacity: 0.45,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  textLocked: {
    color: MONIQ.textMuted
  },
  modeCardActiveReviews: {
    borderColor: MONIQ.gold,
    backgroundColor: 'rgba(255, 179, 64, 0.08)'
  },
  modeCardActiveMenu: {
    borderColor: MONIQ.cyan,
    backgroundColor: 'rgba(0, 229, 255, 0.08)'
  },
  modeCardActiveHub: {
    borderColor: MONIQ.positive,
    backgroundColor: 'rgba(53, 201, 154, 0.08)'
  },
  modeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modeCardTitle: {
    color: MONIQ.textPrimary,
    fontSize: 13,
    fontWeight: '800'
  },
  modeCardDesc: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '800'
  },
  lockedPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)'
  },
  lockedPillText: {
    color: MONIQ.textMuted,
    fontSize: 8,
    fontWeight: '800'
  },

  // RUTAS Y ENLACES
  routingCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  routingCardLocked: {
    backgroundColor: '#0E111A',
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },
  routingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  routingIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  routingCardTitle: {
    color: MONIQ.textPrimary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  routingCardSub: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  planStatusPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1
  },
  planStatusActiveReviews: {
    borderColor: 'rgba(255, 179, 64, 0.3)',
    backgroundColor: 'rgba(255, 179, 64, 0.08)'
  },
  planStatusActiveMenu: {
    borderColor: 'rgba(0, 229, 255, 0.3)',
    backgroundColor: 'rgba(0, 229, 255, 0.08)'
  },
  planStatusActiveHub: {
    borderColor: 'rgba(53, 201, 154, 0.3)',
    backgroundColor: 'rgba(53, 201, 154, 0.08)'
  },
  planStatusLocked: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)'
  },
  planStatusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  lockedBlockMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.bg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  lockedBlockText: {
    flex: 1,
    color: MONIQ.textMuted,
    fontSize: 11,
    lineHeight: 16
  },
  routingInputLabel: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6
  },
  routingTextInput: {
    height: 48,
    backgroundColor: MONIQ.bg,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: MONIQ.textPrimary,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    fontSize: 13
  },
  routingHelpText: {
    color: MONIQ.textMuted,
    fontSize: 11,
    marginTop: 6
  },
  redirectOptionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  redirectOption: {
    flex: 1,
    backgroundColor: MONIQ.bg,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    alignItems: 'center'
  },
  redirectOptionActive: {
    borderColor: MONIQ.gold,
    backgroundColor: 'rgba(255, 179, 64, 0.08)'
  },
  redirectOptionText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center'
  },
  redirectOptionTextActive: {
    color: MONIQ.gold
  },
  testLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingVertical: 10,
    backgroundColor: MONIQ.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  testLinkBtnText: {
    color: MONIQ.gold,
    fontSize: 12,
    fontWeight: '700'
  },
  saveRoutingBtn: {
    backgroundColor: MONIQ.accent,
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  saveRoutingBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },

  // CARTA Y MENÚ
  emptyStateBox: {
    backgroundColor: MONIQ.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  emptyStateTitle: {
    color: MONIQ.textPrimary,
    fontSize: 15,
    fontWeight: '800'
  },
  emptyStateSub: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4
  },
  categoryBlock: {
    marginBottom: 20
  },
  categoryTitleText: {
    color: MONIQ.cyan,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10
  },
  dishCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.surface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  dishIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: MONIQ.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center'
  },
  dishName: {
    color: MONIQ.textPrimary,
    fontSize: 14,
    fontWeight: '700'
  },
  dishPrice: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    marginTop: 2
  },
  dishBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1
  },
  dishAvail: {
    backgroundColor: 'rgba(53, 201, 154, 0.1)',
    borderColor: 'rgba(53, 201, 154, 0.3)'
  },
  dishSoldOut: {
    backgroundColor: 'rgba(255, 77, 106, 0.1)',
    borderColor: 'rgba(255, 77, 106, 0.3)'
  },
  dishBadgeText: {
    fontSize: 11,
    fontWeight: '800'
  },
  dishAvailText: {
    color: MONIQ.positive
  },
  dishSoldOutText: {
    color: MONIQ.negative
  },

  // MODAL IMPRESIÓN WI-FI
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  printModalCard: {
    width: '100%',
    backgroundColor: '#121622',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  printModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  printModalTitle: {
    color: '#F0F4FC',
    fontSize: 16,
    fontWeight: '900'
  },
  printModalSubtitle: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginBottom: 16,
    lineHeight: 16
  },
  formatSelectorCol: {
    gap: 8,
    marginBottom: 14
  },
  formatOptionCard: {
    backgroundColor: '#090B10',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  formatOptionActive: {
    borderColor: MONIQ.cyan,
    backgroundColor: 'rgba(0, 229, 255, 0.08)'
  },
  formatOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  formatOptionTitle: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '800'
  },
  formatOptionTitleActive: {
    color: '#FFFFFF'
  },
  formatOptionDesc: {
    color: MONIQ.textMuted,
    fontSize: 10,
    lineHeight: 14,
    marginLeft: 24
  },
  printNoticeBanner: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    marginBottom: 16
  },
  printNoticeText: {
    color: '#93C5FD',
    fontSize: 10,
    lineHeight: 14
  },
  printModalActions: {
    flexDirection: 'row',
    gap: 10
  },
  cancelPrintBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1E2536',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelPrintBtnText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  executePrintBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: MONIQ.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  executePrintBtnText: {
    color: '#0B0B0E',
    fontSize: 12,
    fontWeight: '900'
  }
});
