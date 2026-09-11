# HOSPITALITY — MANAGEMENT SYSTEM DETAILED DESIGN
**Wave:** 3 · **Status:** DETAILED DESIGN COMPLETE

## HSP-HMS — Hotel Management System
**Foundation owner:** F-13 §4.3 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Hotel front-office, guest stay, folio and housekeeping operations. Actors: General Manager, Front Office, Housekeeping, Accountant, Guest. Modules: check-in/out; rooms; folio; housekeeping; night-audit posture.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Stay / `hsp_hms_stay` | reservation_ref uuid, guest_ref uuid, room_ref uuid?, checkin_at timestamptz?, checkout_at timestamptz?, state enum(RESERVED,CHECKED_IN,IN_HOUSE,CHECKOUT_PENDING,CHECKED_OUT,CLOSED) | PK id; INDEX (tenant_id, industry_context_id, room_ref, state); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL/FINANCIAL; hospitality-record policy |
| Folio / `hsp_hms_folio` | stay_id uuid, folio_no text, currency char(3), balance_minor bigint, state enum(OPEN,SETTLEMENT_PENDING,SETTLED,TRANSFERRED,CLOSED) | PK id; UNIQUE (tenant_id, industry_context_id,folio_no); INDEX (tenant_id, industry_context_id, stay_id) | SENSITIVE_PERSONAL/FINANCIAL; hospitality-record policy |
| HousekeepingTask / `hsp_hms_housekeeping` | room_ref uuid, assigned_to uuid?, state enum(DIRTY,CLEANING,INSPECTED,READY,OUT_OF_ORDER), priority_code text, completed_at timestamptz? | PK id; INDEX (tenant_id, industry_context_id, room_ref, state); PARTIAL INDEX (tenant_id, industry_context_id, state) WHERE state NOT IN ('CLOSED','CANCELLED','RETIRED','EXPIRED','REVOKED','COMPLETED') | INTERNAL/CONFIDENTIAL; policy retention |
| FolioEntry / `hsp_hms_folio_entry` | folio_id uuid, entry_type text, amount_minor bigint, source_ref text, posted_at timestamptz, reversal_of uuid? | append-only where history/evidence; append-only | SENSITIVE_PERSONAL/FINANCIAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **RESERVED → CHECKED_IN → IN_HOUSE → CHECKOUT_PENDING → CHECKED_OUT → CLOSED**.  
Invalid transition: any transition not in the MS transition table is rejected with `HSP-HMS_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. Checkout requires room/stay closure and settled/transferred folio; housekeeping readiness gates room assignment.

### Business rules / approvals
- **HSP-HMS-R01** Check-in only to governed available/ready room.
- **HSP-HMS-R02** No-show/cancellation charges follow rate-plan policy.
- **HSP-HMS-R03** Checkout blocked until folio settled or approved transfer.
- **HSP-HMS-R04** Posted folio corrections use reversal entries.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`hsp.hms.stay.checkin` · `hsp.hms.stay.transfer_room` · `hsp.hms.housekeeping.update` · `hsp.hms.folio.post` · `hsp.hms.stay.checkout` · `hsp.hms.folio.transfer`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: registration card, folio/invoice, housekeeping record. All use DD-08 DocumentMeta.  
Notifications: arrival, room ready, checkout; sensitive payloads use generic push preview.  
Reports/KPIs: occupancy, ADR, RevPAR, housekeeping turnaround; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.hsp.hms.stay_checkin` · `ind.hsp.hms.stay_transfer_room` · `ind.hsp.hms.housekeeping_update` · `ind.hsp.hms.folio_post` · `ind.hsp.hms.stay_checkout`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `hsp.hms.stay_checkin` · `hsp.hms.stay_transfer_room` · `hsp.hms.housekeeping_update`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: RBM reservations, Billing, optional lock/PBX; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: guest-service assistant can summarize stay/recommend services; no autonomous charges/room transfer. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/hsp/hms` list/detail/workflow/report views. Mobile: staff housekeeping + guest stay services. Desktop: front-desk candidate.  
Offline class: **CONTROLLED_OFFLINE_MUTATION**. housekeeping status may queue; folio/check-in/out require controlled current authorization.

### Configuration / entitlement / dependencies / audit
Configuration: property/room/rate/folio policies. Security floors cannot be overridden.  
Entitlement: suite license + `HSP-HMS` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: HSP-RBM, Core Billing/Documents. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: reservation→checkin→stay→settlement→checkout. Negative: unready room/unsettled folio denied. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** guest/folio/room history auditable and isolated.

---

## HSP-RMS — Restaurant Management System
**Foundation owner:** F-13 §4.3 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Restaurant table/KOT/kitchen/billing operations. Actors: Restaurant Manager, Steward, Chef/Kitchen, Cashier. Modules: menu; tables; orders; KOT; kitchen; bill/settlement.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| RestaurantOrder / `hsp_rms_order` | order_no text, service_type enum(TABLE,TAKEAWAY,DELIVERY), table_ref uuid?, state enum(OPEN,KOT_SENT,PREPARING,SERVED,BILLING,SETTLED,VOIDED) | PK id; UNIQUE (tenant_id, industry_context_id,order_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; hospitality-financial policy |
| OrderLine / `hsp_rms_line` | order_id uuid, menu_item_ref uuid, qty numeric, modifier_json jsonb, state enum(NEW,KOT_SENT,PREPARING,SERVED,REVERSED), price_minor bigint | PK id; served lines immutable except reversal; INDEX (tenant_id, industry_context_id, order_id) | CONFIDENTIAL/FINANCIAL; hospitality-financial policy |
| KotTicket / `hsp_rms_kot` | order_id uuid, ticket_no text, station_code text, state enum(QUEUED,PREPARING,READY,SERVED), fired_at timestamptz | PK id; UNIQUE (tenant_id, industry_context_id,ticket_no); PARTIAL INDEX (tenant_id, industry_context_id, state) WHERE state NOT IN ('CLOSED','CANCELLED','RETIRED','EXPIRED','REVOKED','COMPLETED') | INTERNAL/CONFIDENTIAL; policy retention |
| OrderReversal / `hsp_rms_reversal` | order_line_id uuid, reason_code text, approved_by uuid?, reversed_at timestamptz | append-only where history/evidence; append-only | CONFIDENTIAL/FINANCIAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **OPEN → KOT_SENT → PREPARING → SERVED → BILLING → SETTLED**.  
Invalid transition: any transition not in the MS transition table is rejected with `HSP-RMS_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. KOT modifications after served state use reversal/new line, never deletion.

