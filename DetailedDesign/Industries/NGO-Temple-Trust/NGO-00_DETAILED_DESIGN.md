# NGO / TEMPLE / TRUST — MANAGEMENT SYSTEM DETAILED DESIGN
**Wave:** 3 · **Status:** DETAILED DESIGN COMPLETE

## NGO-DMS — Donor Management System
**Foundation owner:** F-13 §2.5 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Donor profiles, segments, engagement, pledges, campaigns and consent. Actors: Donor Manager, Fundraising Staff, Trustee/Authorized Viewer, Donor. Modules: donors; segments; engagement; pledge; campaign; consent; recognition.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Donor / `ngo_dms_donor` | donor_no text, principal_ref uuid?, display_name text, confidentiality enum(NORMAL,CONFIDENTIAL,ANONYMOUS_PUBLIC), lifecycle enum(PROSPECT,ACTIVE,LAPSED,REACTIVATED), consent_json jsonb | PK id; UNIQUE(context,donor_no); context-first indexes | SENSITIVE_PERSONAL; donor/privacy policy |
| Pledge / `ngo_dms_pledge` | donor_id uuid, campaign_ref uuid?, amount_minor bigint, currency char(3), due_date date?, fulfilled_minor bigint, state enum(RECORDED,REMINDER,PARTIAL,FULFILLED,CANCELLED) | PK id; index context+donor_id+state; context-first indexes | SENSITIVE_PERSONAL; donor/privacy policy |
| DonorSegmentMembership / `ngo_dms_segment` | donor_id uuid, segment_code text, calculated_at timestamptz, reason_code text, state enum(ACTIVE,REMOVED) | PK id; UNIQUE(context,donor_id,segment_code,state); context-first indexes | SENSITIVE_PERSONAL; donor/privacy policy |
| Engagement / `ngo_dms_engagement` | donor_id uuid, channel text, campaign_ref uuid?, consent_basis text, occurred_at timestamptz, outcome text? | PK id; index context+donor_id+occurred_at; context-first indexes | SENSITIVE_PERSONAL; donor/privacy policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**PROSPECT → ACTIVE → LAPSED → REACTIVATED**. Donation event activates donor; configurable inactivity marks lapsed; pledge reminder stops on fulfillment/cancel. Any undeclared transition returns `NGO-DMS_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **NGO-DMS-R01** Outreach obeys per-channel consent/opt-out.
- **NGO-DMS-R02** Pledge reminders stop when fulfilled/cancelled.
- **NGO-DMS-R03** Confidential donors excluded from public recognition/reports.
- **NGO-DMS-R04** Segments recompute from governed donation/engagement facts.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`ngo.dms.donor.manage` · `ngo.dms.consent.update` · `ngo.dms.pledge.record` · `ngo.dms.pledge.cancel` · `ngo.dms.segment.manage` · `ngo.dms.recognition.publish`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: consent record, pledge summary, donor acknowledgment reference. Notifications: pledge reminder, campaign, acknowledgment only with consent. KPIs/reports: retention, reactivation, pledge fulfillment, average gift. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.ngo.dms.donor_manage` · `ind.ngo.dms.consent_update` · `ind.ngo.dms.pledge_record` · `ind.ngo.dms.pledge_cancel` · `ind.ngo.dms.segment_manage`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `ngo.dms.donor_manage` · `ngo.dms.consent_update` · `ngo.dms.pledge_record`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: DFM donations + Core Communication; credentials use secret references.

