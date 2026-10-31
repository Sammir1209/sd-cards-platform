# CONTRATOS DE API Y ESPECIFICACIÓN DE RUTAS: S & D

## 1. Módulo de Negocios y Facturación

### `POST /api/business/register`
- **Rol requerido**: SuperAdmin
- **Propósito**: Registra un nuevo comprador con sus datos fiscales y genera credenciales de acceso.
- **Request Body**:
```json
{
  "name": "Restaurante Central",
  "ownerName": "Carlos Mendoza",
  "email": "carlos@central.pe",
  "phone": "+51999111222",
  "ruc": "20601234567",
  "city": "Lima",
  "address": "Av. Dos de Mayo 450",
  "services": 3, 
  "plan": "Anual Pro"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "businessId": 2,
  "temporaryPin": "8921",
  "loginUrl": "https://s-d.pe/app"
}
```

---

## 2. Módulo de Tarjetas y Hardware NFC

### `POST /api/cardsapi/assign-single`
- **Rol requerido**: SuperAdmin
- **Request Body**:
```json
{
  "businessId": 2,
  "cardType": 2,
  "label": "Mesa 1",
  "customCode": "SD-CEN-01"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "cardId": 12,
  "cardCode": "SD-CEN-01",
  "ndefUrl": "http://192.168.1.7:5000/t/SD-CEN-01",
  "status": "ASSIGNED"
}
```

### `POST /api/cardsapi/{cardId}/verify-activation`
- **Rol requerido**: SuperAdmin / Hardware Station
- **Request Body**:
```json
{
  "nfcUid": "04A1B2C3D4E5F6",
  "verifiedUrl": "http://192.168.1.7:5000/t/SD-CEN-01"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "cardCode": "SD-CEN-01",
  "status": "ACTIVE",
  "activatedAt": "2026-10-30T19:50:00Z"
}
```

