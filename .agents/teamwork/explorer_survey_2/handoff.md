# Explorer 2 Handoff Report: Peru Ubigeo Location Dataset (Requirement R2)

## 1. Observation

### 1.1 Existing Location Data Definition & Storage
- **File**: `sd_cards_mobile/src/data/peruLocations.ts` (lines 1-210)
  - Data structure:
    ```typescript
    export interface PeruDistrict {
      id: string;
      name: string;
    }
    export interface PeruProvince {
      id: string;
      name: string;
      districts: string[];
    }
    export interface PeruDepartment {
      id: string;
      name: string;
      provinces: PeruProvince[];
    }
    export const PERU_DEPARTMENTS: PeruDepartment[] = [ ... ];
    ```
  - Note: `PeruDistrict` interface is defined but not utilized within `PeruProvince.districts`, which is typed as `string[]`.
  - Currently contains only **10 departments**:
    1. `lima` (lines 19-60)
    2. `san_martin` (lines 61-91)
    3. `arequipa` (lines 92-107)
    4. `la_libertad` (lines 108-118)
    5. `cusco` (lines 119-134)
    6. `piura` (lines 135-150)
    7. `lambayeque` (lines 151-161)
    8. `ancash` (lines 162-177)
    9. `junin` (lines 178-188)
    10. `ica` (lines 189-209)
  - **15 Department-level regions are completely missing**:
    Amazonas, Apurímac, Ayacucho, Cajamarca, Callao (Provincia Constitucional del Callao), Huancavelica, Huánuco, Loreto, Madre de Dios, Moquegua, Pasco, Puno, Tacna, Tumbes, and Ucayali.
  - **Incomplete coverage in existing 10 departments**:
    - **Lima**: Lists only 3 of 10 provinces (`lima`, `canete`, `huaral`). The province of Lima lists only 20 districts out of 43 (missing Breña, Carabayllo, Chaclacayo, Cieneguilla, El Agustino, Independencia, La Victoria, Lurigancho-Chosica, Lurín, Pachacámac, Pucusana, Puente Piedra, Punta Hermosa, Punta Negra, Rímac, San Bartolo, San Juan de Miraflores, San Luis, Santa Anita, Santa María del Mar, Santa Rosa, Villa María del Triunfo). Missing entire provinces: Barranca, Cajatambo, Canta, Huarochirí, Huaura, Oyón, Yauyos.
    - **La Libertad**: Lists only `trujillo` (1 of 12 provinces).
    - **Cusco**: Lists only `cusco` and `urubamba` (2 of 13 provinces).
    - **Piura**: Lists only `piura` and `talara` (2 of 8 provinces).
    - **Lambayeque**: Lists only `chiclayo` (1 of 3 provinces; missing Lambayeque and Ferreñafe).
    - **Áncash**: Lists only `santa` and `huaraz` (2 of 20 provinces).
    - **Junín**: Lists only `huancayo` (1 of 9 provinces; missing Chanchamayo, Tarma, Satipo, Jauja, Yauli, Chupaca, Concepción, Junín).
    - **Ica**: Lists only `ica`, `chincha`, `pisco` (3 of 5 provinces; missing Nasca and Palpa).
    - **Arequipa**: Lists only `arequipa`, `islay` (2 of 8 provinces; missing Camaná, Caravelí, Castilla, Caylloma, Condesuyos, La Unión).
    - **San Martín**: Lists 5 of 10 provinces (missing El Dorado, Huallaga, Lamas, Picota, Tocache).