### AI / experience / offline
AI: engagement assistant may draft consent-compliant outreach/segment summaries; cannot reveal confidential donor or modify consent; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/ngo/dms`. Mobile: donor profile/pledge + fundraiser mobile. Desktop: none required. Offline **READ_OFFLINE** — private donor data cache limited by sensitivity; consent/pledge mutations online.

### Configuration / entitlement / dependencies / audit
Configuration: lapse window, segments, recognition tiers, consent policies. Entitlement: suite + NGO-DMS + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: NGO-DFM, Core Communication. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: prospect→donation→active; pledge→fulfilled. Negative: opted-out outreach/confidential recognition denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** privacy/consent and donor lifecycle preserved.

---

## NGO-DFM — Donation & Fund Management System
**Foundation owner:** F-13 §4.7 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Donations, receipts, funds/grants, budgets and controlled utilization. Actors: Fund Manager, Donation Operator, Accountant, Trustee, Donor. Modules: donation; receipt; funds/grants; budgets; expenses/disbursement; utilization.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Donation / `ngo_dfm_donation` | donation_no text, donor_ref uuid?, fund_ref uuid, amount_minor bigint, currency char(3), method text, state enum(RECEIVED,RECEIPTED,ALLOCATED,REVERSED) | PK id; UNIQUE(context,donation_no); context-first indexes | FINANCIAL/SENSITIVE_PERSONAL; financial-audit policy |
| DonationReceipt / `ngo_dfm_receipt` | receipt_no text, donation_id uuid, issued_at timestamptz, reversal_of uuid?, state enum(ISSUED,REVERSED) | PK id; UNIQUE(context,receipt_no); append-only; context-first indexes | FINANCIAL/SENSITIVE_PERSONAL; financial-audit policy |
| Fund / `ngo_dfm_fund` | fund_code text, purpose_code text, restriction_json jsonb, balance_minor bigint, state enum(ACTIVE,CLOSED) | PK id; UNIQUE(context,fund_code); context-first indexes | FINANCIAL/SENSITIVE_PERSONAL; financial-audit policy |
| FundUtilization / `ngo_dfm_utilization` | fund_id uuid, expense_ref uuid, amount_minor bigint, purpose_code text, approval_ref uuid?, state enum(REQUESTED,APPROVED,POSTED,REVERSED) | PK id; index context+fund_id+state; context-first indexes | FINANCIAL/SENSITIVE_PERSONAL; financial-audit policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**DONATION_RECEIVED → RECEIPTED → ALLOCATED → UTILIZED → REPORTED**. Grant expense requires approval and restricted-purpose validation; receipt cancellation is reversal, not delete. Any undeclared transition returns `NGO-DFM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **NGO-DFM-R01** Restricted fund posts only to designated purpose/budget.
- **NGO-DFM-R02** Cross-fund transfer requires Trustee approval.
- **NGO-DFM-R03** Receipt numbering immutable/sequential within configured series.
- **NGO-DFM-R04** Utilization reporting follows configured cadence.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`ngo.dfm.donation.record` · `ngo.dfm.receipt.issue` · `ngo.dfm.fund.allocate` · `ngo.dfm.expense.approve` · `ngo.dfm.utilization.post` · `ngo.dfm.transfer.approve`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: donation receipt, tax-exemption certificate when policy permits, utilization/grant report. Notifications: acknowledgment, utilization update, approval. KPIs/reports: donations, fund utilization, grant balance. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.ngo.dfm.donation_record` · `ind.ngo.dfm.receipt_issue` · `ind.ngo.dfm.fund_allocate` · `ind.ngo.dfm.expense_approve` · `ind.ngo.dfm.utilization_post`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `ngo.dfm.donation_record` · `ngo.dfm.receipt_issue` · `ngo.dfm.fund_allocate`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: Payment/accounting adapters, DMS/TAM; credentials use secret references.

### AI / experience / offline
AI: report-drafting/fund summary assistant; cannot reallocate restricted fund or approve expense; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/ngo/dfm`. Mobile: counter/fund approval + donor receipt access. Desktop: donation counter optional. Offline **CONTROLLED_OFFLINE_MUTATION** — cash receipt capture may be restricted offline only with sequential/offline series policy; fund posting requires reconciliation.

