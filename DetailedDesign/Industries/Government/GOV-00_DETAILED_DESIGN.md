# GOVERNMENT & PUBLIC SECTOR — MANAGEMENT SYSTEM DETAILED DESIGN
**Wave:** 3 · **Status:** DETAILED DESIGN COMPLETE

## GOV-CSM — Citizen Service Management System
**Foundation owner:** F-13 §4.6 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Citizen service/grievance request delivery with SLA and appeals. Actors: Citizen, Counter/Service Staff, Grievance Officer, Approver. Modules: service catalog; requests; triage; assignment; info request; SLA/escalation; appeal.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| CitizenRequest / `gov_csm_request` | request_no text, service_code text, citizen_ref uuid?, channel text, state enum(SUBMITTED,ACKNOWLEDGED,TRIAGED,ASSIGNED,PROCESSING,INFO_REQUESTED,RESOLVED,CLOSED,REOPENED,ESCALATED) | PK id; UNIQUE (tenant_id, industry_context_id,request_no); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL; public-record/service policy |
| SlaInstance / `gov_csm_sla` | request_id uuid, category_code text, due_at timestamptz, escalation_level int, state enum(RUNNING,PAUSED,MET,BREACHED,ESCALATED) | PK id; UNIQUE (tenant_id, industry_context_id,request_id); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL; public-record/service policy |
| RequestAction / `gov_csm_action` | request_id uuid, action_type_code text, note text?, actor_id uuid, from_state text, to_state text, occurred_at timestamptz | PK id; append-only; INDEX (tenant_id, industry_context_id, request_id) | SENSITIVE_PERSONAL; public-record/service policy |
| Appeal / `gov_csm_appeal` | request_id uuid, appeal_no text, reason text, authority_ref uuid, state enum(SUBMITTED,REVIEW,HEARING,DECIDED,CLOSED) | PK id; UNIQUE (tenant_id, industry_context_id,appeal_no); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL; public-record/service policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**SUBMITTED → ACKNOWLEDGED → TRIAGED → ASSIGNED → PROCESSING → RESOLVED → CLOSED**. Info-request/response and reopen/escalation branches; SLA breach auto-escalates according to category matrix. Any undeclared transition returns `GOV-CSM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **GOV-CSM-R01** Acknowledgment assigns immutable request number/SLA start.
- **GOV-CSM-R02** SLA breach escalates one configured authority level.
- **GOV-CSM-R03** Closure requires resolution evidence/actor.
- **GOV-CSM-R04** Appeal does not erase prior request history.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`gov.csm.request.submit` · `gov.csm.request.triage` · `gov.csm.request.assign` · `gov.csm.request.resolve` · `gov.csm.request.close` · `gov.csm.appeal.decide`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: acknowledgment, deficiency/info request, resolution/appeal record. Notifications: status, info request, SLA/escalation, hearing. KPIs/reports: SLA %, pendency, resolution time, reopen rate. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.gov.csm.request_submit` · `ind.gov.csm.request_triage` · `ind.gov.csm.request_assign` · `ind.gov.csm.request_resolve` · `ind.gov.csm.request_close`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `gov.csm.request_submit` · `gov.csm.request_triage` · `gov.csm.request_assign`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: CFM handoff, payment if service requires; credentials use secret references.

