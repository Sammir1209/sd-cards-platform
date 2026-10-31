import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform
} from 'react-native';
import {
  X,
  Building,
  User,
  Phone,
  FileText,
  MapPin,
  Sliders,
  Calendar,
  Lock,
  AlertCircle
} from 'lucide-react-native';
import { MONIQ } from '../theme/colors';
import { PERU_DEPARTMENTS, parseLocationCity, PeruDepartment, PeruProvince } from '../data/peruLocations';
import { api, Business, UpdateBusinessData } from '../services/api';

export interface ClientEditModalProps {
  visible: boolean;
  business: Business | any | null;
  onClose: () => void;
  onSave?: (id: number, data: UpdateBusinessData) => Promise<{ success: boolean; data?: any; error?: string }>;
  onSuccess?: (updatedBusiness: any) => void;
}

export const ClientEditModal: React.FC<ClientEditModalProps> = ({
  visible,
  business,
  onClose,
  onSave,
  onSuccess
}) => {
  // Form state
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ruc, setRuc] = useState('');
  const [address, setAddress] = useState('');

  // Ubigeo state
  const [deptId, setDeptId] = useState('lima');
  const [provId, setProvId] = useState('lima');
  const [districtName, setDistrictName] = useState('Miraflores');

  // Contract & Status state
  const [isActive, setIsActive] = useState(true);
  const [planMonths, setPlanMonths] = useState(12);
  const [services, setServices] = useState(1);

  // Status
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever modal becomes visible or target business changes
  useEffect(() => {
    if (visible && business) {
      setName(business.name || '');
      setOwnerName(business.ownerName || '');
      setPhone(business.ownerPhone || business.phone || '');
      setEmail(business.ownerEmail || business.email || '');
      setPassword(business.accessPassword || '');
      setRuc(business.ruc || '');
      setAddress(business.address || '');
      setIsActive(business.isActive !== undefined ? (business.isActive && !business.isArchived) : true);
      setPlanMonths(business.planMonths || 12);
      setServices(business.templateType || 1);
      setErrorMessage(null);

      // Ubigeo resolution
      const parsedFallback = business.city
        ? parseLocationCity(business.city)
        : { deptId: 'lima', provId: 'lima', districtName: 'Miraflores' };

      let matchedDept = business.department
        ? PERU_DEPARTMENTS.find(
            d => d.name.toLowerCase() === business.department.toLowerCase() ||
                 d.id.toLowerCase() === business.department.toLowerCase()
          )
        : PERU_DEPARTMENTS.find(d => d.id === parsedFallback.deptId);

      if (!matchedDept) {
        matchedDept = PERU_DEPARTMENTS.find(d => d.id === 'lima') || PERU_DEPARTMENTS[0];
      }
      const resolvedDeptId = matchedDept.id;
      setDeptId(resolvedDeptId);

      const provinces = matchedDept.provinces || [];
      let matchedProv = business.province
        ? provinces.find(
            p => p.name.toLowerCase() === business.province.toLowerCase() ||
                 p.id.toLowerCase() === business.province.toLowerCase()
          )
        : provinces.find(
            p => p.id === parsedFallback.provId ||
                 p.name.toLowerCase() === parsedFallback.provId.toLowerCase()
          );

      if (!matchedProv) matchedProv = provinces[0];
      const resolvedProvId = matchedProv?.id || 'lima';
      setProvId(resolvedProvId);

      const districts = matchedProv?.districts || [];
      let matchedDist = business.district
        ? districts.find(d => d.toLowerCase() === business.district.toLowerCase())
        : districts.find(d => d.toLowerCase() === parsedFallback.districtName.toLowerCase());

      setDistrictName(matchedDist || districts[0] || 'Centro');
    }
  }, [visible, business]);

  // Department selector handler (cascades to first province and first district)
  const handleSelectDepartment = (newDeptId: string) => {
    setDeptId(newDeptId);
    const dept = PERU_DEPARTMENTS.find(d => d.id === newDeptId) || PERU_DEPARTMENTS[0];
    const firstProv = dept?.provinces?.[0];
    if (firstProv) {
      setProvId(firstProv.id);
      setDistrictName(firstProv.districts?.[0] || 'Centro');
    } else {
      setProvId('central');
      setDistrictName('Centro');
    }
  };

  // Province selector handler (cascades to first district)
  const handleSelectProvince = (newProvId: string) => {
    setProvId(newProvId);
    const dept = PERU_DEPARTMENTS.find(d => d.id === deptId) || PERU_DEPARTMENTS[0];
    const prov = dept?.provinces?.find(p => p.id === newProvId) || dept?.provinces?.[0];
    setDistrictName(prov?.districts?.[0] || 'Centro');
  };

  // District selector handler
  const handleSelectDistrict = (newDistName: string) => {
    setDistrictName(newDistName);
  };

  // Form submit handler
  const handleSave = async () => {
    if (!business?.id) return;

    if (!name.trim()) {
      setErrorMessage('El nombre comercial del cliente es obligatorio.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    const currentDept = PERU_DEPARTMENTS.find(d => d.id === deptId) || PERU_DEPARTMENTS[0];
    const currentProv = currentDept?.provinces?.find(p => p.id === provId) || currentDept?.provinces?.[0];
    const deptName = currentDept?.name || 'Perú';
    const provName = currentProv?.name || 'Central';
    const locationCity = `${districtName}, ${provName} - ${deptName}`;

    const payload: UpdateBusinessData = {
      name: name.trim(),
      ownerName: ownerName.trim() || undefined,
      phone: phone.trim() || undefined,
      ownerPhone: phone.trim() || undefined,
      email: email.trim() || undefined,
      ownerEmail: email.trim() || undefined,
      password: password.trim() || undefined,
      ruc: ruc.trim() || undefined,
      department: deptName,
      province: provName,
      district: districtName,
      city: locationCity,
      address: address.trim() || undefined,
      isActive: isActive,
      planMonths: planMonths,
      services: services
    };

    try {
      let res: { success: boolean; data?: any; error?: string };
      if (onSave) {
        res = await onSave(business.id, payload);
      } else {
        res = await api.updateBusiness(business.id, payload);
      }

      if (res.success) {
        const updated = {
          ...business,
          ...payload,
          ownerPhone: phone.trim(),
          phone: phone.trim(),
          ownerEmail: email.trim(),
          email: email.trim(),
          department: deptName,
          province: provName,
          district: districtName,
          city: locationCity,
          address: address.trim(),
          isActive: isActive,
          isArchived: !isActive,
          planMonths: planMonths,
          templateType: services,
          ...(res.data?.business || res.data || {})
        };
        if (onSuccess) {
          onSuccess(updated);
        }
        onClose();
      } else {
        setErrorMessage(res.error || 'No se pudo guardar la información del cliente.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error de conexión de red.');
    } finally {
      setLoading(false);
    }
  };

  const currentDept = PERU_DEPARTMENTS.find(d => d.id === deptId) || PERU_DEPARTMENTS[0];
  const provinces = currentDept?.provinces || [];
  const currentProv = provinces.find(p => p.id === provId) || provinces[0];
  const districts = currentProv?.districts || [];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Editar Cliente</Text>
              <Text style={styles.modalSubtitle}>Actualiza datos comerciales, ubicación y contrato</Text>
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

          {/* FORM BODY */}
          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* BLOQUE 1: IDENTIFICACIÓN COMERCIAL */}
            <View style={styles.sectionHeader}>
              <Building size={14} color={MONIQ.cyan} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>1. IDENTIFICACIÓN COMERCIAL</Text>
            </View>

            <Text style={styles.label}>NOMBRE COMERCIAL DEL NEGOCIO *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={t => {
                setName(t);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Ej. Pollería Ben 10"
              placeholderTextColor={MONIQ.textMuted}
            />

            <View style={styles.twoColsRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={[styles.label, { marginTop: 10 }]}>TITULAR / ENCARGADO</Text>
                <TextInput
                  style={styles.input}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  placeholder="Nombre completo"
                  placeholderTextColor={MONIQ.textMuted}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { marginTop: 10 }]}>RUC / DNI</Text>
                <TextInput
                  style={styles.input}
                  value={ruc}
                  onChangeText={setRuc}
                  placeholder="11 dígitos"
                  placeholderTextColor={MONIQ.textMuted}
                  keyboardType="numeric"
                  maxLength={11}
                />
              </View>
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>TELÉFONO WHATSAPP (+51)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Ej. 987654321"
              placeholderTextColor={MONIQ.textMuted}
              keyboardType="phone-pad"
            />

            {/* BLOQUE 2: UBICACIÓN GEOGRÁFICA (PERÚ) */}
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <MapPin size={14} color={MONIQ.cyan} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>2. UBICACIÓN GEOGRÁFICA (PERÚ)</Text>
            </View>

            {/* SELECTOR DE DEPARTAMENTO */}
            <Text style={styles.label}>DEPARTAMENTO *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScrollRow}>
              {PERU_DEPARTMENTS.map(dept => (
                <TouchableOpacity
                  key={`dept-${dept.id}`}
                  style={[styles.geoPill, deptId === dept.id && styles.geoPillActive]}
                  onPress={() => handleSelectDepartment(dept.id)}
                >
                  <Text style={[styles.geoPillText, deptId === dept.id && styles.geoPillTextActive]}>
                    {dept.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* SELECTOR DE PROVINCIA */}
            <Text style={[styles.label, { marginTop: 10 }]}>PROVINCIA *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScrollRow}>
              {provinces.map(prov => (
                <TouchableOpacity
                  key={`prov-${deptId}-${prov.id}`}
                  style={[styles.geoPill, provId === prov.id && styles.geoPillActive]}
                  onPress={() => handleSelectProvince(prov.id)}
                >
                  <Text style={[styles.geoPillText, provId === prov.id && styles.geoPillTextActive]}>
                    {prov.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* SELECTOR DE DISTRITO */}
            <Text style={[styles.label, { marginTop: 10 }]}>DISTRITO *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScrollRow}>
              {districts.map(dist => (
                <TouchableOpacity
                  key={`dist-${deptId}-${provId}-${dist}`}
                  style={[styles.geoPill, districtName === dist && styles.geoPillActive]}
                  onPress={() => handleSelectDistrict(dist)}
                >
                  <Text style={[styles.geoPillText, districtName === dist && styles.geoPillTextActive]}>
                    {dist}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { marginTop: 10 }]}>DIRECCIÓN ESPECÍFICA / LOCAL</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Av. Principal 123, Piso 1"
              placeholderTextColor={MONIQ.textMuted}
            />

            {/* BLOQUE 3: ESTADO COMERCIAL & VIGENCIA */}
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Sliders size={14} color={MONIQ.cyan} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>3. ESTADO COMERCIAL & MODALIDAD</Text>
            </View>

            <Text style={styles.label}>ESTADO OPERATIVO</Text>
            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.optionPill,
                  isActive && { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: MONIQ.positive }
                ]}
                onPress={() => setIsActive(true)}
              >
                <Text style={[styles.optionPillText, isActive && { color: MONIQ.positive, fontWeight: '800' }]}>
                  Activo (Operativo)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionPill,
                  !isActive && { backgroundColor: 'rgba(239, 68, 68, 0.2)', borderColor: MONIQ.negative }
                ]}
                onPress={() => setIsActive(false)}
              >
                <Text style={[styles.optionPillText, !isActive && { color: MONIQ.negative, fontWeight: '800' }]}>
                  Pausado (Suspendido)
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>MODALIDAD / SERVICIO CONTRATADO</Text>
            <View style={styles.optionsRow}>
              {[
                { id: 1, label: 'Menú Digital' },
                { id: 2, label: 'Reseñas Google' },
                { id: 3, label: 'Dual Hub' }
              ].map(s => (
                <TouchableOpacity
                  key={`srv-${s.id}`}
                  style={[styles.optionPill, services === s.id && styles.optionPillActive]}
                  onPress={() => setServices(s.id)}
                >
                  <Text style={[styles.optionPillText, services === s.id && styles.optionPillTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 12 }]}>VIGENCIA DEL PLAN</Text>
            <View style={styles.optionsRow}>
              {[
                { m: 6, label: '6 Meses' },
                { m: 12, label: '12 Meses (1 Año)' },
                { m: 24, label: '24 Meses (2 Años)' }
              ].map(item => (
                <TouchableOpacity
                  key={`plan-${item.m}`}
                  style={[styles.optionPill, planMonths === item.m && styles.optionPillActive]}
                  onPress={() => setPlanMonths(item.m)}
                >
                  <Text style={[styles.optionPillText, planMonths === item.m && styles.optionPillTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* BLOQUE 4: ACCESO AL PORTAL */}
            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Lock size={14} color={MONIQ.cyan} style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>4. CREDENCIALES DE ACCESO</Text>
            </View>

            <Text style={styles.label}>CORREO ELECTRÓNICO (USUARIO)</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="usuario@negocio.com"
              placeholderTextColor={MONIQ.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={[styles.label, { marginTop: 10 }]}>CLAVE DE ACCESO</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Nueva clave o conservar actual"
              placeholderTextColor={MONIQ.textMuted}
            />
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
              style={[styles.saveBtn, loading && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#0B132B" />
              ) : (
                <Text style={styles.saveBtnText}>Guardar Cambios</Text>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14
  },
  modalTitle: {
    color: MONIQ.textPrimary,
    fontSize: 18,
    fontWeight: '900'
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
    paddingVertical: 8,
    marginBottom: 12
  },
  errorBannerText: {
    color: MONIQ.negative,
    fontSize: 12,
    fontWeight: '700',
    flex: 1
  },
  formScroll: {
    maxHeight: 480
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    color: MONIQ.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  label: {
    color: MONIQ.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.4
  },
  input: {
    height: 44,
    backgroundColor: MONIQ.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: MONIQ.textPrimary,
    fontSize: 13,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder
  },
  twoColsRow: {
    flexDirection: 'row',
    width: '100%'
  },
  pillsScrollRow: {
    flexDirection: 'row',
    marginBottom: 6
  },
  geoPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: MONIQ.card,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    marginRight: 6
  },
  geoPillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: MONIQ.cyan
  },
  geoPillText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '600'
  },
  geoPillTextActive: {
    color: MONIQ.cyan,
    fontWeight: '800'
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6
  },
  optionPill: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: MONIQ.card,
    borderWidth: 1,
    borderColor: MONIQ.cardBorder,
    alignItems: 'center',
    justifyContent: 'center'
  },
  optionPillActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    borderColor: MONIQ.cyan
  },
  optionPillText: {
    color: MONIQ.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center'
  },
  optionPillTextActive: {
    color: MONIQ.cyan,
    fontWeight: '800'
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
  saveBtn: {
    flex: 2,
    height: 46,
    backgroundColor: MONIQ.cyan,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4
  },
  saveBtnText: {
    color: '#0B132B',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3
  }
});
