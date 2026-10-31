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
  Image,
  Dimensions
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
  Globe,
  Copy,
  ExternalLink,
  Printer,
  Share2,
  Check,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ChevronRight,
  Wifi,
  Sparkles,
  RefreshCw,
  QrCode,
  ShieldCheck,
  X
} from 'lucide-react-native';
import { MONIQ } from '../../theme/colors';
import { api } from '../../services/api';
import { ENV } from '../../config/env';
import { UpdateService } from '../../services/updateService';

const { width } = Dimensions.get('window');

interface BuyerPortalScreenProps {
  businessId: number;
}

export const BuyerPortalScreen: React.FC<BuyerPortalScreenProps> = ({ businessId }) => {
  const [business, setBusiness] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'cards' | 'routing' | 'qr' | 'menu'>('cards');
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Estados del enrutamiento directo (0ms)
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [activeRoutingMode, setActiveRoutingMode] = useState<number>(1); // 1: Reseñas, 2: Carta
  const [wifiPassword, setWifiPassword] = useState('');
  const [savingRouting, setSavingRouting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [routingNotice, setRoutingNotice] = useState<{ message: string; isError: boolean } | null>(null);

  // Modal de Impresión
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFormat, setPrintFormat] = useState<'stand' | 'sticker' | 'thermal'>('stand');
  const [isPrinting, setIsPrinting] = useState(false);

  // Modal QR de Tarjeta Individual
  const [selectedCardForQr, setSelectedCardForQr] = useState<any>(null);

  // Referencias para QR e imágenes
  const qrSvgRef = useRef<any>(null);
  const [isSharingQr, setIsSharingQr] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, [businessId]);

  const loadPortalData = async () => {
    try {
      setIsLoadingInitial(true);
      const [bizData, cardsData, menuData] = await Promise.all([
        api.getBusinessById(businessId),
        api.getCardsByBusiness(businessId),
        api.getMenuByBusiness(businessId)
      ]);

      if (bizData) {
        setBusiness(bizData);
        setGoogleMapsUrl(bizData.googleMapsUrl || '');
        setCustomDomain(bizData.customDomain || '');
        // El modo activo es estrictamente directo: 1 (Reseñas) o 2 (Carta)
        setActiveRoutingMode(bizData.activeRoutingMode === 2 ? 2 : 1);
        setWifiPassword(bizData.wifiPassword || '');
      }
      if (cardsData) setCards(cardsData);
      if (menuData && menuData.categories) setCategories(menuData.categories);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudieron sincronizar los datos del local.');
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const handleToggleDish = async (dishId: number) => {
    try {
      setCategories(prev =>
        prev.map(cat => ({
          ...cat,
          dishes: cat.dishes.map((d: any) =>
            d.id === dishId ? { ...d, isAvailable: !d.isAvailable } : d
          )
        }))
      );
      await api.toggleDish(dishId);
    } catch (e: any) {
      Alert.alert('Error', 'No se pudo actualizar el estado del platillo.');
      loadPortalData();
    }
  };

  const handleSaveRouting = async (overrideMode?: number) => {
    try {
      setSavingRouting(true);
      setRoutingNotice(null);
      const modeToSave = overrideMode !== undefined ? overrideMode : activeRoutingMode;

      const res = await api.updateBusinessRouting(businessId, {
        googleMapsUrl: googleMapsUrl.trim(),
        autoRedirectReviews: true,
        customDomain: customDomain.trim(),
        activeRoutingMode: modeToSave,
        wifiPassword: wifiPassword.trim()
      });

      if (res.success) {
        setActiveRoutingMode(modeToSave);
        setRoutingNotice({
          message: 'Destino directo guardado. Todos los taps redirigirán instantáneamente.',
          isError: false
        });
        if (business) {
          setBusiness({
            ...business,
            googleMapsUrl: googleMapsUrl.trim(),
            customDomain: customDomain.trim(),
            activeRoutingMode: modeToSave,
            wifiPassword: wifiPassword.trim()
          });
        }
      } else {
        setRoutingNotice({
          message: res.error || 'No se pudo guardar la configuración.',
          isError: true
        });
      }
    } catch (err: any) {
      setRoutingNotice({
        message: err?.message || 'Error de conexión con el servidor.',
        isError: true
      });
    } finally {
      setSavingRouting(false);
    }
  };

  const handleTestUrl = (url: string) => {
    if (!url) return;
    const finalUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    Linking.openURL(finalUrl).catch(() => {
      Alert.alert('Error al abrir enlace', 'Comprueba que la URL ingresada sea válida.');
    });
  };

  const handleCopyQrLink = async () => {
    const qrUrl = ENV.getQrUrl(business?.slug || 'qr');
    await Clipboard.setStringAsync(qrUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShareQrImage = async () => {
    if (!qrSvgRef.current) return;
    try {
      setIsSharingQr(true);
      qrSvgRef.current.toDataURL(async (data: string) => {
        try {
          const filePath = `${FileSystem.cacheDirectory}qr_${business?.slug || 'codigo'}.png`;
          await FileSystem.writeAsStringAsync(filePath, data, {
            encoding: FileSystem.EncodingType.Base64
          });
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(filePath, {
              mimeType: 'image/png',
              dialogTitle: `Código QR - ${business?.name || 'Local'}`
            });
          } else {
            Alert.alert('Compartir no disponible', 'La función de compartir no está activa en este teléfono.');
          }
        } catch (err: any) {
          Alert.alert('Error al exportar imagen', err?.message || 'No se pudo generar la imagen del código QR.');
        } finally {
          setIsSharingQr(false);
        }
      });
    } catch (e: any) {
      setIsSharingQr(false);
      Alert.alert('Error', e?.message || 'Error al preparar la imagen QR.');
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
            <div class="tag">Atencion Inmediata</div>
            <h1 class="title">${businessName}</h1>
            <div class="subtitle">Apunta tu camara o acerca tu telefono</div>
          </div>
          <div>
            <div class="qr-box">
              <img src="${qrImg}" alt="QR" />
            </div>
            <div class="cta">Califica tu Experiencia o Consulta Carta</div>
            <div class="instructions">Acceso instantaneo de alta velocidad</div>
            ${wifiPass ? `<div class="wifi-card">Red Wi-Fi Clientes: ${wifiPass}</div>` : ''}
          </div>
          <div class="footer">Soporte Inteligente en Sala</div>
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
          <div class="sub">Acerca tu Telefono o Escanea</div>
          <img class="qr-img" src="${qrImg}" alt="QR" />
          <div class="footer">Tarjetas NFC & QR Inteligente</div>
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
          <div style="font-size: 10px;">Apunta con la camara de tu celular</div>
          <img class="qr" src="${qrImg}" alt="QR" />
          <div class="url">${qrUrl}</div>
          ${wifiPass ? `<div class="msg">Clave Wi-Fi: ${wifiPass}</div>` : ''}
          <div class="sep"></div>
          <div class="foot">Acceso Directo Inteligente</div>
        </body>
        </html>
      `;
    }
  };

  const handleExecutePrint = async () => {
    try {
      setIsPrinting(true);
      const qrUrl = ENV.getQrUrl(business?.slug || 'qr');
      const html = generatePrintHtml(printFormat, business?.name || 'Local', qrUrl, wifiPassword);
      await Print.printAsync({ html });
      setShowPrintModal(false);
    } catch (e: any) {
      Alert.alert('Error de impresión', e?.message || 'No se pudo conectar con la impresora.');
    } finally {
      setIsPrinting(false);
    }
  };

  const qrCanonicalUrl = ENV.getQrUrl(business?.slug || 'qr');

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
      
      {/* CABECERA ERGONÓMICA DEL CLIENTE */}
      <View style={styles.buyerHeader}>
        <View style={styles.buyerHeaderTop}>
          <View style={styles.buyerHeaderLeft}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {(business?.name || 'Local').substring(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.buyerTitle}>{business?.name || 'Mi Establecimiento'}</Text>
              <Text style={styles.buyerMeta}>{business?.city || 'Lima'} • Servicio Activo</Text>
            </View>
          </View>

          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>Activo</Text>
          </View>
        </View>

        {/* METRICAS PRINCIPALES */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <CreditCard size={18} color={MONIQ.cyan} />
            <Text style={styles.metricVal}>{cards.length}</Text>
            <Text style={styles.metricSub}>Tarjetas en sala</Text>
          </View>

          <View style={styles.metricCard}>
            <Zap size={18} color={MONIQ.positive} />
            <Text style={styles.metricVal}>
              {cards.reduce((acc, curr) => acc + (curr.tapCount || 0), 0)}
            </Text>
            <Text style={styles.metricSub}>Lecturas totales</Text>
          </View>

          <View style={styles.metricCard}>
            <Star size={18} color={MONIQ.gold} />
            <Text style={[styles.metricVal, { color: MONIQ.gold }]}>
              {activeRoutingMode === 1 ? 'Reseñas' : 'Menú'}
            </Text>
            <Text style={styles.metricSub}>Destino activo</Text>
          </View>
        </View>
      </View>

      {/* SELECTOR SEGMENTADO HORIZONTAL ESTILO IPHONE (SIN DESBORDAMIENTOS) */}
      <View style={styles.tabScrollWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'cards' && styles.tabPillActive]}
            onPress={() => setActiveTab('cards')}
            activeOpacity={0.8}
          >
            <CreditCard size={15} color={activeTab === 'cards' ? '#FFFFFF' : MONIQ.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.tabPillText, activeTab === 'cards' && styles.tabPillTextActive]}>
              Tarjetas ({cards.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'routing' && styles.tabPillActive]}
            onPress={() => setActiveTab('routing')}
            activeOpacity={0.8}
          >
            <Sliders size={15} color={activeTab === 'routing' ? '#FFFFFF' : MONIQ.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.tabPillText, activeTab === 'routing' && styles.tabPillTextActive]}>
              Enlaces Directos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'qr' && styles.tabPillActive]}
            onPress={() => setActiveTab('qr')}
            activeOpacity={0.8}
          >
            <QrCode size={15} color={activeTab === 'qr' ? '#FFFFFF' : MONIQ.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.tabPillText, activeTab === 'qr' && styles.tabPillTextActive]}>
              Imprimir QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'menu' && styles.tabPillActive]}
            onPress={() => setActiveTab('menu')}
            activeOpacity={0.8}
          >
            <Utensils size={15} color={activeTab === 'menu' ? '#FFFFFF' : MONIQ.textSecondary} style={{ marginRight: 6 }} />
            <Text style={[styles.tabPillText, activeTab === 'menu' && styles.tabPillTextActive]}>
              Carta Digital
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* NOTIFICACION DE ACCION */}
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

      {/* ===================================================================== */}
      {/* PESTAÑA 1: TARJETAS EN SALÓN CON CONTROL DIRECTO                     */}
      {/* ===================================================================== */}
      {activeTab === 'cards' && (
        <View>
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionTitle}>Tarjetas Físicas en Salón</Text>
            <Text style={styles.sectionSubtitle}>
              Cada tarjeta redirige directamente al destino configurado sin pantallas intermedias.
            </Text>
          </View>

          {cards.length === 0 ? (
            <View style={styles.emptyCardBox}>
              <CreditCard size={32} color={MONIQ.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyCardTitle}>Sin Tarjetas Vinculadas</Text>
              <Text style={styles.emptyCardSub}>
                El administrador creará las tarjetas de tu local desde el taller de hardware.
              </Text>
            </View>
          ) : (
            cards.map((c) => (
              <View key={c.id} style={styles.tableCardItem}>
                <View style={styles.tableCardTop}>
                  <View style={styles.tableIconWrap}>
                    <CreditCard size={18} color={MONIQ.cyan} />
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.tableCardLabel}>{c.label || 'Mesa'}</Text>
                    <Text style={styles.tableCardCode}>#{c.cardCode}</Text>
                  </View>

                  <View style={styles.tapCounterBadge}>
                    <Zap size={12} color={MONIQ.positive} style={{ marginRight: 4 }} />
                    <Text style={styles.tapCounterText}>{c.tapCount || 0} taps</Text>
                  </View>
                </View>

                {/* DESTINO DIRECTO DE LA TARJETA */}
                <View style={styles.destinationDirectRow}>
                  <Text style={styles.destLabelMicro}>DESTINO DIRECTO:</Text>
                  <Text style={styles.destValHighlight}>
                    {activeRoutingMode === 1 ? 'Reseñas Google (5★ Directo)' : 'Carta Digital (Directo)'}
                  </Text>
                </View>

                {/* ACCIONES RAPIDAS */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.cardActionBtn}
                    onPress={() => handleTestUrl(ENV.getCardUrl(c.cardCode))}
                  >
                    <ExternalLink size={13} color={MONIQ.cyan} style={{ marginRight: 6 }} />
                    <Text style={styles.cardActionBtnText}>Probar Salto Directo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.cardActionBtn, { backgroundColor: MONIQ.surfaceElevated }]}
                    onPress={() => setSelectedCardForQr(c)}
                  >
                    <QrCode size={13} color={MONIQ.textPrimary} style={{ marginRight: 6 }} />
                    <Text style={[styles.cardActionBtnText, { color: MONIQ.textPrimary }]}>Ver QR</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 2: ENLACES DIRECTOS (RESEÑAS / CARTA / DOMINIO)              */}
      {/* ===================================================================== */}
      {activeTab === 'routing' && (
        <View>
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionTitle}>Configuración de Destino Directo</Text>
            <Text style={styles.sectionSubtitle}>
              Tus tarjetas y QRs saltan directamente aquí. Sin pantallas intermedias.
            </Text>
          </View>

          {/* SELECTOR DE DESTINO GLOBAL DIRECTO */}
          <View style={styles.modeCardsContainer}>
            <TouchableOpacity
              style={[styles.modeSelectCard, activeRoutingMode === 1 && styles.modeSelectCardActive]}
              onPress={() => setActiveRoutingMode(1)}
              activeOpacity={0.8}
            >
              <View style={styles.modeSelectTop}>
                <View style={[styles.modeRadioCircle, activeRoutingMode === 1 && styles.modeRadioCircleActive]}>
                  {activeRoutingMode === 1 && <View style={styles.modeRadioDot} />}
                </View>
                <Text style={styles.modeSelectTitle}>Reseñas Google Maps (5★)</Text>
              </View>
              <Text style={styles.modeSelectDesc}>
                Al tocar la tarjeta o escanear el QR, el cliente va directamente a la ventana de calificación de 5 estrellas en Google Maps.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeSelectCard, activeRoutingMode === 2 && styles.modeSelectCardActive]}
              onPress={() => setActiveRoutingMode(2)}
              activeOpacity={0.8}
            >
              <View style={styles.modeSelectTop}>
                <View style={[styles.modeRadioCircle, activeRoutingMode === 2 && styles.modeRadioCircleActive]}>
                  {activeRoutingMode === 2 && <View style={styles.modeRadioDot} />}
                </View>
                <Text style={styles.modeSelectTitle}>Carta / Menú Digital</Text>
              </View>
              <Text style={styles.modeSelectDesc}>
                Al tocar la tarjeta, el cliente abre de inmediato la carta interactiva con fotos, precios y platillos disponibles.
              </Text>
            </TouchableOpacity>
          </View>

          {/* FORMULARIO DE ENLACES */}
          <View style={styles.routingFormCard}>
            <Text style={styles.inputHeading}>ENLACE DE RESEÑAS GOOGLE MAPS</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.formInputText}
                value={googleMapsUrl}
                onChangeText={setGoogleMapsUrl}
                placeholder="https://g.page/r/... o enlace corto de Google Maps"
                placeholderTextColor={MONIQ.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.testLinkBtn}
                onPress={() => handleTestUrl(googleMapsUrl)}
              >
                <ExternalLink size={14} color={MONIQ.cyan} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputHeading, { marginTop: 16 }]}>DOMINIO O SITIO WEB PROPIO (OPCIONAL)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.formInputText}
                value={customDomain}
                onChangeText={setCustomDomain}
                placeholder="Ej. https://mirestaurante.pe/carta"
                placeholderTextColor={MONIQ.textMuted}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.testLinkBtn}
                onPress={() => handleTestUrl(customDomain)}
              >
                <ExternalLink size={14} color={MONIQ.cyan} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputHeading, { marginTop: 16 }]}>CONTRASEÑA WI-FI PARA CLIENTES (OPCIONAL)</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.formInputText}
                value={wifiPassword}
                onChangeText={setWifiPassword}
                placeholder="Clave de red para imprimir en stickers"
                placeholderTextColor={MONIQ.textMuted}
              />
            </View>

            <TouchableOpacity
              style={styles.saveRoutingBtn}
              onPress={() => handleSaveRouting()}
              disabled={savingRouting}
              activeOpacity={0.85}
            >
              {savingRouting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.saveRoutingBtnText}>Guardar Destino Directo</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 3: IMPRESIÓN Y EXPORTACIÓN DE CÓDIGOS QR                     */}
      {/* ===================================================================== */}
      {activeTab === 'qr' && (
        <View>
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionTitle}>Centro de Impresión y QR</Text>
            <Text style={styles.sectionSubtitle}>
              Exporta en alta resolución para colocar en stickers de mesa o parantes.
            </Text>
          </View>

          <View style={styles.qrDisplayCard}>
            <View style={styles.qrFrame}>
              <QRCode
                value={qrCanonicalUrl}
                size={180}
                color="#0D0E13"
                backgroundColor="#FFFFFF"
                getRef={(c) => (qrSvgRef.current = c)}
              />
            </View>

            <Text style={styles.qrNoticeText}>
              Este código QR físico permanece idéntico en tus mesas. Su destino cambia en vivo desde la pestaña Enlaces Directos.
            </Text>

            <View style={styles.qrButtonGrid}>
              <TouchableOpacity
                style={styles.qrPillActionBtn}
                onPress={handleShareQrImage}
                disabled={isSharingQr}
              >
                <Share2 size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.qrPillActionText}>Compartir QR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.qrPillActionBtn, { backgroundColor: MONIQ.surfaceElevated, borderColor: MONIQ.cardBorder }]}
                onPress={() => setShowPrintModal(true)}
              >
                <Printer size={14} color={MONIQ.cyan} style={{ marginRight: 6 }} />
                <Text style={[styles.qrPillActionText, { color: MONIQ.textPrimary }]}>Imprimir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.qrPillActionBtn, { backgroundColor: MONIQ.bg, borderColor: MONIQ.cardBorder }]}
                onPress={handleCopyQrLink}
              >
                <Copy size={14} color={MONIQ.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.qrPillActionText, { color: MONIQ.textSecondary }]}>
                  {copiedLink ? 'Copiado' : 'Copiar URL'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* ===================================================================== */}
      {/* PESTAÑA 4: CARTA Y MENÚ DIGITAL                                      */}
      {/* ===================================================================== */}
      {activeTab === 'menu' && (
        <View>
          <View style={styles.sectionHeaderWrap}>
            <Text style={styles.sectionTitle}>Carta Digital en Tiempo Real</Text>
            <Text style={styles.sectionSubtitle}>
              Activa o agota platillos instantáneamente para la vista de tus clientes.
            </Text>
          </View>

          {categories.length === 0 ? (
            <View style={styles.emptyCardBox}>
              <Utensils size={32} color={MONIQ.textMuted} style={{ marginBottom: 8 }} />
              <Text style={styles.emptyCardTitle}>Sin Categorías de Menú</Text>
              <Text style={styles.emptyCardSub}>
                Aún no se han configurado platillos en la carta de tu establecimiento.
              </Text>
            </View>
          ) : (
            categories.map((cat) => (
              <View key={cat.id} style={styles.categoryCard}>
                <Text style={styles.categoryTitle}>{cat.name}</Text>
                {cat.dishes.map((dish: any) => (
                  <View key={dish.id} style={styles.dishRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.dishName, !dish.isAvailable && styles.dishUnavailable]}>
                        {dish.name}
                      </Text>
                      <Text style={styles.dishPrice}>S/ {dish.price?.toFixed(2)}</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.availabilityToggle, dish.isAvailable ? styles.availYes : styles.availNo]}
                      onPress={() => handleToggleDish(dish.id)}
                    >
                      <Text style={[styles.availText, dish.isAvailable ? styles.availTextYes : styles.availTextNo]}>
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

      {/* ===================================================================== */}
      {/* MODAL: IMPRESIÓN WI-FI / BLUETOOTH                                    */}
      {/* ===================================================================== */}
      <Modal visible={showPrintModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.printModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Imprimir Plantillas QR</Text>
              <TouchableOpacity onPress={() => setShowPrintModal(false)}>
                <X size={20} color={MONIQ.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.printOptionLabel}>SELECCIONA EL FORMATO DE SALIDA:</Text>
            <View style={styles.printOptionsRow}>
              {[
                { id: 'stand', label: 'Parante Mesa' },
                { id: 'sticker', label: 'Sticker 80mm' },
                { id: 'thermal', label: 'Ticket Térmico' }
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.printOptBtn, printFormat === opt.id && styles.printOptBtnActive]}
                  onPress={() => setPrintFormat(opt.id as any)}
                >
                  <Text style={[styles.printOptText, printFormat === opt.id && styles.printOptTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.executePrintBtn}
              onPress={handleExecutePrint}
              disabled={isPrinting}
            >
              {isPrinting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Printer size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.executePrintBtnText}>Enviar a Impresora</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: QR DE TARJETA INDIVIDUAL                                      */}
      {/* ===================================================================== */}
      <Modal visible={!!selectedCardForQr} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.qrIndividualCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>{selectedCardForQr?.label || 'Mesa'}</Text>
              <TouchableOpacity onPress={() => setSelectedCardForQr(null)}>
                <X size={20} color={MONIQ.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedCardForQr && (
              <View style={{ alignItems: 'center', marginVertical: 14 }}>
                <View style={styles.qrFrame}>
                  <QRCode
                    value={ENV.getCardUrl(selectedCardForQr.cardCode)}
                    size={180}
                    color="#0D0E13"
                    backgroundColor="#FFFFFF"
                  />
                </View>
                <Text style={styles.qrCardCodeText}>#{selectedCardForQr.cardCode}</Text>
                <Text style={styles.qrCardUrlText}>{ENV.getCardUrl(selectedCardForQr.cardCode)}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.closeCardQrBtn}
              onPress={() => setSelectedCardForQr(null)}
            >
              <Text style={styles.closeCardQrBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PIE DE VERSION DEL SISTEMA */}
      <View style={styles.footerVersionSection}>
        <Text style={styles.footerVersionText}>
          Aplicacion v{UpdateService.getCurrentVersion()} • Sistema Seguro
        </Text>
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MONIQ.bg
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: MONIQ.bg,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: MONIQ.textSecondary,
    fontSize: 13,
    marginTop: 12
  },
  buyerHeader: {
    backgroundColor: MONIQ.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginBottom: 14
  },
  buyerHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  buyerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  avatarText: {
    color: MONIQ.accent,
    fontSize: 16,
    fontWeight: '800'
  },
  buyerTitle: {
    color: MONIQ.textPrimary,
    fontSize: 17,
    fontWeight: '800'
  },
  buyerMeta: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MONIQ.positive,
    marginRight: 6
  },
  livePillText: {
    color: MONIQ.positive,
    fontSize: 10,
    fontWeight: '800'
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8
  },
  metricCard: {
    flex: 1,
    backgroundColor: MONIQ.bg,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    alignItems: 'center'
  },
  metricVal: {
    color: MONIQ.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 4
  },
  metricSub: {
    color: MONIQ.textMuted,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2
  },
  tabScrollWrap: {
    marginBottom: 16
  },
  tabScrollContent: {
    paddingVertical: 2,
    gap: 8
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: MONIQ.surface,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  tabPillActive: {
    backgroundColor: MONIQ.accent,
    borderColor: 'transparent',
    shadowColor: MONIQ.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3
  },
  tabPillText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  tabPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1
  },
  noticeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)'
  },
  noticeError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)'
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600'
  },
  noticeTextSuccess: {
    color: MONIQ.positive
  },
  noticeTextError: {
    color: MONIQ.negative
  },
  sectionHeaderWrap: {
    marginBottom: 12
  },
  sectionTitle: {
    color: MONIQ.textPrimary,
    fontSize: 16,
    fontWeight: '800'
  },
  sectionSubtitle: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    marginTop: 2
  },
  emptyCardBox: {
    backgroundColor: MONIQ.surface,
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  emptyCardTitle: {
    color: MONIQ.textPrimary,
    fontSize: 14,
    fontWeight: '700'
  },
  emptyCardSub: {
    color: MONIQ.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4
  },
  tableCardItem: {
    backgroundColor: MONIQ.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  tableCardTop: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tableIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tableCardLabel: {
    color: MONIQ.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  tableCardCode: {
    color: MONIQ.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 1
  },
  tapCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.bg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8
  },
  tapCounterText: {
    color: MONIQ.positive,
    fontSize: 11,
    fontWeight: '700'
  },
  destinationDirectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MONIQ.bg,
    borderRadius: 8,
    padding: 8,
    marginVertical: 10
  },
  destLabelMicro: {
    color: MONIQ.textSecondary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginRight: 6
  },
  destValHighlight: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontWeight: '700'
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.2)'
  },
  cardActionBtnText: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontWeight: '700'
  },
  modeCardsContainer: {
    gap: 10,
    marginBottom: 14
  },
  modeSelectCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: MONIQ.cardBorder
  },
  modeSelectCardActive: {
    borderColor: MONIQ.cyan,
    backgroundColor: 'rgba(0, 229, 255, 0.04)'
  },
  modeSelectTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  modeRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: MONIQ.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  modeRadioCircleActive: {
    borderColor: MONIQ.cyan
  },
  modeRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MONIQ.cyan
  },
  modeSelectTitle: {
    color: MONIQ.textPrimary,
    fontSize: 14,
    fontWeight: '800'
  },
  modeSelectDesc: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 28
  },
  routingFormCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  inputHeading: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  formInputText: {
    flex: 1,
    backgroundColor: MONIQ.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    color: MONIQ.textPrimary,
    fontSize: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  testLinkBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: MONIQ.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  saveRoutingBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MONIQ.accent,
    height: 46,
    borderRadius: 12,
    marginTop: 20
  },
  saveRoutingBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  qrDisplayCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  qrFrame: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16
  },
  qrNoticeText: {
    color: MONIQ.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 14,
    lineHeight: 16
  },
  qrButtonGrid: {
    width: '100%',
    flexDirection: 'row',
    gap: 8
  },
  qrPillActionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MONIQ.accent,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  qrPillActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  categoryCard: {
    backgroundColor: MONIQ.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  categoryTitle: {
    color: MONIQ.cyan,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)'
  },
  dishName: {
    color: MONIQ.textPrimary,
    fontSize: 13,
    fontWeight: '700'
  },
  dishUnavailable: {
    color: MONIQ.textMuted,
    textDecorationLine: 'line-through'
  },
  dishPrice: {
    color: MONIQ.positive,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  availabilityToggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6
  },
  availYes: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)'
  },
  availNo: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)'
  },
  availText: {
    fontSize: 10,
    fontWeight: '800'
  },
  availTextYes: {
    color: MONIQ.positive
  },
  availTextNo: {
    color: MONIQ.negative
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  printModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: MONIQ.surface,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalHeaderTitle: {
    color: MONIQ.textPrimary,
    fontSize: 16,
    fontWeight: '800'
  },
  printOptionLabel: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  printOptionsRow: {
    gap: 8,
    marginBottom: 16
  },
  printOptBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: MONIQ.bg,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    alignItems: 'center'
  },
  printOptBtnActive: {
    borderColor: MONIQ.cyan,
    backgroundColor: 'rgba(0, 229, 255, 0.08)'
  },
  printOptText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  printOptTextActive: {
    color: MONIQ.cyan
  },
  executePrintBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MONIQ.accent,
    height: 46,
    borderRadius: 12
  },
  executePrintBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  qrIndividualCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: MONIQ.surface,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  qrCardCodeText: {
    color: MONIQ.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12
  },
  qrCardUrlText: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4
  },
  closeCardQrBtn: {
    width: '100%',
    height: 42,
    borderRadius: 10,
    backgroundColor: MONIQ.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8
  },
  closeCardQrBtnText: {
    color: MONIQ.textPrimary,
    fontSize: 12,
    fontWeight: '700'
  },
  footerVersionSection: {
    alignItems: 'center',
    paddingVertical: 18
  },
  footerVersionText: {
    color: MONIQ.textMuted,
    fontSize: 11,
    fontWeight: '600'
  }
});
