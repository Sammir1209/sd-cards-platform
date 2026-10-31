# Challenger 2 Handoff Report: Milestone M2 (Peru Ubigeo Location Dataset)

**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

1. **Mobile TypeScript Build**:
   - Command: `cd sd_cards_mobile; npx tsc --noEmit`
   - Exit code: `0`
   - Output: 0 errors.

2. **Backend .NET Build**:
   - Command: `dotnet build NfcMenuSaas.csproj`
   - Exit code: `0`
   - Output:
     ```
     Compilación correcta.
         0 Advertencia(s)
         0 Errores
     ```

3. **Key Uniqueness & Dataset Completeness (`sd_cards_mobile/src/data/peruLocations.ts`)**:
   - Executed automated audit in `sd_cards_mobile/tests/m2_ubigeo_stress_test.js`:
     * Total regional entities: 25 (24 departments + Callao).
     * Total provinces: 183.
     * Total districts: 1,766.
     * Lima Metropolitana has all 43 districts (`p.id === 'lima'`).
     * Callao has all 7 districts (`p.id === 'callao'`).
     * Áncash contains Huarmey (`p.id === 'huarmey'`, 5 districts).
     * React keys:
       - Department keys (`dept.id`): 25/25 unique (0 duplicates).
       - Province keys (`${dept.id}-${prov.id}`): 183/183 unique (0 duplicates).
       - District keys (`${dept.id}-${prov.id}-${dist}`): 1,766/1,766 unique (0 duplicates).

4. **Rapid Department Switching Safety (`sd_cards_mobile/src/screens/admin/SuperAdminScreen.tsx`)**:
   - Simulated all 625 department-to-department switching transitions (including `lima` [43 districts] -> `amazonas` [small district counts]) across desynchronized intermediate states (Phase 1: new dept + old prov + old dist; Phase 2: new dept + new prov + old dist; Phase 3: settled).
   - In all 625 transitions:
     * `const provinces = dept?.provinces || []` handled missing properties without `TypeError`.
     * `const prov = dept?.provinces?.find(p => p.id === selectedProvId) || dept?.provinces?.[0]` cleanly fell back to `dept.provinces[0]` when `selectedProvId` from the prior department was not found.
     * Zero out-of-bounds indexing occurred.
     * Zero duplicate keys were generated during intermediate desynchronized renders.

5. **`handleCreateBusiness` String Synthesis (`SuperAdminScreen.tsx` lines 283-287)**:
   - Evaluated string synthesis across all 1,766 valid combinations:
     `const locationCity = \`\${selectedDistrictName}, \${provName} - \${deptName}\`;`
   - 1,766 / 1,766 strings synthesized without `undefined`, `null`, or `[object Object]`.
   - 1,766 / 1,766 strings round-tripped with 100% precision through `parseLocationCity`.

6. **Defensive Fallbacks with Corrupted Data**:
   - Evaluated inputs `null`, `undefined`, `""`, `"   "`, `"invalid_id_9999"`, `12345`, `{}`, `[]`.
   - Optional chaining (`?.`) and fallback operators (`|| []`, `|| PERU_DEPARTMENTS[0]`, `|| 'Central'`, `|| 'Perú'`) prevented unhandled runtime exceptions.

7. **Vulnerability Confirmed: Data Corruption in `openEditBizModal` (`SuperAdminScreen.tsx` lines 366-378)**:
   - Code snippet in `SuperAdminScreen.tsx`:
     ```typescript
     365: const provinces = matchedDept?.provinces || [];
     366: let matchedProv = provinces.find(p =>
     367:   (biz.province && p.name.toLowerCase() === biz.province.toLowerCase()) ||
     368:   (biz.city && biz.city.toLowerCase().includes(p.name.toLowerCase()))
     369: );
     370: if (!matchedProv) matchedProv = provinces[0];
     371: const provId = matchedProv?.id || 'lima';
     372: setEditProvId(provId);
     373: 
     374: const districts = matchedProv?.districts || [];
     375: let matchedDist = districts.find(d =>
     376:   (biz.district && d.toLowerCase() === biz.district.toLowerCase()) ||
     377:   (biz.city && biz.city.toLowerCase().includes(d.toLowerCase()))
     378: );
     379: setEditDistrictName(matchedDist || districts[0] || 'Centro');
     ```
   - Empirical test case:
     ```typescript
     const biz = {
       department: 'Cusco',
       province: 'Urubamba',
       district: 'Machupicchu',
       city: 'Machupicchu, Urubamba - Cusco'
     };
     ```
   - Actual test execution result:
     * `matchedDept.id`: `'cusco'` (correct).
     * `matchedProv.id`: `'cusco'` (WRONG: expected `'urubamba'`).
     * `editDistrictName`: `'Cusco'` (WRONG: expected `'Machupicchu'`).
   - Confirmed assertion in `sd_cards_mobile/tests/m2_ubigeo_stress_test.js`:
     `assert(bugResult.editProvId === 'cusco' && bugResult.editDistrictName === 'Cusco')` evaluated to `true`.

---

## 2. Logic Chain

