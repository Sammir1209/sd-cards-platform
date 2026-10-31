# Handoff Report - Codebase Investigation for Requirements R3 & R4
**Explorer 3: Client Information Editing and Client Management Flow**
**Date**: 2026-10-31T19:42:00Z
**Target Requirements**: R3 (Comprehensive Client Information Editing) & R4 (Client Management Flow Refactoring)

---

## 1. Observation

### A. Backend .NET Solution Architecture & Files
1. **Project Configuration**:
   - Project file: `C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\NfcMenuSaas.csproj`
   - Target Framework: `net10.0`
   - Key Dependencies:
     - `Microsoft.EntityFrameworkCore.Sqlite` (v10.0.14)
     - `Microsoft.EntityFrameworkCore.Design` (v10.0.14)
     - `Npgsql.EntityFrameworkCore.PostgreSQL` (v10.0.3)
   - Build Verification: `dotnet build NfcMenuSaas.csproj` passed with 0 warnings, 0 errors (Exit code 0).
   - Test Command: `dotnet test` executes with exit code 0 (currently 0 test projects configured).

2. **Database Context & Schema**:
   - Context: `Data/AppDbContext.cs` exposes:
     - `DbSet<Business> Businesses`
     - `DbSet<NfcCard> NfcCards`
     - `DbSet<Category> Categories`
     - `DbSet<Dish> Dishes`
   - Schema Initialization (`Data/DbInitializer.cs`, lines 33-73):
     Already includes SQLite column injection for `Businesses`:
     - `Ruc` (TEXT)
     - `Department` (TEXT)
     - `Province` (TEXT)
     - `District` (TEXT)
     - `PlanMonths` (INTEGER DEFAULT 12)
     - `PlanExpiryDate` (TEXT)
   - PostgreSQL Supabase Schema (`Data/supabase_schema.sql`, lines 9-28):
     The PostgreSQL table `Businesses` currently does not yet declare `Ruc`, `Department`, `Province`, `District`, `PlanMonths`, or `PlanExpiryDate`.

3. **Client Entity (`Models/Business.cs`)**:
   - File: `Models/Business.cs` (lines 5-95)
   - Current properties:
     - `int Id`
     - `string Name`
     - `string Slug`
     - `string? CustomDomain`
     - `TemplateType TemplateType`
     - `BusinessSector Sector`
     - `string? City`
     - `string? Address`
     - `string? GooglePlaceId`
     - `string? OwnerName`
     - `string? OwnerPhone`
     - `string? OwnerEmail`
     - `string? AccessPassword`
     - `string? GoogleMapsUrl`
     - `bool AutoRedirectReviews`
     - `string? LogoUrl`
     - `string PrimaryColor`
     - `bool IsActive`
     - `bool IsArchived`
     - `bool WhatsappOptIn`
     - `DateTime? LastNotificationAt`
     - `DateTime CreatedAt`
     - `int ActiveRoutingMode`
     - `string? WifiPassword`
     - Navigation: `ICollection<Category> Categories`, `ICollection<NfcCard> Cards`
   - **Critical Gap**: `Business.cs` lacks the C# properties:
     - `string? Ruc`
     - `string? Department`
     - `string? Province`
     - `string? District`
     - `int PlanMonths`
     - `DateTime? PlanExpiryDate`
   - Because these properties do not exist on the C# model, EF Core does not map them, preventing API controllers from reading or writing them.

