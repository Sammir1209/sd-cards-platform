/**
 * Empirical Stress Test Harness for Milestone M4:
 * Search, Status Filtering, and Ubigeo Location Filtering Logic
 * Target Component: sd_cards_mobile/src/screens/admin/SuperAdminScreen.tsx
 */

const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('M4 EMPIRICAL CHALLENGER: SEARCH & FILTERING STRESS TEST HARNESS');
console.log('================================================================\n');

// 1. Source Code Static Audit
const superAdminPath = path.join(__dirname, '..', 'src', 'screens', 'admin', 'SuperAdminScreen.tsx');
if (!fs.existsSync(superAdminPath)) {
  console.error(`FATAL: File not found at ${superAdminPath}`);
  process.exit(1);
}

const sourceCode = fs.readFileSync(superAdminPath, 'utf8');

console.log('--- PHASE 1: STATIC CODE AUDIT OF SEARCH & FILTER SPECIFICATION ---');

const requiredFields = [
  'name',
  'ruc',
  'ownerName',
  'phone',
  'ownerPhone',
  'ownerEmail',
  'city',
  'department',
  'province',
  'district'
];

let allFieldsFound = true;
requiredFields.forEach(field => {
  const pattern = new RegExp(`b\\.${field}\\s*&&\\s*b\\.${field}\\.toLowerCase\\(\\)\\.includes\\(q\\)`);
  const found = pattern.test(sourceCode);
  console.log(`[Audit] Field '${field}' checked in search query: ${found ? 'PASS' : 'FAIL'}`);
  if (!found) allFieldsFound = false;
});

if (!allFieldsFound) {
  console.error('FAIL: One or more required search fields missing from search implementation in SuperAdminScreen.tsx!');
} else {
  console.log('PASS: All 10 required search fields are explicitly present in SuperAdminScreen.tsx.');
}

// 2. Logic Extraction from SuperAdminScreen.tsx
// We replicate the exact functions used in SuperAdminScreen.tsx lines 425-478 and 744-786:

function computeClientStatus(biz, now = new Date()) {
  const isOperating = biz.isActive && !biz.isArchived;
  if (!isOperating) {
    return {
      status: 'paused',
      label: 'PAUSADO',
      daysRemaining: null,
      isExpired: false,
      isExpiringSoon: false
    };
  }

  if (biz.planExpiryDate) {
    const expiry = new Date(biz.planExpiryDate);
    if (!isNaN(expiry.getTime())) {
      const diffMs = expiry.getTime() - now.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffMs <= 0 || days < 0) {
        return {
          status: 'expired',
          label: 'VENCIDO',
          daysRemaining: days <= 0 ? (days === 0 ? -1 : days) : days,
          isExpired: true,
          isExpiringSoon: false
        };
      }
      if (days <= 30) {
        return {
          status: 'expiring_soon',
          label: 'POR VENCER',
          daysRemaining: days,
          isExpired: false,
          isExpiringSoon: true
        };
      }
      return {
        status: 'active',
        label: 'ACTIVO',
        daysRemaining: days,
        isExpired: false,
        isExpiringSoon: false
      };
    }
  }

  return {
    status: 'active',
    label: 'ACTIVO',
    daysRemaining: null,
    isExpired: false,
    isExpiringSoon: false
  };
}