### Configuration / entitlement / dependencies / audit
Configuration: fund restrictions, receipt series, approval cadence. Entitlement: suite + NGO-DFM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: NGO-DMS/TAM, Core Billing/Documents. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: donation→receipt→allocation→utilization. Negative: cross-purpose posting and receipt delete denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** fund/receipt ledger immutable and transparent.

---

## NGO-TAM — Temple Administration Management System
**Foundation owner:** F-13 §4.7 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Seva/puja booking, festivals/events, facilities and prasad dispatch. Actors: Trust Admin, Seva/Event Coordinator, Counter Staff, Devotee. Modules: seva catalog; slots; booking/payment; events; facilities; dispatch.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| SevaOffering / `ngo_tam_offering` | code text, name text, slot_policy_ref uuid, capacity int?, price_minor bigint?, state enum(ACTIVE,PAUSED,RETIRED) | PK id; UNIQUE(context,code); context-first indexes | CONFIDENTIAL/FINANCIAL; booking/event policy |
| SevaBooking / `ngo_tam_booking` | booking_no text, offering_id uuid, devotee_ref uuid?, slot_at timestamptz, qty int, state enum(HELD,CONFIRMED,PERFORMED,CANCELLED,NO_SHOW) | PK id; UNIQUE(context,booking_no); context-first indexes | CONFIDENTIAL/FINANCIAL; booking/event policy |
| TempleEvent / `ngo_tam_event` | event_code text, name text, start_at timestamptz, end_at timestamptz, budget_minor bigint?, state enum(PLANNED,APPROVED,EXECUTING,COMPLETED,SETTLED) | PK id; UNIQUE(context,event_code); context-first indexes | CONFIDENTIAL/FINANCIAL; booking/event policy |
| Dispatch / `ngo_tam_dispatch` | booking_id uuid?, event_id uuid?, recipient_ref uuid?, dispatch_type text, tracking_ref text?, state enum(PENDING,PACKED,DISPATCHED,DELIVERED,FAILED) | PK id; index context+state; context-first indexes | CONFIDENTIAL/FINANCIAL; booking/event policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**CATALOG → BOOKED → CONFIRMED → PERFORMED → DISPATCHED_OR_CLOSED**. Event planning has approval/budget/execution/settlement; booking consumes slot capacity atomically. Any undeclared transition returns `NGO-TAM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **NGO-TAM-R01** Confirmed booking cannot exceed slot capacity.
- **NGO-TAM-R02** Payments/receipts consume Core Billing/DFM receipt rules.
- **NGO-TAM-R03** Event spending follows approved budget/fund policy.
- **NGO-TAM-R04** Performance/dispatch states are actor/time audited.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`ngo.tam.offering.manage` · `ngo.tam.booking.confirm` · `ngo.tam.booking.perform` · `ngo.tam.event.approve` · `ngo.tam.event.complete` · `ngo.tam.dispatch.record`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: booking receipt/certificate, event/function report. Notifications: booking, event reminder, dispatch. KPIs/reports: bookings, participation, revenue, budget variance. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.ngo.tam.offering_manage` · `ind.ngo.tam.booking_confirm` · `ind.ngo.tam.booking_perform` · `ind.ngo.tam.event_approve` · `ind.ngo.tam.event_complete`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `ngo.tam.offering_manage` · `ngo.tam.booking_confirm` · `ngo.tam.booking_perform`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: DFM/MVM + payment/shipping adapter; credentials use secret references.

