/**
 * Empirical Adversarial Test Harness for Milestone M2 (Peru Ubigeo Location Dataset)
 * Tests PERU_DEPARTMENTS dataset completeness, invariants, and stress-tests query utilities.
 */

import {
  PERU_DEPARTMENTS,
  getDepartments,
  getProvinces,
  getDistricts,
  parseLocationCity
} from '../src/data/peruLocations.ts';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function check(desc, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    // console.log(`  [PASS] ${desc}`);
  } else {
    failedTests++;
    const errMsg = `FAIL: ${desc} ${details ? '- ' + details : ''}`;
    failures.push(errMsg);
    console.error(`  [X] ${errMsg}`);
  }
}

console.log('===============================================================');
console.log('SUITE 1: DATASET COMPLETENESS & STRUCTURAL INVARIANTS');
console.log('===============================================================');

// 1.1 Count of departments
check('PERU_DEPARTMENTS length is exactly 25', PERU_DEPARTMENTS.length === 25, `Got: ${PERU_DEPARTMENTS.length}`);

// 1.2 Expected 25 entities (24 departments + Callao)
const expectedDepartments = [
  'amazonas', 'ancash', 'apurimac', 'arequipa', 'ayacucho',
  'cajamarca', 'callao', 'cusco', 'huancavelica', 'huanuco',
  'ica', 'junin', 'la_libertad', 'lambayeque', 'lima',
  'loreto', 'madre_de_dios', 'moquegua', 'pasco', 'piura',
  'puno', 'san_martin', 'tacna', 'tumbes', 'ucayali'
];

const actualDeptIds = PERU_DEPARTMENTS.map(d => d.id);
const missingDepts = expectedDepartments.filter(id => !actualDeptIds.includes(id));
check('All 24 departments + Callao IDs are present', missingDepts.length === 0, `Missing: ${missingDepts.join(', ')}`);

// 1.3 Department ID and Name uniqueness
const deptIdSet = new Set();
let dupDeptIds = [];
for (const d of PERU_DEPARTMENTS) {
  if (deptIdSet.has(d.id)) dupDeptIds.push(d.id);
  deptIdSet.add(d.id);
}
check('All department IDs are unique', dupDeptIds.length === 0, `Duplicates: ${dupDeptIds.join(', ')}`);

const deptNameSet = new Set();
let dupDeptNames = [];
for (const d of PERU_DEPARTMENTS) {
  if (deptNameSet.has(d.name)) dupDeptNames.push(d.name);
  deptNameSet.add(d.name);
}
check('All department names are unique', dupDeptNames.length === 0, `Duplicates: ${dupDeptNames.join(', ')}`);

// 1.4 Check every department has non-empty provinces, and each province has non-empty districts
let emptyProvincesDepts = [];
let emptyDistrictsProvs = [];
let totalProvincesCount = 0;
let totalDistrictsCount = 0;
let blankDistrictNames = [];

for (const dept of PERU_DEPARTMENTS) {
  if (!dept.provinces || dept.provinces.length === 0) {
    emptyProvincesDepts.push(dept.name);
    continue;
  }
  const provIdSet = new Set();
  for (const prov of dept.provinces) {
    totalProvincesCount++;
    if (provIdSet.has(prov.id)) {
      failures.push(`Duplicate province id ${prov.id} in department ${dept.name}`);
      failedTests++;
      totalTests++;
    } else {
      provIdSet.add(prov.id);
    }

    if (!prov.districts || prov.districts.length === 0) {
      emptyDistrictsProvs.push(`${dept.name}/${prov.name}`);
    } else {
      for (const dist of prov.districts) {
        totalDistrictsCount++;
        if (!dist || typeof dist !== 'string' || !dist.trim()) {
          blankDistrictNames.push(`${dept.name}/${prov.name}: '${dist}'`);
        }
      }
    }
  }
}

check('All 25 entities have non-empty provinces', emptyProvincesDepts.length === 0, `Empty: ${emptyProvincesDepts.join(', ')}`);
check('All provinces have non-empty districts', emptyDistrictsProvs.length === 0, `Empty: ${emptyDistrictsProvs.join(', ')}`);
check('Zero blank, null, or whitespace-only district names', blankDistrictNames.length === 0, `Blanks: ${blankDistrictNames.join(', ')}`);
console.log(`  -> Total Provinces Cataloged: ${totalProvincesCount}`);
console.log(`  -> Total Districts Cataloged: ${totalDistrictsCount}`);