4. **API Endpoints in `Controllers/Api/BusinessApiController.cs`**:
   - `GET /api/businessapi`: Returns list of businesses (lines 20-45). Projected fields:
     `Id, Name, Slug, OwnerName, OwnerPhone, OwnerEmail, AccessPassword, City, Address, TemplateType, IsActive, IsArchived, WhatsappOptIn, LastNotificationAt, CardsCount = b.Cards.Count`.
     *Missing*: `Ruc`, `Department`, `Province`, `District`, `PlanMonths`, `PlanExpiryDate`, `TotalTaps`.
   - `GET /api/businessapi/{id:int}`: Returns single business with cards (lines 48-85).
     *Missing*: `Ruc`, `Department`, `Province`, `District`, `PlanMonths`, `PlanExpiryDate`.
   - `POST /api/businessapi/login`: Authenticates SuperAdmin and Buyer (lines 87-138).
   - `POST /api/businessapi/register`: Registers a business (lines 140-197).
     In `RegisterBusinessRequest` (lines 435-445): `string? Ruc` is present in the record definition, but in lines 167-179 `new Business` does not assign `Ruc` because property does not exist on `Business`. `PlanMonths` is not even part of `RegisterBusinessRequest`.
   - `POST /api/businessapi/{id:int}/toggle-status`:
     Toggles `business.IsActive = !business.IsActive` and `business.IsArchived = !business.IsActive`. Cascades to cards: sets status to `CardStatus.ACTIVE` (`IsActive=true`) or `CardStatus.SUSPENDED` (`IsActive=false`). Returns `{ success = true, isActive, isArchived, message }`.
   - `DELETE /api/businessapi/{id:int}?permanent={bool}`: Soft or hard delete (lines 252-281).
   - `PUT /api/businessapi/{id:int}/update-password`: Updates `AccessPassword` (lines 286-305).
   - `PUT /api/businessapi/{id:int}/routing`: Updates routing parameters (lines 310-388).
   - `PUT /api/businessapi/{id:int}/template-type`: Updates `TemplateType` (lines 393-420).
   - **Critical Gap**: **No endpoint exists to update general client details (`PUT /api/businessapi/{id}`).**
   - **Critical Gap**: **No plan renewal endpoint exists (`POST /api/businessapi/{id}/renew-plan`).**

---

### B. Mobile React Native Project (`sd_cards_mobile`)
1. **Project Configuration & Tooling**:
   - Location: `sd_cards_mobile/`
   - React Native: `0.88.1`, Expo: `~58.0.21`, React: `19.3.0`, TypeScript: `~6.0.3`
   - Compilation Verification: `cd sd_cards_mobile; npx tsc --noEmit` passed with 0 errors (Exit code 0).

2. **Screens and Component Structure**:
   - Root: `App.tsx` handles `session` state (`superadmin` vs `buyer`).
     - SuperAdmin renders `src/screens/admin/SuperAdminScreen.tsx`.
     - Buyer renders `src/screens/buyer/BuyerPortalScreen.tsx`.
   - `SuperAdminScreen.tsx` is a 2706-line monolith with 5 tab views:
     - Tab 0: Panel Principal (Dashboard)
     - Tab 1: Clientes (Client directory & card management) (lines 735-948)
     - Tab 2: Taller NFC (Hardware recording station)
     - Tab 3: Auditoría & Logs
     - Tab 4: Ajustes
   - **Modularity Finding**: There are currently NO separate component files such as `ClientList.tsx`, `ClientCard.tsx`, or `ClientModal.tsx`. The entire client management flow is rendered inline in `SuperAdminScreen.tsx`.

3. **Current Client Search & Filter Capabilities (`SuperAdminScreen.tsx`, lines 575-585, 754-798)**:
   - Instant search:
     ```typescript
     const filteredBusinesses = businesses.filter(b => {
       const matchSearch =
         b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         (b.slug && b.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
         (b.city && b.city.toLowerCase().includes(searchQuery.toLowerCase()));
       if (!matchSearch) return false;
       if (clientFilter === 'active') return b.isActive && !b.isArchived;
       if (clientFilter === 'suspended') return !b.isActive || b.isArchived;
       return true;
     });
     ```
   - Search only checks `name`, `slug`, and `city`. It fails to search by RUC/DNI, phone number, owner name, department, province, or district.
   - Filtering only supports three static pills: `Todos`, `Activos`, `Pausados`.
   - **Missing Filters (R4)**:
     - No filtering by expiration date / status (`Vencidos`, `Por Vencer` <= 30 days).
     - No location filtering (e.g. by Department or Province).

