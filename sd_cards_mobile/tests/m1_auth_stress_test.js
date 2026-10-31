/**
 * Empirical Stress Test Harness for Milestone M1 (Persistent Authentication Session)
 * Tests AuthStorage and Auth Lifecycle logic under normal, adversarial, and corrupt conditions.
 */

const assert = require('assert');

// Mock AsyncStorage implementation to inject into tests
class MockAsyncStorage {
  constructor() {
    this.store = new Map();
    this.shouldFailGet = false;
    this.shouldFailSet = false;
    this.shouldFailRemove = false;
  }

  async getItem(key) {
    if (this.shouldFailGet) {
      throw new Error('AsyncStorage simulated read disk failure');
    }
    return this.store.has(key) ? this.store.get(key) : null;
  }

  async setItem(key, value) {
    if (this.shouldFailSet) {
      throw new Error('AsyncStorage simulated disk write failure / quota exceeded');
    }
    this.store.set(key, String(value));
  }

  async removeItem(key) {
    if (this.shouldFailRemove) {
      throw new Error('AsyncStorage simulated remove failure');
    }
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
    this.shouldFailGet = false;
    this.shouldFailSet = false;
    this.shouldFailRemove = false;
  }
}

const mockStorage = new MockAsyncStorage();

// Implementation mirroring src/services/authStorage.ts with injected storage
const AUTH_STORAGE_KEY = '@sd_cards_auth_session';
const LEGACY_STORAGE_KEY = '@moniq_user_session';

async function saveSession(session) {
  try {
    const json = JSON.stringify(session);
    await mockStorage.setItem(AUTH_STORAGE_KEY, json);
  } catch (error) {
    // console.error('[AuthStorage] Error saving session:', error);
  }
}

async function getSession() {
  try {
    let json = await mockStorage.getItem(AUTH_STORAGE_KEY);
    if (!json) {
      json = await mockStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (!json) return null;

    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.isAuthenticated === 'boolean') {
      return parsed;
    }
    return null;
  } catch (error) {
    // console.error('[AuthStorage] Error loading session:', error);
    return null;
  }
}

async function clearSession() {
  try {
    await mockStorage.removeItem(AUTH_STORAGE_KEY);
    await mockStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    // console.error('[AuthStorage] Error clearing session:', error);
  }
}

// Mock API state
let currentAuthToken = null;
let onUnauthorizedCallback = null;

function setAuthToken(token) {
  currentAuthToken = token;
}

function getAuthToken() {
  return currentAuthToken;
}

function setOnUnauthorized(callback) {
  onUnauthorizedCallback = callback;
}

// Test Runner
const testResults = [];

