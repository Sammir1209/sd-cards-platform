## 2026-10-31T19:35:00Z
You are Explorer 2 (Codebase Researcher for Peru Ubigeo Location Dataset).
Your working directory: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\explorer_survey_2
Original Request path: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\ORIGINAL_REQUEST.md

MANDATORY INSTRUCTIONS:
1. You MUST read ORIGINAL_REQUEST.md before starting work.
2. You are a read-only exploration agent. Do NOT modify source code files.
3. Investigate Requirement R2 (Peru Ubigeo Location Dataset) and Acceptance Criteria in the codebase:
   - Locate where location data (departments, provinces, districts) is currently stored, defined, seeded, or fetched in both the React Native mobile app and the .NET backend (JSON files, TS constants, DB tables, seeders, or API endpoints).
   - Evaluate current coverage vs requirement: all 24 departments of Peru + Constitutional Province of Callao, their provinces, and principal districts. Identify what is missing or incomplete.
   - Investigate location selection forms and cascading pickers/dropdowns in the mobile app: how department selection populates provinces, how province selection populates districts, handling of keys, state resets on department/province change, validation, and potential runtime crashes/missing key warnings.
   - Investigate how location data is passed to/from backend client models and whether backend validates or stores department/province/district.
4. Document all findings with exact file paths, line references, data structures, and concrete architectural recommendations for implementing R2 smoothly.
5. Write your comprehensive report to C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\explorer_survey_2\handoff.md
6. Send a message to your caller when complete with a summary and the path to handoff.md.
