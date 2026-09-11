# RETAIL & COMMERCE — MANAGEMENT SYSTEM DETAILED DESIGN
**Wave:** 3 · **Status:** DETAILED DESIGN COMPLETE

## RTL-RSM — Retail Store Management System
**Foundation owner:** F-13 §2.2 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Store-day, staff shifts, cash control and in-store execution backbone. Actors: Store Manager, Cashier, Floor Staff, Retail Admin. Modules: store/counters; shifts; opening/closing; floats/pickups; price execution; stocktake; service desk.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| StoreDay / `rtl_rsm_store_day` | store_ref uuid, business_date date, state enum(PLANNED,OPENING,TRADING,CLOSING,RECONCILIATION,CLOSED), opened_by uuid?, closed_by uuid? | PK id; UNIQUE (tenant_id, industry_context_id,store_ref,business_date); INDEX (tenant_id, industry_context_id, state, updated_at) | FINANCIAL/CONFIDENTIAL; financial-audit policy |
| CashMovement / `rtl_rsm_cash_movement` | store_day_id uuid, movement_type enum(FLOAT,PICKUP,BANKING,VARIANCE), amount_minor bigint, currency char(3), reason_code text?, actor_id uuid | PK id; CHECK amount_minor>=0; INDEX (tenant_id, industry_context_id, store_day_id) | FINANCIAL/CONFIDENTIAL; financial-audit policy |
| CounterShift / `rtl_rsm_counter_shift` | store_day_id uuid, counter_code text, principal_id uuid, started_at timestamptz, ended_at timestamptz?, state enum(PLANNED,OPEN,CLOSED,RECONCILED) | PK id; INDEX (tenant_id, industry_context_id, store_day_id, state); PARTIAL INDEX (tenant_id, industry_context_id, state) WHERE state NOT IN ('CLOSED','CANCELLED','RETIRED','EXPIRED','REVOKED','COMPLETED') | INTERNAL/CONFIDENTIAL; policy retention |
| StoreChecklistEntry / `rtl_rsm_checklist` | store_day_id uuid, checklist_code text, item_code text, state enum(PENDING,DONE,EXCEPTION), completed_by uuid?, note text? | append-only where history/evidence; UNIQUE (tenant_id, industry_context_id,store_day_id,checklist_code,item_code) | FINANCIAL/CONFIDENTIAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **PLANNED → OPENING → TRADING → CLOSING → RECONCILIATION → CLOSED**.  
Invalid transition: any transition not in the MS transition table is rejected with `RTL-RSM_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. Variance branch becomes REVIEW/APPROVED/INVESTIGATED before day close when threshold exceeded.

### Business rules / approvals
- **RTL-RSM-R01** Day closes only when all POS sessions reconciled.
- **RTL-RSM-R02** Price changes use approved effective price-list version.
- **RTL-RSM-R03** Every float/pickup/variance is append-only evidence.
- **RTL-RSM-R04** Stock adjustments require approval and reason.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`rtl.rsm.day.open` · `rtl.rsm.day.close` · `rtl.rsm.cash.record` · `rtl.rsm.variance.approve` · `rtl.rsm.price.execute` · `rtl.rsm.stocktake.post`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: opening/closing checklist, cash reconciliation, stocktake record. All use DD-08 DocumentMeta.  
Notifications: variance, missing reconciliation, checklist exception; sensitive payloads use generic push preview.  
Reports/KPIs: sales/store, cash variance, shrinkage, checklist compliance; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.rtl.rsm.day_open` · `ind.rtl.rsm.day_close` · `ind.rtl.rsm.cash_record` · `ind.rtl.rsm.variance_approve` · `ind.rtl.rsm.price_execute`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `rtl.rsm.day_open` · `rtl.rsm.day_close` · `rtl.rsm.cash_record`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: POS sessions, IWM counts, OMS returns; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: may summarize exceptions; cannot approve cash variance. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/rtl/rsm` list/detail/workflow/report views. Mobile: manager checklist/approval. Desktop: store control/POS-adjacent.  
Offline class: **CONTROLLED_OFFLINE_MUTATION**. Checklists may queue; cash close/adjustments require server reconciliation.

### Configuration / entitlement / dependencies / audit
Configuration: store hours, counters, variance thresholds, checklists. Security floors cannot be overridden.  
Entitlement: suite license + `RTL-RSM` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: RTL-POS/IWM/OMS. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: open→trade→reconcile→close. Negative: unreconciled session/variance threshold blocks close. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** store day/cash evidence is immutable and auditable.

---

## RTL-POS — Point of Sale Management System
**Foundation owner:** F-13 §4.2 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** In-store checkout/session, pricing/tax, tender, receipt and reconciliation. Actors: Store Manager, Cashier, Retail Admin. Modules: register/session; cart; pricing/tax; tender; receipt; void/refund; reconciliation; offline.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| PosSession / `rtl_pos_session` | store_day_ref uuid, counter_code text, cashier_id uuid, opening_float_minor bigint, state enum(OPEN,LOCKED,CLOSING,CLOSED,RECONCILED) | PK id; one OPEN per counter/cashier policy; INDEX (tenant_id, industry_context_id, state, updated_at) | FINANCIAL/CONFIDENTIAL; financial-audit policy |
| Sale / `rtl_pos_sale` | session_id uuid, sale_no text, customer_ref uuid?, total_minor bigint, tax_minor bigint, currency char(3), state enum(DRAFT,TENDERING,PAID,VOIDED,REFUNDED_PARTIAL,REFUNDED_FULL) | PK id; UNIQUE (tenant_id, industry_context_id,sale_no); INDEX (tenant_id, industry_context_id, session_id) | FINANCIAL/CONFIDENTIAL; financial-audit policy |
| SaleLine / `rtl_pos_sale_line` | sale_id uuid, product_ref uuid, variant_ref uuid?, qty numeric, unit_price_minor bigint, tax_minor bigint, discount_minor bigint, price_list_version text | PK id; CHECK qty>0; immutable price facts after payment; PARTIAL INDEX (tenant_id, industry_context_id, updated_at) WHERE deleted_at IS NULL | INTERNAL/CONFIDENTIAL; policy retention |
| Tender / `rtl_pos_tender` | sale_id uuid, tender_type text, amount_minor bigint, external_payment_ref text?, state enum(PENDING,AUTHORIZED,CAPTURED,FAILED,REVERSED) | append-only where history/evidence; INDEX (tenant_id, industry_context_id, sale_id, state) | FINANCIAL/CONFIDENTIAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **OPEN_SESSION → DRAFT → TENDERING → PAID → RECEIPT → RECONCILED**.  
Invalid transition: any transition not in the MS transition table is rejected with `RTL-POS_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. Void/refund are governed reversal branches; sale line price/tax facts freeze at payment.

