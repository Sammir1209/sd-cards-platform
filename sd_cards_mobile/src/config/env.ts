/**
 * Configuracion centralizada de red y entornos para Sam Services Platform
 * Cuando el backend se despliegue en Render (u otro proveedor cloud),
 * la aplicacion cambiara de inmediato a la URL asignada.
 */

// URL oficial del Backend en Produccion (Render Cloud)
const DEFAULT_BACKEND_URL = 'https://sd-cards-platform.onrender.com';

export const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_BACKEND_URL;
export const API_BASE_URL = `${BACKEND_URL}/api`;

export const ENV = {
  BACKEND_URL,
  API_BASE_URL,
  getQrUrl: (slug: string) => `${BACKEND_URL}/qr/${slug}`,
  getCardUrl: (cardCode: string) => `${BACKEND_URL}/t/${cardCode}`,
  getMenuUrl: (slug: string) => `${BACKEND_URL}/m/${slug}`
};