### Business rules / approvals
- **HSP-RMS-R01** Served KOT lines cannot be deleted.
- **HSP-RMS-R02** Bill settlement freezes commercial line values.
- **HSP-RMS-R03** Void/reversal above threshold requires manager permission.
- **HSP-RMS-R04** Kitchen state may not skip required KOT dispatch.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`hsp.rms.order.open` · `hsp.rms.kot.send` · `hsp.rms.line.serve` · `hsp.rms.line.reverse` · `hsp.rms.bill.settle` · `hsp.rms.order.close`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: KOT, bill/receipt, reversal record. All use DD-08 DocumentMeta.  
Notifications: kitchen ticket, ready, exception; sensitive payloads use generic push preview.  
Reports/KPIs: covers, table turnover, ticket time, void rate; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.hsp.rms.order_open` · `ind.hsp.rms.kot_send` · `ind.hsp.rms.line_serve` · `ind.hsp.rms.line_reverse` · `ind.hsp.rms.bill_settle`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `hsp.rms.order_open` · `hsp.rms.kot_send` · `hsp.rms.line_serve`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: Core Billing/Inventory and optional kitchen/device adapters; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: assistant may summarize demand/menu; cannot reverse served line or settle payment. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/hsp/rms` list/detail/workflow/report views. Mobile: steward ordering; kitchen display. Desktop: POS/KDS candidate.  
Offline class: **CONTROLLED_OFFLINE_MUTATION**. Order/KOT capture may queue in approved local mode; settlement/reversal conflict is regulated.

### Configuration / entitlement / dependencies / audit
Configuration: menus, taxes/service charge, stations, reversal thresholds. Security floors cannot be overridden.  
Entitlement: suite license + `HSP-RMS` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: Core Billing/Inventory. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: order→KOT→serve→settle. Negative: served-line delete and unauthorized reversal denied. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** KOT/financial history immutable and reconciled.

---