function filterBusinesses(businesses, { searchQuery = '', clientFilter = 'all', deptFilter = 'all', serviceFilter = 'all' }, now = new Date()) {
  return businesses.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.slug && b.slug.toLowerCase().includes(q)) ||
      (b.ruc && b.ruc.toLowerCase().includes(q)) ||
      (b.ownerName && b.ownerName.toLowerCase().includes(q)) ||
      (b.phone && b.phone.toLowerCase().includes(q)) ||
      (b.ownerPhone && b.ownerPhone.toLowerCase().includes(q)) ||
      (b.ownerEmail && b.ownerEmail.toLowerCase().includes(q)) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.department && b.department.toLowerCase().includes(q)) ||
      (b.province && b.province.toLowerCase().includes(q)) ||
      (b.district && b.district.toLowerCase().includes(q)) ||
      (b.address && b.address.toLowerCase().includes(q));

    if (!matchSearch) return false;

    const statusInfo = computeClientStatus(b, now);

    // Filtros de Estado
    if (clientFilter === 'active' && statusInfo.status !== 'active') return false;
    if (clientFilter === 'suspended' && statusInfo.status !== 'paused') return false;
    if (clientFilter === 'expired' && statusInfo.status !== 'expired') return false;
    if (clientFilter === 'expiring_soon' && statusInfo.status !== 'expiring_soon') return false;

    // Filtro de Departamento
    if (deptFilter !== 'all') {
      const targetDept = deptFilter.toLowerCase();
      const matchDept =
        (b.department && b.department.toLowerCase() === targetDept) ||
        (b.city && b.city.toLowerCase().includes(targetDept));
      if (!matchDept) return false;
    }

    // Filtro de Tipo de Servicio
    if (serviceFilter !== 'all') {
      if (String(b.templateType) !== serviceFilter) return false;
    }

    return true;
  });
}

// --- TEST SUITE 1: SEARCH MATCHING ACROSS ALL 10 FIELDS ---
console.log('\n--- PHASE 2: SEARCH MATCHING ACROSS ALL 10 REQUIRED FIELDS ---');

let searchTestsPassed = 0;
let searchTestsTotal = 0;

function assertSearch(description, query, dataset, expectedCount) {
  searchTestsTotal++;
  const results = filterBusinesses(dataset, { searchQuery: query });
  const passed = results.length === expectedCount;
  if (passed) {
    searchTestsPassed++;
    console.log(`  [PASS] ${description}: query="${query}" -> ${results.length} matches (expected ${expectedCount})`);
  } else {
    console.error(`  [FAIL] ${description}: query="${query}" -> ${results.length} matches (expected ${expectedCount})`);
  }
}

// Base client template
const makeClient = (overrides = {}) => ({
  id: 1,
  name: 'Default Name',
  slug: 'default-slug',
  ruc: '20100000001',
  ownerName: 'Owner Juan',
  phone: '999111222',
  ownerPhone: '999333444',
  ownerEmail: 'owner@example.com',
  city: 'Miraflores, Lima - Lima',
  department: 'Lima',
  province: 'Lima',
  district: 'Miraflores',
  address: 'Av Larco 123',
  isActive: true,
  isArchived: false,
  planExpiryDate: new Date(Date.now() + 100 * 86400000).toISOString(),
  templateType: 1,
  ...overrides
});

// Test each of the 10 fields individually with unique tokens
const uniqueDataset = [
  makeClient({ id: 101, name: 'Cevichería El Muelle', ruc: '00000000000', ownerName: 'Z', phone: '0', ownerPhone: '0', ownerEmail: 'z@z.com', city: 'X', department: 'X', province: 'X', district: 'X' }),
  makeClient({ id: 102, name: 'Alpha', ruc: '20609876543', ownerName: 'Z', phone: '0', ownerPhone: '0', ownerEmail: 'z@z.com', city: 'X', department: 'X', province: 'X', district: 'X' }),
  makeClient({ id: 103, name: 'Beta', ruc: '00000000000', ownerName: 'Rodrigo Mendoza', phone: '0', ownerPhone: '0', ownerEmail: 'z@z.com', city: 'X', department: 'X', province: 'X', district: 'X' }),
  makeClient({ id: 104, name: 'Gamma', ruc: '00000000000', ownerName: 'Z', phone: '984555123', ownerPhone: '0', ownerEmail: 'z@z.com', city: 'X', department: 'X', province: 'X', district: 'X' }),
  makeClient({ id: 105, name: 'Delta', ruc: '00000000000', ownerName: 'Z', phone: '0', ownerPhone: '956777888', ownerEmail: 'z@z.com', city: 'X', department: 'X', province: 'X', district: 'X' }),
  makeClient({ id: 106, name: 'Epsilon', ruc: '00000000000', ownerName: 'Z', phone: '0', ownerPhone: '0', ownerEmail: 'contacto@pollosparrilla.pe', city: 'X', department: 'X', province: 'X', district: 'X' }),
  makeClient({ id: 107, name: 'Zeta', ruc: '00000000000', ownerName: 'Z', phone: '0', ownerPhone: '0', ownerEmail: 'z@z.com', city: 'Huancayo Metropolitano', department: 'X', province: 'X', district: 'X' }),
  makeClient({ id: 108, name: 'Eta', ruc: '00000000000', ownerName: 'Z', phone: '0', ownerPhone: '0', ownerEmail: 'z@z.com', city: 'X', department: 'Arequipa', province: 'X', district: 'X' }),
  makeClient({ id: 109, name: 'Theta', ruc: '00000000000', ownerName: 'Z', phone: '0', ownerPhone: '0', ownerEmail: 'z@z.com', city: 'X', department: 'X', province: 'Urubamba', district: 'X' }),
  makeClient({ id: 110, name: 'Iota', ruc: '00000000000', ownerName: 'Z', phone: '0', ownerPhone: '0', ownerEmail: 'z@z.com', city: 'X', department: 'X', province: 'X', district: 'Yanahuara' })
];

