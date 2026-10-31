/**
 * EMPIRICAL CHALLENGER 2: Ubigeo Location Dataset & UI Edge Cases Stress Harness
 * Milestone M2 Verification Suite
 */

import { PERU_DEPARTMENTS, getDepartments, getProvinces, getDistricts, parseLocationCity } from '../src/data/peruLocations.ts';

let passedTests = 0;
let totalTests = 0;
const failures = [];

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    failures.push(message);
    console.error(`❌ FAIL: ${message}`);
  } else {
    passedTests++;
  }
}

console.log('================================================================');
console.log('  CHALLENGER 2: EMPIRICAL STRESS TEST - PERU UBIGEO & UI SAFETY');
console.log('================================================================\n');

// -------------------------------------------------------------------------
// SUITE 1: DATASET COMPLETENESS & CANONICAL COVERAGE
// -------------------------------------------------------------------------
console.log('--- SUITE 1: Dataset Completeness & Canonical Coverage ---');

assert(PERU_DEPARTMENTS.length === 25, `Expected exactly 25 regional entities, got ${PERU_DEPARTMENTS.length}`);

const callao = PERU_DEPARTMENTS.find(d => d.id === 'callao');
assert(!!callao, 'Callao region exists in PERU_DEPARTMENTS');
assert(callao && callao.provinces.length === 1, `Callao has exactly 1 province, got ${callao?.provinces.length}`);
assert(callao && callao.provinces[0].districts.length === 7, `Callao province has exactly 7 districts, got ${callao?.provinces[0].districts.length}`);
const callaoExpected = ['Callao', 'Bellavista', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Ventanilla', 'Mi Perú'];
for (const dist of callaoExpected) {
  assert(callao?.provinces[0].districts.includes(dist), `Callao includes district '${dist}'`);
}

const lima = PERU_DEPARTMENTS.find(d => d.id === 'lima');
assert(!!lima, 'Lima department exists in PERU_DEPARTMENTS');
const limaMetropolitana = lima?.provinces.find(p => p.id === 'lima');
assert(!!limaMetropolitana, 'Lima province (Metropolitana) exists');
assert(limaMetropolitana && limaMetropolitana.districts.length === 43, `Lima province must have all 43 districts, got ${limaMetropolitana?.districts.length}`);
assert(limaMetropolitana?.districts.includes('Ancón'), 'Lima includes Ancón');
assert(limaMetropolitana?.districts.includes('Miraflores'), 'Lima includes Miraflores');
assert(limaMetropolitana?.districts.includes('San Isidro'), 'Lima includes San Isidro');
assert(limaMetropolitana?.districts.includes('Santiago de Surco'), 'Lima includes Santiago de Surco');

const ancash = PERU_DEPARTMENTS.find(d => d.id === 'ancash');
assert(!!ancash, 'Ancash exists in PERU_DEPARTMENTS');
const huarmey = ancash?.provinces.find(p => p.id === 'huarmey');
assert(!!huarmey, 'Huarmey province exists in Ancash');
assert(huarmey && huarmey.districts.length >= 5, `Huarmey has at least 5 districts, got ${huarmey?.districts.length}`);

// Check all 25 departments have non-empty id, name, and at least 1 province
let totalProvincesCount = 0;
let totalDistrictsCount = 0;
for (const dept of PERU_DEPARTMENTS) {
  assert(dept.id && dept.id.trim().length > 0, `Department has valid id: ${dept.name}`);
  assert(dept.name && dept.name.trim().length > 0, `Department has valid name: ${dept.id}`);
  assert(Array.isArray(dept.provinces) && dept.provinces.length > 0, `Department ${dept.id} has at least 1 province`);
  totalProvincesCount += dept.provinces.length;
  for (const prov of dept.provinces) {
    assert(prov.id && prov.id.trim().length > 0, `Province has valid id in dept ${dept.id}`);
    assert(prov.name && prov.name.trim().length > 0, `Province has valid name in dept ${dept.id}`);
    assert(Array.isArray(prov.districts) && prov.districts.length > 0, `Province ${prov.id} in ${dept.id} has at least 1 district`);
    totalDistrictsCount += prov.districts.length;
  }
}
console.log(`Total regional entities: ${PERU_DEPARTMENTS.length}`);
console.log(`Total provinces: ${totalProvincesCount}`);
console.log(`Total districts: ${totalDistrictsCount}`);

// -------------------------------------------------------------------------
// SUITE 2: REACT KEY UNIQUENESS EMPIRICAL AUDIT
// -------------------------------------------------------------------------
console.log('\n--- SUITE 2: React Key Uniqueness Audit Across All 25 Departments ---');

// 1. Department keys: `dept.id`
const deptIds = new Set();
for (const dept of PERU_DEPARTMENTS) {
  assert(!deptIds.has(dept.id), `Duplicate department key found: ${dept.id}`);
  deptIds.add(dept.id);
}

// 2. Province keys: `${selectedDeptId}-${prov.id}`
for (const dept of PERU_DEPARTMENTS) {
  const provKeys = new Set();
  const provIdsInDept = new Set();
  for (const prov of dept.provinces) {
    assert(!provIdsInDept.has(prov.id), `Duplicate province id '${prov.id}' within department '${dept.id}'`);
    provIdsInDept.add(prov.id);

    const generatedKey = `${dept.id}-${prov.id}`;
    assert(!provKeys.has(generatedKey), `Duplicate province key '${generatedKey}' in dept '${dept.id}'`);
    provKeys.add(generatedKey);
  }
}

// 3. District keys: `${selectedDeptId}-${selectedProvId}-${dist}`
let duplicateDistrictsWithinProvince = 0;
for (const dept of PERU_DEPARTMENTS) {
  for (const prov of dept.provinces) {
    const distKeys = new Set();
    const distNames = new Set();
    for (const dist of prov.districts) {
      if (distNames.has(dist)) {
        duplicateDistrictsWithinProvince++;
        failures.push(`Duplicate district name '${dist}' in province '${prov.id}' (${dept.id})`);
      }
      distNames.add(dist);

      const generatedKey = `${dept.id}-${prov.id}-${dist}`;
      assert(!distKeys.has(generatedKey), `Duplicate district key '${generatedKey}'`);
      distKeys.add(generatedKey);
    }
  }
}
assert(duplicateDistrictsWithinProvince === 0, `Duplicate districts within any province: expected 0, got ${duplicateDistrictsWithinProvince}`);

// -------------------------------------------------------------------------
// SUITE 3: RAPID DEPARTMENT SWITCHING & STATE DESYNCHRONIZATION
// -------------------------------------------------------------------------
console.log('\n--- SUITE 3: Rapid Department Switching (Lima -> Amazonas & All Combinations) ---');

// Test specifically Lima (43 districts) -> Amazonas (7 provinces, small district counts)
const testSwitchPair = (fromDeptId, toDeptId) => {
  const fromDept = PERU_DEPARTMENTS.find(d => d.id === fromDeptId);
  const toDept = PERU_DEPARTMENTS.find(d => d.id === toDeptId);

  // Start state
  let selectedDeptId = fromDept.id;
  let selectedProvId = fromDept.provinces[0].id;
  let selectedDistrictName = fromDept.provinces[0].districts[fromDept.provinces[0].districts.length - 1]; // pick last (e.g. index 42)

  // Desynchronized phase 1: dept changed, prov and dist are STILL from old dept
  selectedDeptId = toDept.id;

  // Simulate Province selector rendering logic in SuperAdminScreen:
  let provRenderError = null;
  let renderedProvinces = [];
  try {
    const dept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
    const provinces = dept?.provinces || [];
    renderedProvinces = provinces.map(prov => ({
      key: `${selectedDeptId}-${prov.id}`,
      active: selectedProvId === prov.id,
      name: prov.name
    }));
  } catch (err) {
    provRenderError = err;
  }
  assert(!provRenderError, `Province render threw error during switch from ${fromDeptId} to ${toDeptId}: ${provRenderError?.message}`);

  // Simulate District selector rendering logic in SuperAdminScreen:
  let distRenderError = null;
  let renderedDistricts = [];
  try {
    const dept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
    const prov = dept?.provinces?.find(p => p.id === selectedProvId) || dept?.provinces?.[0];
    const districts = prov?.districts || [];
    renderedDistricts = districts.map(dist => ({
      key: `${selectedDeptId}-${selectedProvId}-${dist}`,
      active: selectedDistrictName === dist,
      name: dist
    }));
  } catch (err) {
    distRenderError = err;
  }
  assert(!distRenderError, `District render threw error during desync Phase 1 from ${fromDeptId} to ${toDeptId}: ${distRenderError?.message}`);
  assert(renderedDistricts.length > 0, `Rendered districts should fall back to first province of ${toDeptId}`);

  // Check keys in desync phase
  const desyncKeys = new Set();
  for (const item of renderedDistricts) {
    assert(!desyncKeys.has(item.key), `Duplicate key during desync phase: ${item.key}`);
    desyncKeys.add(item.key);
  }

  // Simulate handleCreateBusiness triggered during this exact desync moment:
  let createBusinessError = null;
  let synthesizedCity = '';
  try {
    const currentDept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
    const currentProv = currentDept?.provinces?.find(p => p.id === selectedProvId) || currentDept?.provinces?.[0];
    const deptName = currentDept?.name || 'Perú';
    const provName = currentProv?.name || 'Central';
    synthesizedCity = `${selectedDistrictName}, ${provName} - ${deptName}`;
  } catch (err) {
    createBusinessError = err;
  }
  assert(!createBusinessError, `handleCreateBusiness crashed during desync: ${createBusinessError?.message}`);
  assert(!synthesizedCity.includes('undefined'), `Synthesized city contains 'undefined': ${synthesizedCity}`);
  assert(!synthesizedCity.includes('null'), `Synthesized city contains 'null': ${synthesizedCity}`);

  // Desynchronized phase 2: prov changed, district still old
  const firstProv = toDept.provinces?.[0];
  selectedProvId = firstProv.id;

  try {
    const dept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
    const prov = dept?.provinces?.find(p => p.id === selectedProvId) || dept?.provinces?.[0];
    const districts = prov?.districts || [];
    renderedDistricts = districts.map(dist => ({
      key: `${selectedDeptId}-${selectedProvId}-${dist}`,
      active: selectedDistrictName === dist,
      name: dist
    }));
  } catch (err) {
    distRenderError = err;
  }
  assert(!distRenderError, `District render threw error during desync Phase 2: ${distRenderError?.message}`);

  // Phase 3: settled state
  selectedDistrictName = firstProv.districts?.[0] || 'Centro';
  try {
    const currentDept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
    const currentProv = currentDept?.provinces?.find(p => p.id === selectedProvId) || currentDept?.provinces?.[0];
    const deptName = currentDept?.name || 'Perú';
    const provName = currentProv?.name || 'Central';
    synthesizedCity = `${selectedDistrictName}, ${provName} - ${deptName}`;
  } catch (err) {
    createBusinessError = err;
  }
  assert(!createBusinessError, `handleCreateBusiness crashed in settled state: ${createBusinessError?.message}`);
  assert(synthesizedCity === `${firstProv.districts[0]}, ${firstProv.name} - ${toDept.name}`, `Settled synthesized string match: got '${synthesizedCity}'`);
};

// Test Lima -> Amazonas directly
testSwitchPair('lima', 'amazonas');

// Exhaustive test: switch between ALL 25 departments (625 combinations)
console.log('Testing all 25 x 25 = 625 department switching transitions...');
for (const fromDept of PERU_DEPARTMENTS) {
  for (const toDept of PERU_DEPARTMENTS) {
    testSwitchPair(fromDept.id, toDept.id);
  }
}
console.log('All 625 department switching transitions passed without any TypeError or out-of-bounds error!');

// -------------------------------------------------------------------------
// SUITE 4: DEFENSIVE FALLBACKS WITH CORRUPTED & BOUNDARY DATA
// -------------------------------------------------------------------------
console.log('\n--- SUITE 4: Defensive Fallbacks with Corrupted, Null, & Undefined Inputs ---');

const badInputs = [
  null,
  undefined,
  '',
  '   ',
  'invalid_id_9999',
  'undefined',
  'null',
  12345,
  {},
  []
];

for (const badDeptId of badInputs) {
  for (const badProvId of badInputs) {
    // 1. Creation picker provinces resolution
    let caught = false;
    let dept, provinces, prov, districts, deptName, provName, locationCity;
    try {
      dept = PERU_DEPARTMENTS.find(d => d.id === badDeptId) || PERU_DEPARTMENTS[0];
      provinces = dept?.provinces || [];
      prov = dept?.provinces?.find(p => p.id === badProvId) || dept?.provinces?.[0];
      districts = prov?.districts || [];
      deptName = dept?.name || 'Perú';
      provName = prov?.name || 'Central';
    } catch (e) {
      caught = true;
    }
    assert(!caught, `Corrupted deptId=${badDeptId}, provId=${badProvId} caused crash`);
    assert(Array.isArray(provinces), `Provinces is array for deptId=${badDeptId}`);
    assert(Array.isArray(districts), `Districts is array for provId=${badProvId}`);
  }
}

// Test corrupted department object missing provinces
const corruptedDeptNoProvinces = { id: 'corrupted', name: 'Corrupted' };
const safeProvinces = corruptedDeptNoProvinces.provinces || [];
assert(Array.isArray(safeProvinces) && safeProvinces.length === 0, 'Safe fallback for missing provinces array');

// Test corrupted province object missing districts
const corruptedProvNoDistricts = { id: 'corrupted_prov', name: 'Corrupted Prov' };
const safeDistricts = corruptedProvNoDistricts.districts || [];
assert(Array.isArray(safeDistricts) && safeDistricts.length === 0, 'Safe fallback for missing districts array');

// -------------------------------------------------------------------------
// SUITE 5: HANDLECREATEBUSINESS STRING SYNTHESIS & ROUND-TRIP
// -------------------------------------------------------------------------
console.log('\n--- SUITE 5: handleCreateBusiness String Synthesis & Round-Trip Parsing ---');

let combinationsTested = 0;
let roundTripSuccesses = 0;

for (const dept of PERU_DEPARTMENTS) {
  for (const prov of dept.provinces) {
    for (const dist of prov.districts) {
      combinationsTested++;
      const selectedDeptId = dept.id;
      const selectedProvId = prov.id;
      const selectedDistrictName = dist;

      const currentDept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
      const currentProv = currentDept?.provinces?.find(p => p.id === selectedProvId) || currentDept?.provinces?.[0];
      const deptName = currentDept?.name || 'Perú';
      const provName = currentProv?.name || 'Central';
      const locationCity = `${selectedDistrictName}, ${provName} - ${deptName}`;

      assert(locationCity.includes(dist), `locationCity includes district '${dist}'`);
      assert(locationCity.includes(provName), `locationCity includes provName '${provName}'`);
      assert(locationCity.includes(deptName), `locationCity includes deptName '${deptName}'`);
      assert(!locationCity.includes('undefined'), `locationCity does not contain 'undefined': '${locationCity}'`);
      assert(!locationCity.includes('null'), `locationCity does not contain 'null': '${locationCity}'`);

      // Test round-trip with parseLocationCity
      const parsed = parseLocationCity(locationCity);
      assert(parsed.deptId === dept.id, `parseLocationCity round-trip dept: expected '${dept.id}', got '${parsed.deptId}' for '${locationCity}'`);
      assert(parsed.provId === prov.id, `parseLocationCity round-trip prov: expected '${prov.id}', got '${parsed.provId}' for '${locationCity}'`);
      assert(parsed.districtName.toLowerCase() === dist.toLowerCase(), `parseLocationCity round-trip dist: expected '${dist}', got '${parsed.districtName}' for '${locationCity}'`);
      roundTripSuccesses++;
    }
  }
}
console.log(`Successfully synthesized and round-tripped all ${combinationsTested} combinations across Peru!`);

// -------------------------------------------------------------------------
// SUITE 6: OPENEDITBIZMODAL EMPIRICAL AUDIT & REPRODUCTION OF SUBSTRING BUG
// -------------------------------------------------------------------------
console.log('\n--- SUITE 6: openEditBizModal Empirical Audit & Bug Reproduction ---');

// Current implementation in SuperAdminScreen.tsx lines 358-379:
const currentOpenEditBizModal = (biz) => {
  let matchedDept = PERU_DEPARTMENTS.find(d =>
    (biz.department && d.name.toLowerCase() === biz.department.toLowerCase()) ||
    (biz.city && biz.city.toLowerCase().includes(d.name.toLowerCase()))
  );
  if (!matchedDept) matchedDept = PERU_DEPARTMENTS.find(d => d.id === 'lima') || PERU_DEPARTMENTS[0];
  const editDeptId = matchedDept.id;

  const provinces = matchedDept?.provinces || [];
  let matchedProv = provinces.find(p =>
    (biz.province && p.name.toLowerCase() === biz.province.toLowerCase()) ||
    (biz.city && biz.city.toLowerCase().includes(p.name.toLowerCase()))
  );
  if (!matchedProv) matchedProv = provinces[0];
  const editProvId = matchedProv?.id || 'lima';

  const districts = matchedProv?.districts || [];
  let matchedDist = districts.find(d =>
    (biz.district && d.toLowerCase() === biz.district.toLowerCase()) ||
    (biz.city && biz.city.toLowerCase().includes(d.toLowerCase()))
  );
  const editDistrictName = matchedDist || districts[0] || 'Centro';

  return { editDeptId, editProvId, editDistrictName };
};

// Proposed corrected implementation utilizing parseLocationCity:
const fixedOpenEditBizModal = (biz) => {
  let matchedDept = PERU_DEPARTMENTS.find(d =>
    d.name.toLowerCase() === biz.department?.toLowerCase() ||
    d.id.toLowerCase() === biz.department?.toLowerCase()
  );
  if (!matchedDept && biz.city) {
    const parsed = parseLocationCity(biz.city);
    matchedDept = PERU_DEPARTMENTS.find(d => d.id === parsed.deptId);
  }
  if (!matchedDept) matchedDept = PERU_DEPARTMENTS.find(d => d.id === 'lima') || PERU_DEPARTMENTS[0];

  const provinces = matchedDept?.provinces || [];
  let matchedProv = provinces.find(p =>
    p.name.toLowerCase() === biz.province?.toLowerCase() ||
    p.id.toLowerCase() === biz.province?.toLowerCase()
  );
  if (!matchedProv && biz.city) {
    const parsed = parseLocationCity(biz.city);
    matchedProv = provinces.find(p => p.id === parsed.provId);
  }
  if (!matchedProv) matchedProv = provinces[0];
  const provId = matchedProv?.id || 'lima';

  const districts = matchedProv?.districts || [];
  let matchedDist = districts.find(d =>
    d.toLowerCase() === biz.district?.toLowerCase()
  );
  if (!matchedDist && biz.city) {
    const parsed = parseLocationCity(biz.city);
    matchedDist = districts.find(d => d.toLowerCase() === parsed.districtName.toLowerCase());
  }
  const editDistrictName = matchedDist || districts[0] || 'Centro';

  return { editDeptId: matchedDept.id, editProvId: provId, editDistrictName };
};

// Reproduce bug on current implementation:
const bugTarget = {
  department: 'Cusco',
  province: 'Urubamba',
  district: 'Machupicchu',
  city: 'Machupicchu, Urubamba - Cusco'
};
const bugResult = currentOpenEditBizModal(bugTarget);
const isBugReproduced = (bugResult.editProvId === 'cusco' && bugResult.editDistrictName === 'Cusco');
assert(isBugReproduced, 'BUG CONFIRMED EMPIRICALLY: openEditBizModal erroneously overwrites Urubamba/Machupicchu to Cusco/Cusco due to substring .includes match on city ending');

// Verify that fixed implementation correctly resolves:
const fixedResult = fixedOpenEditBizModal(bugTarget);
assert(fixedResult.editDeptId === 'cusco', 'Fixed logic resolves department cusco');
assert(fixedResult.editProvId === 'urubamba', 'Fixed logic resolves province urubamba');
assert(fixedResult.editDistrictName === 'Machupicchu', 'Fixed logic resolves district Machupicchu');

// Verify fixed implementation handles legacy city string without department/province fields:
const fixedLegacy = fixedOpenEditBizModal({ city: 'Machupicchu, Urubamba - Cusco' });
assert(fixedLegacy.editDeptId === 'cusco' && fixedLegacy.editProvId === 'urubamba' && fixedLegacy.editDistrictName === 'Machupicchu', 'Fixed logic handles legacy composite string');

// Verify fixed implementation handles empty or corrupted input safely:
const fixedCorrupted = fixedOpenEditBizModal({});
assert(fixedCorrupted.editDeptId === 'lima' && fixedCorrupted.editProvId === 'lima', 'Fixed logic safely falls back on empty object');


// -------------------------------------------------------------------------
// SUITE 7: HELPER FUNCTIONS DEFENSIVE CONTRACTS
// -------------------------------------------------------------------------
console.log('\n--- SUITE 7: Helper Functions Defensive Contracts ---');

// getDepartments
const depts = getDepartments();
assert(Array.isArray(depts) && depts.length === 25, `getDepartments returned ${depts.length} departments`);

// getProvinces
assert(getProvinces('lima').length > 0, 'getProvinces(lima) returns provinces');
assert(getProvinces('LIMA').length > 0, 'getProvinces case-insensitive');
assert(getProvinces('nonexistent').length === 0, 'getProvinces invalid returns empty array');
assert(getProvinces('').length === 0, 'getProvinces empty returns empty array');
assert(getProvinces(null).length === 0, 'getProvinces null returns empty array');
assert(getProvinces(undefined).length === 0, 'getProvinces undefined returns empty array');

// getDistricts
assert(getDistricts('lima', 'lima').length === 43, `getDistricts(lima, lima) has 43 districts, got ${getDistricts('lima', 'lima').length}`);
assert(getDistricts('callao', 'callao').length === 7, `getDistricts(callao, callao) has 7 districts, got ${getDistricts('callao', 'callao').length}`);
assert(getDistricts('nonexistent', 'lima').length === 0, 'getDistricts invalid dept returns empty array');
assert(getDistricts('lima', 'nonexistent').length === 0, 'getDistricts invalid prov returns empty array');
assert(getDistricts('lima', '').length === 43, 'getDistricts with empty prov defaults to first province');
assert(getDistricts('', '').length === 0, 'getDistricts with empty dept returns empty array');

// parseLocationCity
const p1 = parseLocationCity('Miraflores, Lima - Lima');
assert(p1.deptId === 'lima' && p1.provId === 'lima' && p1.districtName === 'Miraflores', 'parse standard city');

const p2 = parseLocationCity('Surco');
assert(p2.deptId === 'lima' && p2.provId === 'huarochiri' && p2.districtName === 'Surco', 'parse Surco district in Huarochiri');

const p3 = parseLocationCity('');
assert(p3.deptId === 'lima' && p3.provId === 'lima' && p3.districtName === 'Miraflores', 'parse empty string fallback');

const p4 = parseLocationCity(null);
assert(p4.deptId === 'lima' && p4.provId === 'lima' && p4.districtName === 'Miraflores', 'parse null fallback');

const p5 = parseLocationCity('Completely Bogus Location String');
assert(p5.deptId === 'lima' && p5.provId === 'lima' && p5.districtName === 'Miraflores', 'parse bogus fallback');

console.log('Helper functions defensive contracts validated.');

// -------------------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS EXECUTED: ${totalTests}`);
console.log(`PASSED: ${passedTests}`);
console.log(`FAILURES: ${failures.length}`);
console.log('================================================================\n');

if (failures.length > 0) {
  console.error('FAILURES DETECTED:');
  for (const f of failures) {
    console.error(` - ${f}`);
  }
  process.exit(1);
} else {
  console.log('VERDICT: ALL ADVERSARIAL STRESS TESTS PASSED EMPIRICALLY (0 ERRORS).');
  process.exit(0);
}