### 1.2 Mobile UI Cascading Selectors
- **File**: `sd_cards_mobile/src/screens/admin/SuperAdminScreen.tsx`
  - Location state declarations (lines 146-148):
    ```typescript
    const [selectedDeptId, setSelectedDeptId] = useState('lima');
    const [selectedProvId, setSelectedProvId] = useState('lima');
    const [selectedDistrictName, setSelectedDistrictName] = useState('Miraflores');
    ```
  - Department Selector (lines 1378-1399):
    ```typescript
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScrollRow}>
      {PERU_DEPARTMENTS.map((dept) => (
        <TouchableOpacity
          key={dept.id}
          style={[styles.geoPill, selectedDeptId === dept.id && styles.geoPillActive]}
          onPress={() => {
            setSelectedDeptId(dept.id);
            const firstProv = dept.provinces[0];
            if (firstProv) {
              setSelectedProvId(firstProv.id);
              setSelectedDistrictName(firstProv.districts[0] || 'Centro');
            }
          }}
        >
    ```
  - Province Selector (lines 1401-1425):
    ```typescript
    const dept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScrollRow}>
        {dept.provinces.map((prov) => (
          <TouchableOpacity
            key={prov.id}
            style={[styles.geoPill, selectedProvId === prov.id && styles.geoPillActive]}
            onPress={() => {
              setSelectedProvId(prov.id);
              setSelectedDistrictName(prov.districts[0] || 'Centro');
            }}
          >
    ```
  - District Selector (lines 1427-1450):
    ```typescript
    const dept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
    const prov = dept.provinces.find(p => p.id === selectedProvId) || dept.provinces[0];
    const districts = prov?.districts || [];
    ...
    {districts.map((dist) => (
      <TouchableOpacity
        key={dist}
        style={[styles.geoPill, selectedDistrictName === dist && styles.geoPillActive]}
        onPress={() => setSelectedDistrictName(dist)}
      >
    ```
  - Identified issues and potential crashes in Mobile UI:
    1. **Pill ScrollView Scalability**: 25 departments and dozens of districts inside a horizontal ScrollView becomes difficult to navigate on mobile devices.
    2. **Uncaught TypeError risk on client creation** (lines 257-260):
       ```typescript
       const currentDept = PERU_DEPARTMENTS.find(d => d.id === selectedDeptId) || PERU_DEPARTMENTS[0];
       const currentProv = currentDept.provinces.find(p => p.id === selectedProvId) || currentDept.provinces[0];
       const locationCity = `${selectedDistrictName}, ${currentProv.name} - ${currentDept.name}`;
       ```
       If `currentDept.provinces` is empty or undefined, `currentProv` is undefined, causing `currentProv.name` to throw an unhandled `TypeError` (`Cannot read properties of undefined`).
    3. **Key collisions**: `key={dist}` at line 1438 uses the plain string name. While unique within a single province list, using a composite key `${prov.id}-${dist}` avoids warnings during state transitions.
    4. **No location selector in client edit**: Location selection exists only in the create modal (`showCreateBizModal`). There is no edit modal in `SuperAdminScreen.tsx` for updating existing client location (Requirement R3).

### 1.3 Backend Persistence & API Contracts
- **File**: `Models/Business.cs` (lines 1-96)
  - Properties currently defined:
    - Line 34: `public string? City { get; set; }`
    - Line 40: `public string? Address { get; set; }`
  - The model does NOT declare: `Department`, `Province`, `District`, `Ruc`, `PlanMonths`, `PlanExpiryDate`.
- **File**: `Data/DbInitializer.cs` (lines 40-74)
  - SQLite migration script already contains:
    - Line 43: `ALTER TABLE Businesses ADD COLUMN Department TEXT;`
    - Line 50: `ALTER TABLE Businesses ADD COLUMN Province TEXT;`
    - Line 57: `ALTER TABLE Businesses ADD COLUMN District TEXT;`
    - Line 64: `ALTER TABLE Businesses ADD COLUMN PlanMonths INTEGER NOT NULL DEFAULT 12;`
    - Line 71: `ALTER TABLE Businesses ADD COLUMN PlanExpiryDate TEXT;`
  - Observation: The database table schema was planned for these columns, but they were never mapped onto the C# `Business` model class.
- **File**: `Controllers/Api/BusinessApiController.cs` (lines 1-452)
  - `GetAll` (lines 20-45) and `GetById` (lines 48-85): project only `b.City` and `b.Address`.
  - `Register` (lines 141-197): receives `RegisterBusinessRequest(Name, OwnerName, Email, Phone, Password, Ruc, City, Address, Services)`.
    - Line 175: `City = request.City?.Trim() ?? "Lima"`
    - Ignores `Ruc` and has no fields for `Department`, `Province`, or `District`.
  - Update Client endpoint:
    - Does NOT exist. Currently only `update-password`, `routing`, and `template-type` endpoints exist. No `PUT /api/businessapi/{id}` for updating client details (Requirement R3).
- **File**: `Services/GoogleReviewUrlBuilder.cs` (lines 33-35)
  - Uses `city` in Google search query:
    ```csharp
    string query = string.IsNullOrWhiteSpace(city) 
        ? $"opiniones de {businessName}" 
        : $"opiniones de {businessName} {city}";
    ```
  - Keeping `City` populated with `"{District}, {Province} - {Department}"` ensures Google Review URLs continue to generate accurate location queries.

---

## 2. Logic Chain

1. **Coverage Gap Deduction**:
   - Original Request R2 requires: "all 24 departments of Peru and the Constitutional Province of Callao, including their respective provinces and principal districts".
   - `PERU_DEPARTMENTS` in `peruLocations.ts` contains only 10 departments and Callao is missing.
   - Therefore, 15 department-level items plus their provinces and principal districts must be added, and existing 10 departments must be enriched with missing provinces and capital districts (e.g., all 43 districts of Lima Metropolitana).