// 1.5 Lima Metropolitana District Count & Completeness
const limaDept = PERU_DEPARTMENTS.find(d => d.id === 'lima');
const limaProv = limaDept?.provinces?.find(p => p.id === 'lima');
check('Lima department exists', !!limaDept);
check('Lima province exists within Lima dept', !!limaProv);
check('Lima Metropolitana has exactly 43 districts', limaProv?.districts?.length === 43, `Got: ${limaProv?.districts?.length}`);

// Official 43 Lima Metropolitana districts
const expectedLima43 = [
  'Cercado de Lima', 'Ancón', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos',
  'Cieneguilla', 'Comas', 'El Agustino', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria',
  'Lince', 'Los Olivos', 'Lurigancho-Chosica', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac',
  'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo',
  'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis',
  'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa',
  'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo'
];

if (limaProv?.districts) {
  const normActualLima = limaProv.districts.map(d => d.toLowerCase());
  const missingLima = expectedLima43.filter(d => !normActualLima.includes(d.toLowerCase()));
  check('Lima Metropolitana contains all 43 canonical INEI districts', missingLima.length === 0, `Missing: ${missingLima.join(', ')}`);
}

// 1.6 Callao District Count & Completeness (7 districts)
const callaoDept = PERU_DEPARTMENTS.find(d => d.id === 'callao');
const callaoProv = callaoDept?.provinces?.find(p => p.id === 'callao');
check('Callao region exists', !!callaoDept);
check('Callao province exists', !!callaoProv);
check('Callao has exactly 7 districts', callaoProv?.districts?.length === 7, `Got: ${callaoProv?.districts?.length}`);

const expectedCallao7 = [
  'Callao', 'Bellavista', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Ventanilla', 'Mi Perú'
];
if (callaoProv?.districts) {
  const normActualCallao = callaoProv.districts.map(d => d.toLowerCase());
  const missingCallao = expectedCallao7.filter(d => !normActualCallao.includes(d.toLowerCase()));
  check('Callao contains all 7 canonical districts', missingCallao.length === 0, `Missing: ${missingCallao.join(', ')}`);
}

// 1.7 Huarmey in Áncash
const ancashDept = PERU_DEPARTMENTS.find(d => d.id === 'ancash');
const huarmeyProv = ancashDept?.provinces?.find(p => p.id === 'huarmey');
check('Huarmey province exists in Áncash', !!huarmeyProv);
check('Huarmey has districts', (huarmeyProv?.districts?.length || 0) > 0, `Got: ${huarmeyProv?.districts?.length}`);

console.log('\n===============================================================');
console.log('SUITE 2: QUERY HELPER FUNCTIONS');
console.log('===============================================================');

// 2.1 getDepartments()
const depts = getDepartments();
check('getDepartments() returns array of length 25', Array.isArray(depts) && depts.length === 25, `Length: ${depts.length}`);
check('getDepartments() items have id and name', depts.every(d => typeof d.id === 'string' && typeof d.name === 'string'));

// 2.2 getProvinces()
const limaProvs = getProvinces('lima');
check('getProvinces("lima") returns array of provinces', Array.isArray(limaProvs) && limaProvs.length > 0);
check('getProvinces is case-insensitive ("LIMA")', getProvinces('LIMA').length === limaProvs.length);
check('getProvinces works by dept name ("Lima")', getProvinces('Lima').length === limaProvs.length);
check('getProvinces handles whitespace ("  lima  ")', getProvinces('  lima  ').length === limaProvs.length);
check('getProvinces returns [] for unknown dept ("atlantis")', getProvinces('atlantis').length === 0);
check('getProvinces returns [] for empty string ("")', getProvinces('').length === 0);
check('getProvinces returns [] for null/undefined', getProvinces(null).length === 0 && getProvinces(undefined).length === 0);

