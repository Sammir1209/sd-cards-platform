## 2026-10-31T21:39:02Z
The user requested: "programa con sub agentes de antigravity". Implement persistent authentication sessions, standard Peru Ubigeo data (24 departments and Callao), comprehensive client information editing, and a refactored client management workflow across the React Native mobile app and .NET backend for production deployment.

Working directory: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards
Integrity mode: development

## Requirements

### R1. Persistent Authentication Session
Maintain user session persistence across application launches and restarts using the stored authentication token in mobile storage, ensuring the login screen is bypassed unless an explicit logout action was performed. Explicit logout must clear the stored session.

### R2. Peru Ubigeo Location Dataset
Update the location dataset to cover all 24 departments of Peru and the Constitutional Province of Callao, including their respective provinces and principal districts, and integrate them smoothly into location selection forms.

### R3. Comprehensive Client Information Editing
Provide full editing capabilities for client profiles in both the mobile interface and backend .NET Web API, allowing updates to business name, phone number, RUC/DNI, department, province, district, active/paused status, and plan duration, persisting all changes to the database.

### R4. Client Management Flow Refactoring
Refactor the client management interface and workflow to provide instant search, advanced filtering (by status, expiration date, and location), expandable cards displaying client metrics, a unified edit modal, and quick operational actions (renew plan, add card, view credentials, toggle status).

## Acceptance Criteria

### Session Persistence
- [ ] Application startup inspects local authentication storage and restores session state automatically without requiring re-login if the user did not log out.
- [ ] Explicit user logout removes stored credentials and resets navigation to the authentication screen.

### Location Data Coverage
- [ ] Location catalog includes all 24 departments of Peru plus Callao, with selectable provinces and main districts.
- [ ] Department, province, and district cascading selection operates without runtime exceptions or missing keys.

### Client Editing & Management
- [ ] Client edit form allows modifying name, phone, RUC/DNI, location hierarchy (department/province/district), active status, and plan duration.
- [ ] Backend API endpoints persist client modifications to the database and return the updated entity.
- [ ] Client list displays instant search results and filters by status (active, expired, expiring soon) and location.
- [ ] Quick actions (renew plan, toggle active/paused, view credentials) trigger appropriate state and API updates.

### Verification
- [ ] TypeScript compilation passes without errors in the mobile project.
- [ ] Backend .NET solution builds cleanly without compilation errors.

---
Working directory for metadata: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\orchestrator_gen2\
Original Request path: C:\Users\Conter\OneDrive\Desktop\Reseñas Cards\.agents\teamwork\ORIGINAL_REQUEST.md
Your identity: Project Orchestrator (teamwork_orchestrator gen 2)
Caller/Sentinel conversation ID: b84cedb5-57af-4ad2-8df0-616ff43463de

Status Note:
Predecessor orchestrator completed Milestones 1, 2, 3, and 4 in the codebase. All code changes for R1, R2, R3, and R4 are implemented and independently tested. Review PROJECT.md, .agents/teamwork/orchestrator/progress.md, and all handoff reports in .agents/teamwork/*/handoff.md. Validate the final state across mobile and backend, synthesize the results, and report project completion.