### AI / experience / offline
AI: citizen assistant may explain service/status and summarize request; cannot resolve/close/decide appeal; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/gov/csm`. Mobile: citizen status + field/staff where needed. Desktop: counter optional. Offline **READ_OFFLINE** — counter/field reference may cache; official state transitions online.

### Configuration / entitlement / dependencies / audit
Configuration: service categories, SLA/escalation, appeal authority. Entitlement: suite + GOV-CSM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: GOV-CFM, Core Communication/Documents. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: submit→resolve within SLA. Negative: unauthorized close/SLA bypass denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** SLA/escalation and citizen record are auditable.

---

## GOV-CFM — Case & File Management System
**Foundation owner:** F-13 §4.6 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Official file numbering, noting, movement, approvals, disposal and archive. Actors: Section Officer, Clerk/Assistant, Approving Authority. Modules: file registry; notes; drafts; movement; approval; disposal/archive.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| OfficialFile / `gov_cfm_file` | file_no text, subject text, classification text, current_desk_ref uuid?, state enum(CREATED,IN_PROCESS,APPROVAL,DISPOSED,ARCHIVED) | PK id; UNIQUE (tenant_id, industry_context_id,file_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/REGULATED; official-record policy |
| FileNoting / `gov_cfm_noting` | file_id uuid, sequence_no int, author_id uuid, content_document_ref uuid, supersedes_noting_id uuid?, created_at timestamptz | PK id; append-only; UNIQUE (tenant_id, industry_context_id,file_id,sequence_no); INDEX (tenant_id, industry_context_id, file_id) | CONFIDENTIAL/REGULATED; official-record policy |
| FileMovement / `gov_cfm_movement` | file_id uuid, from_desk_ref uuid?, to_desk_ref uuid, forwarded_by uuid, received_by uuid?, forwarded_at timestamptz, received_at timestamptz? | PK id; append-only; INDEX (tenant_id, industry_context_id, file_id) | CONFIDENTIAL/REGULATED; official-record policy |
| FileDecision / `gov_cfm_decision` | file_id uuid, level_code text, authority_id uuid, decision enum(APPROVE,RETURN,REJECT,DISPOSE), reason text?, occurred_at timestamptz | PK id; append-only; INDEX (tenant_id, industry_context_id, file_id) | CONFIDENTIAL/REGULATED; official-record policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**CREATED → IN_PROCESS → FORWARDED → APPROVAL → DISPOSED → ARCHIVED**. Notings/movements append; return branch creates new movement/note; archive only after disposal. Any undeclared transition returns `GOV-CFM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **GOV-CFM-R01** Notings are append-only; corrections supersede.
- **GOV-CFM-R02** Every movement timestamps sender/receiver desks.
- **GOV-CFM-R03** Decision requires designated authority level.
- **GOV-CFM-R04** Archived/disposed file cannot silently reopen; governed reopen action required.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`gov.cfm.file.create` · `gov.cfm.noting.add` · `gov.cfm.file.forward` · `gov.cfm.decision.record` · `gov.cfm.file.dispose` · `gov.cfm.file.archive`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: official file, noting/draft, disposal record. Notifications: forwarded, pending, returned, decision. KPIs/reports: pendency, movement time, disposal rate. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.gov.cfm.file_create` · `ind.gov.cfm.noting_add` · `ind.gov.cfm.file_forward` · `ind.gov.cfm.decision_record` · `ind.gov.cfm.file_dispose`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `gov.cfm.file_create` · `gov.cfm.noting_add` · `gov.cfm.file_forward`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: CSM/PLM linkage + Core Documents/Workflow; credentials use secret references.

### AI / experience / offline
AI: document intelligence may classify/summarize authorized files; cannot edit notings or record decision; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/gov/cfm`. Mobile: staff read/approval where allowed. Desktop: office file desk candidate. Offline **READ_OFFLINE** — official notes/movements online; read cache according to sensitivity.

### Configuration / entitlement / dependencies / audit
Configuration: numbering, desk hierarchy, approval chains, classification. Entitlement: suite + GOV-CFM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: GOV-CSM/PLM, Core Documents. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: create→noting→forward→decision→dispose. Negative: edit prior noting/unauthorized decision denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** complete immutable official movement/noting history.

---

