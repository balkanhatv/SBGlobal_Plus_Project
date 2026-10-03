# SECURITY & FACILITY MANAGEMENT — MANAGEMENT SYSTEM DETAILED DESIGN
**Wave:** 3 · **Status:** DETAILED DESIGN COMPLETE

## SFM-SGM — Security Guard Management System
**Foundation owner:** F-13 §4.8 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Client-site posts, rosters, guard attendance, relief and payroll input. Actors: Operations Manager, Site Supervisor, Guard, Client Site Manager. Modules: sites/posts; shifts; roster; geo attendance; relief/handover; payroll export.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| SecurityPost / `sfm_sgm_post` | site_ref uuid, post_code text, skill_requirements jsonb, geofence_json jsonb, state enum(ACTIVE,INACTIVE) | PK id; UNIQUE (tenant_id, industry_context_id,site_ref,post_code); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL; workforce-attendance policy |
| RosterShift / `sfm_sgm_roster` | post_id uuid, guard_principal_id uuid, shift_start/end timestamptz, state enum(PLANNED,PUBLISHED,CHECKED_IN,ACTIVE,RELIEVED,COMPLETED,ABSENT) | PK id; INDEX (tenant_id, industry_context_id, guard_principal_id, shift_start); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL; workforce-attendance policy |
| AttendanceCheck / `sfm_sgm_attendance` | roster_id uuid, event_type enum(CHECK_IN,CHECK_OUT,RELIEF), occurred_at timestamptz, geo_evidence jsonb, validation enum(VALID,OUT_OF_FENCE,MANUAL_OVERRIDE), device_id uuid | PK id; append-only; INDEX (tenant_id, industry_context_id, roster_id) | SENSITIVE_PERSONAL; workforce-attendance policy |
| ReliefHandover / `sfm_sgm_handover` | roster_id uuid, relief_guard_id uuid?, note_document_id uuid?, approved_by uuid?, state enum(REQUESTED,ASSIGNED,HANDOVER,COMPLETED) | PK id; INDEX (tenant_id, industry_context_id, roster_id, state); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL; workforce-attendance policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**PLANNED → PUBLISHED → CHECKED_IN → ACTIVE → RELIEVED → COMPLETED**. Absence triggers replacement; geo exception requires governed policy/override. Any undeclared transition returns `SFM-SGM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **SFM-SGM-R01** Check-in validated against configured geofence/post.
- **SFM-SGM-R02** Out-of-fence attempts flagged or denied by site policy.
- **SFM-SGM-R03** Shift relief/handover records both actors/times.
- **SFM-SGM-R04** Payroll input derives only validated/approved attendance.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`sfm.sgm.post.manage` · `sfm.sgm.roster.publish` · `sfm.sgm.attendance.checkin` · `sfm.sgm.attendance.override` · `sfm.sgm.relief.assign` · `sfm.sgm.payroll.export`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: deployment/attendance/handover record. Notifications: shift, absence, replacement, geo exception. KPIs/reports: post coverage, attendance compliance, replacement TAT. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.sfm.sgm.post_manage` · `ind.sfm.sgm.roster_publish` · `ind.sfm.sgm.attendance_checkin` · `ind.sfm.sgm.attendance_override` · `ind.sfm.sgm.relief_assign`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `sfm.sgm.post_manage` · `sfm.sgm.roster_publish` · `sfm.sgm.attendance_checkin`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: PMS patrol, HR/payroll export; credentials use secret references.