### AI / experience / offline
AI: devotee assistant may explain catalog/events; cannot reserve beyond capacity or post financial state; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/ngo/tam`. Mobile: devotee booking + staff event/dispatch. Desktop: counter optional. Offline **READ_OFFLINE** — catalog/event read cache; booking/payment confirmation online.

### Configuration / entitlement / dependencies / audit
Configuration: catalog, slots, packages, events, dispatch rules. Entitlement: suite + NGO-TAM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: NGO-DFM/MVM, Core Billing. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: booking→performance→dispatch. Negative: overcapacity/unpaid confirm denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** booking/event/financial linkage auditable.

---

## NGO-MVM — Membership & Volunteer Management System
**Foundation owner:** F-13 §4.7 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Membership lifecycle, dues, volunteer profiles, assignment and hours. Actors: Membership Coordinator, Volunteer Coordinator, Member, Volunteer. Modules: membership; dues/renewal; volunteer skills; assignment; hours; recognition.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Membership / `ngo_mvm_membership` | membership_no text, principal_ref uuid, type_code text, valid_from date, valid_to date?, state enum(APPLIED,APPROVED,ACTIVE,LAPSED,RENEWED,CANCELLED) | PK id; UNIQUE(context,membership_no); context-first indexes | SENSITIVE_PERSONAL; membership/volunteer policy |
| VolunteerProfile / `ngo_mvm_volunteer` | principal_ref uuid, skills_json jsonb, availability_json jsonb, consent_json jsonb, state enum(APPLIED,ACTIVE,SUSPENDED,INACTIVE) | PK id; UNIQUE(context,principal_ref); context-first indexes | SENSITIVE_PERSONAL; membership/volunteer policy |
| VolunteerAssignment / `ngo_mvm_assignment` | volunteer_id uuid, event_or_activity_ref uuid, role_code text, scheduled_start/end timestamptz, state enum(PLANNED,ACCEPTED,ACTIVE,COMPLETED,CANCELLED) | PK id; index context+volunteer_id+state; context-first indexes | SENSITIVE_PERSONAL; membership/volunteer policy |
| VolunteerHours / `ngo_mvm_hours` | assignment_id uuid, work_date date, hours numeric, submitted_by uuid, verified_by uuid?, state enum(DRAFT,SUBMITTED,VERIFIED,REJECTED) | PK id; CHECK hours>0; context-first indexes | SENSITIVE_PERSONAL; membership/volunteer policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**APPLIED → APPROVED → ACTIVE → LAPSED_OR_RENEWED**. Volunteer registration→skill tagging→assignment→hours→recognition; verified hours immutable except correction workflow. Any undeclared transition returns `NGO-MVM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **NGO-MVM-R01** Membership activation follows approval/dues policy.
- **NGO-MVM-R02** Volunteer assignment must match active profile/consent/required skill policy.
- **NGO-MVM-R03** Hours require verifier before recognition/reporting.
- **NGO-MVM-R04** Communication obeys consent/confidentiality policy.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`ngo.mvm.membership.approve` · `ngo.mvm.membership.renew` · `ngo.mvm.volunteer.activate` · `ngo.mvm.assignment.create` · `ngo.mvm.hours.verify` · `ngo.mvm.recognition.issue`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: membership card, renewal, volunteer hours/recognition record. Notifications: dues/renewal, assignment, hours verification. KPIs/reports: renewal %, active members, volunteer hours, participation. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.ngo.mvm.membership_approve` · `ind.ngo.mvm.membership_renew` · `ind.ngo.mvm.volunteer_activate` · `ind.ngo.mvm.assignment_create` · `ind.ngo.mvm.hours_verify`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `ngo.mvm.membership_approve` · `ngo.mvm.membership_renew` · `ngo.mvm.volunteer_activate`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: DFM dues/payments, TAM events; credentials use secret references.

### AI / experience / offline
AI: engagement assistant may match skills/summarize participation; cannot approve membership/hours; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/ngo/mvm`. Mobile: member/volunteer assignment/hours. Desktop: none required. Offline **CONTROLLED_OFFLINE_MUTATION** — volunteer hours may queue; verification/membership state online.

### Configuration / entitlement / dependencies / audit
Configuration: membership types, dues, skills, recognition rules. Entitlement: suite + NGO-MVM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: NGO-DFM/TAM, Core Communication. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: apply→active→renew; assign→verify hours. Negative: unverified hours/invalid consent action denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** membership and volunteer evidence reliable.