## GOV-PLM — Permit & License Management System
**Foundation owner:** F-13 §4.6 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Application, scrutiny, inspection, approval/rejection, issuance, renewal/amendment/suspension. Actors: Applicant, Scrutiny Officer, Inspector, Approving Authority. Modules: applications; documents/fees; scrutiny; deficiency; inspection; decision; permit/license.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| PermitApplication / `gov_plm_application` | application_no text, permit_type text, applicant_ref uuid, state enum(SUBMITTED,FEE_PENDING,SCRUTINY,DEFICIENCY,INSPECTION,DECISION,APPROVED,REJECTED,ISSUED) | PK id; UNIQUE (tenant_id, industry_context_id,application_no); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL/REGULATED; permit/public-record policy |
| ScrutinyRecord / `gov_plm_scrutiny` | application_id uuid, checklist_version text, result enum(PASS,DEFICIENT), deficiency_json jsonb?, officer_id uuid, completed_at timestamptz | PK id; version/checklist indexed; INDEX (tenant_id, industry_context_id, application_id) | SENSITIVE_PERSONAL/REGULATED; permit/public-record policy |
| Inspection / `gov_plm_inspection` | application_id uuid, inspector_id uuid, scheduled_at timestamptz, performed_at timestamptz?, finding_json jsonb, state enum(SCHEDULED,COMPLETED,FAILED,APPROVED) | PK id; INDEX (tenant_id, industry_context_id, application_id, state); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL/REGULATED; permit/public-record policy |
| PermitLicense / `gov_plm_license` | application_id uuid, license_no text, qr_verification_ref uuid, valid_from date, valid_to date?, state enum(ACTIVE,SUSPENDED,REVOKED,EXPIRED,RENEWED), version int | PK id; UNIQUE (tenant_id, industry_context_id,license_no,version); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL/REGULATED; permit/public-record policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**SUBMITTED → FEE → SCRUTINY → INSPECTION → DECISION → ISSUED**. Deficiency/resubmission loop; renewal/amendment create governed versions; suspension/revocation separate decisions. Any undeclared transition returns `GOV-PLM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **GOV-PLM-R01** Issuance requires completed scrutiny, required inspection, approval and fee realization.
- **GOV-PLM-R02** QR verification record created on issuance.
- **GOV-PLM-R03** Deficiency cannot be bypassed without authorized override/reason.
- **GOV-PLM-R04** Permit corrections/versioning never mutate issued historical version.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`gov.plm.application.submit` · `gov.plm.scrutiny.complete` · `gov.plm.inspection.record` · `gov.plm.decision.approve` · `gov.plm.license.issue` · `gov.plm.license.suspend`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: application, deficiency notice, inspection report, QR permit/license. Notifications: status, deficiency, inspection, renewal. KPIs/reports: issuance TAT, deficiency %, inspection backlog, renewal backlog. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.gov.plm.application_submit` · `ind.gov.plm.scrutiny_complete` · `ind.gov.plm.inspection_record` · `ind.gov.plm.decision_approve` · `ind.gov.plm.license_issue`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `gov.plm.application_submit` · `gov.plm.scrutiny_complete` · `gov.plm.inspection_record`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: RTM fees, trust/identity verification adapters; credentials use secret references.