### AI / experience / offline
AI: anomaly assistant may flag roster/attendance patterns; cannot validate exception or alter payroll; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/sfm/sgm`. Mobile: Tenant Staff App guard-role experience for offline attendance. Desktop: control room optional. Offline **OFFLINE_OPERATIONAL_CRITICAL** — signed device attendance may queue with location/time evidence; server revalidates context/policy, conflict controlled.

### Configuration / entitlement / dependencies / audit
Configuration: geofence, shifts, posts, override policy. Entitlement: suite + SFM-SGM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: SFM-PMS, Core HR/Communication. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: roster→checkin→relief→complete. Negative: wrong geofence/context/payroll invalid attendance denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** deployment/attendance chain auditable and field-resilient.

---

## SFM-PMS — Patrol Management System
**Foundation owner:** F-13 §4.8 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Patrol routes/checkpoints, scheduled rounds, scans, incidents and supervisor review. Actors: Patrol Officer/Guard, Site Supervisor. Modules: routes/checkpoints; schedules; scans; rounds; incidents/evidence.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| PatrolRoute / `sfm_pms_route` | site_ref uuid, route_code text, checkpoint_json jsonb, schedule_policy_ref uuid, state enum(ACTIVE,PAUSED,RETIRED) | PK id; UNIQUE (tenant_id, industry_context_id,site_ref,route_code); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL/CONFIDENTIAL; security-incident policy |
| PatrolRound / `sfm_pms_round` | route_id uuid, guard_principal_id uuid, scheduled_start/end timestamptz, state enum(SCHEDULED,STARTED,IN_PROGRESS,EXCEPTION,COMPLETED,REVIEWED) | PK id; INDEX (tenant_id, industry_context_id, route_id, scheduled_start); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL/CONFIDENTIAL; security-incident policy |
| CheckpointScan / `sfm_pms_scan` | round_id uuid, checkpoint_code text, scanned_at timestamptz, method enum(QR,NFC,MANUAL), device_id uuid, geo_evidence jsonb?, validation enum(VALID,LATE,INVALID) | PK id; UNIQUE (tenant_id, industry_context_id,round_id,checkpoint_code,scanned_at); INDEX (tenant_id, industry_context_id, round_id) | SENSITIVE_PERSONAL/CONFIDENTIAL; security-incident policy |
| Incident / `sfm_pms_incident` | round_id uuid?, category_code text, severity_code text, occurred_at timestamptz, document_ids uuid[], state enum(REPORTED,ACKNOWLEDGED,INVESTIGATING,RESOLVED,CLOSED) | PK id; INDEX (tenant_id, industry_context_id, severity, state); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL/CONFIDENTIAL; security-incident policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**SCHEDULED → STARTED → IN_PROGRESS → COMPLETED → REVIEWED**. Missed/late checkpoint creates exception/alert; incident can branch during round and continues independently. Any undeclared transition returns `SFM-PMS_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **SFM-PMS-R01** Missed checkpoint within configured window alerts supervisor.
- **SFM-PMS-R02** Scans require route/checkpoint/device/context validity.
- **SFM-PMS-R03** Offline scans preserve original time/device/context and cannot be reassigned.
- **SFM-PMS-R04** Critical incident requires acknowledgment/escalation.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`sfm.pms.route.manage` · `sfm.pms.round.start` · `sfm.pms.checkpoint.scan` · `sfm.pms.incident.report` · `sfm.pms.incident.resolve` · `sfm.pms.round.review`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: round report, incident/evidence documents. Notifications: missed checkpoint, incident, escalation. KPIs/reports: checkpoint completion, incident rate/response. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.sfm.pms.route_manage` · `ind.sfm.pms.round_start` · `ind.sfm.pms.checkpoint_scan` · `ind.sfm.pms.incident_report` · `ind.sfm.pms.incident_resolve`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `sfm.pms.route_manage` · `sfm.pms.round_start` · `sfm.pms.checkpoint_scan`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: SGM staff/site, QR/NFC/device adapters; credentials use secret references.

### AI / experience / offline
AI: incident summarization/anomaly assistant; cannot close critical incident; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/sfm/pms`. Mobile: Tenant Staff App guard/patrol-role experience, offline-first. Desktop: control room map/review. Offline **OFFLINE_OPERATIONAL_CRITICAL** — checkpoint/incident capture queues with device evidence; server verifies route/context and conflicts.

### Configuration / entitlement / dependencies / audit
Configuration: routes, windows, checkpoints, severity/escalation. Entitlement: suite + SFM-PMS + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: SFM-SGM, Core Documents. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: round→all scans→review. Negative: wrong-context/replayed forged scan denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** offline patrol evidence remains attributable and complete.

---