### Business rules / approvals
- **RTL-POS-R01** Price/tax resolve from active price list and freeze on line.
- **RTL-POS-R02** Refund above configured threshold requires approval.
- **RTL-POS-R03** Payment failure cannot create paid sale/stock issue.
- **RTL-POS-R04** Offline replay uses idempotency and current context; no duplicate stock/payment effect.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`rtl.pos.session.open` · `rtl.pos.sale.create` · `rtl.pos.sale.tender` · `rtl.pos.refund.request` · `rtl.pos.refund.approve` · `rtl.pos.session.reconcile`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: receipt, refund/void record, reconciliation. All use DD-08 DocumentMeta.  
Notifications: payment/refund exceptions, variance; sensitive payloads use generic push preview.  
Reports/KPIs: sales, basket value, tender mix, refund/void rate; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.rtl.pos.session_open` · `ind.rtl.pos.sale_create` · `ind.rtl.pos.sale_tender` · `ind.rtl.pos.refund_request` · `ind.rtl.pos.refund_approve`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `rtl.pos.session_open` · `rtl.pos.sale_create` · `rtl.pos.sale_tender`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: PaymentPort, IWM stock, OMS returns; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: may suggest products/analyze basket; never alter price/tax or approve refund. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/rtl/pos` list/detail/workflow/report views. Mobile: limited handheld POS if enabled. Desktop: primary POS candidate with printer/barcode.  
Offline class: **OFFLINE_OPERATIONAL_CRITICAL**. Sales may queue only with approved offline tender/stock policy; conflict financial/stock regulated, no LWW.

### Configuration / entitlement / dependencies / audit
Configuration: tenders, receipt format, refund threshold, offline capability. Security floors cannot be overridden.  
Entitlement: suite license + `RTL-POS` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: RTL-RSM/IWM/OMS, Core Billing. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: session→sale→tender→receipt→reconcile. Negative: duplicate idempotency/payment or unauthorized refund denied. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** offline/online sale produces exactly-once governed financial/stock outcomes.