4. **Current Client Card Structure & Metrics (`SuperAdminScreen.tsx`, lines 801-945)**:
   - Header displays: Avatar, `biz.name`, `{biz.ownerEmail || 'Sin correo'} • {biz.phone || 'Sin tel'}`, and badge `{isActive ? 'ACTIVO' : 'PAUSADO'}`.
     - *Defect observed*: Line 818 references `biz.phone`, but the backend API returns `ownerPhone`, causing the card to display "Sin tel" for all businesses.
   - Mini stats display: `{biz.cardsCount || 0} tarjetas`, `{biz.totalTaps || 0} lecturas`, `Plan {biz.planMonths || 12}m`.
     - *Defect observed*: Backend `GetAll` did not compute or return `totalTaps`, so it consistently displays `0 lecturas`.
   - Expandability:
     - The card only expands to show "Tarjetas en Sala" (`buyerCards`) when "Ver Tarjetas" is clicked.
     - It does NOT expand to reveal full client metrics (detailed address, location breakdown, RUC, expiration countdown, plan renewal history).

5. **Current Client Edit Modal**:
   - **DOES NOT EXIST**. There is no edit modal in the mobile app.
   - Only a "Crear Cliente" modal (`showCreateBizModal`, lines 1308-1520) exists.

6. **Current Quick Actions on Client Card (`SuperAdminScreen.tsx`, lines 847-880)**:
   - Action 1: "Credenciales" -> Triggers `openWhatsApp(biz.phone, 'credentials', biz)`. (Defect: `biz.phone` is undefined; also it only attempts external WhatsApp launch without in-app copyable credentials modal).
   - Action 2: "Pausar" / "Activar" -> Triggers `handleToggleBusinessStatus(biz)` which calls `api.toggleBusinessStatus(biz.id)`. (Operates correctly).
   - Action 3: "Ver Tarjetas" / "Ocultar Tarjetas" -> Toggles `selectedBuyer` to expand/collapse card list.
   - **Missing Quick Actions (R4)**:
     - "Renovar plan": No button or modal exists to extend plan duration.
     - "Editar cliente": No button exists to edit client profile.
     - "Agregar tarjeta": Currently only accessible inside the expanded card sub-list (`addCardInExpBtn`), not as an immediate client quick action.
     - "Ver credenciales": In-app modal with one-touch clipboard copy is missing.

7. **API Service (`src/services/api.ts`)**:
   - Endpoints implemented: `login`, `getBusinesses`, `getBusinessById`, `registerBusiness`, `deleteBusiness`, `updateBusinessPassword`, `updateBusinessTemplateType`, `updateBusinessRouting`, `toggleBusinessStatus`, and card NFC methods.
   - Missing methods:
     - `updateBusiness(id: number, data: UpdateBusinessData)`
     - `renewBusinessPlan(id: number, additionalMonths: number)`

---

## 2. Logic Chain

1. **Premise 1 (R3 Requirement)**: R3 specifies: *"Provide full editing capabilities for client profiles in both the mobile interface and backend .NET Web API, allowing updates to business name, phone number, RUC/DNI, department, province, district, active/paused status, and plan duration, persisting all changes to the database."*
   - Observation: `Models/Business.cs` lacks `Ruc`, `Department`, `Province`, `District`, `PlanMonths`, and `PlanExpiryDate`.
   - Observation: `DbInitializer.cs` has already added these columns to SQLite, but the EF entity does not map them.
   - Observation: `BusinessApiController.cs` lacks a `PUT /api/businessapi/{id}` endpoint and has no DTO for editing these fields.
   - Observation: `sd_cards_mobile` lacks an edit modal and lacks `api.updateBusiness`.
   - Inference: To satisfy R3, the backend model must be updated with the 6 properties, `DbInitializer` and `supabase_schema.sql` must ensure consistency, a `PUT /api/businessapi/{id}` endpoint must be added to persist all fields, and the mobile app must add `api.updateBusiness` and a unified `ClientEditModal`.

