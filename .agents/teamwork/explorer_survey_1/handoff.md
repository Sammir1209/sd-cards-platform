# Handoff Report: Requirement R1 (Persistent Authentication Session)

## 1. Observation

### 1.1 Mobile Project Structure & Storage Dependencies
- **Project Location**: `sd_cards_mobile` (Expo ~58.0.21, React 19.3.0, React Native 0.88.1, TypeScript ~6.0.3).
- **Dependency Inspection in `sd_cards_mobile/package.json`**:
  - Line 7: `"@react-native-async-storage/async-storage": "2.2.0"`
  - Verified directory exists in `node_modules/@react-native-async-storage/async-storage`.
  - No `expo-secure-store` or `react-native-mmkv` installed.
  - No React Navigation (`@react-navigation/native`) or Expo Router installed; the application uses conditional component rendering for screen routing based on top-level state in `sd_cards_mobile/App.tsx`.
- **AsyncStorage Usage Scan**:
  - `grep_search` for `AsyncStorage` across `sd_cards_mobile/src` returned 0 occurrences. The library is installed as a project dependency but has not been imported or integrated into the application codebase.

### 1.2 Authentication State & Login Flow
- **Session State in `sd_cards_mobile/App.tsx` (Lines 26–35)**:
  ```typescript
  const [session, setSession] = useState<{
    isAuthenticated: boolean;
    email: string;
    role: 'superadmin' | 'buyer';
    businessId?: number;
  }>({
    isAuthenticated: false,
    email: '',
    role: 'buyer'
  });
  ```
- **Login Handler in `sd_cards_mobile/App.tsx` (Lines 54–61)**:
  ```typescript
  const handleLogin = (email: string, role: 'superadmin' | 'buyer', businessId?: number) => {
    setSession({
      isAuthenticated: true,
      email,
      role,
      businessId: businessId || 1
    });
  };
  ```
- **Login Screen Submission in `sd_cards_mobile/src/screens/auth/LoginScreen.tsx` (Lines 46–53)**:
  ```typescript
  const res = await api.login({ email: email.trim(), password: password.trim() });
  setLoading(false);

  if (res.success && res.data) {
    onLogin(res.data.email || email.trim(), res.data.role, res.data.businessId);
  } else {
    setErrorMsg(res.error || 'Credenciales invalidas o cuenta suspendida.');
  }
  ```
- **API Call in `sd_cards_mobile/src/services/api.ts` (Lines 41–57)**:
  `api.login` issues a POST request to `/businessapi/login` without setting or persisting any token or session state.

### 1.3 Application Bootstrap & Startup Lifecycle
- **Entry Point**: `sd_cards_mobile/index.ts` lines 1–8:
  `registerRootComponent(App);`
- **Startup Hook in `sd_cards_mobile/App.tsx` (Lines 23, 37–52)**:
  ```typescript
  const [isAppLoading, setIsAppLoading] = useState(true);
  ...
  useEffect(() => {
    // Solicitar permisos nativos de notificaciones en el arranque
    NotificationService.requestNotificationPermissions();

    // Comprobar actualizaciones del sistema en segundo plano
    UpdateService.checkForUpdates().then(res => {
      if (res) {
        setUpdateInfo(res);
      }
    });

    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  ```
- **Rendering Condition in `sd_cards_mobile/App.tsx` (Lines 72–84)**:
  ```typescript
  // PANTALLA DE CARGA (SPLASH) INTERACTIVA
  if (isAppLoading) {
    return <SplashScreen />;
  }

  // PANTALLA DE LOGIN
  if (!session.isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaView>
    );
  }
  ```
  `isAppLoading` defaults to `true`, rendering `SplashScreen`. After 2000ms, `setIsAppLoading(false)` executes. Because `session.isAuthenticated` defaults to `false` and is never restored from storage during startup, the app immediately switches to `<LoginScreen />` on every launch or relaunch.

### 1.4 Logout Implementation
- **Logout Handler in `sd_cards_mobile/App.tsx` (Lines 63–69)**:
  ```typescript
  const handleLogout = () => {
    setSession({
      isAuthenticated: false,
      email: '',
      role: 'buyer'
    });
  };
  ```
