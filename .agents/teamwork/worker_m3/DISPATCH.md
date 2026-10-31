## 2026-10-31T20:26:03Z
You are Worker M3 (Full-Stack Developer for Comprehensive Client Information Editing).
Your working directory: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\worker_m3
Original Request path: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\PROJECT.md
Explorer findings path: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INSTRUCTIONS:
1. You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and explorer_survey_3/handoff.md before starting work.
2. Exclusive write ownership:
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\Models\Business.cs
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\Data\supabase_schema.sql
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\Controllers\Api\BusinessApiController.cs
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\src\services\api.ts
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\src\components\ClientEditModal.tsx
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\src\screens\admin\SuperAdminScreen.tsx (edit modal connection and handlers)
3. Implement Requirement R3 (Comprehensive Client Information Editing):
   a. Backend `Models/Business.cs`:
      - Add properties: `Ruc` (string?), `Department` (string?), `Province` (string?), `District` (string?), `PlanMonths` (int, default 12), `PlanExpiryDate` (DateTime?).
   b. Backend `Data/supabase_schema.sql`:
      - Add `ALTER TABLE "Businesses" ADD COLUMN IF NOT EXISTS ...` for Ruc, Department, Province, District, PlanMonths, PlanExpiryDate.
   c. Backend `Controllers/Api/BusinessApiController.cs`:
      - In `GetAll` & `GetById`: project `b.Ruc`, `b.Department`, `b.Province`, `b.District`, `b.PlanMonths`, `b.PlanExpiryDate`, `TotalTaps = b.Cards.Sum(c => (int?)c.TapCount) ?? 0`, and both `phone = b.OwnerPhone` and `ownerPhone = b.OwnerPhone`.
      - In `Register`: assign `Ruc`, `Department`, `Province`, `District`, `PlanMonths`, and compute `business.PlanExpiryDate = DateTime.UtcNow.AddMonths(planMonths)`.
      - Implement `PUT /api/businessapi/{id:int}`: receives `UpdateBusinessRequest`, updates business name, owner name, phone (`OwnerPhone`), email (`OwnerEmail`), RUC, department, province, district, city, address, active status (`IsActive`), plan months (`PlanMonths`), and plan expiry date (`PlanExpiryDate`). Awaits `_context.SaveChangesAsync()` and returns `Ok(new { success = true, business = b })`.
      - Implement `POST /api/businessapi/{id:int}/renew-plan`: receives `RenewPlanRequest(int AdditionalMonths)`, extends `PlanExpiryDate` from max(now, currentExpiry) by additional months (default 12), increases `PlanMonths`, sets `IsActive = true`, `IsArchived = false`, saves changes, and returns `Ok(new { success = true, planExpiryDate = b.PlanExpiryDate, planMonths = b.PlanMonths, isActive = b.IsActive })`.
   d. Mobile `sd_cards_mobile/src/services/api.ts`:
      - In `safeFetch`, fix header normalization: check `Array.isArray(options.headers)` BEFORE `typeof (options.headers as any).forEach === 'function'`.
      - Export `updateBusiness(id: number, data: UpdateBusinessData)` sending `PUT /businessapi/${id}`.
      - Export `renewPlan(id: number, additionalMonths: number)` sending `POST /businessapi/${id}/renew-plan`.
      - Update `Business` interface to include `ruc?`, `department?`, `province?`, `district?`, `planMonths?`, `planExpiryDate?`, `totalTaps?`, `phone?`, `ownerPhone?`.
   e. Mobile `sd_cards_mobile/src/components/ClientEditModal.tsx`:
      - Implement a complete, polished modal with:
        * Business Name input
        * Owner Name input
        * WhatsApp Phone input
        * RUC / DNI input
        * Cascading Ubigeo selectors (Department -> Province -> District using `PERU_DEPARTMENTS` and safe composite keys `${dept.id}-${prov.id}-${dist}`)
        * Address input
        * Active / Paused status switch/pills
        * Plan duration selector (6, 12, 24 months)
        * Save and Cancel buttons with loading state and error handling.
   f. Mobile `sd_cards_mobile/src/screens/admin/SuperAdminScreen.tsx`:
      - Integrate `ClientEditModal` component into the SuperAdmin screen.
      - Wire the "Editar" button on each client card to open `ClientEditModal` with that client's details.
      - On save completion: invoke `api.updateBusiness`, update client list in state, and notify the user with feedback.
4. VERIFICATION:
   - Run: `cd sd_cards_mobile; npx tsc --noEmit` and confirm 0 errors.
   - Run: `dotnet build NfcMenuSaas.csproj` and confirm 0 errors.
5. Write your handoff report to `C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\worker_m3\handoff.md`.
6. Send a message to your caller when complete.


## 2026-10-31T20:36:42Z
**Context**: Milestone M3 (Comprehensive Client Information Editing)
**Content**: Status inquiry: 10 minutes have elapsed since dispatch. Please report current progress, any blockers, and estimated time to completion.
**Action**: Send brief status update or deliver handoff report if finished.