2. **Premise 2 (R4 Requirement)**: R4 specifies: *"Refactor the client management interface and workflow to provide instant search, advanced filtering (by status, expiration date, and location), expandable cards displaying client metrics, a unified edit modal, and quick operational actions (renew plan, add card, view credentials, toggle status)."*
   - Observation: `SuperAdminScreen.tsx` currently has simple search (name, slug, city only) and simple 3-way status filter (`all`, `active`, `suspended`).
   - Observation: There is no filtering by expiration date or location.
   - Observation: Client cards only expand to show cards, not metrics or client profile.
   - Observation: Quick actions lack `renew plan`, `edit client`, on-screen `view credentials`, and direct `add card`.
   - Inference: Refactoring the client management flow requires:
     1. Enhancing search to match `name`, `ruc`, `ownerPhone`, `ownerName`, `department`, `province`, `district`.
     2. Adding advanced filters: Status (`all`, `active`, `suspended`, `expired`, `expiring_soon`) and Location (Department filter).
     3. Refactoring client cards to expand with rich metrics (taps, plan status, expiration date, location hierarchy) and actions.
     4. Adding dedicated quick action buttons:
        - `Renovar Plan` -> invokes modal to add 6, 12, or 24 months.
        - `Editar` -> opens `ClientEditModal`.
        - `Credenciales` -> opens modal displaying login email and access password with copy-to-clipboard button and WhatsApp link.
        - `Agregar Tarjeta` -> opens card assignment modal for that specific client.
        - `Pausar / Activar` -> calls existing toggle endpoint.

3. **Premise 3 (Data Consistency & Bug Fixes)**:
   - Observation: The backend returns `OwnerPhone`, but mobile uses `biz.phone`.
   - Observation: The backend `GetAll` does not project `TotalTaps = b.Cards.Sum(c => c.TapCount)`.
   - Inference: Fixing these field mismatches in both backend projection and mobile typing ensures that phone numbers and tap counts display accurately without regressions.

---

## 3. Caveats

1. **No External Libraries for Modals**: Modals in React Native are implemented using standard React Native `Modal` primitives and `lucide-react-native` icons, keeping bundle size lean.
2. **Database Engine Differences**: In local development, the app uses SQLite (`nfcmenu.db`); in production, Supabase PostgreSQL (`UseNpgsql`). The columns added to SQLite in `DbInitializer.cs` must also be kept synchronized in `Data/supabase_schema.sql`.
3. **No Existing Automated Unit Tests**: `dotnet test` finds 0 test projects. Verification relies on `dotnet build` and `cd sd_cards_mobile; npx tsc --noEmit`, plus manual/endpoint API verification.

---

## 4. Conclusion & Concrete Architectural Specifications

### A. Backend .NET Solution Changes Required for R3 & R4
1. **File: `Models/Business.cs`**:
   Add properties:
   ```csharp
   [MaxLength(20)]
   public string? Ruc { get; set; }

   [MaxLength(100)]
   public string? Department { get; set; }

   [MaxLength(100)]
   public string? Province { get; set; }

   [MaxLength(100)]
   public string? District { get; set; }

   public int PlanMonths { get; set; } = 12;

   public DateTime? PlanExpiryDate { get; set; }
   ```

2. **File: `Data/supabase_schema.sql`**:
   Add safe column migrations:
   ```sql
   ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "Ruc" VARCHAR(20);
   ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "Department" VARCHAR(100);
   ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "Province" VARCHAR(100);
   ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "District" VARCHAR(100);
   ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "PlanMonths" INTEGER NOT NULL DEFAULT 12;
   ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS "PlanExpiryDate" TIMESTAMP WITH TIME ZONE;
   ```