2. **Data Structure Compatibility**:
   - The frontend consumes `dept.id`, `dept.name`, `dept.provinces`, `prov.id`, `prov.name`, and `prov.districts` (as `string[]`).
   - Maintaining the exact existing interface structure (`id: string; name: string; provinces: PeruProvince[]` with `districts: string[]`) guarantees 100% backward compatibility with zero regressions in the UI.

3. **Runtime Stability in Cascading Pickers**:
   - In `SuperAdminScreen.tsx`, `handleCreateBusiness` (line 258) accesses `currentProv.name` directly without defensive null-coalescing.
   - When a user changes department, `selectedDeptId` changes immediately, while `selectedProvId` might briefly be invalid for that department during render cycles.
   - Implementing safe navigation (`currentProv?.name ?? 'Central'`, `currentDept?.name ?? 'Perú'`) and compound keys (`${dept.id}-${prov.id}-${dist}`) eliminates all possible crash and warning vectors.

4. **Integration with Requirements R3 & R4**:
   - R3 requires editing client profiles including "department, province, district, active/paused status, and plan duration".
   - R4 requires filtering by "status, expiration date, and location".
   - Because `Business.cs` currently lacks `Department`, `Province`, and `District`, clients only store location in composite string `City` (`"Miraflores, Lima - Lima"`).
   - Adding explicit properties `Department`, `Province`, `District`, `Ruc`, `PlanMonths`, `PlanExpiryDate` to `Business.cs`, exposing them in `BusinessApiController`, and providing a helper `parseLocationString()` in `peruLocations.ts` enables:
     - Exact filtering by location in the mobile client list.
     - Accurate initialization of cascading pickers in the Client Edit Modal.
     - Preservation of `City` for `GoogleReviewUrlBuilder` and legacy database queries.

---

## 3. Caveats

- **District Volume in Peru**: Peru has 196 provinces and 1,874 districts. Loading all 1,874 districts directly into mobile memory could bloat bundle size if unoptimized. However, storing all 25 regions, all 196 provinces, and their principal/commercial districts (all 43 for Lima, and capitals/major towns for other provinces: ~400-500 total districts) takes ~45 KB in TypeScript, with zero network latency and instantaneous offline performance.
- **Legacy Records**: Existing database records in `nfcmenu.db` only have `City` populated as a formatted string (e.g. `"Miraflores, Lima - Lima"` or `"Lima"`). The implementation must gracefully handle records where `Department`, `Province`, and `District` are null by parsing `City` or falling back to default values.
- **Read-Only Scope**: In accordance with the Explorer role guidelines, no source code files were edited during this survey.

---

## 4. Conclusion & Architectural Recommendations

### Complete Catalog Specification (25 Entities):
The location catalog must define the following 25 department-level entities with their corresponding provinces and principal districts:
1. `amazonas`: Chachapoyas, Bagua, Bongará, Condorcanqui, Luya, Rodríguez de Mendoza, Utcubamba.
2. `ancash`: Huaraz, Santa (Chimbote, Nuevo Chimbote), Casma, Huarmey, Huari, Carhuaz, Yungay.
3. `apurimac`: Abancay, Andahuaylas, Chincheros, Cotabambas, Grau.
4. `arequipa`: Arequipa (all major metropolitan districts), Camaná, Caravelí, Castilla, Caylloma, Islay.
5. `ayacucho`: Huamanga (Ayacucho), Cangallo, Huanta, La Mar, Lucanas.
6. `cajamarca`: Cajamarca, Jaén, Chota, Cutervo, Celendín, Hualgayoc, San Ignacio.
7. `callao`: Callao, Bellavista, Carmen de la Legua Reynoso, La Perla, La Punta, Ventanilla, Mi Perú.
8. `cusco`: Cusco, Urubamba, Calca, Canchis, La Convención, Anta, Espinar, Quispicanchi.
9. `huancavelica`: Huancavelica, Acobamba, Angaraes, Tayacaja.
10. `huanuco`: Huánuco, Leoncio Prado (Tingo María), Ambo, Dos de Mayo, Puerto Inca.
11. `ica`: Ica, Chincha, Pisco, Nasca, Palpa.
12. `junin`: Huancayo, Chanchamayo, Tarma, Satipo, Jauja, Yauli (La Oroya), Chupaca, Concepción.
13. `la_libertad`: Trujillo (all metropolitan districts), Ascope, Pacasmayo, Chepén, Virú, Sánchez Carrión, Otuzco.
14. `lambayeque`: Chiclayo (all metropolitan districts), Lambayeque, Ferreñafe.
15. `lima`:
    - `lima` (All 43 districts: Cercado, Miraflores, San Isidro, Surco, San Borja, Barranco, La Molina, Magdalena, Pueblo Libre, Jesús María, Lince, San Miguel, Surquillo, Los Olivos, Comas, SMP, Ate, SJL, Chorrillos, VES, Breña, Carabayllo, Chaclacayo, Cieneguilla, El Agustino, Independencia, La Victoria, Lurigancho-Chosica, Lurín, Pachacámac, Pucusana, Puente Piedra, Punta Hermosa, Punta Negra, Rímac, San Bartolo, SJM, San Luis, Santa Anita, Santa María del Mar, Santa Rosa, VMT).
    - `barranca`, `canete`, `huaral`, `huarochiri`, `huaura`, `canta`, `oyon`, `yauyos`, `cajatambo`.
