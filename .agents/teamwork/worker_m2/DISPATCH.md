## 2026-10-31T19:58:52Z
You are Worker M2 (Mobile Data Specialist for Peru Ubigeo Location Dataset).
Your working directory: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\worker_m2
Original Request path: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\ORIGINAL_REQUEST.md
Scope document: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\PROJECT.md
Explorer findings path: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\explorer_survey_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY INSTRUCTIONS:
1. You MUST read ORIGINAL_REQUEST.md, PROJECT.md, and explorer_survey_2/handoff.md before starting work.
2. Exclusive write ownership:
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\src\data\peruLocations.ts
   - C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\sd_cards_mobile\src\screens\admin\SuperAdminScreen.tsx (cascading location logic and safe key/fallback fixes only)
3. Implement Requirement R2 (Peru Ubigeo Location Dataset):
   a. In `sd_cards_mobile/src/data/peruLocations.ts`:
      - Expand `PERU_DEPARTMENTS` from 10 to all 25 department-level entities:
        1. amazonas (7 provinces: Chachapoyas, Bagua, Bongará, Condorcanqui, Luya, Rodríguez de Mendoza, Utcubamba)
        2. ancash (Huaraz, Santa, Casma, Huarmey, Huari, etc.)
        3. apurimac (Abancay, Andahuaylas, Chincheros, Cotabambas, Grau, etc.)
        4. arequipa (Arequipa, Camaná, Caravelí, Castilla, Caylloma, Islay, Condesuyos, La Unión)
        5. ayacucho (Huamanga, Cangallo, Huanta, La Mar, Lucanas, etc.)
        6. cajamarca (Cajamarca, Jaén, Chota, Cutervo, Celendín, etc.)
        7. callao (Provincia Constitucional del Callao, with Callao, Bellavista, Carmen de la Legua, La Perla, La Punta, Ventanilla, Mi Perú)
        8. cusco (Cusco, Urubamba, Calca, Canchis, La Convención, Anta, etc.)
        9. huancavelica (Huancavelica, Acobamba, Angaraes, Tayacaja, etc.)
        10. huanuco (Huánuco, Leoncio Prado/Tingo María, Ambo, Dos de Mayo, etc.)
        11. ica (Ica, Chincha, Pisco, Nasca, Palpa)
        12. junin (Huancayo, Chanchamayo, Tarma, Satipo, Jauja, Yauli, Chupaca, Concepción, Junín)
        13. la_libertad (Trujillo, Ascope, Pacasmayo, Chepén, Virú, Sánchez Carrión, Otuzco, etc.)
        14. lambayeque (Chiclayo, Lambayeque, Ferreñafe)
        15. lima (Lima Metropolitana with ALL 43 districts; plus Barranca, Cañete, Huaral, Huarochirí, Huaura, Canta, Oyón, Yauyos, Cajatambo)
        16. loreto (Maynas/Iquitos, Alto Amazonas/Yurimaguas, Loreto/Nauta, Mariscal Ramón Castilla, Requena, Ucayali, Datem del Marañón)
        17. madre_de_dios (Tambopata/Puerto Maldonado, Manu, Tahuamanu)
        18. moquegua (Mariscal Nieto/Moquegua, Ilo, General Sánchez Cerro)
        19. pasco (Pasco/Cerro de Pasco, Oxapampa, Daniel Alcides Carrión)
        20. piura (Piura, Sullana, Talara, Paita, Morropón, Sechura, Ayabaca, Huancabamba)
        21. puno (Puno, San Román/Juliaca, Azángaro, Chucuito, El Collao, Melgar, Huancané, etc.)
        22. san_martin (San Martín/Tarapoto, Moyobamba, Rioja, Mariscal Cáceres/Juanjuí, Bellavista, Lamas, Picota, Tocache, Huallaga, El Dorado)
        23. tacna (Tacna, Candarave, Jorge Basadre, Tarata)
        24. tumbes (Tumbes, Zarumilla, Contralmirante Villar)
        25. ucayali (Coronel Portillo/Pucallpa, Atalaya, Padre Abad, Purús)
      - Implement helper functions:
        * `getDepartments(): { id: string; name: string }[]`
        * `getProvinces(deptId: string): PeruProvince[]`
        * `getDistricts(deptId: string, provId: string): string[]`
        * `parseLocationCity(cityString?: string): { deptId: string; provId: string; districtName: string }`
   b. In `sd_cards_mobile/src/screens/admin/SuperAdminScreen.tsx`:
      - In `handleCreateBusiness`: defensively access `currentProv?.name || 'Central'` and `currentDept?.name || 'Perú'` to eliminate null/undefined TypeError crashes.
      - In cascading pickers (department, province, district horizontal lists): use composite unique keys `${dept.id}`, `${dept.id}-${prov.id}`, and `${selectedDeptId}-${selectedProvId}-${dist}` to eliminate React duplicate key warnings.
      - Ensure defensive fallback if `dept.provinces` or `prov.districts` is empty.
4. VERIFICATION:
   - Run: `cd sd_cards_mobile; npx tsc --noEmit` and confirm 0 errors.
   - Run: `dotnet build NfcMenuSaas.csproj` and confirm 0 errors.
5. Write your handoff report to `C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\worker_m2\handoff.md`. Include all build output and verification commands.
6. Send a message to your caller when complete.
