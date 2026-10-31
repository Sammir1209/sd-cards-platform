# Challenger 1 Handoff Report: Milestone M2 (Peru Ubigeo Location Dataset)

**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### 1.1 Dataset Completeness & Invariants (`sd_cards_mobile/src/data/peruLocations.ts`)
- Executed `node --experimental-strip-types sd_cards_mobile/tests/m2_ubigeo_stress_test.mjs`
- `PERU_DEPARTMENTS` contains exactly **25 regional entities** (24 departments + Constitutional Province of Callao). All department IDs and names are unique and non-empty.
- Total cataloged entities: **183 provinces** and **1766 districts**. All 25 departments have non-empty `provinces` arrays, and all 183 provinces have non-empty `districts` arrays. Zero null, empty, or whitespace-only district strings exist.
- **Lima Metropolitana** (`id: 'lima'`, province `lima`): Exactly **43 districts** verified, containing all canonical metropolitan districts (Miraflores, San Isidro, Surco, San Juan de Lurigancho, Ancón, Lurigancho-Chosica, etc.).
- **Callao** (`id: 'callao'`, province `callao`): Exactly **7 districts** verified (Callao, Bellavista, Carmen de la Legua Reynoso, La Perla, La Punta, Ventanilla, Mi Perú).
- **Áncash**: Province `huarmey` (`id: 'huarmey'`, `name: 'Huarmey'`) verified with 5 districts (`Huarmey`, `Cochapeti`, `Culebras`, `Huayan`, `Malvas`).

### 1.2 Query Utilities & Edge Case Stress-Testing
- `getDepartments()`: Returns array of 25 objects `{ id, name }`.
- `getProvinces(deptId)`: Correctly handles case-insensitivity (`"LIMA"`), trimmed spaces (`"  lima  "`), department names (`"Lima"`), and returns `[]` on invalid, empty, or null inputs.
- `getDistricts(deptId, provId)`: Correctly returns 43 districts for Lima, 7 for Callao, and returns `[]` defensively for unknown departments or provinces.
- `parseLocationCity(cityString)`: Tested with 340+ test cases including:
  * Multi-word districts (`San Juan de Lurigancho`, `Santiago de Surco`, `Villa El Salvador`, `Villa María del Triunfo`, `San Martín de Porres`, `Carmen de la Legua Reynoso`, `Mi Perú`, `Nuevo Chimbote`, `Cerro Colorado`).
  * Malformed delimiters (`" - "`, `", , - - "`, `" - Lima"`, `"Miraflores, , - Lima"`, `"A - B - C"`).
  * Boundary types (`""`, `"   "`, `null`, `undefined`, `"Atlantis"`, `"Gotham City"`, `12345`, `{}`, `[]`, `true`).
  * In all 100% of cases, `parseLocationCity` safely returns `{ deptId, provId, districtName }` with non-empty strings and valid catalog references, without throwing any unhandled exceptions.

### 1.3 Build Verification
- **Mobile TypeScript Compiler**:
  ```powershell
  cd sd_cards_mobile; npx tsc --noEmit
  ```
  Result: Exit code 0, 0 errors.
- **Backend .NET Build**:
  ```powershell
  dotnet build NfcMenuSaas.csproj
  ```
  Result: Exit code 0, 0 Warnings, 0 Errors.

### 1.4 Critical Defect: Province & District Hijacking in `SuperAdminScreen.tsx` (Lines 366-378)
- In `sd_cards_mobile/src/screens/admin/SuperAdminScreen.tsx`, `handleOpenEditBusiness` attempts to resolve the client's current location when opening the Edit Modal:
  ```typescript
  // Lines 365-378:
  const provinces = matchedDept?.provinces || [];
  let matchedProv = provinces.find(p =>
    (biz.province && p.name.toLowerCase() === biz.province.toLowerCase()) ||
    (biz.city && biz.city.toLowerCase().includes(p.name.toLowerCase()))
  );
  if (!matchedProv) matchedProv = provinces[0];
  const provId = matchedProv?.id || 'lima';
  setEditProvId(provId);

  const districts = matchedProv?.districts || [];
  let matchedDist = districts.find(d =>
    (biz.district && d.toLowerCase() === biz.district.toLowerCase()) ||
    (biz.city && biz.city.toLowerCase().includes(d.toLowerCase()))
  );
  setEditDistrictName(matchedDist || districts[0] || 'Centro');
  ```
- **Verbatim Error Output from `sd_cards_mobile/tests/m2_ubigeo_stress_test.mjs`**:
  ```
  [X] FAIL: SuperAdminScreen edit resolution for Juliaca, San Román - Puno - Expected province 'San Román' and district 'Juliaca', but got province 'Puno' and district 'Puno'
  [X] FAIL: SuperAdminScreen edit resolution for Machupicchu, Urubamba - Cusco - Expected province 'Urubamba' and district 'Machupicchu', but got province 'Cusco' and district 'Cusco'
  [X] FAIL: SuperAdminScreen edit resolution for Mollendo, Islay - Arequipa - Expected province 'Islay' and district 'Mollendo', but got province 'Arequipa' and district 'Arequipa'
  ```

---

## 2. Logic Chain

1. **Dataset Completeness (Verified PASS)**:
   - Observation: `PERU_DEPARTMENTS` contains 25 regions, 183 provinces, 1766 districts.
   - Deduction: Requirement R2 data coverage criteria are completely fulfilled.

2. **Query Functions (Verified PASS)**:
   - Observation: `parseLocationCity` safely parsed every tested composite and malformed string into valid identifiers.
   - Deduction: Query utilities meet all contract specifications.

