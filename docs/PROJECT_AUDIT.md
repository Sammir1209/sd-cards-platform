# AUDITORÍA TÉCNICA DEL PROYECTO S & D - COMPANY CARDS
Fecha: 30 de Octubre de 2026
Estado: En curso - Fase 0

---

## 1. Arquitectura Encontrada

### A. Backend (.NET 10 Web API + MVC)
- **Framework**: .NET 10.0 C# con Kestrel en escucha en `http://0.0.0.0:5000`.
- **Acceso a Datos**: Entity Framework Core con soporte híbrido en `Program.cs`:
  - Si `SupabaseConnection` está presente y no contiene placeholder -> `UseNpgsql`.
  - En caso contrario -> `UseSqlite("Data Source=nfcmenu.db")`.
- **Rutas Públicas Canónicas**:
  - `/t/{code}` en `MenuController.cs`: resuelve salto 302 instantáneo (Reviews con `#ebo=3`) o redirección a menú digital si está activa.
- **APIs REST**:
  - `CardsApiController.cs`: `/api/cardsapi/business/{businessId}`, `/api/cardsapi/{cardId}/label`, `/api/cardsapi/generate-batch`.
  - `MenuApiController.cs`: `/api/menuapi/business/{businessId}`, `/api/menuapi/dish`, `/api/menuapi/dish/{id}/toggle`.

### B. Base de Datos (Resolución de Contradicción y Fuente de Verdad)
- **Diagnóstico del error previo**:
  `SQLite Error 1: 'table NfcCards has no column named ActivatedAt'`.
- **Causa**: `NfcCard.cs` tenía propiedades C# (`Status`, `NfcUid`, `ProgrammedAt`, `ActivatedAt`) añadidas sin haber corrido una migración o alter table sobre `nfcmenu.db`.
- **Solución persistente**: Se inyectaron exitosamente las columnas faltantes en `nfcmenu.db`. El endpoint `generate-batch` se verificó funcionando de forma real generando tarjetas reales `SD-MEN-9096` y `SD-MEN-7334`.
- **Estrategia de Fuente de Verdad**:
  - En desarrollo local: SQLite `nfcmenu.db`.
  - En producción: PostgreSQL / Supabase mediante `Data/supabase_schema.sql`.

### C. Aplicación Móvil (React Native + Expo)
- **Versiones reales en `sd_cards_mobile/package.json`**:
  - React: `19.3.0`
  - React Native: `0.88.1`
  - Expo: `~58.0.21` (Nueva Arquitectura)
  - lucide-react-native: `^1.64.0`
  - react-native-svg: `^15.16.0`
- **Problema de modularidad detectado**:
  - Todo el código residía en un archivo monolítico `App.tsx` (~62KB).
  - Se requiere dividir la arquitectura en módulos profesionales:
    `src/theme/`, `src/services/`, `src/components/`, `src/screens/auth/`, `src/screens/admin/`, `src/screens/buyer/`.

---

## 2. Bloqueos Detectados y Plan de Ejecución
1. Falta de endpoints para creación comercial del negocio con RUC, facturación y generación segura de credenciales de comprador.
2. Interfaz móvil monolítica que mezcla SuperAdmin y Buyer en un solo archivo.
3. Login requiere simplificación: eliminar referencias a "Admin Panel" y roles artificiales; dejar solo bienvenida limpia y campos de credenciales.
4. El comprador no debe tener vistas con mensajes de up-selling ni venta de tarjetas; debe ser una consola limpia de operación.

