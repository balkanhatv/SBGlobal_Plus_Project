# PROFESSIONAL SERVICES — MANAGEMENT SYSTEM DETAILED DESIGN
**Wave:** 3 · **Status:** DETAILED DESIGN COMPLETE

## PSV-CRM — CRM Management System
**Foundation owner:** F-13 §4.5 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Lead, opportunity, proposal and contract pipeline. Actors: Sales/BD, Partner, Client contact. Modules: leads; opportunities; activities; proposal; negotiation; contract handoff.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Lead / `psv_crm_lead` | lead_no text, source text, owner_id uuid, contact_ref jsonb, state enum(NEW,QUALIFIED,DISQUALIFIED,CONVERTED) | PK id; UNIQUE (tenant_id, industry_context_id,lead_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; client-commercial policy |
| Opportunity / `psv_crm_opportunity` | lead_id uuid?, name text, owner_id uuid, value_minor bigint?, currency char(3)?, probability int, stage enum(QUALIFIED,DISCOVERY,PROPOSAL,NEGOTIATION,WON,LOST) | PK id; CHECK probability between 0 and 100; INDEX (tenant_id, industry_context_id, lead_id) | CONFIDENTIAL; client-commercial policy |
| Proposal / `psv_crm_proposal` | opportunity_id uuid, version int, document_id uuid, amount_minor bigint?, state enum(DRAFT,REVIEW,ISSUED,ACCEPTED,REJECTED,SUPERSEDED) | PK id; UNIQUE (tenant_id, industry_context_id,opportunity_id,version); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; client-commercial policy |
| Activity / `psv_crm_activity` | lead_or_opp_ref uuid, activity_type_code text, due_at timestamptz?, completed_at timestamptz?, owner_id uuid, outcome text? | PK id; INDEX (tenant_id, industry_context_id, owner_id, due_at); INDEX (tenant_id, industry_context_id, lead_or_opp_ref) | CONFIDENTIAL; client-commercial policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**LEAD → QUALIFIED → OPPORTUNITY → PROPOSAL → NEGOTIATION → WON_OR_LOST**. Won creates governed engagement/project/service handoff; lost records reason. Any undeclared transition returns `PSV-CRM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **PSV-CRM-R01** Conversion requires source and owner attribution.
- **PSV-CRM-R02** Accepted proposal version is immutable/superseded only.
- **PSV-CRM-R03** Won stage requires accepted commercial/contract reference.
- **PSV-CRM-R04** Handoff uses service contract/event, not direct table writes.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`psv.crm.lead.manage` · `psv.crm.opportunity.advance` · `psv.crm.proposal.issue` · `psv.crm.proposal.accept` · `psv.crm.opportunity.win` · `psv.crm.contract.handoff`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: proposal, quote, contract reference. Notifications: follow-up, stage, proposal response. KPIs/reports: pipeline, win rate, sales cycle, source conversion. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.psv.crm.lead_manage` · `ind.psv.crm.opportunity_advance` · `ind.psv.crm.proposal_issue` · `ind.psv.crm.proposal_accept` · `ind.psv.crm.opportunity_win`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `psv.crm.lead_manage` · `psv.crm.opportunity_advance` · `psv.crm.proposal_issue`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: e-sign/document adapters; PJM/SDM handoff; credentials use secret references.

### AI / experience / offline
AI: proposal-drafting/sales assistant may summarize/draft; cannot mark won or accept contract; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/psv/crm`. Mobile: sales pipeline/activity. Desktop: none required. Offline **READ_OFFLINE** — pipeline read may cache; stage/contract changes online.

### Configuration / entitlement / dependencies / audit
Configuration: stages, source catalog, approval thresholds. Entitlement: suite + PSV-CRM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: PSV-PJM/SDM, Core Documents. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: lead→won→handoff. Negative: won without accepted reference denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** commercial pipeline versions and handoff audited.

---

## PSV-PJM — Project Management System
**Foundation owner:** F-13 §4.5 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Project/WBS/task/milestone/change and client acceptance governance. Actors: Project Manager, Team, Client. Modules: project; WBS/tasks; milestone; change request; deliverable; acceptance.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Project / `psv_pjm_project` | project_no text, client_ref uuid, contract_ref uuid?, manager_id uuid, budget_minor bigint?, currency char(3)?, state enum(SETUP,ACTIVE,HOLD,COMPLETING,COMPLETED,CLOSED) | PK id; UNIQUE (tenant_id, industry_context_id,project_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; project-contract policy |
| WorkItem / `psv_pjm_work_item` | project_id uuid, parent_id uuid?, title text, assignee_id uuid?, planned_hours numeric?, state enum(TODO,IN_PROGRESS,BLOCKED,DONE,CANCELLED) | PK id; INDEX (tenant_id, industry_context_id, project_id, state); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; project-contract policy |
| Milestone / `psv_pjm_milestone` | project_id uuid, code text, due_at timestamptz?, amount_minor bigint?, state enum(PLANNED,IN_PROGRESS,SUBMITTED,ACCEPTED,REJECTED,INVOICED) | PK id; UNIQUE (tenant_id, industry_context_id,project_id,code); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; project-contract policy |
| ChangeRequest / `psv_pjm_change_request` | project_id uuid, cr_no text, scope_delta text, cost_delta_minor bigint?, schedule_delta_hours numeric?, state enum(DRAFT,SUBMITTED,APPROVED,REJECTED,IMPLEMENTED) | PK id; UNIQUE (tenant_id, industry_context_id,project_id,cr_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; project-contract policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**SETUP → ACTIVE → MILESTONE_DELIVERY → ACCEPTANCE → COMPLETED → CLOSED**. Change requests version scope/budget/schedule; milestone invoice trigger requires acceptance. Any undeclared transition returns `PSV-PJM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **PSV-PJM-R01** Budget threshold alerts; continuation beyond governed overrun may require approval.
- **PSV-PJM-R02** Milestone invoicing requires recorded client acceptance.
- **PSV-PJM-R03** Approved change modifies project baseline through versioned history.
- **PSV-PJM-R04** Closed project cannot accept new task/time without reopen approval.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`psv.pjm.project.activate` · `psv.pjm.task.manage` · `psv.pjm.milestone.submit` · `psv.pjm.milestone.accept` · `psv.pjm.change.approve` · `psv.pjm.project.close`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: project plan, change request, deliverable, acceptance. Notifications: milestone, budget, change, overdue. KPIs/reports: on-time %, margin, change volume, milestone acceptance. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.psv.pjm.project_activate` · `ind.psv.pjm.task_manage` · `ind.psv.pjm.milestone_submit` · `ind.psv.pjm.milestone_accept` · `ind.psv.pjm.change_approve`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `psv.pjm.project_activate` · `psv.pjm.task_manage` · `psv.pjm.milestone_submit`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: RTM time, SDM deliverables, Billing invoice trigger; credentials use secret references.

### AI / experience / offline
AI: project assistant may summarize risks/draft plans; cannot accept milestone or approve change; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/psv/pjm`. Mobile: tasks/approvals/status. Desktop: optional PM desk. Offline **CONTROLLED_OFFLINE_MUTATION** — task notes/status may queue; acceptance/change/billing triggers online.

### Configuration / entitlement / dependencies / audit
Configuration: templates, budget thresholds, approval chains. Entitlement: suite + PSV-PJM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: PSV-RTM/SDM, Core Billing. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: setup→deliver→accept→complete. Negative: invoice trigger without acceptance rejected. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** baseline/change/acceptance history is versioned.

---

## PSV-SDM — Service Delivery Management System
**Foundation owner:** F-13 §2.4 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Contracted/recurring service requests, SLA delivery and deliverable acceptance. Actors: Delivery Manager, Consultant/Agent, Resource Manager, Client. Modules: service contract; ticket queue; SLA; deliverable; escalation; reviews.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| ServiceContractRef / `psv_sdm_contract_ref` | client_ref uuid, contract_external_ref uuid, service_code text, entitled_hours numeric?, sla_policy_ref uuid, state enum(ACTIVE,SUSPENDED,EXPIRED) | PK id; UNIQUE (tenant_id, industry_context_id,contract_external_ref,service_code); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; service-contract policy |
| ServiceTicket / `psv_sdm_ticket` | ticket_no text, contract_ref_id uuid, priority_code text, assigned_to uuid?, state enum(RECEIVED,TRIAGED,ASSIGNED,IN_PROGRESS,CLIENT_WAIT,RESOLVED,ACCEPTED,CLOSED,ESCALATED) | PK id; UNIQUE (tenant_id, industry_context_id,ticket_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; service-contract policy |
| SlaClock / `psv_sdm_sla_clock` | ticket_id uuid, metric_code text, started_at timestamptz, paused_at?, accumulated_pause_seconds bigint, due_at timestamptz, state enum(RUNNING,PAUSED,MET,BREACHED) | PK id; UNIQUE (tenant_id, industry_context_id,ticket_id,metric_code); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; service-contract policy |
| Deliverable / `psv_sdm_deliverable` | contract_ref_id uuid, project_ref uuid?, title text, version int, document_id uuid?, state enum(PLANNED,IN_PROGRESS,SUBMITTED,REVISION,ACCEPTED) | PK id; UNIQUE (tenant_id, industry_context_id,contract_ref_id,title,version); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; service-contract policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**RECEIVED → TRIAGED → ASSIGNED → IN_PROGRESS → RESOLVED → ACCEPTED → CLOSED**. CLIENT_WAIT pauses clock only per policy; SLA breach escalates; deliverable invoice trigger after acceptance. Any undeclared transition returns `PSV-SDM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **PSV-SDM-R01** SLA pauses only in configured client-wait state and is audited.
- **PSV-SDM-R02** Work beyond entitled hours needs approval/change order.
- **PSV-SDM-R03** Acceptance precedes invoice trigger.
- **PSV-SDM-R04** Service review schedule follows contract policy.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`psv.sdm.ticket.triage` · `psv.sdm.ticket.assign` · `psv.sdm.ticket.resolve` · `psv.sdm.deliverable.submit` · `psv.sdm.deliverable.accept` · `psv.sdm.sla.override`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: service report, deliverable, acceptance, SLA report. Notifications: assignment, response due, breach, acceptance. KPIs/reports: SLA %, response/resolution, backlog age, CSAT, profitability. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.psv.sdm.ticket_triage` · `ind.psv.sdm.ticket_assign` · `ind.psv.sdm.ticket_resolve` · `ind.psv.sdm.deliverable_submit` · `ind.psv.sdm.deliverable_accept`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `psv.sdm.ticket_triage` · `psv.sdm.ticket_assign` · `psv.sdm.ticket_resolve`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: CRM contracts, PJM projects, RTM time; credentials use secret references.

### AI / experience / offline
AI: support agent may summarize/answer from authorized knowledge and draft resolution; cannot close/accept high-risk cases; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/psv/sdm`. Mobile: ticket work/approvals. Desktop: service desk optional. Offline **READ_OFFLINE** — assigned work/read may cache; SLA state/acceptance online.

### Configuration / entitlement / dependencies / audit
Configuration: SLA matrices, priorities, escalation, review cadence. Entitlement: suite + PSV-SDM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: PSV-CRM/PJM/RTM, Core Billing. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: receive→resolve→accept→close. Negative: pause outside policy/bill before acceptance denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** SLA and acceptance evidence is deterministic.

---

## PSV-RTM — Resource & Timesheet Management System
**Foundation owner:** F-13 §4.5 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Capacity, allocation, time and expense control. Actors: Resource Manager, PM, Team Member, Finance. Modules: skills/capacity; allocations; timesheets; expenses.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| ResourceProfile / `psv_rtm_resource` | principal_id uuid, capacity_hours_week numeric, skills_json jsonb, cost_rate_minor bigint?, state enum(ACTIVE,INACTIVE) | PK id; UNIQUE (tenant_id, industry_context_id,principal_id); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; time-financial policy |
| Allocation / `psv_rtm_allocation` | resource_id uuid, project_ref uuid, start_date date, end_date date, allocation_percent numeric, state enum(PROPOSED,APPROVED,ACTIVE,ENDED) | PK id; CHECK allocation_percent>0 AND <=100; INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; time-financial policy |
| Timesheet / `psv_rtm_timesheet` | principal_id uuid, period_start date, period_end date, total_hours numeric, state enum(DRAFT,SUBMITTED,REJECTED,APPROVED,LOCKED,BILLED) | PK id; UNIQUE (tenant_id, industry_context_id,principal_id,period_start,period_end); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; time-financial policy |
| TimeEntry / `psv_rtm_time_entry` | timesheet_id uuid, project_ref uuid, task_ref uuid?, work_date date, hours numeric, billable boolean, note text?, state enum(DRAFT,APPROVED,REJECTED) | PK id; CHECK hours>0; INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; time-financial policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**DRAFT → SUBMITTED → APPROVED → LOCKED → BILLED**. Rejected returns to draft; approved time is basis for billing/cost posting; period lock prevents edits. Any undeclared transition returns `PSV-RTM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **PSV-RTM-R01** Only approved time can bill.
- **PSV-RTM-R02** Allocations cannot exceed capacity without Resource Manager approval.
- **PSV-RTM-R03** Locked/approved time corrections use adjustment/reopen workflow.
- **PSV-RTM-R04** Expense approval follows project/client policy.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`psv.rtm.allocation.propose` · `psv.rtm.allocation.approve` · `psv.rtm.timesheet.submit` · `psv.rtm.timesheet.approve` · `psv.rtm.period.lock` · `psv.rtm.expense.approve`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: timesheet, expense report, allocation report. Notifications: submission, rejection, approval, capacity conflict. KPIs/reports: utilization, billable %, approval TAT, allocation conflict. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.psv.rtm.allocation_propose` · `ind.psv.rtm.allocation_approve` · `ind.psv.rtm.timesheet_submit` · `ind.psv.rtm.timesheet_approve` · `ind.psv.rtm.period_lock`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `psv.rtm.allocation_propose` · `psv.rtm.allocation_approve` · `psv.rtm.timesheet_submit`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: PJM/SDM and Core Billing; credentials use secret references.

### AI / experience / offline
AI: resource assistant may suggest allocations/summarize capacity; cannot approve time/over-allocation; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/psv/rtm`. Mobile: time/expense entry + approval. Desktop: none required. Offline **CONTROLLED_OFFLINE_MUTATION** — draft time may queue; approval/lock/billing online with version checks.

### Configuration / entitlement / dependencies / audit
Configuration: periods, capacity, expense policies, locking. Entitlement: suite + PSV-RTM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: PSV-PJM/SDM, Core Billing. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: draft→approve→lock→bill. Negative: unapproved billing and overcapacity denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** time/billing lineage is exact and auditable.

---

## PSV-SGM — PG/VG Studio Management System
**Foundation owner:** F-13 §4.5 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Photography/videography booking, shoot, editing, review and final delivery. Actors: Studio Manager, Photographer/Videographer, Editor, Client. Modules: packages; booking; schedule; equipment; shoot; edit; revision; delivery vault.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| StudioBooking / `psv_sgm_booking` | booking_no text, client_ref uuid, package_code text, shoot_at timestamptz, location text?, state enum(ENQUIRY,CONFIRMED,SCHEDULED,SHOT,EDITING,CLIENT_REVIEW,DELIVERED,ARCHIVED,CANCELLED) | PK id; UNIQUE (tenant_id, industry_context_id,booking_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/SENSITIVE_PERSONAL; media-contract policy |
| ShootAssignment / `psv_sgm_shoot` | booking_id uuid, crew_json jsonb, equipment_json jsonb, started_at timestamptz?, completed_at timestamptz?, state enum(PLANNED,IN_PROGRESS,COMPLETED) | PK id; UNIQUE (tenant_id, industry_context_id,booking_id); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/SENSITIVE_PERSONAL; media-contract policy |
| MediaRevision / `psv_sgm_revision` | booking_id uuid, asset_group_ref uuid, revision_no int, revision_document_id uuid, state enum(DRAFT,SUBMITTED,CHANGES_REQUESTED,APPROVED) | PK id; exact-scope composite FK to DocumentMeta; UNIQUE (tenant_id, industry_context_id,asset_group_ref,revision_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/SENSITIVE_PERSONAL; media-contract policy |
| DeliveryRecord / `psv_sgm_delivery` | booking_id uuid, delivery_version int, delivery_document_id uuid, accepted_by uuid?, accepted_at timestamptz?, state enum(PREPARED,SHARED,ACCEPTED,REVOKED) | PK id; exact-scope composite FK to DocumentMeta; UNIQUE (tenant_id, industry_context_id,booking_id,delivery_version); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/SENSITIVE_PERSONAL; media-contract policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**ENQUIRY → CONFIRMED → SCHEDULED → SHOT → EDITING → CLIENT_REVIEW → DELIVERED → ARCHIVED**. Revision cycles bounded by package/config; final delivery requires approved version/acceptance. Any undeclared transition returns `PSV-SGM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **PSV-SGM-R01** Schedule cannot double-book governed critical equipment/crew beyond policy.
- **PSV-SGM-R02** Revision entitlement follows package limit; extra requires change/approval.
- **PSV-SGM-R03** Final media delivery only from approved revision.
- **PSV-SGM-R04** Client acceptance and vault access are audited.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`psv.sgm.booking.confirm` · `psv.sgm.shoot.schedule` · `psv.sgm.revision.submit` · `psv.sgm.revision.approve` · `psv.sgm.delivery.publish` · `psv.sgm.booking.archive`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: booking agreement, shot list, review/delivery record. Notifications: schedule, review ready, revision, delivery. KPIs/reports: conversion, turnaround, revisions, utilization. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.psv.sgm.booking_confirm` · `ind.psv.sgm.shoot_schedule` · `ind.psv.sgm.revision_submit` · `ind.psv.sgm.revision_approve` · `ind.psv.sgm.delivery_publish`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `psv.sgm.booking_confirm` · `psv.sgm.shoot_schedule` · `psv.sgm.revision_submit`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: CRM, Core Billing/Documents/storage; credentials use secret references.

### AI / experience / offline
AI: media AI may assist tagging/summaries where consent/policy allows; never publish final delivery autonomously; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/psv/sgm`. Mobile: crew schedule/capture metadata + client review. Desktop: editing/delivery control optional. Offline **READ_OFFLINE** — schedule/shot list cache; media transfer follows governed upload/storage, not generic queue.

### Configuration / entitlement / dependencies / audit
Configuration: packages, revision limits, storage/retention, equipment rules. Entitlement: suite + PSV-SGM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: PSV-CRM, Core Billing/Documents. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: booking→shoot→review→deliver. Negative: over-limit revision/unapproved delivery denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** media versions, acceptance and access are controlled.


## Fable 5 deterministic contract binding
The Professional Services MS sections above remain the canonical domain entity/module/permission/document/integration owners. The following remediation artifacts are **normative extensions of each listed MS**, not optional commentary:
- MS set: `PSV-CRM`, `PSV-PJM`, `PSV-SDM`, `PSV-RTM`, `PSV-SGM`.
- Deterministic per-MS tests: `DD-21_MS_ACCEPTANCE_TEST_CONTRACTS.md` → `<MS>-T001…T014`.
- Exact major workflow transitions/forbidden edges/reversal-cancellation: `DD-22_MS_WORKFLOW_TRANSITION_MATRICES.md`.
- Behavior-bearing field/catalog and exact context-index rules: `DD-23_BEHAVIORAL_CATALOGS_INDEX_CONTRACTS.md` + `DD-23A_BEHAVIOR_FIELD_REGISTRY.md`.
- Domain-critical product defaults: `DD-24_INDUSTRY_DOMAIN_RULE_DECISIONS.md` → PSV-AC-001…004.
- Mathematical KPIs + KPI acceptance IDs: `DD-25_KPI_CALCULATION_CATALOG.md`.
- Requirement-ID chains: `Registers/DD_REQUIREMENT_TRACEABILITY_F5.md`.
- 41-MS determinism evidence: `DD-27_41_MS_DETERMINISM_AUDIT.md`.

Where an earlier sentence in this file is less specific than a referenced remediation contract, the more specific remediation contract governs. None of these references permits cross-industry inheritance of business semantics.


## Canonical mobile-app mapping — Phase 3
All mobile capabilities in this Industry DD are routes/features inside the canonical `TENANT_STAFF_APP` and/or `TENANT_USER_APP` defined by DD-10/DD-11. Internal staff roles map to `TENANT_STAFF_APP`; external/customer/student/guest/citizen/donor/member/etc. roles map to `TENANT_USER_APP` where mobile scope exists. Role/persona labels never create separate mobile app classes or binaries. Platform Mobile is outside the Tenant app pair.