3. **Silent Data Corruption Mechanism (Identified Critical Flaw)**:
   - Observation: In Peru, departments such as Arequipa, Cusco, Huancavelica, Huánuco, Ica, Pasco, Piura, Puno, Tacna, and Tumbes have a province with the exact same name as the department (e.g., province `Cusco` in department `Cusco`, province `Puno` in department `Puno`). In `PERU_DEPARTMENTS`, this capital province is always listed as the first element of `provinces`.
   - Observation: The client's composite city string is stored as `${district}, ${province} - ${department}` (e.g., `"Juliaca, San Román - Puno"` or `"Machupicchu, Urubamba - Cusco"`).
   - Reasoning: In `SuperAdminScreen.tsx` line 368, the condition `(biz.city && biz.city.toLowerCase().includes(p.name.toLowerCase()))` is checked inside `provinces.find(...)`. Because `biz.city` ends with `- Puno` or `- Cusco`, and the first province evaluated is `p.name = 'Puno'` or `'Cusco'`, `biz.city.toLowerCase().includes('puno')` evaluates to **true** regardless of `biz.province`!
   - Deduction: `provinces.find` returns the capital province `Puno` instead of `San Román` (or `Cusco` instead of `Urubamba`), discarding `biz.province`. Next, because the client's district (`Juliaca` or `Machupicchu`) does not exist inside the capital province, `matchedDist` evaluates to `undefined` and falls back to `districts[0]` (`'Puno'` or `'Cusco'`).
   - Impact: Whenever an administrator opens the Edit Modal for any business outside the capital province in 10+ Peruvian departments and clicks "Guardar Cambios", the business's province and district are silently overwritten to the capital province and district in the database.

---

## 3. Caveats

- Backend SQLite persistence of the new columns (`Department`, `Province`, `District`) is scheduled for Milestone M3. In Milestone M2, location data flows through `city` and UI state in `SuperAdminScreen.tsx`.
- The dataset in `sd_cards_mobile/src/data/peruLocations.ts` is 100% sound and complete. The defect is localized strictly to the client editing reconciliation logic in `SuperAdminScreen.tsx`.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

While the Ubigeo dataset in `peruLocations.ts` and the helper functions (`getDepartments`, `getProvinces`, `getDistricts`, `parseLocationCity`) are completely and correctly implemented, the integration in `SuperAdminScreen.tsx` (lines 358-379) introduces a critical data corruption defect when editing existing client profiles.

### Required Remediations for worker_m2:
In `sd_cards_mobile/src/screens/admin/SuperAdminScreen.tsx`, refactor `handleOpenEditBusiness` (lines 358-380) to avoid naive substring searching on `biz.city`.
Instead, use hierarchical resolution:
1. If `biz.department` is present, find department by name or id. If not, use `parseLocationCity(biz.city).deptId`.
2. If `biz.province` is present, find province by name or id within the matched department. If not, use `parseLocationCity(biz.city).provId`.
3. If `biz.district` is present, find district by name within the matched province. If not, use `parseLocationCity(biz.city).districtName`.

Example drop-in fix for `handleOpenEditBusiness`:
```typescript
// Emparejar departamento, provincia y distrito
let parsedFallback = biz.city ? parseLocationCity(biz.city) : { deptId: 'lima', provId: 'lima', districtName: 'Miraflores' };

let matchedDept = biz.department
  ? PERU_DEPARTMENTS.find(d => d.name.toLowerCase() === biz.department.toLowerCase() || d.id.toLowerCase() === biz.department.toLowerCase())
  : PERU_DEPARTMENTS.find(d => d.id === parsedFallback.deptId);
if (!matchedDept) matchedDept = PERU_DEPARTMENTS.find(d => d.id === 'lima') || PERU_DEPARTMENTS[0];
setEditDeptId(matchedDept.id);

const provinces = matchedDept?.provinces || [];
let matchedProv = biz.province
  ? provinces.find(p => p.name.toLowerCase() === biz.province.toLowerCase() || p.id.toLowerCase() === biz.province.toLowerCase())
  : provinces.find(p => p.id === parsedFallback.provId || p.name.toLowerCase() === parsedFallback.provId.toLowerCase());
if (!matchedProv) matchedProv = provinces[0];
const provId = matchedProv?.id || 'lima';
setEditProvId(provId);

const districts = matchedProv?.districts || [];
let matchedDist = biz.district
  ? districts.find(d => d.toLowerCase() === biz.district.toLowerCase())
  : districts.find(d => d.toLowerCase() === parsedFallback.districtName.toLowerCase());
setEditDistrictName(matchedDist || districts[0] || 'Centro');
```

---

## 5. Verification Method

To independently reproduce the findings and verify subsequent fixes:

1. **Run Empirical Challenger Stress Test Suite**:
   ```powershell
   cd "C:\Users\Conter\OneDrive\Desktop\Reseñas Cards"
   node --experimental-strip-types sd_cards_mobile/tests/m2_ubigeo_stress_test.mjs
   ```
   *Current Result*: Fails on Suite 4 (demonstrating province hijacking in Cusco, Puno, Arequipa).
   *Target Post-Fix Result*: 343/343 checks pass cleanly with exit code 0.

2. **TypeScript Build Check**:
   ```powershell
   cd "C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile"
   npx tsc --noEmit
   ```
   *Expected Result*: Exit code 0, 0 errors.

3. **.NET Backend Build Check**:
   ```powershell
   cd "C:\Users\Conter\OneDrive\Desktop\Reseñas Cards"
   dotnet build NfcMenuSaas.csproj
   ```
   *Expected Result*: 0 Warnings, 0 Errors.