3. **File: `Controllers/Api/BusinessApiController.cs`**:
   - Update `GetAll`:
     Include `b.Ruc`, `b.Department`, `b.Province`, `b.District`, `b.PlanMonths`, `b.PlanExpiryDate`, and `TotalTaps = b.Cards.Sum(c => (int?)c.TapCount) ?? 0`. Also project both `phone = b.OwnerPhone` and `ownerPhone = b.OwnerPhone` for backwards compatibility.
   - Update `GetById`:
     Include `b.Ruc`, `b.Department`, `b.Province`, `b.District`, `b.PlanMonths`, `b.PlanExpiryDate`.
   - Update `Register`:
     Save `request.Ruc`, `request.Department`, `request.Province`, `request.District`, `request.PlanMonths`, and compute `business.PlanExpiryDate = DateTime.UtcNow.AddMonths(months)`.
   - Implement `PUT /api/businessapi/{id:int}`:
     ```csharp
     [HttpPut("{id:int}")]
     public async Task<IActionResult> UpdateBusiness(int id, [FromBody] UpdateBusinessRequest request)
     {
         var b = await _context.Businesses.FirstOrDefaultAsync(x => x.Id == id);
         if (b == null) return NotFound(new { error = "Negocio no encontrado." });

         if (!string.IsNullOrWhiteSpace(request.Name)) b.Name = request.Name.Trim();
         if (request.OwnerName != null) b.OwnerName = request.OwnerName.Trim();
         if (request.Phone != null) b.OwnerPhone = request.Phone.Trim();
         if (request.Email != null) b.OwnerEmail = request.Email.Trim().ToLower();
         if (request.Ruc != null) b.Ruc = request.Ruc.Trim();
         if (request.Department != null) b.Department = request.Department.Trim();
         if (request.Province != null) b.Province = request.Province.Trim();
         if (request.District != null) b.District = request.District.Trim();
         if (request.City != null) b.City = request.City.Trim();
         if (request.Address != null) b.Address = request.Address.Trim();
         if (request.IsActive.HasValue) b.IsActive = request.IsActive.Value;
         if (request.PlanMonths.HasValue && request.PlanMonths.Value > 0)
         {
             b.PlanMonths = request.PlanMonths.Value;
         }
         if (request.PlanExpiryDate.HasValue)
         {
             b.PlanExpiryDate = request.PlanExpiryDate.Value;
         }

         await _context.SaveChangesAsync();
         return Ok(new { success = true, business = b });
     }
     ```
   - Implement `POST /api/businessapi/{id:int}/renew-plan`:
     ```csharp
     [HttpPost("{id:int}/renew-plan")]
     public async Task<IActionResult> RenewPlan(int id, [FromBody] RenewPlanRequest request)
     {
         var b = await _context.Businesses.FirstOrDefaultAsync(x => x.Id == id);
         if (b == null) return NotFound(new { error = "Negocio no encontrado." });

         int additional = request.AdditionalMonths > 0 ? request.AdditionalMonths : 12;
         DateTime baseDate = (b.PlanExpiryDate.HasValue && b.PlanExpiryDate.Value > DateTime.UtcNow)
             ? b.PlanExpiryDate.Value
             : DateTime.UtcNow;

         b.PlanExpiryDate = baseDate.AddMonths(additional);
         b.PlanMonths += additional;
         if (!b.IsActive)
         {
             b.IsActive = true;
             b.IsArchived = false;
         }

         await _context.SaveChangesAsync();
         return Ok(new { success = true, planExpiryDate = b.PlanExpiryDate, planMonths = b.PlanMonths, isActive = b.IsActive });
     }
     ```
   - DTO Records:
     ```csharp
     public record UpdateBusinessRequest(
         string? Name,
         string? OwnerName,
         string? Email,
         string? Phone,
         string? Ruc,
         string? Department,
         string? Province,
         string? District,
         string? City,
         string? Address,
         bool? IsActive,
         int? PlanMonths,
         DateTime? PlanExpiryDate
     );

     public record RenewPlanRequest(int AdditionalMonths);
     ```