---

## RTL-IWM — Inventory & Warehouse Management System
**Foundation owner:** F-13 §4.2 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Retail inventory/warehouse stock, reservations, transfers, counts and fulfillment. Actors: Warehouse Manager, Operator, Store Manager, Procurement role. Modules: warehouse/bin; receipt; putaway; reservation; picking; transfer; count; adjustment.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| StockBalance / `rtl_iwm_stock_balance` | location_ref uuid, product_ref uuid, variant_ref uuid?, on_hand numeric, reserved numeric, available numeric, version bigint | PK id; UNIQUE (tenant_id, industry_context_id,location_ref,product_ref,variant_ref); CHECK nonnegative; INDEX (tenant_id, industry_context_id, status, updated_at) | CONFIDENTIAL; inventory-ledger policy |
| StockMovement / `rtl_iwm_stock_movement` | movement_no text, type enum(RECEIPT,PUTAWAY,RESERVE,RELEASE,PICK,SHIP,TRANSFER,ADJUST), product_ref uuid, qty numeric, from_location uuid?, to_location uuid?, source_ref text | PK id; append-only; UNIQUE (tenant_id, industry_context_id,movement_no); INDEX (tenant_id, industry_context_id, product_ref) | CONFIDENTIAL; inventory-ledger policy |
| Reservation / `rtl_iwm_reservation` | order_ref uuid, product_ref uuid, qty numeric, state enum(HELD,COMMITTED,RELEASED,EXPIRED), expires_at timestamptz? | PK id; INDEX (tenant_id, industry_context_id, order_ref, state); PARTIAL INDEX (tenant_id, industry_context_id, state) WHERE state NOT IN ('CLOSED','CANCELLED','RETIRED','EXPIRED','REVOKED','COMPLETED') | INTERNAL/CONFIDENTIAL; policy retention |
| CycleCount / `rtl_iwm_cycle_count` | location_ref uuid, count_no text, state enum(PLANNED,COUNTING,REVIEW,APPROVED,POSTED), variance_json jsonb | append-only where history/evidence; UNIQUE (tenant_id, industry_context_id,count_no) | CONFIDENTIAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **RECEIPT → PUTAWAY → AVAILABLE → RESERVED → PICKED → MOVED**.  
Invalid transition: any transition not in the MS transition table is rejected with `RTL-IWM_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. Counts use PLANNED→COUNTING→REVIEW→APPROVED→POSTED; reservations commit/release atomically.

### Business rules / approvals
- **RTL-IWM-R01** Order reservation atomically reduces availability; failure/timeout releases.
- **RTL-IWM-R02** Negative availability/stock prohibited.
- **RTL-IWM-R03** Adjustments require approval/reason.
- **RTL-IWM-R04** Cross-location transfer posts paired movements.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`rtl.iwm.stock.receive` · `rtl.iwm.stock.reserve` · `rtl.iwm.stock.pick` · `rtl.iwm.transfer.execute` · `rtl.iwm.count.approve` · `rtl.iwm.adjustment.post`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: GRN, transfer, pick list, count sheet. All use DD-08 DocumentMeta.  
Notifications: low stock, variance, reservation expiry; sensitive payloads use generic push preview.  
Reports/KPIs: turnover, fill rate, inventory accuracy, stockout; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.rtl.iwm.stock_receive` · `ind.rtl.iwm.stock_reserve` · `ind.rtl.iwm.stock_pick` · `ind.rtl.iwm.transfer_execute` · `ind.rtl.iwm.count_approve`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `rtl.iwm.stock_receive` · `rtl.iwm.stock_reserve` · `rtl.iwm.stock_pick`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: OMS allocation, POS sales, courier/order projections; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: inventory assistant may forecast/recommend replenishment; cannot post adjustments. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/rtl/iwm` list/detail/workflow/report views. Mobile: warehouse scan/pick/count. Desktop: warehouse optional.  
Offline class: **CONTROLLED_OFFLINE_MUTATION**. Scanning/count collection may queue; stock postings revalidate version/reservation.

### Configuration / entitlement / dependencies / audit
Configuration: warehouses/bins, reorder, count rules. Security floors cannot be overridden.  
Entitlement: suite license + `RTL-IWM` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: RTL-OMS/POS. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: receive→reserve→pick→ship. Negative: negative stock and unapproved adjustment rejected. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** ledger remains exact under concurrency/context isolation.

---

## RTL-OMS — Order Management System
**Foundation owner:** F-13 §4.2 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Omnichannel order lifecycle, allocation, fulfillment, delivery, return and refund. Actors: Order/Customer Service Staff, Warehouse Staff, Customer. Modules: order; payment; allocation; fulfillment; shipment; cancellation; return/refund.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Order / `rtl_oms_order` | order_no text, customer_ref uuid?, channel text, currency char(3), total_minor bigint, state enum(PLACED,PAYMENT_PENDING,PAID,ALLOCATED,PICKED,PACKED,SHIPPED,DELIVERED,CLOSED,CANCELLED) | PK id; UNIQUE (tenant_id, industry_context_id,order_no); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; commerce-record policy |
| OrderLine / `rtl_oms_order_line` | order_id uuid, product_ref uuid, qty numeric, price_minor bigint, tax_minor bigint, discount_minor bigint, price_version text, fulfillment_state text | PK id; price immutable after placement; INDEX (tenant_id, industry_context_id, order_id) | CONFIDENTIAL; commerce-record policy |
| Shipment / `rtl_oms_shipment` | order_id uuid, shipment_no text, courier_integration_id uuid?, tracking_ref text?, state enum(PLANNED,DISPATCHED,IN_TRANSIT,DELIVERED,FAILED,RETURNED) | PK id; UNIQUE (tenant_id, industry_context_id,shipment_no); PARTIAL INDEX (tenant_id, industry_context_id, state) WHERE state NOT IN ('CLOSED','CANCELLED','RETIRED','EXPIRED','REVOKED','COMPLETED') | INTERNAL/CONFIDENTIAL; policy retention |
| ReturnCase / `rtl_oms_return_case` | order_id uuid, line_ref uuid?, reason_code text, requested_at timestamptz, state enum(REQUESTED,APPROVED,RECEIVED,INSPECTED,REFUND_APPROVED,REFUNDED,REJECTED) | append-only where history/evidence; INDEX (tenant_id, industry_context_id, order_id, state) | CONFIDENTIAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **PLACED → PAID → ALLOCATED → PICKED → PACKED → SHIPPED → DELIVERED → CLOSED**.  
Invalid transition: any transition not in the MS transition table is rejected with `RTL-OMS_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. Cancel and return/refund are explicit branches; payment/stock side effects are idempotent.

