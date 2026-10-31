# Project: Reseñas Cards — Multi-Platform Client & Session Management

## Architecture
- **Backend**: ASP.NET Core Web API (.NET 10.0), Entity Framework Core (SQLite in dev, PostgreSQL/Supabase compatible). RESTful API endpoints under `/api/businessapi`.
- **Mobile**: React Native / Expo application (`sd_cards_mobile`), TypeScript, stateful component architecture with async local storage persistence (`@react-native-async-storage/async-storage`).
- **Data Flow**:
  - Auth Flow: `LoginScreen` -> `api.login` -> `/api/businessapi/login` -> Auth token & user metadata -> `authStorage.saveSession` -> `App.tsx` session state -> conditional rendering of `SuperAdminScreen` / `BuyerPortalScreen`.
  - Ubigeo Flow: `sd_cards_mobile/src/data/peruLocations.ts` -> 25 departments (24 + Callao) -> Cascading picker in Client Creation and `ClientEditModal` -> Backend `Department`, `Province`, `District`, `City` persistence.
  - Client Management Flow: `SuperAdminScreen` (Tab 1: Clientes) -> instant search & multi-filter (status, expiration, department) -> expandable client card with metrics -> quick actions (Edit modal, Renew modal, Credentials modal, Add card, Toggle status) -> `api.ts` -> `/api/businessapi` endpoints -> SQLite / EF Core.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Auth Storage Service | Encapsulated storage service using AsyncStorage for session persistence and retrieval | M1 | R1, survey_1 |
| 2 | App Bootstrap Session Check | App startup inspects AsyncStorage and restores session, bypassing LoginScreen unless logged out | M1 | R1, survey_1 |
| 3 | Explicit Logout Cleanup | Logout button clears local storage session, nullifies auth token, and returns to LoginScreen | M1 | R1, survey_1 |
| 4 | HTTP Client Auth & 401 Interceptor | safeFetch injects Bearer token into headers and evicts session on 401 Unauthorized | M1 | R1, survey_1 |
| 5 | Backend Auth Token Generation | /api/businessapi/login returns authentication token in response object | M1 | R1, survey_1 |
| 6 | Standard Peru 25-Region Catalog | peruLocations.ts expanded to 24 departments + Callao, all 196 provinces and principal districts | M2 | R2, survey_2 |
| 7 | Ubigeo Helper Functions | getDepartments, getProvinces, getDistricts, and parseLocationCity utilities | M2 | R2, survey_2 |
| 8 | Safe Cascading Pickers | Safe navigation, compound keys `${dept.id}-${prov.id}-${dist}`, and defensive fallbacks in location selectors | M2 | R2, survey_2 |
| 9 | Backend Business Model Expansion | Add Ruc, Department, Province, District, PlanMonths, PlanExpiryDate properties to Models/Business.cs | M3 | R3, survey_3 |
| 10 | Backend Schema Alignment | Sync SQLite and supabase_schema.sql with new client columns | M3 | R3, survey_3 |
| 11 | Backend Client Projection Updates | GetAll and GetById endpoints return Ruc, Ubigeo hierarchy, Plan duration/expiry, and TotalTaps | M3 | R3, survey_3 |
| 12 | Backend Client Update Endpoint | PUT /api/businessapi/{id} endpoint persisting full client profile changes | M3 | R3, survey_3 |
| 13 | Backend Plan Renewal Endpoint | POST /api/businessapi/{id}/renew-plan endpoint extending plan expiry and months | M3 | R3, survey_3 |
| 14 | Mobile API Client Extensions | api.updateBusiness and api.renewPlan methods added to src/services/api.ts | M3 | R3, survey_3 |
| 15 | Mobile Client Edit Modal | Comprehensive ClientEditModal component with name, phone, RUC/DNI, Ubigeo cascade, status, plan months | M3 | R3, survey_3 |
| 16 | Mobile Client Instant Search | Multi-field search across name, RUC, owner, phone, email, city, and Ubigeo | M4 | R4, survey_3 |
| 17 | Mobile Advanced Client Filtering | Filter pills by status (all, active, paused, expired, expiring_soon) and location (Department) | M4 | R4, survey_3 |
| 18 | Expandable Client Cards | Card header summary + expandable body revealing client metrics, full address, and details | M4 | R4, survey_3 |
| 19 | Client Credentials Modal | In-app modal displaying login email and password with 1-touch copy and WhatsApp share | M4 | R4, survey_3 |
| 20 | Client Plan Renewal Modal | Quick renewal modal for +6, +12, +24 months with immediate API update | M4 | R4, survey_3 |
| 21 | Quick Operational Actions Bar | Toolbar on card with Edit, Renew, Credentials, + Card, and Pause/Activate toggles | M4 | R4, survey_3 |
| 22 | End-to-End Build & Validation | Clean compilation of .NET solution and TypeScript without warnings or errors | Final | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Persistent Authentication Session | Features 1-5 (authStorage, App bootstrap, explicit logout, api interceptor, backend token) | none | DONE |
| M2 | Peru Ubigeo Location Dataset | Features 6-8 (peruLocations 25 regions, helper utils, safe cascading pickers) | none | DONE |
| M3 | Comprehensive Client Information Editing | Features 9-15 (Business.cs model, backend PUT endpoint, renew endpoint, api.ts, ClientEditModal) | M2 | DONE |
| M4 | Client Management Flow Refactoring | Features 16-21 (Instant search, multi-filters, expandable metric cards, credentials modal, renew modal, quick actions) | M1, M3 | IN_PROGRESS |
| Final | Full Verification & Adversarial Hardening | Feature 22 (dotnet build, npx tsc, verification of all acceptance criteria, adversarial audit) | M1, M2, M3, M4 | PLANNED |