### B. Mobile React Native Project Changes Required for R3 & R4
1. **File: `src/services/api.ts`**:
   Add client editing and plan renewal methods:
   - `updateBusiness(id: number, data: Partial<ClientUpdateData>)` -> `PUT /businessapi/${id}`
   - `renewPlan(id: number, additionalMonths: number)` -> `POST /businessapi/${id}/renew-plan`

2. **File: `src/components/ClientEditModal.tsx` (New Component)**:
   - Form fields:
     - Business Name (`name`)
     - Owner Name (`ownerName`)
     - RUC / DNI (`ruc`)
     - Phone WhatsApp (`ownerPhone` / `phone`)
     - Cascading Ubigeo Selectors: Department -> Province -> District (using `PERU_DEPARTMENTS`)
     - Address (`address`)
     - Status Toggle: Activo vs Pausado
     - Plan Duration Selection: 6, 12, 24 months
   - Save handler: Calls `api.updateBusiness` and triggers refresh callback.

3. **File: `src/components/ClientCredentialsModal.tsx` (New Component)**:
   - Displays Login Email & Access Password clearly with:
     - One-touch copy to clipboard (`Clipboard.setStringAsync`)
     - WhatsApp share button
     - Close button

4. **File: `src/components/RenewPlanModal.tsx` (New Component)**:
   - Displays client name, current expiration date, and status.
   - Duration options: +6 Meses, +12 Meses (1 Año), +24 Meses (2 Años).
   - On confirmation: Calls `api.renewPlan(bizId, months)` and displays success feedback.

5. **File: `src/screens/admin/SuperAdminScreen.tsx` (Tab 1 Refactoring)**:
   - **Instant Search**:
     Matches against: `name`, `ruc`, `ownerName`, `phone`, `ownerPhone`, `ownerEmail`, `city`, `department`, `province`, `district`.
   - **Advanced Filters**:
     - Status filters: `Todos`, `Activos`, `Pausados`, `Vencidos`, `Por Vencer (<= 30d)`.
     - Location filter: Department selector chip/modal to filter clients by department.
   - **Expandable Client Cards**:
     - Card preview: Business name, status badge (with colors: Green=Activo, Amber=Por Vencer, Red=Vencido, Gray=Pausado), days remaining badge (`Vence en X días`), location tag (`Lima - Miraflores`), card count, tap count.
     - Expand toggle: Reveals full business details (RUC, full address, owner, credentials shortcut), cards list, and management tools.
   - **Quick Actions Toolbar on Card**:
     - `Editar` -> Opens `ClientEditModal`.
     - `Renovar` -> Opens `RenewPlanModal`.
     - `Credenciales` -> Opens `ClientCredentialsModal`.
     - `+ Tarjeta` -> Opens `showAddCardModal` preselected for this business.
     - `Pausar / Activar` -> Calls `handleToggleBusinessStatus(biz)`.

---

## 5. Verification Method

1. **Backend Verification**:
   - Execute from project root:
     ```powershell
     dotnet build NfcMenuSaas.csproj
     ```
     *Success condition*: Exits with code 0, 0 warnings, 0 errors.
   - Verify SQLite columns: Inspect `nfcmenu.db` table `Businesses` to confirm `Ruc`, `Department`, `Province`, `District`, `PlanMonths`, `PlanExpiryDate` exist.
   - Verify API Endpoints via HTTP requests (or integration test):
     - `PUT /api/businessapi/{id}` returns 200 OK with updated entity.
     - `POST /api/businessapi/{id}/renew-plan` returns 200 OK with updated `planExpiryDate`.

2. **Mobile TypeScript Verification**:
   - Execute from `sd_cards_mobile/`:
     ```powershell
     cd "C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile"
     npx tsc --noEmit
     ```
     *Success condition*: Exits with code 0 and no TypeScript errors.

3. **Invalidation Conditions**:
   - Any modification to `Models/Business.cs` that fails `dotnet build`.
   - Any missing property in `UpdateBusinessRequest` preventing updates to RUC, Ubigeo, or Plan duration.
   - Any TypeScript type errors introduced in `SuperAdminScreen.tsx` or new modal components.