## HSP-BEM — Banquet & Event Management System
**Foundation owner:** F-13 §4.3 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Banquet/event enquiry, proposal, venue booking, function sheet, execution and settlement. Actors: Banquet Coordinator, Sales/Manager, Finance, Client/Guest. Modules: enquiry; proposal; venue availability; packages; function sheet; execution; billing.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| EventEnquiry / `hsp_bem_enquiry` | enquiry_no text, client_ref uuid?, event_type text, preferred_at timestamptz, guest_count int, state enum(NEW,QUALIFIED,PROPOSAL,SITE_VISIT,BOOKING_PENDING,LOST) | PK id; UNIQUE (tenant_id, industry_context_id,enquiry_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; event-contract policy |
| EventBooking / `hsp_bem_booking` | enquiry_id uuid, venue_ref uuid, start_at timestamptz, end_at timestamptz, package_code text?, state enum(TENTATIVE,CONFIRMED,EXECUTING,COMPLETED,SETTLED,CANCELLED) | PK id; no overlapping confirmed venue unless policy allows; INDEX (tenant_id, industry_context_id, enquiry_id) | CONFIDENTIAL/FINANCIAL; event-contract policy |
| FunctionSheet / `hsp_bem_function_sheet` | booking_id uuid, version int, schedule_json jsonb, service_json jsonb, state enum(DRAFT,REVIEW,APPROVED,SUPERSEDED) | PK id; UNIQUE (tenant_id, industry_context_id,booking_id,version); PARTIAL INDEX (tenant_id, industry_context_id, state) WHERE state NOT IN ('CLOSED','CANCELLED','RETIRED','EXPIRED','REVOKED','COMPLETED') | INTERNAL/CONFIDENTIAL; policy retention |
| EventCharge / `hsp_bem_charge` | booking_id uuid, charge_type text, amount_minor bigint, currency char(3), source_ref text, state enum(PLANNED,POSTED,REVERSED) | append-only where history/evidence; append/reversal for posted | CONFIDENTIAL/FINANCIAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **NEW → PROPOSAL → BOOKING_PENDING → CONFIRMED → EXECUTING → COMPLETED → SETTLED**.  
Invalid transition: any transition not in the MS transition table is rejected with `HSP-BEM_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. Confirmation requires availability and configured advance; function sheet must be approved before execution.

### Business rules / approvals
- **HSP-BEM-R01** Confirmed bookings cannot overbook venue/time without governed override.
- **HSP-BEM-R02** Advance/cancellation policy evaluated by active package/policy version.
- **HSP-BEM-R03** Function sheet approval freezes execution version; revisions supersede.
- **HSP-BEM-R04** Settlement uses Core Billing and recorded event completion.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`hsp.bem.enquiry.manage` · `hsp.bem.proposal.issue` · `hsp.bem.booking.confirm` · `hsp.bem.function_sheet.approve` · `hsp.bem.event.complete` · `hsp.bem.settlement.trigger`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: proposal, contract, function sheet, invoice. All use DD-08 DocumentMeta.  
Notifications: proposal, advance, milestone, event reminder; sensitive payloads use generic push preview.  
Reports/KPIs: conversion, event revenue, venue utilization, variance; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.hsp.bem.enquiry_manage` · `ind.hsp.bem.proposal_issue` · `ind.hsp.bem.booking_confirm` · `ind.hsp.bem.function_sheet_approve` · `ind.hsp.bem.event_complete`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `hsp.bem.enquiry_manage` · `hsp.bem.proposal_issue` · `hsp.bem.booking_confirm`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: Billing/Documents/Communication and property availability; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: may draft proposal/function summary; human approval required. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/hsp/bem` list/detail/workflow/report views. Mobile: coordinator schedule/checklist. Desktop: optional banquet office.  
Offline class: **READ_OFFLINE**. Approved function sheet may cache; booking/charge/settlement online.

### Configuration / entitlement / dependencies / audit
Configuration: packages, advance/cancel policies, venue capacity. Security floors cannot be overridden.  
Entitlement: suite license + `HSP-BEM` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: HSP-HMS availability, Core Billing. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: enquiry→confirm→execute→settle. Negative: venue conflict/unapproved function sheet denied. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** commercial/operational event history versioned and auditable.

---

## HSP-RBM — Reservation & Booking Management System
**Foundation owner:** F-13 §4.3 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Room/property availability, rate plans, booking and channel inventory. Actors: Reservation Agent, Revenue/Hotel Manager, Guest. Modules: inventory; rate plans; allocations; reservation; channels.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Reservation / `hsp_rbm_reservation` | reservation_no text, guest_ref uuid, room_type_ref uuid, arrival date, departure date, rate_plan_ref uuid, state enum(TENTATIVE,CONFIRMED,CANCELLED,NO_SHOW,CHECKED_IN,COMPLETED) | PK id; UNIQUE (tenant_id, industry_context_id,reservation_no); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL/FINANCIAL; reservation-record policy |
| AvailabilityBucket / `hsp_rbm_availability` | property_ref uuid, room_type_ref uuid, business_date date, physical int, blocked int, allocated int, booked int, overbook_tolerance int | PK id; UNIQUE (tenant_id, industry_context_id,property_ref,room_type_ref,business_date); INDEX (tenant_id, industry_context_id, property_ref) | SENSITIVE_PERSONAL/FINANCIAL; reservation-record policy |
| RatePlan / `hsp_rbm_rate_plan` | code text, currency char(3), base_rate_minor bigint, cancellation_policy_ref uuid, guarantee_policy_ref uuid, state enum(DRAFT,ACTIVE,RETIRED) | PK id; UNIQUE (tenant_id, industry_context_id,code); PARTIAL INDEX (tenant_id, industry_context_id, state) WHERE state NOT IN ('CLOSED','CANCELLED','RETIRED','EXPIRED','REVOKED','COMPLETED') | INTERNAL/CONFIDENTIAL; policy retention |
| ChannelAllocation / `hsp_rbm_channel_alloc` | channel_integration_id uuid, room_type_ref uuid, business_date date, allocated_qty int, sold_qty int, sync_version bigint | append-only where history/evidence; UNIQUE (tenant_id, industry_context_id,channel_integration_id,room_type_ref,business_date) | SENSITIVE_PERSONAL/FINANCIAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **TENTATIVE → CONFIRMED → CHECKED_IN → COMPLETED**.  
Invalid transition: any transition not in the MS transition table is rejected with `HSP-RBM_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. CANCELLED/NO_SHOW branch follows rate policy; confirmation performs atomic availability check/reservation.

### Business rules / approvals
- **HSP-RBM-R01** Confirmation blocked when net availability exhausted unless approved tolerance.
- **HSP-RBM-R02** Cancellation/no-show charges use effective rate plan policy.
- **HSP-RBM-R03** Channel allocation cannot exceed property availability policy.
- **HSP-RBM-R04** Rate/version facts used by confirmed booking remain historical.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`hsp.rbm.availability.view` · `hsp.rbm.reservation.create` · `hsp.rbm.reservation.confirm` · `hsp.rbm.reservation.cancel` · `hsp.rbm.rate.manage` · `hsp.rbm.channel.sync`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: confirmation, cancellation record, deposit receipt reference. All use DD-08 DocumentMeta.  
Notifications: confirmation, pre-arrival, cancellation/no-show; sensitive payloads use generic push preview.  
Reports/KPIs: forecast occupancy, booking pace, cancellation/no-show; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.hsp.rbm.availability_view` · `ind.hsp.rbm.reservation_create` · `ind.hsp.rbm.reservation_confirm` · `ind.hsp.rbm.reservation_cancel` · `ind.hsp.rbm.rate_manage`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `hsp.rbm.availability_view` · `hsp.rbm.reservation_create` · `hsp.rbm.reservation_confirm`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: HMS, PaymentPort, OTA/channel adapters; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: reservation assistant may search availability/suggest rates within policy; booking tool still access/entitlement governed. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/hsp/rbm` list/detail/workflow/report views. Mobile: guest booking/trip view. Desktop: reservation/front desk optional.  
Offline class: **READ_OFFLINE**. availability cache is advisory; booking confirmation online/current.

### Configuration / entitlement / dependencies / audit
Configuration: seasons, rates, tolerance, cancellation/guarantee policies. Security floors cannot be overridden.  
Entitlement: suite license + `HSP-RBM` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: HSP-HMS, Core Billing/Integration. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: availability→confirm→handoff to stay. Negative: overbooking without approval and stale rate denied. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** availability and booking remain atomic/auditable across channels.


## Fable 5 deterministic contract binding
The Hospitality MS sections above remain the canonical domain entity/module/permission/document/integration owners. The following remediation artifacts are **normative extensions of each listed MS**, not optional commentary:
- MS set: `HSP-HMS`, `HSP-RMS`, `HSP-BEM`, `HSP-RBM`.
- Deterministic per-MS tests: `DD-21_MS_ACCEPTANCE_TEST_CONTRACTS.md` → `<MS>-T001…T014`.
- Exact major workflow transitions/forbidden edges/reversal-cancellation: `DD-22_MS_WORKFLOW_TRANSITION_MATRICES.md`.
- Behavior-bearing field/catalog and exact context-index rules: `DD-23_BEHAVIORAL_CATALOGS_INDEX_CONTRACTS.md` + `DD-23A_BEHAVIOR_FIELD_REGISTRY.md`.
- Domain-critical product defaults: `DD-24_INDUSTRY_DOMAIN_RULE_DECISIONS.md` → HSP-AC-001…004.
- Mathematical KPIs + KPI acceptance IDs: `DD-25_KPI_CALCULATION_CATALOG.md`.
- Requirement-ID chains: `Registers/DD_REQUIREMENT_TRACEABILITY_F5.md`.
- 41-MS determinism evidence: `DD-27_41_MS_DETERMINISM_AUDIT.md`.

Where an earlier sentence in this file is less specific than a referenced remediation contract, the more specific remediation contract governs. None of these references permits cross-industry inheritance of business semantics.