## Interface Contracts
### Auth Storage ↔ App Bootstrap
- `AuthStorage.saveSession(session: StoredSession): Promise<void>`
- `AuthStorage.getSession(): Promise<StoredSession | null>`
- `AuthStorage.clearSession(): Promise<void>`
- `api.setAuthToken(token: string | null): void`
- `api.setOnUnauthorized(callback: () => void): void`

### Ubigeo Dataset ↔ Mobile Components
- `PERU_DEPARTMENTS: PeruDepartment[]` (25 regions: 24 departments + Callao)
- `getDepartments(): { id: string; name: string }[]`
- `getProvinces(deptId: string): PeruProvince[]`
- `getDistricts(deptId: string, provId: string): string[]`
- `parseLocationCity(city?: string): { deptId: string; provId: string; districtName: string }`

### Mobile Client ↔ Backend .NET Web API
- `PUT /api/businessapi/{id}`
  - Body: `{ name?, ownerName?, email?, phone?, ruc?, department?, province?, district?, city?, address?, isActive?, planMonths?, planExpiryDate? }`
  - Response: `{ success: true, business: Business }`
- `POST /api/businessapi/{id}/renew-plan`
  - Body: `{ additionalMonths: number }`
  - Response: `{ success: true, planExpiryDate: string, planMonths: number, isActive: boolean }`
- `POST /api/businessapi/{id}/toggle-status`
  - Response: `{ success: true, isActive: boolean, isArchived: boolean, message: string }`

## Code Layout
### Backend (`.`)
- `Models/Business.cs`: Client entity with Ruc, Department, Province, District, PlanMonths, PlanExpiryDate.
- `Data/AppDbContext.cs`: EF Core DbContext.
- `Data/DbInitializer.cs`: SQLite schema initializer with column migrations.
- `Data/supabase_schema.sql`: PostgreSQL schema definitions.
- `Controllers/Api/BusinessApiController.cs`: API controller with CRUD, status toggle, plan renewal, auth.

### Mobile (`sd_cards_mobile/`)
- `src/services/authStorage.ts`: AsyncStorage session manager.
- `src/services/api.ts`: API service with token injection, 401 handling, client update, plan renewal.
- `src/data/peruLocations.ts`: 25-region Ubigeo dataset and query helpers.
- `src/components/ClientEditModal.tsx`: Comprehensive client profile edit modal.
- `src/components/ClientCredentialsModal.tsx`: In-app credentials view and copy modal.
- `src/components/RenewPlanModal.tsx`: Plan renewal modal.
- `src/screens/admin/SuperAdminScreen.tsx`: Refactored Tab 1 client management screen with instant search, multi-filters, and expandable cards.
- `App.tsx`: App root with persistent auth restoration lifecycle and explicit logout.