### AI / experience / offline
AI: scrutiny AI may flag missing/inconsistent docs; cannot approve/issue; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/gov/plm`. Mobile: applicant status + inspector field capture. Desktop: counter/office optional. Offline **CONTROLLED_OFFLINE_MUTATION** — field inspection evidence may queue with device/context; issuance online.

### Configuration / entitlement / dependencies / audit
Configuration: checklists, authority, validity/renewal rules. Entitlement: suite + GOV-PLM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: GOV-RTM, Core Documents/Workflow. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: application→issuance. Negative: issue without gate condition rejected. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** permit version and issuance proof verifiable/audited.

---

## GOV-RTM — Revenue & Tax Management System
**Foundation owner:** F-13 §4.6 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Assessment, demand, collection, arrears, reconciliation, recovery and refund. Actors: Revenue Officer, Cashier, Approver, Citizen/Business. Modules: tax heads; assessment; demand; payment/receipt; reconciliation; arrears; recovery/refund.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Assessment / `gov_rtm_assessment` | assessment_no text, taxpayer_ref uuid, tax_head_code text, period_key text, assessed_minor bigint, state enum(DRAFT,ASSESSED,FINALIZED,REVISED) | PK id; UNIQUE (tenant_id, industry_context_id,assessment_no); INDEX (tenant_id, industry_context_id, state, updated_at) | FINANCIAL/SENSITIVE_PERSONAL; financial/public-record policy |
| Demand / `gov_rtm_demand` | assessment_id uuid, demand_no text, due_date date, amount_minor bigint, balance_minor bigint, state enum(ISSUED,PART_PAID,PAID,ARREARS,REVERSED) | PK id; UNIQUE (tenant_id, industry_context_id,demand_no); INDEX (tenant_id, industry_context_id, state, updated_at) | FINANCIAL/SENSITIVE_PERSONAL; financial/public-record policy |
| RevenueReceipt / `gov_rtm_receipt` | receipt_no text, demand_id uuid?, payment_ref uuid, amount_minor bigint, issued_at timestamptz, reversal_of uuid?, state enum(ISSUED,REVERSED) | PK id; UNIQUE (tenant_id, industry_context_id,receipt_no); append-only; INDEX (tenant_id, industry_context_id, state, updated_at) | FINANCIAL/SENSITIVE_PERSONAL; financial/public-record policy |
| RecoveryRefundCase / `gov_rtm_case` | taxpayer_ref uuid, demand_id uuid?, case_type enum(RECOVERY,REFUND), amount_minor bigint, reason text, state enum(OPEN,REVIEW,APPROVED,EXECUTED,CLOSED) | PK id; INDEX (tenant_id, industry_context_id, case_type, state); INDEX (tenant_id, industry_context_id, state, updated_at) | FINANCIAL/SENSITIVE_PERSONAL; financial/public-record policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**ASSESSED → DEMAND_ISSUED → PAYMENT → RECONCILED → PAID_OR_ARREARS**. Arrears opens recovery; refund follows approval; receipt correction reversal+reissue only. Any undeclared transition returns `GOV-RTM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **GOV-RTM-R01** Issued receipt is immutable.
- **GOV-RTM-R02** Demand balance changes only through governed payment/reversal/adjustment events.
- **GOV-RTM-R03** Refund/recovery requires approval chain.
- **GOV-RTM-R04** Tax/rate tables are versioned effective policies, not hard-coded.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`gov.rtm.assessment.finalize` · `gov.rtm.demand.issue` · `gov.rtm.payment.record` · `gov.rtm.receipt.issue` · `gov.rtm.refund.approve` · `gov.rtm.recovery.execute`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: assessment, demand notice, receipt, recovery/refund record. Notifications: demand due, payment, arrears, recovery. KPIs/reports: collection vs demand, arrears, reconciliation. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.gov.rtm.assessment_finalize` · `ind.gov.rtm.demand_issue` · `ind.gov.rtm.payment_record` · `ind.gov.rtm.receipt_issue` · `ind.gov.rtm.refund_approve`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `gov.rtm.assessment_finalize` · `gov.rtm.demand_issue` · `gov.rtm.payment_record`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: PaymentPort/treasury/accounting adapters; credentials use secret references.

### AI / experience / offline
AI: AI limited to assistance/anomaly/analytics; cannot assess/finalize/refund autonomously; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/gov/rtm`. Mobile: citizen demand/payment/receipt + staff field. Desktop: counter candidate. Offline **ONLINE_ONLY** — financial receipts/assessments require live current state.

### Configuration / entitlement / dependencies / audit
Configuration: tax heads/rates, approval/recovery policies. Entitlement: suite + GOV-RTM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: Core Billing/Workflow/Integration. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: assessment→demand→payment→receipt. Negative: receipt edit/unauthorized refund denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** financial records immutable and reconciled.