assertSearch('1. Match by name', 'Cevichería El Muelle', uniqueDataset, 1);
assertSearch('2. Match by ruc', '20609876543', uniqueDataset, 1);
assertSearch('3. Match by ownerName', 'Rodrigo Mendoza', uniqueDataset, 1);
assertSearch('4. Match by phone', '984555123', uniqueDataset, 1);
assertSearch('5. Match by ownerPhone', '956777888', uniqueDataset, 1);
assertSearch('6. Match by ownerEmail', 'contacto@pollosparrilla.pe', uniqueDataset, 1);
assertSearch('7. Match by city', 'Huancayo Metropolitano', uniqueDataset, 1);
assertSearch('8. Match by department', 'Arequipa', uniqueDataset, 1);
assertSearch('9. Match by province', 'Urubamba', uniqueDataset, 1);
assertSearch('10. Match by district', 'Yanahuara', uniqueDataset, 1);

// Case Insensitivity and Substrings
assertSearch('Case Insensitive UPPER: name', 'CEVICHERÍA', uniqueDataset, 1);
assertSearch('Case Insensitive LOWER: ownerName', 'rodrigo', uniqueDataset, 1);
assertSearch('Case Insensitive MIXED: department', 'aReQuIpA', uniqueDataset, 1);
assertSearch('Partial substring: ruc', '98765', uniqueDataset, 1);
assertSearch('Partial substring: email domain', 'pollosparrilla', uniqueDataset, 1);

// Empty and Whitespace Queries
assertSearch('Empty query returns all', '', uniqueDataset, 10);
assertSearch('Whitespace-only query returns all', '     ', uniqueDataset, 10);
assertSearch('Surrounding whitespace trimmed', '  Yanahuara  ', uniqueDataset, 1);

// Non-matching query
assertSearch('Non-matching query returns 0', 'NONEXISTENT_QUERY_xyz999', uniqueDataset, 0);

// Robustness: Null and undefined fields in business records
const sparseDataset = [
  { id: 201, name: 'Sparse Biz 1', isActive: true },
  { id: 202, name: null, ruc: null, ownerName: undefined, phone: null, isActive: true },
  { id: 203, name: 'Sparse Biz 3', ruc: '20456789012', department: null, isActive: true }
];

try {
  const sparseRes = filterBusinesses(sparseDataset, { searchQuery: 'sparse' });
  console.log(`  [PASS] Null/Undefined property safety: filter executed without throwing (${sparseRes.length} found)`);
  searchTestsPassed++;
} catch (err) {
  console.error(`  [FAIL] Null/Undefined property safety threw exception:`, err);
}
searchTestsTotal++;

