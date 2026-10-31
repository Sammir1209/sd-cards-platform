import { LogManager } from './logManager';
import { API_BASE_URL } from '../config/env';

let currentAuthToken: string | null = null;
let onUnauthorizedCallback: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  currentAuthToken = token;
}

export function getAuthToken(): string | null {
  return currentAuthToken;
}

export function setOnUnauthorized(callback: () => void): void {
  onUnauthorizedCallback = callback;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  ownerName?: string;
  ownerPhone?: string;
  phone?: string;
  ownerEmail?: string;
  email?: string;
  accessPassword?: string;
  ruc?: string;
  department?: string;
  province?: string;
  district?: string;
  city?: string;
  address?: string;
  planMonths?: number;
  planExpiryDate?: string;
  googleMapsUrl?: string;
  autoRedirectReviews?: boolean;
  customDomain?: string;
  googlePlaceId?: string;
  activeRoutingMode?: number;
  wifiPassword?: string;
  templateType?: number;
  isActive?: boolean;
  isArchived?: boolean;
  whatsappOptIn?: boolean;
  lastNotificationAt?: string;
  createdAt?: string;
  cardsCount?: number;
  totalTaps?: number;
  cards?: any[];
}

export interface UpdateBusinessData {
  name?: string;
  ownerName?: string;
  phone?: string;
  ownerPhone?: string;
  email?: string;
  ownerEmail?: string;
  password?: string;
  ruc?: string;
  department?: string;
  province?: string;
  district?: string;
  address?: string;
  city?: string;
  isActive?: boolean;
  planMonths?: number;
  planExpiryDate?: string;
  services?: number;
  googleMapsUrl?: string;
}

/**
 * Función robusta safeFetch:
 * Previene el error fatal "JSON Parse error: Unexpected character: <"
 * verificando si la respuesta HTTP es realmente JSON antes de parsearla.
 * Inyecta token Bearer si existe y maneja respuestas 401 desautorizadas.
 */