- **Logout Trigger in `sd_cards_mobile/App.tsx` (Lines 106–108)**:
  ```typescript
  <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
    <LogOut size={16} color={MONIQ.textSecondary} />
  </TouchableOpacity>
  ```
  `handleLogout` only mutates transient React component state. No storage removal operation is invoked. Navigation resets to `LoginScreen` purely because `!session.isAuthenticated` evaluates to true upon state change.

### 1.5 HTTP Client & Token Interceptors
- **HTTP Client in `sd_cards_mobile/src/services/api.ts` (Lines 9–37)**:
  ```typescript
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
  ```
  - **No Authorization header**: `safeFetch` passes `options` straight to `fetch` without injecting `Authorization: Bearer <token>`.
  - **No 401 Unauthorized handling**: If `res.status === 401`, it is logged as a standard error and returned as `{ success: false, error }`. No callback is triggered to evict expired sessions or force logout navigation.

### 1.6 Backend Login Endpoint
- **Endpoint**: `Controllers/Api/BusinessApiController.cs` (Lines 87–138):
  - SuperAdmin route (Line 97):
    Returns `{ success = true, role = "superadmin", email = cleanEmail, name = "Samir Conter" }`.
  - Client route (Line 127):
    Returns `{ success = true, role = "buyer", businessId = business.Id, businessName = business.Name, ownerName = business.OwnerName, email = business.OwnerEmail ?? cleanEmail, slug = business.Slug, templateType = (int)business.TemplateType }`.
  - Note: Neither response returns an explicit token string (`token`).

---

## 2. Logic Chain

1. **Storage Dependency Availability (from Observation 1.1)**:
   - `@react-native-async-storage/async-storage` 2.2.0 is already installed in `sd_cards_mobile/package.json` and present in `node_modules`. No extra native modules or dependencies are required to achieve persistent local storage.

2. **Cause of Session Loss on Relaunch (from Observations 1.2 & 1.3)**:
   - Authentication state in `App.tsx` is stored solely in volatile React state (`useState`).
   - The app's bootstrap lifecycle (`useEffect` in `App.tsx`) executes an unconditional `setTimeout(..., 2000)` without querying storage.
   - Therefore, whenever the app process terminates or restarts, `session.isAuthenticated` defaults to `false`, causing `App.tsx` to mount `<LoginScreen />` rather than the appropriate dashboard.

3. **Restoration Bypass Location (from Observation 1.3)**:
   - The bootstrap lifecycle in `App.tsx` (`useEffect`) already manages the transition from `SplashScreen` (`isAppLoading = true`) to the app content (`isAppLoading = false`).
   - If `App.tsx` queries local storage asynchronously during this bootstrap sequence, it can restore `{ isAuthenticated: true, email, role, businessId, token }` before setting `isAppLoading = false`.
   - As a result, when `isAppLoading` turns false, `session.isAuthenticated` is already `true`, so `<LoginScreen />` is completely bypassed, and either `<SuperAdminScreen />` or `<BuyerPortalScreen />` renders immediately.

4. **Incomplete Logout Flow (from Observation 1.4)**:
   - `handleLogout` only resets memory state. To ensure explicit logout terminates the persisted session, `handleLogout` must invoke `AsyncStorage.removeItem` (or clear storage), wipe the in-memory API token, and then update React state.
   - Upon state reset, `!session.isAuthenticated` becomes true, which reactively mounts `<LoginScreen />`.

5. **API Security & Token Interception (from Observation 1.5 & 1.6)**:
   - When a user logs in, backend `/businessapi/login` should supply an auth token (or mobile generates/stores a session token).
   - In `api.ts`, `safeFetch` must inject `Authorization: Bearer <token>` into `options.headers`.
   - In `safeFetch`, when `res.status === 401`, a registered `onUnauthorized` listener should trigger `handleLogout()` to clear storage and return to `<LoginScreen />`.

---

## 3. Caveats