// --- TEST SUITE 2: STATUS FILTERING AND PARTITION VERIFICATION ---
console.log('\n--- PHASE 3: STATUS PARTITIONING & EXPIRATION LOGIC ---');

const fixedNow = new Date('2026-10-31T12:00:00.000Z');

const statusDataset = [
  // 1. Activo (> 30 días restantes)
  makeClient({ id: 1, name: 'Biz Activo 60d', isActive: true, isArchived: false, planExpiryDate: '2026-12-30T12:00:00.000Z' }), // +60d
  makeClient({ id: 2, name: 'Biz Activo 31d', isActive: true, isArchived: false, planExpiryDate: '2026-12-01T12:00:00.000Z' }), // +31d
  makeClient({ id: 3, name: 'Biz Activo Sin Fecha', isActive: true, isArchived: false, planExpiryDate: null }), // null fecha -> activo por defecto
  makeClient({ id: 4, name: 'Biz Activo Fecha Invalida', isActive: true, isArchived: false, planExpiryDate: 'not-a-valid-date' }),

  // 2. Por Vencer (1 a 30 días restantes)
  makeClient({ id: 5, name: 'Biz Expiring 30d', isActive: true, isArchived: false, planExpiryDate: '2026-11-30T12:00:00.000Z' }), // +30d
  makeClient({ id: 6, name: 'Biz Expiring 15d', isActive: true, isArchived: false, planExpiryDate: '2026-11-15T12:00:00.000Z' }), // +15d
  makeClient({ id: 7, name: 'Biz Expiring 1d', isActive: true, isArchived: false, planExpiryDate: '2026-11-01T12:00:00.000Z' }), // +1d
  makeClient({ id: 8, name: 'Biz Expiring 5h', isActive: true, isArchived: false, planExpiryDate: '2026-10-31T17:00:00.000Z' }), // +5h (later today)

  // 3. Vencidos (Pasados de fecha)
  makeClient({ id: 9, name: 'Biz Expired 1d', isActive: true, isArchived: false, planExpiryDate: '2026-10-30T12:00:00.000Z' }), // -1d
  makeClient({ id: 10, name: 'Biz Expired 30d', isActive: true, isArchived: false, planExpiryDate: '2026-10-01T12:00:00.000Z' }), // -30d
  makeClient({ id: 11, name: 'Biz Expired 365d', isActive: true, isArchived: false, planExpiryDate: '2025-10-31T12:00:00.000Z' }), // -1 year

  // 4. Pausados / Inactivos (isActive === false or isArchived === true)
  makeClient({ id: 12, name: 'Biz Pausado Inactive', isActive: false, isArchived: false, planExpiryDate: '2026-12-30T12:00:00.000Z' }),
  makeClient({ id: 13, name: 'Biz Pausado Archived', isActive: true, isArchived: true, planExpiryDate: '2026-12-30T12:00:00.000Z' }),
  makeClient({ id: 14, name: 'Biz Pausado Inactive & Expired', isActive: false, isArchived: false, planExpiryDate: '2025-10-31T12:00:00.000Z' })
];

const totalStatusRecords = statusDataset.length; // 14 records

const allList = filterBusinesses(statusDataset, { clientFilter: 'all' }, fixedNow);
const activeList = filterBusinesses(statusDataset, { clientFilter: 'active' }, fixedNow);
const expiringSoonList = filterBusinesses(statusDataset, { clientFilter: 'expiring_soon' }, fixedNow);
const expiredList = filterBusinesses(statusDataset, { clientFilter: 'expired' }, fixedNow);
const pausedList = filterBusinesses(statusDataset, { clientFilter: 'suspended' }, fixedNow);

console.log(`  Partition Counts (Total: ${totalStatusRecords}):`);
console.log(`    - Todos: ${allList.length}`);
console.log(`    - Activos: ${activeList.length} (Expected: 4)`);
console.log(`    - Por Vencer: ${expiringSoonList.length} (Expected: 4)`);
console.log(`    - Vencidos: ${expiredList.length} (Expected: 3)`);
console.log(`    - Pausados: ${pausedList.length} (Expected: 3)`);