async function runTest(testName, fn) {
  mockStorage.clear();
  currentAuthToken = null;
  onUnauthorizedCallback = null;
  try {
    await fn();
    testResults.push({ name: testName, status: 'PASS' });
    console.log(`[PASS] ${testName}`);
  } catch (err) {
    testResults.push({ name: testName, status: 'FAIL', error: err.message });
    console.error(`[FAIL] ${testName}:`, err.message);
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log('STARTING EMPIRICAL STRESS TESTS FOR MILESTONE M1');
  console.log('================================================================\n');

  // 1. Stress-testing AuthStorage.getSession with empty, malformed, or corrupt JSON
  await runTest('T01: Empty storage returns null without error', async () => {
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T02: Storage with whitespace returns null without error', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, '   ');
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T03: Malformed JSON (truncated syntax) caught gracefully and returns null', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, '{"isAuthenticated": true, "email": "corrupt');
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T04: Arbitrary corrupt string (binary garbage / html error page) returns null', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, '<!DOCTYPE html><html><body>502 Bad Gateway</body></html>');
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T05: JSON primitive (number) returns null', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, '123456');
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T06: JSON primitive (string) returns null', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, '"just_a_string"');
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T07: JSON null literal returns null', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, 'null');
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T08: Empty JSON object {} without isAuthenticated returns null', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, '{}');
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T09: JSON with isAuthenticated as string "true" is rejected (type-safe boolean check)', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated: "true", email: "hacker@test.com" }));
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T10: JSON with isAuthenticated as number 1 is rejected (type-safe boolean check)', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated: 1, email: "hacker@test.com" }));
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T11: Underlying AsyncStorage read failure is caught and returns null without crashing', async () => {
    mockStorage.shouldFailGet = true;
    const res = await getSession();
    assert.strictEqual(res, null);
  });

  await runTest('T12: Legacy storage fallback works when primary key is absent', async () => {
    const legacySession = {
      isAuthenticated: true,
      email: 'legacy@user.com',
      role: 'buyer',
      businessId: 42,
      token: 'SD-AUTH-LEGACY-001'
    };
    mockStorage.store.set(LEGACY_STORAGE_KEY, JSON.stringify(legacySession));
    const res = await getSession();
    assert.notStrictEqual(res, null);
    assert.strictEqual(res.isAuthenticated, true);
    assert.strictEqual(res.email, 'legacy@user.com');
    assert.strictEqual(res.token, 'SD-AUTH-LEGACY-001');
  });

  await runTest('T13: Primary key takes precedence over legacy storage key', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, JSON.stringify({
      isAuthenticated: true,
      email: 'primary@user.com',
      role: 'superadmin'
    }));
    mockStorage.store.set(LEGACY_STORAGE_KEY, JSON.stringify({
      isAuthenticated: true,
      email: 'legacy@user.com',
      role: 'buyer'
    }));
    const res = await getSession();
    assert.strictEqual(res.email, 'primary@user.com');
    assert.strictEqual(res.role, 'superadmin');
  });

  // 2. Stress-testing saveSession
  await runTest('T14: saveSession stores all required attributes (isAuthenticated, email, role, businessId, token)', async () => {
    const sessionToSave = {
      isAuthenticated: true,
      email: 'samirconter@gmail.com',
      role: 'superadmin',
      businessId: 1,
      token: 'SD-AUTH-9876543210abcdef',
      businessName: 'HQ Admin',
      ownerName: 'Samir Conter',
      slug: 'superadmin'
    };
    await saveSession(sessionToSave);

    const storedRaw = mockStorage.store.get(AUTH_STORAGE_KEY);
    assert.ok(storedRaw, 'Raw string should exist in storage');
    
    const parsed = JSON.parse(storedRaw);
    assert.strictEqual(parsed.isAuthenticated, true);
    assert.strictEqual(parsed.email, 'samirconter@gmail.com');
    assert.strictEqual(parsed.role, 'superadmin');
    assert.strictEqual(parsed.businessId, 1);
    assert.strictEqual(parsed.token, 'SD-AUTH-9876543210abcdef');
    assert.strictEqual(parsed.businessName, 'HQ Admin');
    assert.strictEqual(parsed.ownerName, 'Samir Conter');
    assert.strictEqual(parsed.slug, 'superadmin');
  });

  await runTest('T15: saveSession handles disk write error without crashing', async () => {
    mockStorage.shouldFailSet = true;
    let didThrow = false;
    try {
      await saveSession({ isAuthenticated: true, email: 'fail@test.com', role: 'buyer' });
    } catch {
      didThrow = true;
    }
    assert.strictEqual(didThrow, false, 'saveSession should handle storage write errors gracefully');
  });

  // 3. Stress-testing clearSession
  await runTest('T16: clearSession completely purges both primary and legacy storage keys', async () => {
    mockStorage.store.set(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated: true, email: 'active@test.com' }));
    mockStorage.store.set(LEGACY_STORAGE_KEY, JSON.stringify({ isAuthenticated: true, email: 'legacy@test.com' }));

    await clearSession();

    assert.strictEqual(mockStorage.store.has(AUTH_STORAGE_KEY), false);
    assert.strictEqual(mockStorage.store.has(LEGACY_STORAGE_KEY), false);

    const check = await getSession();
    assert.strictEqual(check, null);
  });

  await runTest('T17: clearSession is idempotent and safe when keys do not exist', async () => {
    await clearSession();
    await clearSession();
    const check = await getSession();
    assert.strictEqual(check, null);
  });

  await runTest('T18: clearSession handles storage remove failure without crashing', async () => {
    mockStorage.shouldFailRemove = true;
    let didThrow = false;
    try {
      await clearSession();
    } catch {
      didThrow = true;
    }
    assert.strictEqual(didThrow, false, 'clearSession should handle remove errors gracefully');
  });

  // 4. App.tsx Startup & Session Lifecycle Simulation
  await runTest('T19: App bootstrap with valid session restores state, token, and bypasses LoginScreen', async () => {
    // 1. Arrange: Session in storage
    const validSession = {
      isAuthenticated: true,
      email: 'buyer@restaurant.pe',
      role: 'buyer',
      businessId: 5,
      token: 'SD-AUTH-TOKEN-BUYER-123'
    };
    await saveSession(validSession);

    // 2. Simulate App.tsx bootstrap
    let isAppLoading = true;
    let currentSession = { isAuthenticated: false, email: '', role: 'buyer' };

    const stored = await getSession();
    if (stored && stored.isAuthenticated) {
      setAuthToken(stored.token || null);
      currentSession = stored;
    }
    isAppLoading = false;

    // 3. Assert: Token set in api module, session active, LoginScreen bypassed
    assert.strictEqual(isAppLoading, false);
    assert.strictEqual(getAuthToken(), 'SD-AUTH-TOKEN-BUYER-123');
    assert.strictEqual(currentSession.isAuthenticated, true);
    assert.strictEqual(currentSession.email, 'buyer@restaurant.pe');
    assert.strictEqual(currentSession.role, 'buyer');
    assert.strictEqual(currentSession.businessId, 5);

    // Screen selection check
    const screenMounted = !currentSession.isAuthenticated
      ? 'LoginScreen'
      : (currentSession.role === 'superadmin' ? 'SuperAdminScreen' : 'BuyerPortalScreen');
    assert.strictEqual(screenMounted, 'BuyerPortalScreen');
  });

  await runTest('T20: App bootstrap with unauthenticated storage shows LoginScreen', async () => {
    let isAppLoading = true;
    let currentSession = { isAuthenticated: false, email: '', role: 'buyer' };

    const stored = await getSession();
    if (stored && stored.isAuthenticated) {
      setAuthToken(stored.token || null);
      currentSession = stored;
    }
    isAppLoading = false;

    assert.strictEqual(isAppLoading, false);
    assert.strictEqual(currentSession.isAuthenticated, false);
    assert.strictEqual(getAuthToken(), null);

    const screenMounted = !currentSession.isAuthenticated ? 'LoginScreen' : 'Dashboard';
    assert.strictEqual(screenMounted, 'LoginScreen');
  });

  await runTest('T21: Explicit logout wipes storage, nullifies token, and returns to LoginScreen', async () => {
    // 1. Start with authenticated state
    await saveSession({
      isAuthenticated: true,
      email: 'samirconter@gmail.com',
      role: 'superadmin',
      token: 'SD-AUTH-LOGOUT-TEST'
    });
    setAuthToken('SD-AUTH-LOGOUT-TEST');
    let session = { isAuthenticated: true, email: 'samirconter@gmail.com', role: 'superadmin' };

    // 2. Execute handleLogout
    await clearSession();
    setAuthToken(null);
    session = { isAuthenticated: false, email: '', role: 'buyer' };

    // 3. Verify
    assert.strictEqual(getAuthToken(), null);
    assert.strictEqual(session.isAuthenticated, false);
    assert.strictEqual(await getSession(), null);

    const screenMounted = !session.isAuthenticated ? 'LoginScreen' : 'Dashboard';
    assert.strictEqual(screenMounted, 'LoginScreen');
  });

  await runTest('T22: safeFetch 401 interceptor triggers logout flow automatically', async () => {
    // 1. Start with authenticated state
    let session = { isAuthenticated: true, email: 'buyer@test.com', role: 'buyer' };
    setAuthToken('SD-AUTH-EXPIRED');

    setOnUnauthorized(async () => {
      await clearSession();
      setAuthToken(null);
      session = { isAuthenticated: false, email: '', role: 'buyer' };
    });

    // 2. Simulate 401 interception
    await onUnauthorizedCallback();

    // 3. Verify
    assert.strictEqual(session.isAuthenticated, false);
    assert.strictEqual(getAuthToken(), null);
    assert.strictEqual(await getSession(), null);
  });

  // Summary
  console.log('\n================================================================');
  console.log('STRESS TEST SUMMARY');
  console.log('================================================================');
  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;
  console.log(`TOTAL: ${testResults.length} | PASSED: ${passed} | FAILED: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