// 2.3 getDistricts()
const limaDistricts = getDistricts('lima', 'lima');
check('getDistricts("lima", "lima") returns 43 districts', limaDistricts.length === 43, `Got: ${limaDistricts.length}`);
check('getDistricts is case-insensitive ("LIMA", "LIMA")', getDistricts('LIMA', 'LIMA').length === 43);
check('getDistricts works by province name ("Lima", "Lima")', getDistricts('Lima', 'Lima').length === 43);
check('getDistricts returns first province districts when provId is omitted', getDistricts('lima', '').length > 0);
check('getDistricts returns [] for unknown dept', getDistricts('invalid_dept', 'lima').length === 0);
check('getDistricts returns [] for unknown prov', getDistricts('lima', 'invalid_prov').length === 0);
check('getDistricts Callao returns 7 districts', getDistricts('callao', 'callao').length === 7);

console.log('\n===============================================================');
console.log('SUITE 3: STRESS-TESTING parseLocationCity');
console.log('===============================================================');

function validateParsedLocation(res, label) {
  if (!res || typeof res !== 'object') {
    check(`${label}: returns object`, false, `Got: ${JSON.stringify(res)}`);
    return false;
  }
  const hasDept = typeof res.deptId === 'string' && res.deptId.length > 0;
  const hasProv = typeof res.provId === 'string' && res.provId.length > 0;
  const hasDist = typeof res.districtName === 'string' && res.districtName.length > 0;
  
  const deptExists = PERU_DEPARTMENTS.some(d => d.id === res.deptId);
  const deptObj = PERU_DEPARTMENTS.find(d => d.id === res.deptId);
  const provExists = deptObj?.provinces?.some(p => p.id === res.provId);

  check(`${label}: structure is valid { deptId, provId, districtName }`, hasDept && hasProv && hasDist, JSON.stringify(res));
  check(`${label}: deptId '${res.deptId}' exists in catalog`, deptExists);
  check(`${label}: provId '${res.provId}' exists in dept '${res.deptId}'`, provExists);
  return hasDept && hasProv && hasDist && deptExists && provExists;
}

// 3.1 Standard Formatted Strings
const stdCases = [
  { input: 'Miraflores, Lima - Lima', expDept: 'lima', expProv: 'lima', expDist: 'Miraflores' },
  { input: 'San Isidro, Lima - Lima', expDept: 'lima', expProv: 'lima', expDist: 'San Isidro' },
  { input: 'Cayma, Arequipa - Arequipa', expDept: 'arequipa', expProv: 'arequipa', expDist: 'Cayma' },
  { input: 'Wanchaq, Cusco - Cusco', expDept: 'cusco', expProv: 'cusco', expDist: 'Wanchaq' },
  { input: 'Ventanilla, Callao - Callao', expDept: 'callao', expProv: 'callao', expDist: 'Ventanilla' },
  { input: 'Huarmey, Huarmey - Áncash', expDept: 'ancash', expProv: 'huarmey', expDist: 'Huarmey' },
  { input: 'Trujillo, Trujillo - La Libertad', expDept: 'la_libertad', expProv: 'trujillo', expDist: 'Trujillo' }
];

for (const c of stdCases) {
  const r = parseLocationCity(c.input);
  validateParsedLocation(r, `Standard '${c.input}'`);
  check(`Standard '${c.input}' matches expected dept/prov/dist`,
    r.deptId === c.expDept && r.provId === c.expProv && r.districtName.toLowerCase() === c.expDist.toLowerCase(),
    `Expected ${c.expDept}/${c.expProv}/${c.expDist}, got ${r.deptId}/${r.provId}/${r.districtName}`
  );
}

// 3.2 Multi-word Districts (MANDATORY REQUIREMENT)
const multiWordCases = [
  'San Juan de Lurigancho',
  'Santiago de Surco',
  'Villa El Salvador',
  'Villa María del Triunfo',
  'San Martín de Porres',
  'Magdalena del Mar',
  'Pueblo Libre',
  'Carmen de la Legua Reynoso',
  'Mi Perú',
  'San Juan de Miraflores',
  'Santa María del Mar',
  'Nuevo Chimbote',
  'Cerro Colorado'
];

for (const mw of multiWordCases) {
  // Test 1: Full compound format
  const compStr = `${mw}, Lima - Lima`;
  const r1 = parseLocationCity(compStr);
  validateParsedLocation(r1, `Multi-word comp '${compStr}'`);
  check(`Multi-word comp '${compStr}' resolves district`, r1.districtName.toLowerCase() === mw.toLowerCase(), `Got: ${r1.districtName}`);

  // Test 2: Solo multi-word district name
  const r2 = parseLocationCity(mw);
  validateParsedLocation(r2, `Multi-word solo '${mw}'`);
  check(`Multi-word solo '${mw}' resolves district name correctly`, r2.districtName.toLowerCase() === mw.toLowerCase(), `Got: ${r2.districtName}`);
}

