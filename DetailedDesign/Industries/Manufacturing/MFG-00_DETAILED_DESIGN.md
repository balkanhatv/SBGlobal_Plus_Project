# Manufacturing — MANAGEMENT SYSTEM DETAILED DESIGN
**Wave:** 3 · **Status:** DETAILED DESIGN COMPLETE

## MFG-PMS — Production Management System
**Foundation owner:** F-13 §4.4 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Plan-to-produce execution across BOM/routing, work centers, production orders, WIP/output. Actors: Planner, Production Supervisor, Operator, QC, Stores. Modules: BOM/routing; work centers; production orders; operations; WIP; output.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| BomVersion / `mfg_pms_bom` | item_ref uuid, version_no int, effective_from timestamptz, state enum(DRAFT,APPROVED,ACTIVE,RETIRED), component_json jsonb | PK id; UNIQUE (tenant_id, industry_context_id,item_ref,version_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; manufacturing-genealogy policy |
| RoutingVersion / `mfg_pms_routing` | item_ref uuid, version_no int, operation_json jsonb, state enum(DRAFT,APPROVED,ACTIVE,RETIRED) | PK id; UNIQUE (tenant_id, industry_context_id,item_ref,version_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; manufacturing-genealogy policy |
| ProductionOrder / `mfg_pms_production_order` | order_no text, item_ref uuid, qty numeric, bom_version_id uuid, routing_version_id uuid, planned_start/end timestamptz, state enum(PLANNED,RELEASED,MATERIAL_ISSUED,IN_PROGRESS,QC,HOLD,COMPLETED,CLOSED,SCRAPPED) | PK id; UNIQUE (tenant_id, industry_context_id,order_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; manufacturing-genealogy policy |
| OperationExecution / `mfg_pms_operation_exec` | production_order_id uuid, sequence_no int, work_center_ref uuid, started_at timestamptz?, completed_at timestamptz?, good_qty numeric, scrap_qty numeric, state enum(PENDING,RUNNING,COMPLETED,HOLD) | PK id; UNIQUE (tenant_id, industry_context_id,production_order_id,sequence_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; manufacturing-genealogy policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**PLANNED → RELEASED → MATERIAL_ISSUED → IN_PROGRESS → QC → COMPLETED → CLOSED**. HOLD/SCRAPPED are controlled branches; release freezes active BOM/routing references unless approved change order. Any undeclared transition returns `MFG-PMS_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **MFG-PMS-R01** Release requires active BOM and routing.
- **MFG-PMS-R02** Post-release BOM/routing change requires change-order approval.
- **MFG-PMS-R03** Lot/serial genealogy must trace consumed materials to output.
- **MFG-PMS-R04** Completion cannot exceed governed material/output reconciliation without exception approval.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`mfg.pms.order.plan` · `mfg.pms.order.release` · `mfg.pms.operation.start` · `mfg.pms.operation.complete` · `mfg.pms.change.approve` · `mfg.pms.order.close`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: production order, job card, completion/scrap record. Notifications: release, hold, operation delay, completion. KPIs/reports: OEE, yield, scrap, schedule adherence. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.mfg.pms.order_plan` · `ind.mfg.pms.order_release` · `ind.mfg.pms.operation_start` · `ind.mfg.pms.operation_complete` · `ind.mfg.pms.change_approve`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `mfg.pms.order_plan` · `mfg.pms.order_release` · `mfg.pms.operation_start`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: IWM material issue/FG receipt, QMS gates, MMS downtime; credentials use secret references.

### AI / experience / offline
AI: production agent may explain schedule/variance and suggest optimization; cannot release/change BOM or close order autonomously; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/mfg/pms`. Mobile: shop-floor execution/scanning. Desktop: plant control optional. Offline **CONTROLLED_OFFLINE_MUTATION** — operation progress may queue; material/regulated close revalidates live versions.

### Configuration / entitlement / dependencies / audit
Configuration: numbering, work centers, order policies, tolerance. Entitlement: suite + MFG-PMS + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: MFG-IWM/QMS/MMS. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: plan→release→execute→QC→complete. Negative: release without active BOM/routing rejected. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** order genealogy and operation evidence are complete/auditable.

---

## MFG-IWM — Inventory & Warehouse Management System
**Foundation owner:** F-13 §2.3 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Industrial materials receipts, QC-gated stock, reservations/issues, lot genealogy and counts. Actors: Store/Warehouse Keeper, Production Supervisor, QC Inspector, Procurement Officer. Modules: warehouse/bin; GRN; putaway; reservation; issue; FG receipt; lot/serial; count; transfer.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| MaterialBalance / `mfg_iwm_balance` | location_ref uuid, item_ref uuid, lot_serial_ref text?, on_hand numeric, reserved numeric, quality_state enum(AVAILABLE,HOLD,REJECTED), version bigint | PK id; UNIQUE (tenant_id, industry_context_id,location_ref,item_ref,lot_serial_ref); INDEX (tenant_id, industry_context_id, location_ref) | CONFIDENTIAL; inventory/genealogy policy |
| MaterialMovement / `mfg_iwm_movement` | movement_no text, type enum(GRN,PUTAWAY,RESERVE,ISSUE,RETURN,FG_RECEIPT,TRANSFER,ADJUST,SCRAP), item_ref uuid, qty numeric, lot_serial_ref text?, source_ref text | PK id; append-only; UNIQUE (tenant_id, industry_context_id,movement_no); INDEX (tenant_id, industry_context_id, item_ref) | CONFIDENTIAL; inventory/genealogy policy |
| ProductionReservation / `mfg_iwm_reservation` | production_order_ref uuid, item_ref uuid, qty numeric, lot_serial_ref text?, state enum(HELD,ISSUED,RELEASED) | PK id; INDEX (tenant_id, industry_context_id, production_order_ref, state); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; inventory/genealogy policy |
| CycleCount / `mfg_iwm_cycle_count` | count_no text, location_ref uuid, state enum(PLANNED,COUNTED,REVIEW,APPROVED,ADJUSTED), variance_json jsonb | PK id; UNIQUE (tenant_id, industry_context_id,count_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; inventory/genealogy policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**GRN → QC_GATE → PUTAWAY → AVAILABLE → RESERVED → ISSUED**. QC Hold blocks issue/transfer/dispatch; count variances need approval before adjustment. Any undeclared transition returns `MFG-IWM_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **MFG-IWM-R01** Issues only against released production orders and reserved QC-cleared stock.
- **MFG-IWM-R02** QC-Hold stock cannot be consumed/transferred.
- **MFG-IWM-R03** Lot/serial identity captured on every movement.
- **MFG-IWM-R04** Negative stock prohibited; corrections via approved adjustment.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`mfg.iwm.receipt.record` · `mfg.iwm.stock.putaway` · `mfg.iwm.stock.reserve` · `mfg.iwm.stock.issue` · `mfg.iwm.count.approve` · `mfg.iwm.adjustment.post`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: GRN, issue slip, transfer, count sheet. Notifications: QC hold, low stock, count variance. KPIs/reports: accuracy, turns, released-order stockouts, dead stock. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.mfg.iwm.receipt_record` · `ind.mfg.iwm.stock_putaway` · `ind.mfg.iwm.stock_reserve` · `ind.mfg.iwm.stock_issue` · `ind.mfg.iwm.count_approve`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `mfg.iwm.receipt_record` · `mfg.iwm.stock_putaway` · `mfg.iwm.stock_reserve`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: PMS/QMS/PRO service contracts; credentials use secret references.

### AI / experience / offline
AI: warehouse agent may optimize putaway/pick/reorder; cannot post adjustment or release hold; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/mfg/iwm`. Mobile: offline-capable scan/count/issue capture. Desktop: warehouse optional. Offline **CONTROLLED_OFFLINE_MUTATION** — scan/count can queue; issue/adjust requires server version/QC validation.

### Configuration / entitlement / dependencies / audit
Configuration: warehouses/bins, lot profiles, count/reorder rules. Entitlement: suite + MFG-IWM + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: MFG-PMS/QMS/PRO. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: GRN→QC→putaway→reserve→issue. Negative: hold/negative/unapproved adjustment rejected. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** material genealogy has no ownership or lot gaps.

---

## MFG-QMS — Quality Management System
**Foundation owner:** F-13 §4.4 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Inspection, quality hold, non-conformance and CAPA governance. Actors: QC Inspector, Quality Manager, Production/Procurement roles. Modules: inspection plans; samples/lots; results; holds; NCR; CAPA; disposition.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| InspectionPlan / `mfg_qms_inspection_plan` | code text, item_or_process_ref text, version int, characteristic_json jsonb, state enum(DRAFT,APPROVED,ACTIVE,RETIRED) | PK id; UNIQUE (tenant_id, industry_context_id,code,version); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/REGULATED; quality-record policy |
| Inspection / `mfg_qms_inspection` | source_type text, source_ref uuid, plan_id uuid, lot_ref text?, state enum(PLANNED,IN_PROGRESS,PASS,FAIL,DEVIATION,HOLD,DISPOSED), inspector_id uuid | PK id; INDEX (tenant_id, industry_context_id, source_ref, state); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/REGULATED; quality-record policy |
| NonConformance / `mfg_qms_ncr` | ncr_no text, inspection_id uuid, defect_code text, severity_code text, disposition enum(REWORK,ACCEPT_DEVIATION,SCRAP,PENDING), state enum(OPEN,REVIEW,APPROVED,CLOSED) | PK id; UNIQUE (tenant_id, industry_context_id,ncr_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/REGULATED; quality-record policy |
| Capa / `mfg_qms_capa` | ncr_id uuid, cause text, corrective_action text, preventive_action text?, owner_id uuid, due_at timestamptz, state enum(OPEN,IMPLEMENTED,VERIFIED,CLOSED) | PK id; INDEX (tenant_id, industry_context_id, owner_id, state); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/REGULATED; quality-record policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**PLANNED → IN_PROGRESS → PASS_OR_FAIL → NCR → DISPOSITION → CLOSED**. Failed inspection places source lot/material in HOLD until approved disposition; CAPA verification precedes closure. Any undeclared transition returns `MFG-QMS_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **MFG-QMS-R01** Failed lot remains unusable until disposition.
- **MFG-QMS-R02** Accept-with-deviation requires authorized approval and reason.
- **MFG-QMS-R03** Inspection result is immutable after approval except versioned correction.
- **MFG-QMS-R04** CAPA cannot close before effectiveness verification.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`mfg.qms.plan.manage` · `mfg.qms.inspection.record` · `mfg.qms.inspection.approve` · `mfg.qms.ncr.disposition` · `mfg.qms.capa.verify` · `mfg.qms.hold.release`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: inspection report, NCR, CAPA, quality certificate. Notifications: failure/hold, CAPA due/escalation. KPIs/reports: defect rate, first-pass yield, CAPA aging. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.mfg.qms.plan_manage` · `ind.mfg.qms.inspection_record` · `ind.mfg.qms.inspection_approve` · `ind.mfg.qms.ncr_disposition` · `ind.mfg.qms.capa_verify`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `mfg.qms.plan_manage` · `mfg.qms.inspection_record` · `mfg.qms.inspection_approve`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: gates PMS/PRO/IWM; credentials use secret references.

### AI / experience / offline
AI: quality agent may summarize trends/anomalies; cannot release hold/disposition autonomously; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/mfg/qms`. Mobile: inspector tablet/mobile. Desktop: quality lab optional. Offline **CONTROLLED_OFFLINE_MUTATION** — measurement capture can queue; disposition/release is online/current.

### Configuration / entitlement / dependencies / audit
Configuration: plans, tolerances, defect codes, approval chains. Entitlement: suite + MFG-QMS + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: MFG-PMS/IWM/PRO. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: inspect→fail→NCR→CAPA→verify. Negative: consume held lot/release without approval denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** quality decisions and genealogy remain traceable.

---

## MFG-PRO — Procurement Management System
**Foundation owner:** F-13 §4.4 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Purchase requisition through approval, sourcing, PO, GRN and invoice match. Actors: Procurement Officer, Approver, Store, QC, Finance. Modules: vendors; PR; RFQ; quote compare; PO; GRN; match.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| PurchaseRequisition / `mfg_pro_pr` | pr_no text, requester_id uuid, need_by date?, total_estimate_minor bigint?, state enum(DRAFT,SUBMITTED,APPROVED,REJECTED,SOURCING,PO_CREATED,CLOSED) | PK id; UNIQUE (tenant_id, industry_context_id,pr_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; procurement-financial policy |
| PurchaseOrder / `mfg_pro_po` | po_no text, vendor_ref uuid, currency char(3), total_minor bigint, approval_ref uuid?, state enum(DRAFT,APPROVED,ISSUED,PART_RECEIVED,RECEIVED,CLOSED,CANCELLED) | PK id; UNIQUE (tenant_id, industry_context_id,po_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; procurement-financial policy |
| GoodsReceipt / `mfg_pro_grn` | grn_no text, po_id uuid, received_at timestamptz, receiver_id uuid, quality_gate_state enum(PENDING,PASS,FAIL,HOLD), state enum(DRAFT,POSTED,REVERSED) | PK id; UNIQUE (tenant_id, industry_context_id,grn_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; procurement-financial policy |
| InvoiceMatch / `mfg_pro_match` | po_id uuid, grn_id uuid, supplier_invoice_ref text, amount_minor bigint, variance_minor bigint, state enum(PENDING,MATCHED,EXCEPTION,APPROVED) | PK id; INDEX (tenant_id, industry_context_id, po_id, state); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; procurement-financial policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**DRAFT → SUBMITTED → APPROVED → SOURCING → PO_CREATED → RECEIVED → MATCHED → CLOSED**. Approval threshold gates PR/PO; receipt passes QMS before available stock; match exceptions require approval. Any undeclared transition returns `MFG-PRO_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **MFG-PRO-R01** Reorder trigger may create PR but cannot auto-approve.
- **MFG-PRO-R02** PO issue requires approved commercial/vendor terms.
- **MFG-PRO-R03** Received stock is unavailable until required quality gate passes.
- **MFG-PRO-R04** 3-way match exception above threshold needs Finance approval.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`mfg.pro.pr.submit` · `mfg.pro.pr.approve` · `mfg.pro.po.issue` · `mfg.pro.grn.post` · `mfg.pro.match.approve` · `mfg.pro.vendor.manage`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: RFQ, quote comparison, PO, GRN, match record. Notifications: approval, vendor issue, receipt, variance. KPIs/reports: PO cycle, supplier performance, price variance. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.mfg.pro.pr_submit` · `ind.mfg.pro.pr_approve` · `ind.mfg.pro.po_issue` · `ind.mfg.pro.grn_post` · `ind.mfg.pro.match_approve`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `mfg.pro.pr_submit` · `mfg.pro.pr_approve` · `mfg.pro.po_issue`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: IWM receipts, QMS quality, Billing/AP adapter; credentials use secret references.

### AI / experience / offline
AI: procurement assistant may compare quotes/suggest vendors; cannot approve PR/PO/match; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/mfg/pro`. Mobile: approval + receiving. Desktop: procurement optional. Offline **READ_OFFLINE** — PO/GRN/match postings require current server state.

### Configuration / entitlement / dependencies / audit
Configuration: approval thresholds, vendor rules, sourcing policies. Entitlement: suite + MFG-PRO + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: MFG-IWM/QMS, Core Billing/Workflow. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: PR→PO→GRN→match. Negative: unapproved PO and failed-QC availability denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** procurement approvals and receipt/match lineage auditable.

---

## MFG-MMS — Maintenance Management System
**Foundation owner:** F-13 §4.4 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Preventive and breakdown asset maintenance with work orders, spares and downtime. Actors: Maintenance Engineer, Supervisor, Operator requester. Modules: assets; preventive schedule; breakdown ticket; work order; spare use; downtime.

### Entity design
Every table below carries `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, immutable ownership, `row_version bigint`, audit timestamps/actors and `is_demo boolean default false`.

| Entity / storage | Domain fields | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Asset / `mfg_mms_asset` | asset_code text, category text, location_ref uuid, criticality text, state enum(ACTIVE,DOWN,MAINTENANCE,RETIRED) | PK id; UNIQUE (tenant_id, industry_context_id,asset_code); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; asset-maintenance policy |
| MaintenanceSchedule / `mfg_mms_schedule` | asset_id uuid, maintenance_type text, recurrence_rule text, next_due_at timestamptz, state enum(ACTIVE,PAUSED,RETIRED) | PK id; INDEX (tenant_id, industry_context_id, next_due_at, state); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; asset-maintenance policy |
| WorkOrder / `mfg_mms_work_order` | wo_no text, asset_id uuid, source enum(PREVENTIVE,BREAKDOWN), priority_code text, assigned_to uuid?, state enum(OPEN,ASSIGNED,IN_PROGRESS,WAITING_PARTS,VERIFICATION,CLOSED,CANCELLED) | PK id; UNIQUE (tenant_id, industry_context_id,wo_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; asset-maintenance policy |
| DowntimeRecord / `mfg_mms_downtime` | asset_id uuid, work_order_id uuid?, started_at timestamptz, ended_at timestamptz?, cause_code text?, production_order_ref uuid? | PK id; no overlapping active record per asset; INDEX (tenant_id, industry_context_id, asset_id) | CONFIDENTIAL; asset-maintenance policy |

Relationships are same-context FK or service/projection references. Direct sibling-MS table reads are prohibited.

### Workflow
**OPEN → ASSIGNED → IN_PROGRESS → VERIFICATION → CLOSED**. Preventive schedules generate work orders; breakdown records downtime; verifier required before close. Any undeclared transition returns `MFG-MMS_STATE_INVALID`; transition commands carry expected version, actor, permission, correlation and reason for exception branches.

### Business rules / approvals
- **MFG-MMS-R01** Critical asset breakdown escalates by priority policy.
- **MFG-MMS-R02** Closure requires completion evidence and authorized verification.
- **MFG-MMS-R03** Spare consumption posts through IWM, never local stock table.
- **MFG-MMS-R04** Downtime linkage to production remains immutable after verification.
Core Workflow owns approval tasks; approver permission/context is revalidated.

### Permissions / ABAC
`mfg.mms.ticket.raise` · `mfg.mms.workorder.assign` · `mfg.mms.workorder.execute` · `mfg.mms.workorder.verify` · `mfg.mms.schedule.manage` · `mfg.mms.asset.retire`. ABAC may narrow by site/plant/project/jurisdiction/resource/state/sensitivity/time/device but cannot widen RBAC.

### Documents / notifications / analytics
Documents: work order, service report, verification record. Notifications: PM due, breakdown, parts wait, overdue. KPIs/reports: MTBF, MTTR, downtime, preventive compliance. DD-08/15 own storage/audit/report export mechanics.

### APIs / events / integrations
tRPC: `ind.mfg.mms.ticket_raise` · `ind.mfg.mms.workorder_assign` · `ind.mfg.mms.workorder_execute` · `ind.mfg.mms.workorder_verify` · `ind.mfg.mms.schedule_manage`. REST only for true external interoperability; both use one DD-06 OperationContract.  
Events v1: `mfg.mms.ticket_raise` · `mfg.mms.workorder_assign` · `mfg.mms.workorder_execute`; DD-07 envelope always includes Tenant+Industry Context.  
Integrations: PMS downtime, IWM spare consumption; credentials use secret references.

### AI / experience / offline
AI: maintenance assistant may diagnose/suggest parts from authorized history; cannot verify/close; all tools bind OperationContracts, acting-user permission and approvals.  
Web route root `/app/mfg/mms`. Mobile: technician work orders/offline notes. Desktop: maintenance desk optional. Offline **CONTROLLED_OFFLINE_MUTATION** — technician notes/status can queue; close/spare issue revalidate.

### Configuration / entitlement / dependencies / audit
Configuration: schedules, priorities, SLA/escalation. Entitlement: suite + MFG-MMS + feature/add-on/usage facts via DD-04; no plan-name branching. Dependencies: MFG-PMS/IWM. All state/approval/regulated/financial/export/cross-module actions produce DD-15 audit evidence.

### Tests / acceptance
Positive: schedule/breakdown→WO→verify→close. Negative: close without verification denied. Wrong Tenant and same-Tenant wrong Industry Context deny with no effect/existence leak. Disabled entitlement denies. Wrong-context event/document/AI access denies.  
**Acceptance:** asset downtime and maintenance evidence consistent.