async function safeFetch<T = any>(endpoint: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const requestHeaders: Record<string, string> = {};
    if (options?.headers) {
      if (Array.isArray(options.headers)) {
        for (const [key, value] of options.headers) {
          requestHeaders[key] = value;
        }
      } else if (typeof (options.headers as any).forEach === 'function') {
        (options.headers as any).forEach((value: string, key: string) => {
          requestHeaders[key] = value;
        });
      } else {
        Object.assign(requestHeaders, options.headers);
      }
    }

    const hasAuth = Object.keys(requestHeaders).some(
      key => key.toLowerCase() === 'authorization'
    );
    if (currentAuthToken && !hasAuth) {
      requestHeaders['Authorization'] = `Bearer ${currentAuthToken}`;
    }

    const mergedOptions: RequestInit = {
      ...options,
      headers: requestHeaders
    };

    const res = await fetch(url, mergedOptions);

    if (res.status === 401 && !endpoint.includes('/login')) {
      LogManager.addLog(`[AUTH 401] ${endpoint} -> No autorizado (expirado o inválido)`);
      if (onUnauthorizedCallback) {
        try {
          onUnauthorizedCallback();
        } catch (cbErr) {
          console.error('[safeFetch] Error en callback onUnauthorized:', cbErr);
        }
      }
    }

    const contentType = res.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      const rawText = await res.text();
      const preview = rawText.substring(0, 100).replace(/\n/g, ' ');
      const errorMsg = `HTTP ${res.status}: Respuesta no JSON (${preview}...)`;
      LogManager.addLog(`[ERROR RED] ${endpoint} -> ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data?.error || `HTTP ${res.status}`;
      LogManager.addLog(`[ERROR API] ${endpoint} -> ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    LogManager.addLog(`[OK API] ${endpoint} (${res.status})`);
    return { success: true, data };
  } catch (err: any) {
    const errorMsg = err?.message || 'Error de conexión de red';
    LogManager.addLog(`[EXCEPCIÓN] ${endpoint} -> ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

export async function updateBusiness(
  id: number,
  data: UpdateBusinessData
): Promise<{ success: boolean; data?: any; error?: string }> {
  return safeFetch<any>(`/businessapi/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function renewPlan(
  id: number,
  additionalMonths: number = 12
): Promise<{
  success: boolean;
  data?: {
    success: boolean;
    planExpiryDate: string;
    planMonths: number;
    isActive: boolean;
    message?: string;
  };
  error?: string;
}> {
  return safeFetch<any>(`/businessapi/${id}/renew-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ additionalMonths })
  });
}

export const api = {
  // Configuración de Sesión y Token
  setAuthToken,
  getAuthToken,
  setOnUnauthorized,

  // Autenticación de Usuarios / Portal Clientes
  login: async (credentials: { email: string; password: string }) => {
    const res = await safeFetch<{
      success: boolean;
      role: 'superadmin' | 'buyer';
      businessId?: number;
      businessName?: string;
      ownerName?: string;
      name?: string;
      email?: string;
      slug?: string;
      templateType?: number;
      token?: string;
      error?: string;
    }>('/businessapi/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (res.success && res.data?.token) {
      setAuthToken(res.data.token);
    }

    return res;
  },

  // Negocios / Compradores
  getBusinesses: async () => {
    const res = await safeFetch<any[]>('/businessapi');
    return res.success ? (res.data || []) : [];
  },

  getBusinessById: async (id: number) => {
    const res = await safeFetch<any>(`/businessapi/${id}`);
    return res.success ? res.data : null;
  },

  registerBusiness: async (data: {
    name: string;
    ownerName: string;
    email: string;
    password?: string;
    phone: string;
    ruc?: string;
    department?: string;
    province?: string;
    district?: string;
    city?: string;
    address?: string;
    services: number;
    planMonths?: number;
  }) => {
    return safeFetch<any>('/businessapi/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  updateBusiness,
  renewPlan,

  deleteBusiness: async (id: number, permanent = false) => {
    return safeFetch<any>(`/businessapi/${id}?permanent=${permanent}`, {
      method: 'DELETE'
    });
  },

  updateBusinessPassword: async (businessId: number, password: string) => {
    return safeFetch<any>(`/businessapi/${businessId}/update-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
  },

  updateBusinessTemplateType: async (businessId: number, templateType: number) => {
    return safeFetch<any>(`/businessapi/${businessId}/template-type`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateType })
    });
  },

  updateBusinessRouting: async (
    businessId: number,
    data: {
      googleMapsUrl?: string;
      autoRedirectReviews?: boolean;
      customDomain?: string;
      slug?: string;
      activeRoutingMode?: number;
      wifiPassword?: string;
    }
  ) => {
    return safeFetch<any>(`/businessapi/${businessId}/routing`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  toggleBusinessStatus: async (id: number) => {
    return safeFetch<any>(`/businessapi/${id}/toggle-status`, {
      method: 'POST'
    });
  },

  // Tarjetas NFC
  getCardsByBusiness: async (businessId: number) => {
    const res = await safeFetch<any[]>(`/cardsapi/business/${businessId}`);
    return res.success ? (res.data || []) : [];
  },

  assignSingleCard: async (data: {
    businessId: number;
    cardType: number;
    label: string;
    customCode?: string;
  }) => {
    return safeFetch<any>('/cardsapi/assign-single', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  startProvisionSession: async (cardId: number) => {
    return safeFetch<{
      success: boolean;
      cardId: number;
      cardCode: string;
      provisionToken: string;
      expectedUrl: string;
      status: string;
      expiresInSeconds: number;
    }>(`/cardsapi/${cardId}/provision-session`, {
      method: 'POST'
    });
  },

  confirmProvision: async (cardId: number, data: {
    provisionToken: string;
    nfcUid: string;
    chipFamily: string;
    memoryBytes: number;
    readBackUrl: string;
  }) => {
    return safeFetch<any>(`/cardsapi/${cardId}/confirm-provision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  cancelProvision: async (cardId: number) => {
    return safeFetch<any>(`/cardsapi/${cardId}/cancel-provision`, {
      method: 'POST'
    });
  },

  retryActivation: async (cardId: number) => {
    return safeFetch<any>(`/cardsapi/${cardId}/retry-activation`, {
      method: 'POST'
    });
  },

  deleteCard: async (cardId: number) => {
    return safeFetch<any>(`/cardsapi/${cardId}`, {
      method: 'DELETE'
    });
  },

  verifyActivation: async (cardId: number, data: { nfcUid?: string; verifiedUrl?: string }) => {
    return safeFetch<any>(`/cardsapi/${cardId}/verify-activation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },

  // Menú
  getMenuByBusiness: async (businessId: number) => {
    const res = await safeFetch<any>(`/menuapi/business/${businessId}`);
    return res.success ? res.data : { categories: [] };
  },

  toggleDish: async (dishId: number) => {
    return safeFetch<any>(`/menuapi/dish/${dishId}/toggle`, {
      method: 'PUT'
    });
  },

  // Version y Actualizaciones del Sistema
  getAppVersionInfo: async () => {
    const res = await safeFetch<any>('/systemapi/version');
    return res.success ? res.data : null;
  },

  updateServerAppVersion: async (data: {
    version?: string;
    buildNumber?: number;
    apkUrl?: string;
    directDownloadUrl?: string;
    changelog?: string[];
    forceUpdate?: boolean;
  }) => {
    return safeFetch<any>('/systemapi/version', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }
};