1. **Mechanism of the Bug**:
   - In Peru, many regional departments share their name with their capital province and capital district: Cusco (Dept: Cusco, Prov: Cusco, Dist: Cusco), Arequipa (Dept: Arequipa, Prov: Arequipa, Dist: Arequipa), Puno, Tacna, Huánuco, Ica, Moquegua, Pasco, Piura, Tumbes.
   - When a business record is registered, `handleCreateBusiness` (line 287) creates `city` in the standard canonical format: `"<district>, <province> - <department>"` (e.g., `"Machupicchu, Urubamba - Cusco"`).
   - When `openEditBizModal` is invoked to edit that business, lines 366-369 search for `matchedProv` using `.find()`.
   - On the first iteration of `.find()`, `p` is province 0 (`Cusco`).
   - Condition 1: `(biz.province && p.name.toLowerCase() === biz.province.toLowerCase())` is `false` (`'cusco' === 'urubamba'`).
   - Condition 2: `(biz.city && biz.city.toLowerCase().includes(p.name.toLowerCase()))` is `true`, because `'machupicchu, urubamba - cusco'` contains `'cusco'` (which is the department suffix at the end of the string!).
   - Because `Condition 1 || Condition 2` evaluates to `true`, `.find()` halts immediately at province 0 (`Cusco`) and never inspects province 12 (`Urubamba`).
   - Similarly, in lines 375-378, `.find()` iterates through districts of province `Cusco`. District 0 is `'Cusco'`. Because `biz.city` contains `'cusco'`, Condition 2 is `true`, returning district `'Cusco'`.

2. **Blast Radius & Impact**:
   - Whenever an administrator opens the "Edit Client" modal for any client located in a non-capital province or district within any of the ~10 departments whose capital shares the department name (e.g. Urubamba in Cusco, Caylloma in Arequipa, San Román in Puno, Sullana in Piura):
     The modal automatically overwrites the client's province and district with the capital!
   - When the administrator clicks "Guardar Cambios", `handleSaveEditBusiness` sends the overwritten location to the backend database via `PUT /api/businessapi/{id}`, corrupting the client's location data permanently.

3. **Remediation**:
   - Worker M2 created and exported `parseLocationCity(cityString?: string)` in `sd_cards_mobile/src/data/peruLocations.ts`, which correctly parses composite strings by splitting on ` - ` into `[leftPart, deptPart]` and on `,` into `[districtName, provName]`.
   - However, Worker M2 did not import or use `parseLocationCity` in `SuperAdminScreen.tsx`.
   - Fixing `openEditBizModal` in `SuperAdminScreen.tsx` requires:
     1. Import `parseLocationCity` from `../../data/peruLocations`.
     2. In `openEditBizModal`, prioritize exact matches on `biz.department`, `biz.province`, `biz.district`. If missing, parse `biz.city` via `parseLocationCity(biz.city)`. Do not use substring `.includes()` on `biz.city` within province/district matching.

---

## 3. Caveats

- The location catalog (`peruLocations.ts`), cascading pickers during client creation (`handleCreateBusiness`), TypeScript build, and .NET backend compilation are robust, clean, and passed all tests.
- This finding pertains exclusively to `openEditBizModal` in `SuperAdminScreen.tsx`.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone M2 cannot be approved in its current state because `SuperAdminScreen.tsx` contains a confirmed data-corruption defect when loading existing client profiles into the Edit modal.

### Required Changes for Worker M2:
1. In `sd_cards_mobile/src/screens/admin/SuperAdminScreen.tsx`:
   - Update import at line 63:
     ```typescript
     import { PERU_DEPARTMENTS, parseLocationCity } from '../../data/peruLocations';
     ```
   - In `openEditBizModal` (lines 357-380), replace the substring `.includes()` logic with structured matching:
     ```typescript
     let matchedDept = PERU_DEPARTMENTS.find(d =>
       d.name.toLowerCase() === biz.department?.toLowerCase() ||
       d.id.toLowerCase() === biz.department?.toLowerCase()
     );
     if (!matchedDept && biz.city) {
       const parsed = parseLocationCity(biz.city);
       matchedDept = PERU_DEPARTMENTS.find(d => d.id === parsed.deptId);
     }
     if (!matchedDept) matchedDept = PERU_DEPARTMENTS.find(d => d.id === 'lima') || PERU_DEPARTMENTS[0];
     setEditDeptId(matchedDept.id);

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
     setEditProvId(provId);

     const districts = matchedProv?.districts || [];
     let matchedDist = districts.find(d =>
       d.toLowerCase() === biz.district?.toLowerCase()
     );
     if (!matchedDist && biz.city) {
       const parsed = parseLocationCity(biz.city);
       matchedDist = districts.find(d => d.toLowerCase() === parsed.districtName.toLowerCase());
     }
     setEditDistrictName(matchedDist || districts[0] || 'Centro');
     ```

---

## 5. Verification Method

1. **Execute Empirical Stress Test Suite**:
   ```powershell
   cd "C:\Users\Conter\OneDrive\Desktop\Reseñas Cards"
   node --experimental-strip-types sd_cards_mobile/tests/m2_ubigeo_stress_test.js
   ```
   *Expected result: 31,637 assertions executed, 0 errors.*

2. **Verify Mobile TypeScript Compilation**:
   ```powershell
   cd "C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile"
   npx tsc --noEmit
   ```
   *Expected result: Exit code 0, 0 errors.*

3. **Verify Backend .NET Compilation**:
   ```powershell
   cd "C:\Users\Conter\OneDrive\Desktop\Reseñas Cards"
   dotnet build NfcMenuSaas.csproj
   ```
   *Expected result: 0 Warnings, 0 Errors.*