### Business rules / approvals
- **RTL-OMS-R01** Placement reserves stock through IWM.
- **RTL-OMS-R02** Refund above threshold requires approval.
- **RTL-OMS-R03** Order line price/tax is immutable after placement.
- **RTL-OMS-R04** Return accepted only within configured category window unless approved exception.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`rtl.oms.order.place` · `rtl.oms.order.allocate` · `rtl.oms.shipment.dispatch` · `rtl.oms.return.approve` · `rtl.oms.refund.approve` · `rtl.oms.order.cancel`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: invoice, packing slip, delivery/return/refund records. All use DD-08 DocumentMeta.  
Notifications: order/payment/shipping/delivery/return; sensitive payloads use generic push preview.  
Reports/KPIs: AOV, fulfillment time, delivery %, return rate; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.rtl.oms.order_place` · `ind.rtl.oms.order_allocate` · `ind.rtl.oms.shipment_dispatch` · `ind.rtl.oms.return_approve` · `ind.rtl.oms.refund_approve`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `rtl.oms.order_place` · `rtl.oms.order_allocate` · `rtl.oms.shipment_dispatch`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: PaymentPort, couriers, IWM, marketplace; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: support agent may summarize/order-query and propose resolution; refund/cancel tools require permission/approval. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/rtl/oms` list/detail/workflow/report views. Mobile: customer order tracking + staff fulfillment. Desktop: fulfillment optional.  
Offline class: **READ_OFFLINE**. Picking lists may cache; fulfillment mutations controlled/online by default.

### Configuration / entitlement / dependencies / audit
Configuration: return windows, channels, courier/payment profiles. Security floors cannot be overridden.  
Entitlement: suite license + `RTL-OMS` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: RTL-IWM/MKT, Core Billing. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: place→deliver and return→refund. Negative: return outside window/unauthorized refund denied. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** order state, stock/payment effects and customer docs remain consistent.

