import { LogManager } from './logManager';
import { API_BASE_URL } from '../config/env';

/**
 * Función robusta safeFetch:
 * Previene el error fatal "JSON Parse error: Unexpected character: <"
 * verificando si la respuesta HTTP es realmente JSON antes de parsearla.
 */
async function safeFetch<T = any>(endpoint: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
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

export const api = {
  // Autenticación de Usuarios / Portal Clientes
  login: async (credentials: { email: string; password: string }) => {
    return safeFetch<{
      success: boolean;
      role: 'superadmin' | 'buyer';
      businessId?: number;
      businessName?: string;
      ownerName?: string;
      email?: string;
      slug?: string;
      templateType?: number;
      error?: string;
    }>('/businessapi/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
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
  }
};