1. **Backend Token Format**: The backend currently validates credentials with raw database checks and returns DTOs without JWT signing or session cookies. Adding a token string (e.g., `token = "SD-AUTH-" + Guid.NewGuid().ToString("N")` or a signed JWT) in `BusinessApiController.cs` provides a complete Bearer token contract for `api.ts`. If the backend is not modified, the mobile client can generate and store a deterministic session token alongside the user credentials.
2. **Biometrics / Hardware Keystore**: Expo SecureStore is not installed in `package.json`. Standard `@react-native-async-storage/async-storage` is sufficient for requirement R1 and works cross-platform (Android, iOS, Web).
3. **No React Navigation**: The mobile app does not use a stack/tab navigator library. Navigation is driven by state branches in `App.tsx`. All session navigation switches must occur through `setSession(...)`.

---

## 4. Conclusion

Requirement R1 is completely implementable using existing project dependencies. To satisfy all acceptance criteria:

### Concrete Architectural Recommendations for Implementer:

1. **Create `sd_cards_mobile/src/services/authStorage.ts`**:
   - Provide typed helper functions using `@react-native-async-storage/async-storage`:
     - Storage Key: `@sd_cards_auth_session`
     - `saveSession(session: StoredSession): Promise<void>`
     - `getSession(): Promise<StoredSession | null>`
     - `clearSession(): Promise<void>`
   - `StoredSession` interface:
     ```typescript
     export interface StoredSession {
       isAuthenticated: boolean;
       email: string;
       role: 'superadmin' | 'buyer';
       businessId?: number;
       token?: string;
       businessName?: string;
       ownerName?: string;
       slug?: string;
     }
     ```

2. **Upgrade `sd_cards_mobile/src/services/api.ts`**:
   - Add module-level `let currentAuthToken: string | null = null;` and `let onUnauthorizedCallback: (() => void) | null = null;`.
   - Export `setAuthToken(token: string | null)`.
   - Export `setOnUnauthorized(cb: () => void)`.
   - In `safeFetch`:
     - Merge headers: if `currentAuthToken` is set and `Authorization` is absent, set `Authorization: Bearer ${currentAuthToken}`.
     - Inspect `res.status`: if `res.status === 401`, invoke `onUnauthorizedCallback?.()`.
   - In `api.login`: include `token?: string` in the returned typing.

3. **Refactor Bootstrap & Logout in `sd_cards_mobile/App.tsx`**:
   - In `useEffect`:
     - Read `await AuthStorage.getSession()`.
     - If stored session is valid, call `api.setAuthToken(storedSession.token)` and `setSession(storedSession)`.
     - Set `isAppLoading = false` once the check and splash duration finish.
   - In `handleLogin`:
     - Persist the session to storage via `await AuthStorage.saveSession(...)`.
     - Update `api.setAuthToken(token)`.
     - Set React state `session`.
   - In `handleLogout`:
     - Call `await AuthStorage.clearSession()`.
     - Call `api.setAuthToken(null)`.
     - Set React state `session` to default unauthenticated state.
   - Register `api.setOnUnauthorized(handleLogout)`.

4. **Update `Controllers/Api/BusinessApiController.cs` (Backend)**:
   - In `Login` action, include `token = "SD-AUTH-" + Guid.NewGuid().ToString("N")` in both superadmin and buyer response objects.

---

## 5. Verification Method

1. **TypeScript Build Verification**:
   Execute command in `sd_cards_mobile`:
   ```powershell
   cd 'C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile'; npx tsc --noEmit
   ```
   *Expected result*: Exit code 0, 0 errors.

2. **Backend Solution Build Verification**:
   Execute command in project root:
   ```powershell
   cd 'C:\Users\Conter\OneDrive\Desktop\Reseñas Cards'; dotnet build
   ```
   *Expected result*: Exit code 0, Compilación correcta.

3. **Session Persistence Functional Verification**:
   - Trigger login with valid credentials (e.g. `samirconter@gmail.com`).
   - Verify `AsyncStorage.getItem('@sd_cards_auth_session')` contains the serialized JSON session object with `isAuthenticated: true`.
   - Simulate an app restart / reload.
   - Verify `App.tsx` loads directly into `SuperAdminScreen` (or `BuyerPortalScreen`) after `SplashScreen` without showing `LoginScreen`.
   - Click the logout button (`LogOut` in header).
   - Verify `AsyncStorage.getItem('@sd_cards_auth_session')` is null, `api.setAuthToken(null)` was executed, and `LoginScreen` is rendered.
   - Relaunch the app; verify it lands on `LoginScreen`.