const sumPartition = activeList.length + expiringSoonList.length + expiredList.length + pausedList.length;
console.log(`  Sum of partitions = ${sumPartition} (Matches total: ${sumPartition === totalStatusRecords ? 'YES' : 'NO'})`);

// Check mutual exclusivity: no ID in multiple categories
const allIds = [
  ...activeList.map(b => b.id),
  ...expiringSoonList.map(b => b.id),
  ...expiredList.map(b => b.id),
  ...pausedList.map(b => b.id)
];
const uniqueIds = new Set(allIds);
const isMutuallyExclusive = uniqueIds.size === allIds.length;
console.log(`  Mutual exclusivity (no overlaps across filters): ${isMutuallyExclusive ? 'PASS' : 'FAIL'}`);

// --- CRITICAL ADVERSARIAL DISCOVERY: SAME-DAY EXPIRATION EDGE CASE (-0) ---
console.log('\n--- PHASE 4: ADVERSARIAL STRESS TEST: SAME-DAY PAST EXPIRY (-0 BUG) ---');

const sameDayExpiredCases = [
  { name: 'Expired 1 second ago', offsetMs: -1000 },
  { name: 'Expired 1 minute ago', offsetMs: -60000 },
  { name: 'Expired 2 hours ago', offsetMs: -7200000 },
  { name: 'Expired 23 hours ago', offsetMs: -82800000 },
  { name: 'Expired 24 hours ago (-1d)', offsetMs: -86400000 },
  { name: 'Expired 24h + 1ms ago', offsetMs: -86400001 }
];

sameDayExpiredCases.forEach(tc => {
  const expiryDate = new Date(fixedNow.getTime() + tc.offsetMs);
  const biz = makeClient({ id: 999, name: tc.name, isActive: true, isArchived: false, planExpiryDate: expiryDate.toISOString() });
  const status = computeClientStatus(biz, fixedNow);
  const diffMs = expiryDate.getTime() - fixedNow.getTime();
  const rawDays = diffMs / (1000 * 60 * 60 * 24);
  const mathCeilDays = Math.ceil(rawDays);

  console.log(`  [Edge Case] ${tc.name}:`);
  console.log(`    diffMs: ${diffMs} | rawDays: ${rawDays.toFixed(4)} | Math.ceil: ${mathCeilDays}`);
  console.log(`    days < 0 evaluates to: ${mathCeilDays < 0}`);
  console.log(`    Assigned Status: '${status.status}' (${status.label})`);

  if (tc.offsetMs < 0 && tc.offsetMs > -86400000) {
    if (status.status !== 'expired') {
      console.warn(`    ⚠️ ANOMALY DETECTED: Plan expired in the past, but classified as '${status.status}' because Math.ceil returned -0!`);
    } else {
      console.log(`    Classification: correct (${status.status})`);
    }
  }
});

// --- TEST SUITE 3: UBIGEO DEPARTMENT FILTERING ---
console.log('\n--- PHASE 5: UBIGEO DEPARTMENT FILTERING & ISOLATION ---');

const deptDataset = [
  makeClient({ id: 301, name: 'Cevichería Costa', department: 'Lima', city: 'Miraflores, Lima - Lima' }),
  makeClient({ id: 302, name: 'Picantería Arequipeña', department: 'Arequipa', city: 'Yanahuara, Arequipa - Arequipa' }),
  makeClient({ id: 303, name: 'Restaurante Valle Sagrado', department: 'Cusco', city: 'Urubamba, Urubamba - Cusco' }),
  makeClient({ id: 304, name: 'Trujillo Grill', department: 'La Libertad', city: 'Trujillo, Trujillo - La Libertad' }),
  makeClient({ id: 305, name: 'Amazon River Bar', department: 'Loreto', city: 'Iquitos, Maynas - Loreto' }),
  makeClient({ id: 306, name: 'Callao Port Seafood', department: 'Callao', city: 'Callao, Callao - Callao' }),
  makeClient({ id: 307, name: 'Fallback Dept Only in City', department: null, city: 'Huancayo, Huancayo - Junín' })
];