## SFM-VMS — Visitor Management System
**Foundation owner:** F-13 §4.8 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Visitor preregistration, identity capture, host approval, badges, check-in/out and overstay. Actors: Visitor Operator/Security, Host, Visitor. Modules: preregistration; identity; approval; blacklist; badge; checkin/out; overstay.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Visitor / `sfm_vms_visitor` | visitor_no text, name text, contact_norm text?, identity_ref_encrypted text?, privacy_class text, blacklist_match_state enum(NOT_CHECKED,CLEAR,REVIEW,BLOCKED) | PK id; UNIQUE (tenant_id, industry_context_id,visitor_no); INDEX (tenant_id, industry_context_id, updated_at) | SENSITIVE_PERSONAL; visitor/privacy policy |
| Visit / `sfm_vms_visit` | visitor_id uuid, host_principal_id uuid, site_ref uuid, expected_from/to timestamptz, purpose text, state enum(PREREGISTERED,ARRIVED,APPROVAL_PENDING,APPROVED,CHECKED_IN,CHECKED_OUT,DENIED,OVERSTAY) | PK id; INDEX (tenant_id, industry_context_id, site_ref, state); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL; visitor/privacy policy |
| Badge / `sfm_vms_badge` | visit_id uuid, badge_code text, issued_at timestamptz, expires_at timestamptz, state enum(ISSUED,ACTIVE,EXPIRED,RETURNED,REVOKED) | PK id; UNIQUE (tenant_id, industry_context_id,badge_code); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL; visitor/privacy policy |
| HostApproval / `sfm_vms_approval` | visit_id uuid, host_principal_id uuid, decision enum(APPROVE,DENY), reason text?, decided_at timestamptz | PK id; UNIQUE (tenant_id, industry_context_id,visit_id,host_principal_id); INDEX (tenant_id, industry_context_id, visit_id) | SENSITIVE_PERSONAL; visitor/privacy policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**PREREGISTERED → ARRIVED → APPROVAL_PENDING → APPROVED → CHECKED_IN → CHECKED_OUT**. Blacklist/denied branches block entry; overstay triggers alert and badge expiry. Any undeclared transition returns `SFM-VMS_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **SFM-VMS-R01** Blocked/blacklisted visitor cannot check in without explicit governed exception.
- **SFM-VMS-R02** Host approval required where site policy says so.
- **SFM-VMS-R03** Badge expires at visit/policy end and cannot authorize after expiry.
- **SFM-VMS-R04** Overstay alerts host/security.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`sfm.vms.visitor.register` · `sfm.vms.visit.approve` · `sfm.vms.visit.checkin` · `sfm.vms.visit.checkout` · `sfm.vms.badge.issue` · `sfm.vms.exception.approve`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: visitor badge/log, approval/exception record. Notifications: arrival/approval, overstay. KPIs/reports: throughput, approval TAT, overstay rate. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.sfm.vms.visitor_register` · `ind.sfm.vms.visit_approve` · `ind.sfm.vms.visit_checkin` · `ind.sfm.vms.visit_checkout` · `ind.sfm.vms.badge_issue`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `sfm.vms.visitor_register` · `sfm.vms.visit_approve` · `sfm.vms.visit_checkin`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: access-control device adapters + Communication; credentials use secret references.