---

## RTL-MKT — Marketplace Management System
**Foundation owner:** F-13 §4.2 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Seller onboarding, listings, routed orders, commissions and settlements. Actors: Marketplace Admin, Seller, Finance/Settlement Staff. Modules: seller/KYC status; listings; commission; order routing; statements/settlements.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Seller / `rtl_mkt_seller` | seller_code text, principal_or_org_ref uuid?, kyc_status enum(PENDING,VERIFIED,REJECTED), state enum(APPLIED,REVIEW,APPROVED,SUSPENDED,REVOKED) | PK id; UNIQUE (tenant_id, industry_context_id,seller_code); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL/FINANCIAL; marketplace-financial policy |
| Listing / `rtl_mkt_listing` | seller_id uuid, product_ref uuid, seller_sku text, price_minor bigint, currency char(3), state enum(DRAFT,REVIEW,ACTIVE,PAUSED,REJECTED) | PK id; UNIQUE (tenant_id, industry_context_id,seller_id,seller_sku); INDEX (tenant_id, industry_context_id, seller_id) | CONFIDENTIAL/FINANCIAL; marketplace-financial policy |
| SellerOrder / `rtl_mkt_seller_order` | seller_id uuid, oms_order_ref uuid, gross_minor bigint, commission_minor bigint, net_minor bigint, state enum(ROUTED,ACCEPTED,FULFILLED,RETURNED,SETTLED) | PK id; UNIQUE (tenant_id, industry_context_id,seller_id,oms_order_ref); PARTIAL INDEX (tenant_id, industry_context_id, state) WHERE state NOT IN ('CLOSED','CANCELLED','RETIRED','EXPIRED','REVOKED','COMPLETED') | INTERNAL/CONFIDENTIAL; policy retention |
| Settlement / `rtl_mkt_settlement` | seller_id uuid, period_key text, gross_minor bigint, commission_minor bigint, adjustments_minor bigint, payable_minor bigint, state enum(DRAFT,APPROVED,PAID,REVERSED) | append-only where history/evidence; UNIQUE (tenant_id, industry_context_id,seller_id,period_key) | CONFIDENTIAL/FINANCIAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **APPLIED → REVIEW → APPROVED → LISTING_ACTIVE → ORDER_ROUTED → SETTLED**.  
Invalid transition: any transition not in the MS transition table is rejected with `RTL-MKT_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. KYC/approval gates seller activation; settlement consumes fulfilled/order financial projections.

### Business rules / approvals
- **RTL-MKT-R01** Unapproved seller/listing cannot receive routed orders.
- **RTL-MKT-R02** Commission derives from active profile/version.
- **RTL-MKT-R03** Settlement approval precedes payment/export.
- **RTL-MKT-R04** Suspension stops new routing without deleting history.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`rtl.mkt.seller.review` · `rtl.mkt.seller.approve` · `rtl.mkt.listing.approve` · `rtl.mkt.order.route` · `rtl.mkt.settlement.approve` · `rtl.mkt.seller.suspend`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: seller agreement, KYC status docs, settlement statement. All use DD-08 DocumentMeta.  
Notifications: onboarding, listing review, routed order, settlement; sensitive payloads use generic push preview.  
Reports/KPIs: active sellers, GMV, commission, settlement TAT; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.rtl.mkt.seller_review` · `ind.rtl.mkt.seller_approve` · `ind.rtl.mkt.listing_approve` · `ind.rtl.mkt.order_route` · `ind.rtl.mkt.settlement_approve`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `rtl.mkt.seller_review` · `rtl.mkt.seller_approve` · `rtl.mkt.listing_approve`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: OMS/IWM, payment/accounting adapters; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: listing/support assistant may draft content; cannot approve KYC/settlement. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/rtl/mkt` list/detail/workflow/report views. Mobile: seller portal/mobile. Desktop: none required.  
Offline class: **READ_OFFLINE**. Seller catalog may cache; KYC/order/settlement mutations online.

### Configuration / entitlement / dependencies / audit
Configuration: commission profiles, seller categories, settlement cycles. Security floors cannot be overridden.  
Entitlement: suite license + `RTL-MKT` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: RTL-OMS/IWM, Core Billing. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: seller→listing→order→settlement. Negative: unapproved routing and unapproved settlement denied. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** seller financial lineage and approval evidence are complete.
