## 2026-10-31T20:50:13Z
You are Worker M4 (Mobile UI/UX Specialist for Client Management Flow Refactoring).
Your working directory: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\worker_m4
Original Request path: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\PROJECT.md
Explorer findings path: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INSTRUCTIONS:
1. You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and explorer_survey_3/handoff.md before starting work.
2. Exclusive write ownership:
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\src\components\ClientCredentialsModal.tsx
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\src\components\RenewPlanModal.tsx
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\src\screens\admin\SuperAdminScreen.tsx
3. Implement Requirement R4 (Client Management Flow Refactoring):
   a. Create `sd_cards_mobile/src/components/ClientCredentialsModal.tsx`:
      - Polished modal displaying client credentials:
        * Business Name
        * Login Email (with 1-touch copy button)
        * Access Password (with 1-touch copy button and show/hide toggle)
        * Full credentials copy button (copies formatted WhatsApp-friendly message)
        * WhatsApp share button (`Linking.openURL('https://wa.me/...')`)
        * Close button
   b. Create `sd_cards_mobile/src/components/RenewPlanModal.tsx`:
      - Polished modal for renewing plan duration:
        * Displays client name, current expiration date (formatted), and active/expired status.
        * Duration options: +6 Meses, +12 Meses (1 Año), +24 Meses (2 Años).
        * Action buttons: Confirmar Renovación (calls `api.renewPlan(business.id, months)`) and Cancel.
        * Loading state, error handling banner, and `onSuccess` callback.
   c. Refactor Tab 1 (Clientes) in `sd_cards_mobile/src/screens/admin/SuperAdminScreen.tsx`:
      - Instant Search:
        * Multi-field search matching across: `name`, `ruc`, `ownerName`, `phone`, `ownerPhone`, `ownerEmail`, `city`, `department`, `province`, `district`.
      - Advanced Multi-Criteria Filters:
        * Status filters: `Todos`, `Activos`, `Pausados`, `Vencidos`, `Por Vencer` (expiry date <= 30 days from now).
        * Location filter: Department selector horizontal scroll / modal chip allowing filtering by specific department using `PERU_DEPARTMENTS`.
      - Expandable Client Cards:
        * Preview summary: Business name, status badge (Active: Green, Expiring soon: Amber, Expired: Red, Paused: Gray), days remaining badge (`Vence en X días` or `Vencido`), location tag, cards count, tap count (`totalTaps`).
        * Expand/Collapse toggle: reveals full details (RUC, full address, owner name, owner phone, email, card list).
      - Quick Operational Actions Bar on each client card:
        * `Editar` -> opens `ClientEditModal`
        * `Renovar` -> opens `RenewPlanModal`
        * `Credenciales` -> opens `ClientCredentialsModal`
        * `+ Tarjeta` -> opens card assignment modal preselected for this client
        * `Pausar / Activar` -> calls `handleToggleBusinessStatus(biz)`
4. VERIFICATION:
   - Run: `cd sd_cards_mobile; npx tsc --noEmit` and confirm 0 errors.
   - Run: `dotnet build NfcMenuSaas.csproj` and confirm 0 errors.
5. Write your handoff report to `C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\worker_m4\handoff.md`.
6. Send a message to your caller when complete.


## 2026-10-31T21:00:47Z
**Context**: Milestone M4 (Client Management Flow Refactoring)
**Content**: Status inquiry: 10 minutes have elapsed since dispatch. Please report current progress, any blockers, and estimated time to completion.
**Action**: Send brief status update or deliver handoff report if finished.
