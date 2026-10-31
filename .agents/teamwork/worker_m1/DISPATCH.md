## 2026-10-31T19:45:39Z
You are Worker M1 (Full-Stack Developer for Persistent Authentication Session).
Your working directory: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\worker_m1
Original Request path: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\PROJECT.md
Explorer findings path: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\explorer_survey_1\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INSTRUCTIONS:
1. You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and explorer_survey_1/handoff.md before making changes.
2. Exclusive write ownership:
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\src\services\authStorage.ts
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\src\services\api.ts
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\App.tsx
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\Controllers\Api\BusinessApiController.cs (Login endpoint)
3. Implement Requirement R1 (Persistent Authentication Session):
   a. Create `sd_cards_mobile/src/services/authStorage.ts`:
      - Implement using `@react-native-async-storage/async-storage` (key: `@sd_cards_auth_session`).
      - Define typed `StoredSession` interface: `{ isAuthenticated: boolean; email: string; role: 'superadmin' | 'buyer'; businessId?: number; token?: string; businessName?: string; ownerName?: string; slug?: string }`.
      - Export `saveSession(session: StoredSession): Promise<void>`.
      - Export `getSession(): Promise<StoredSession | null>`.
      - Export `clearSession(): Promise<void>`.
   b. Upgrade `sd_cards_mobile/src/services/api.ts`:
      - Maintain module-level `currentAuthToken` and `onUnauthorizedCallback`.
      - Export `setAuthToken(token: string | null)`.
      - Export `setOnUnauthorized(callback: () => void)`.
      - In `safeFetch`, inject `Authorization: Bearer <token>` when `currentAuthToken` is present and header is not explicitly overridden.
      - In `safeFetch`, if `res.status === 401`, trigger `onUnauthorizedCallback?.()`.
      - In `api.login`, update return type and pass token if present.
   c. Refactor `sd_cards_mobile/App.tsx`:
      - In startup `useEffect`: asynchronously call `AuthStorage.getSession()`. If a valid persisted session exists, call `api.setAuthToken(stored.token || null)` and `setSession(stored)`. Ensure `isAppLoading` is set to `false` so the app immediately renders `SuperAdminScreen` or `BuyerPortalScreen`, bypassing `LoginScreen`.
      - In `handleLogin`: call `await AuthStorage.saveSession(...)`, set `api.setAuthToken(...)`, and update `session` state.
      - In `handleLogout`: call `await AuthStorage.clearSession()`, call `api.setAuthToken(null)`, and reset `session` state to unauthenticated, returning cleanly to `LoginScreen`.
      - Register `api.setOnUnauthorized(handleLogout)`.
   d. Update `Controllers/Api/BusinessApiController.cs`:
      - In `Login` action, return `token = "SD-AUTH-" + Guid.NewGuid().ToString("N")` in both superadmin and buyer JSON responses.
4. VERIFICATION:
   - Run: `cd sd_cards_mobile; npx tsc --noEmit` and confirm 0 errors.
   - Run: `dotnet build NfcMenuSaas.csproj` and confirm 0 errors.
5. Write your handoff report to `C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\worker_m1\handoff.md`. Include all build output and verification commands.
6. Send a message to your caller when complete.