// 3.3 Accent Normalization & Variations
const accentCases = [
  { input: 'Huarmey, Huarmey - Ancash', expDept: 'ancash' },
  { input: 'El Tambo, Huancayo - Junin', expDept: 'junin' },
  { input: 'Tarapoto, San Martín - San Martín', expDept: 'san_martin' },
  { input: 'Iquitos, Maynas - Loreto', expDept: 'loreto' }
];
for (const ac of accentCases) {
  const r = parseLocationCity(ac.input);
  validateParsedLocation(r, `Accent test '${ac.input}'`);
  check(`Accent test '${ac.input}' matches dept '${ac.expDept}'`, r.deptId === ac.expDept, `Got: ${r.deptId}`);
}

// 3.4 Single-entity Lookups (Department only, Province only, District only)
const singleCases = [
  { input: 'Lima', expDept: 'lima' },
  { input: 'Arequipa', expDept: 'arequipa' },
  { input: 'Cusco', expDept: 'cusco' },
  { input: 'Huancayo', expDept: 'junin', expProv: 'huancayo' },
  { input: 'Trujillo', expDept: 'la_libertad', expProv: 'trujillo' },
  { input: 'Miraflores', expDept: 'lima', expDist: 'Miraflores' },
  { input: 'Ventanilla', expDept: 'callao', expDist: 'Ventanilla' }
];
for (const sc of singleCases) {
  const r = parseLocationCity(sc.input);
  validateParsedLocation(r, `Single '${sc.input}'`);
  if (sc.expDept) check(`Single '${sc.input}' dept`, r.deptId === sc.expDept, `Got: ${r.deptId}`);
  if (sc.expProv) check(`Single '${sc.input}' prov`, r.provId === sc.expProv, `Got: ${r.provId}`);
  if (sc.expDist) check(`Single '${sc.input}' dist`, r.districtName.toLowerCase() === sc.expDist.toLowerCase(), `Got: ${r.districtName}`);
}

// 3.5 Malformed Dashes, Commas, and Whitespace (MANDATORY REQUIREMENT)
const malformedCases = [
  'Miraflores - Lima',
  'Miraflores, Lima',
  'San Isidro-Lima-Lima',
  'San Isidro,Lima-Lima',
  'Miraflores, Lima - ',
  ' - Lima',
  ' - ',
  ' , - ',
  ', , - - ',
  'Miraflores, , - Lima',
  'San Juan de Lurigancho - Lima',
  'Santiago de Surco, - Lima',
  'Villa El Salvador - ',
  'A - B - C',
  '   Miraflores   ,   Lima   -   Lima   ',
  'Miraflores, Lima - Lima - Perú',
  '-- - --',
  ',,,,',
  ' - - - - '
];

for (const mf of malformedCases) {
  let r;
  let didThrow = false;
  try {
    r = parseLocationCity(mf);
  } catch (e) {
    didThrow = true;
    check(`Malformed '${mf}' did not throw exception`, false, e.message);
  }
  if (!didThrow) {
    check(`Malformed '${mf}' did not throw`, true);
    validateParsedLocation(r, `Malformed '${mf}'`);
  }
}

// 3.6 Edge cases: Empty, Null, Undefined, Unknown, Non-string types (MANDATORY REQUIREMENT)
const edgeCases = [
  { val: '', label: 'empty string' },
  { val: '   ', label: 'whitespace only' },
  { val: null, label: 'null' },
  { val: undefined, label: 'undefined' },
  { val: 'Atlantis', label: 'unknown city Atlantis' },
  { val: 'Gotham City', label: 'unknown city Gotham City' },
  { val: '1234567890', label: 'numeric string' },
  { val: 12345, label: 'number type' },
  { val: {}, label: 'empty object' },
  { val: [], label: 'empty array' },
  { val: true, label: 'boolean true' }
];