### AI / experience / offline
AI: may assist anomaly/identity workflow triage; cannot override blacklist/approve entry; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/sfm/vms`. Mobile: Tenant Staff App for guard/front-desk + Tenant User App where an external host/visitor workflow is exposed. Desktop: front desk candidate. Offline **READ_OFFLINE** — site list may cache; identity approval/check-in online unless approved controlled contingency.

### Configuration / entitlement / dependencies / audit
Configuration: badge, retention, blacklist, approval/overstay policy. Entitlement: suite + SFM-VMS + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: Core Communication/Integration. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: pre-register→approve→checkin→checkout. Negative: blocked/expired badge denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** privacy, badge and visit status fully auditable.

---

## SFM-FMM — Facility Maintenance Management System
**Foundation owner:** F-13 §4.8 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Facility assets, preventive maintenance and SLA-driven tickets/work orders. Actors: Facility Manager, Technician, Requester, authorized Vendor. Modules: assets; PM schedules; tickets; SLA; work orders; vendor assignment.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| FacilityAsset / `sfm_fmm_asset` | asset_code text, site_ref uuid, category text, location text?, criticality text, state enum(ACTIVE,DOWN,MAINTENANCE,RETIRED) | PK id; UNIQUE (tenant_id, industry_context_id,asset_code); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; facility-maintenance policy |
| FacilityTicket / `sfm_fmm_ticket` | ticket_no text, asset_id uuid?, category_code text, priority_code text, requester_id uuid?, state enum(RAISED,CATEGORIZED,ASSIGNED,IN_PROGRESS,RESOLVED,VERIFICATION,CLOSED,ESCALATED) | PK id; UNIQUE (tenant_id, industry_context_id,ticket_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; facility-maintenance policy |
| FacilityWorkOrder / `sfm_fmm_work_order` | ticket_id uuid?, asset_id uuid, assigned_principal_or_vendor_ref uuid, due_at timestamptz?, state enum(OPEN,ACCEPTED,IN_PROGRESS,WAITING,RESOLVED,VERIFIED,CLOSED) | PK id; INDEX (tenant_id, industry_context_id, state, due_at); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; facility-maintenance policy |
| PreventiveSchedule / `sfm_fmm_pm_schedule` | asset_id uuid, recurrence_rule text, next_due_at timestamptz, work_template_ref uuid?, state enum(ACTIVE,PAUSED,RETIRED) | PK id; INDEX (tenant_id, industry_context_id, next_due_at); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; facility-maintenance policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**RAISED → CATEGORIZED → ASSIGNED → IN_PROGRESS → RESOLVED → VERIFICATION → CLOSED**. SLA breach escalates; preventive schedule generates work order; requester/authorized verifier closes. Any undeclared transition returns `SFM-FMM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **SFM-FMM-R01** SLA breach escalates by category/severity matrix.
- **SFM-FMM-R02** Critical safety category pages operations manager immediately.
- **SFM-FMM-R03** Closure requires requester/authorized verification.
- **SFM-FMM-R04** Vendor access is limited to assigned work/resource scope.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`sfm.fmm.ticket.raise` · `sfm.fmm.ticket.assign` · `sfm.fmm.workorder.execute` · `sfm.fmm.workorder.verify` · `sfm.fmm.schedule.manage` · `sfm.fmm.sla.override`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: ticket, work order, service/SLA report. Notifications: assignment, due, breach, verification. KPIs/reports: SLA %, backlog, MTTR, PM compliance. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.sfm.fmm.ticket_raise` · `ind.sfm.fmm.ticket_assign` · `ind.sfm.fmm.workorder_execute` · `ind.sfm.fmm.workorder_verify` · `ind.sfm.fmm.schedule_manage`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `sfm.fmm.ticket_raise` · `sfm.fmm.ticket_assign` · `sfm.fmm.workorder_execute`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: vendor profiles and optional building/device adapters; credentials use secret references.

### AI / experience / offline
AI: maintenance assistant may triage/suggest resolution; cannot verify/close or expand vendor scope; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/sfm/fmm`. Mobile: Tenant Staff App technician workflow + Tenant User App requester workflow where exposed. Desktop: facility desk optional. Offline **CONTROLLED_OFFLINE_MUTATION** — technician updates may queue; verification/SLA override current-server.

### Configuration / entitlement / dependencies / audit
Configuration: SLA/category/PM/vendor policies. Entitlement: suite + SFM-FMM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: Core Workflow/Communication/Documents. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: raise→assign→resolve→verify. Negative: vendor cross-scope/close without verify denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** SLA and maintenance evidence consistent.


## Fable 5 deterministic contract binding
The Security / Facility MS sections above remain the canonical domain entity/module/permission/document/integration owners. The following remediation artifacts are **normative extensions of each listed MS**, not optional commentary:
- MS set: `SFM-SGM`, `SFM-PMS`, `SFM-VMS`, `SFM-FMM`.
- Deterministic per-MS tests: `DD-21_MS_ACCEPTANCE_TEST_CONTRACTS.md` → `<MS>-T001…T014`.
- Exact major workflow transitions/forbidden edges/reversal-cancellation: `DD-22_MS_WORKFLOW_TRANSITION_MATRICES.md`.
- Behavior-bearing field/catalog and exact context-index rules: `DD-23_BEHAVIORAL_CATALOGS_INDEX_CONTRACTS.md` + `DD-23A_BEHAVIOR_FIELD_REGISTRY.md`.
- Domain-critical product defaults: `DD-24_INDUSTRY_DOMAIN_RULE_DECISIONS.md` → SFM-AC-001…005.
- Mathematical KPIs + KPI acceptance IDs: `DD-25_KPI_CALCULATION_CATALOG.md`.
- Requirement-ID chains: `Registers/DD_REQUIREMENT_TRACEABILITY_F5.md`.
- 41-MS determinism evidence: `DD-27_41_MS_DETERMINISM_AUDIT.md`.

Where an earlier sentence in this file is less specific than a referenced remediation contract, the more specific remediation contract governs. None of these references permits cross-industry inheritance of business semantics.


## Canonical mobile-app mapping — Phase 3
All mobile capabilities in this Industry DD are routes/features inside the canonical `TENANT_STAFF_APP` and/or `TENANT_USER_APP` defined by DD-10/DD-11. Role/persona labels never create separate mobile app classes or binaries. Platform Mobile is outside the Tenant app pair.