let deptTestsPassed = 0;
let deptTestsTotal = 0;

function assertDept(deptFilter, expectedIds) {
  deptTestsTotal++;
  const res = filterBusinesses(deptDataset, { deptFilter });
  const ids = res.map(b => b.id).sort();
  const exp = expectedIds.slice().sort();
  const passed = JSON.stringify(ids) === JSON.stringify(exp);
  if (passed) {
    deptTestsPassed++;
    console.log(`  [PASS] deptFilter="${deptFilter}" -> matched IDs [${ids.join(', ')}]`);
  } else {
    console.error(`  [FAIL] deptFilter="${deptFilter}" -> got [${ids.join(', ')}], expected [${exp.join(', ')}]`);
  }
}

assertDept('all', [301, 302, 303, 304, 305, 306, 307]);
assertDept('Lima', [301]);
assertDept('Arequipa', [302]);
assertDept('Cusco', [303]);
assertDept('La Libertad', [304]);
assertDept('Loreto', [305]);
assertDept('Callao', [306]);
assertDept('Junín', [307]); // Fallback matched via city string!
assertDept('Moquegua', []); // No clients in Moquegua

// Case insensitivity for department
assertDept('lima', [301]);
assertDept('AREQUIPA', [302]);

// --- TEST SUITE 4: MULTI-FILTER COMBINATORIAL TESTING ---
console.log('\n--- PHASE 6: MULTI-FILTER COMBINATORIAL INTERSECTIONS ---');

const multiDataset = [
  makeClient({ id: 401, name: 'El Pez Lima Activo', department: 'Lima', isActive: true, planExpiryDate: '2026-12-30T12:00:00Z', templateType: 1 }),
  makeClient({ id: 402, name: 'El Pez Lima Pausado', department: 'Lima', isActive: false, planExpiryDate: '2026-12-30T12:00:00Z', templateType: 1 }),
  makeClient({ id: 403, name: 'El Pez Arequipa Activo', department: 'Arequipa', isActive: true, planExpiryDate: '2026-12-30T12:00:00Z', templateType: 1 }),
  makeClient({ id: 404, name: 'Carnes Lima Activo', department: 'Lima', isActive: true, planExpiryDate: '2026-12-30T12:00:00Z', templateType: 2 })
];

const combo1 = filterBusinesses(multiDataset, { searchQuery: 'Pez', clientFilter: 'active', deptFilter: 'Lima' }, fixedNow);
console.log(`  Combo: Query='Pez' AND Status='active' AND Dept='Lima' -> [${combo1.map(b => b.id)}] (Expected: [401])`);

const combo2 = filterBusinesses(multiDataset, { searchQuery: 'Pez', clientFilter: 'suspended', deptFilter: 'Lima' }, fixedNow);
console.log(`  Combo: Query='Pez' AND Status='suspended' AND Dept='Lima' -> [${combo2.map(b => b.id)}] (Expected: [402])`);

const combo3 = filterBusinesses(multiDataset, { searchQuery: 'Carnes', deptFilter: 'Arequipa' }, fixedNow);
console.log(`  Combo: Query='Carnes' AND Dept='Arequipa' -> [${combo3.map(b => b.id)}] (Expected: [])`);

// Summary
console.log('\n================================================================');
console.log(`SEARCH TESTS: ${searchTestsPassed}/${searchTestsTotal} PASSED`);
console.log(`DEPARTMENT TESTS: ${deptTestsPassed}/${deptTestsTotal} PASSED`);
console.log(`STATUS PARTITION: ${isMutuallyExclusive && sumPartition === totalStatusRecords ? 'EXHAUSTIVE & MUTUALLY EXCLUSIVE' : 'PARTITION ERROR'}`);
console.log('================================================================');