for (const ec of edgeCases) {
  let r;
  let didThrow = false;
  try {
    r = parseLocationCity(ec.val);
  } catch (e) {
    didThrow = true;
    check(`Edge case '${ec.label}' threw exception`, false, e.message);
  }
  if (!didThrow) {
    check(`Edge case '${ec.label}' did not throw`, true);
    validateParsedLocation(r, `Edge case '${ec.label}'`);
    // Default fallback check
    if (['empty string', 'whitespace only', 'null', 'undefined', 'unknown city Atlantis', 'number type', 'empty object'].includes(ec.label)) {
      check(`Edge case '${ec.label}' falls back to lima/lima/Miraflores`,
        r.deptId === 'lima' && r.provId === 'lima',
        `Got: ${r.deptId}/${r.provId}/${r.districtName}`
      );
    }
  }
}

console.log('\n===============================================================');
console.log('SUITE 4: EMPIRICAL VERIFICATION OF SuperAdminScreen EDIT RESOLUTION');
console.log('===============================================================');

function simulateSuperAdminEditResolution(biz) {
  const parsedFallback = biz.city ? parseLocationCity(biz.city) : { deptId: 'lima', provId: 'lima', districtName: 'Miraflores' };

  let matchedDept = biz.department
    ? PERU_DEPARTMENTS.find(d => d.name.toLowerCase() === biz.department.toLowerCase() || d.id.toLowerCase() === biz.department.toLowerCase())
    : PERU_DEPARTMENTS.find(d => d.id === parsedFallback.deptId);
  if (!matchedDept) matchedDept = PERU_DEPARTMENTS.find(d => d.id === 'lima') || PERU_DEPARTMENTS[0];

  const provinces = matchedDept?.provinces || [];
  let matchedProv = biz.province
    ? provinces.find(p => p.name.toLowerCase() === biz.province.toLowerCase() || p.id.toLowerCase() === biz.province.toLowerCase())
    : provinces.find(p => p.id === parsedFallback.provId || p.name.toLowerCase() === parsedFallback.provId.toLowerCase());
  if (!matchedProv) matchedProv = provinces[0];
  const provId = matchedProv?.id || 'lima';

  const districts = matchedProv?.districts || [];
  let matchedDist = biz.district
    ? districts.find(d => d.toLowerCase() === biz.district.toLowerCase())
    : districts.find(d => d.toLowerCase() === parsedFallback.districtName.toLowerCase());

  return {
    deptId: matchedDept.id,
    provName: matchedProv?.name,
    provId: matchedProv?.id,
    distName: matchedDist || districts[0] || 'Centro'
  };
}

const provEditCases = [
  {
    biz: { department: 'Puno', province: 'San Román', district: 'Juliaca', city: 'Juliaca, San Román - Puno' },
    expProv: 'San Román',
    expDist: 'Juliaca'
  },
  {
    biz: { department: 'Cusco', province: 'Urubamba', district: 'Machupicchu', city: 'Machupicchu, Urubamba - Cusco' },
    expProv: 'Urubamba',
    expDist: 'Machupicchu'
  },
  {
    biz: { department: 'Arequipa', province: 'Islay', district: 'Mollendo', city: 'Mollendo, Islay - Arequipa' },
    expProv: 'Islay',
    expDist: 'Mollendo'
  }
];

for (const c of provEditCases) {
  const res = simulateSuperAdminEditResolution(c.biz);
  check(`SuperAdminScreen edit resolution for ${c.biz.district}, ${c.biz.province} - ${c.biz.department}`,
    res.provName === c.expProv && res.distName === c.expDist,
    `Expected province '${c.expProv}' and district '${c.expDist}', but got province '${res.provName}' and district '${res.distName}'`
  );
}

console.log('\n===============================================================');
console.log('SUMMARY OF EMPIRICAL ADVERSARIAL STRESS TEST');
console.log('===============================================================');
console.log(`Total Assertions Checked: ${totalTests}`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);

if (failedTests > 0) {
  console.error('\nFAILURE LIST:');
  failures.forEach(f => console.error(`  - ${f}`));
  console.log('\n>>> STRESS TEST IDENTIFIED REAL DEFECTS REQUIRING REMEDIATION <<<');
  process.exit(1);
} else {
  console.log('\n>>> ALL EMPIRICAL AND ADVERSARIAL ASSERTS PASSED CLEANLY! <<<');
  process.exit(0);
}