16. `loreto`: Maynas (Iquitos), Alto Amazonas (Yurimaguas), Loreto (Nauta), Mariscal Ramón Castilla, Requena, Ucayali (Contamana), Datem del Marañón.
17. `madre_de_dios`: Tambopata (Puerto Maldonado), Manu, Tahuamanu.
18. `moquegua`: Mariscal Nieto (Moquegua), Ilo, General Sánchez Cerro.
19. `pasco`: Pasco (Cerro de Pasco), Oxapampa, Daniel Alcides Carrión.
20. `piura`: Piura, Sullana, Talara, Paita, Morropón, Sechura, Ayabaca, Huancabamba.
21. `puno`: Puno, San Román (Juliaca), Azángaro, Chucuito, El Collao, Melgar, Huancané, Carabaya, Sandia, Yunguyo, Lampa.
22. `san_martin`: San Martín (Tarapoto), Moyobamba, Rioja, Mariscal Cáceres (Juanjuí), Bellavista, Lamas, Picota, Tocache, Huallaga, El Dorado.
23. `tacna`: Tacna, Candarave, Jorge Basadre, Tarata.
24. `tumbes`: Tumbes, Zarumilla, Contralmirante Villar (Zorritos).
25. `ucayali`: Coronel Portillo (Pucallpa), Atalaya, Padre Abad (Aguaytía), Purús.

### Implementation Blueprint:
1. **`sd_cards_mobile/src/data/peruLocations.ts`**:
   - Replace existing 10-department array with full 25-region dataset.
   - Add helper functions:
     - `getDepartments(): { id: string; name: string }[]`
     - `getProvinces(deptId: string): PeruProvince[]`
     - `getDistricts(deptId: string, provId: string): string[]`
     - `parseLocationCity(cityString?: string): { deptId: string; provId: string; districtName: string }`
2. **`sd_cards_mobile/src/screens/admin/SuperAdminScreen.tsx`**:
   - Harden cascading selector state handlers with safe fallbacks and compound keys `${dept.id}-${prov.id}-${dist}`.
   - Refactor UI to use categorized pills or dropdown pickers to comfortably handle 25 items.
   - Reuse cascading selectors for both Client Creation and the new Client Editing Modal (R3).
   - Add location filter pill in the client management view (R4).
3. **Backend `.NET` (`Models/Business.cs`, `DbInitializer.cs`, `BusinessApiController.cs`)**:
   - Add `Department`, `Province`, `District`, `Ruc`, `PlanMonths`, `PlanExpiryDate` to `Business.cs`.
   - Update `GetAll` and `GetById` to return these fields.
   - Update `RegisterBusinessRequest` and `Register` action to persist them.
   - Add `PUT /api/businessapi/{id}` endpoint to support full client updates.

---

## 5. Verification Method

To verify these findings and subsequent implementation independently:

1. **Compilation Checks**:
   - Mobile:
     ```powershell
     cd "C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile"
     npx tsc --noEmit
     ```
     *Current state: PASS (0 errors).*
   - Backend:
     ```powershell
     cd "C:\Users\Conter\OneDrive\Desktop\Reseñas Cards"
     dotnet build
     ```
     *Current state: PASS (0 errors).*

2. **Catalog Verification Test**:
   - In Node/TS environment or unit test, assert:
     - `PERU_DEPARTMENTS.length === 25`
     - `PERU_DEPARTMENTS.some(d => d.id === 'callao') === true`
     - All 25 departments have at least 1 province (`every(d => d.provinces.length > 0)`).
     - Every province has at least 1 district (`every(d => d.provinces.every(p => p.districts.length > 0))`).
     - Lima province has 43 districts (`find(d => d.id === 'lima')?.provinces.find(p => p.id === 'lima')?.districts.length === 43`).

3. **UI & Cascade Verification**:
   - In React Native, switch department from Lima to Amazonas, then to Callao.
   - Verify no warning `Encountered two children with the same key`.
   - Verify `selectedDistrictName` resets immediately to the new province's first district.
   - Trigger `handleCreateBusiness` and verify `locationCity` is properly formatted without null errors.
