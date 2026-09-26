# SBGlobal Plus — A-04 COMMERCIAL & ENTITLEMENT ARCHITECTURE
**Document ID:** A-04 · **Version:** 1.1 · **Status:** Targeted F-14 reconciliation; prior CP-A1-002 certification is historical · **Date:** 2026-09-20
**Traces to:** F-14 (Commercial Foundation: plans, subscription, license, entitlements, effective access, lifecycles, routes), F-01 §5 (subscription/entitlement anchor, BR-SUB-01…04), F-02 W-03/W-04 (subscribe/provision workflows) · **Decisions:** ADR-007 (→ A-12)

---

## 1. Commercial Chain — Architectural Placement
F-14's chain `Plan → Subscription → License → Entitlement → Effective Access` maps onto the Core as follows: the **Entitlement module** (A-01 §2) owns the entire chain's data and computation; the **Billing module** owns money movement only (invoices, payments, dunning); the **kernel guard** is the sole runtime consumer of computed entitlements after Tenant/Industry Context and commercial validity are resolved. No other module ever interprets plans or subscriptions directly — they ask the guard/entitlement contract. This keeps commercial semantics in exactly one place.

## 2. Plan Catalog & Versioning
- Plans are **versioned, immutable records**: `Plan(planId) → PlanVersion(n)` with dimensions per F-14 §1 (modules, MS activations, limits, AI quotas, support class, residency options, route). A subscription always pins a specific PlanVersion.
- Publishing a new PlanVersion never mutates existing subscriptions; migration between versions is an explicit lifecycle operation (upgrade/downgrade per F-14 §6 semantics with BR-SUB-04 downgrade guard from AC-01).
- Platform-level catalog is global (region-neutral directory data, A-02 §5); per-tenant negotiated overrides (Enterprise route) are stored as **EntitlementAdjustments** bound to the subscription, never as forked plans.

## 3. Subscription Lifecycle — Runtime Realization
The canonical F-14 lifecycle (`PENDING → TRIAL → ACTIVE → GRACE → SUSPENDED → EXPIRED/CANCELLED`, with governed reactivation paths; **Renewed is an event and failed renewal is the ACTIVE→GRACE trigger, not a PAST_DUE resting state**) is executed by the **Workflow module** as a platform workflow definition, giving every transition the same guard/audit treatment as business workflows (F-02 per-step audit). Transition triggers: payment webhooks (→ A-06 §6), scheduled evaluators (renewal/expiry/grace timers run as Core scheduled jobs, → A-10 §5), and operator/tenant actions (route-governed per F-14 §7). Every transition emits a domain event (`subscription.transitioned`) through the outbox (→ A-06 §4) which drives entitlement recompilation (§4 below) and notifications.

## 4. Entitlement Compilation Pipeline (ADR-007)
Entitlements are **compiled, not evaluated ad hoc**. Compilation is an execution optimization of Foundation commercial semantics: a current snapshot is valid only from the tenant's current subscription state, applicable license grants, governed adjustments/add-ons and restricting compliance/security inputs; it never means subscription/license checks cease to exist:
```
Sources: PlanVersion dimensions → License grants → EntitlementAdjustments
         → tenant industry activations → suspension/grace overlays
Compile: apply F-14 §4 precedence; conflicts resolve DENY-WINS;
         output = EntitlementSnapshot{tenantId, version, moduleMap,
         featureMap, limitMap, aiQuotaMap, validity}
Triggers: subscription transition · plan version migration · license
          change · adjustment change · industry activation change
Store:    snapshot persisted per tenant (current + history for audit);
          snapshot version stamped into RequestContext (A-02 §3)
```
- **Read path:** a snapshot cache is keyed by `(tenantId, snapshotVersion)` and invalidated by the `entitlement.recompiled` event. Current Subscription, applicable License and authoritative snapshot-version checks remain mandatory before access; an unavailable or mismatched version fails closed and requires reload/revalidation. A previously valid cached snapshot is not authority after invalidation (F-14 §4/§5; DD-04 §5/§11).
- **Deny-wins and server-authoritative semantics** (F-14 §4/§5) are properties of the compiler, verified by contract tests at Detailed Design.

## 5. Runtime Enforcement Points

Canonical access sequence is owned with A-01/A-03: Authenticate → Tenant → active Industry Context → Subscription → License → credential/device/session context → current EntitlementSnapshot → RBAC → ABAC/context → security/compliance/residency → resource/workflow rules → Effective Access.
| Point | Enforces | Behavior on denial |
|---|---|---|
| Kernel guard step 3 (A-01 §3) | Module/feature enabled for tenant | `ENTITLEMENT_DENIED` error class, audited |
| Limit counters | Numeric limits (users, branches, storage, transactions) | Soft-warn at threshold, hard-deny at limit; counters maintained transactionally with the guarded write |
| AI Gateway (→ A-07 §7) | AI quotas/model classes per plan | Deny + quota-exhausted signal to UI |
| Experience shells (→ A-08 §6) | Navigation/feature visibility | UI hides what the snapshot denies; UI state is advisory only — server remains authoritative |
| Webhook/event dispatcher | Integration entitlements | Subscriptions to non-entitled events rejected |
Suspension overlay (F-14 §2/§5/§6): `SUSPENDED` permits governed read-only business-data access plus billing/renewal/export, preserves data, denies ordinary business writes, and pauses integrations/API access. These permitted paths require explicit restricted-operation contracts and the same server-authoritative guard; subscription state alone never grants them. DD-04 §11 currently keeps generic protected operations denied until those dedicated contracts exist.

## 6. Billing & Payment Integration
- Payment gateways sit behind a **PaymentPort** adapter contract (→ A-06 §6): create-checkout, capture, refund, webhook-verify. Card data never touches the Core (PCI scope minimization per A-03 §6); the gateway hosts the payment surface.
- Invoices are generated by Billing from subscription events; financial records are immutable post-approval with reversal-based correction (AC-05) — enforced at the data layer via append-only posting tables (→ A-05 §7).
- Dunning: scheduled evaluator drives `ACTIVE → GRACE → SUSPENDED` per F-14 policy/timings after a failed renewal or unpaid due condition (values are configuration, not code; → A-01 Configuration module). Proration amounts are computed by Billing at transition time and recorded on the invoice line with the formula inputs (auditability).

## 7. Offline & Edge Revalidation
Desktop (Tauri 2.0, F-10 §4) and mobile clients cache the entitlement snapshot for offline operation. Architecture rule: cached snapshots carry `validity` (max offline age per plan); on expiry the client degrades to read-only local mode until revalidation. Revalidation is a lightweight snapshot-version check, not a recompile. Server-authoritative rule (F-14 §4) is preserved: any synced offline transaction is re-guarded server-side on ingest (→ A-08 §7).

## 8. Deferred to Detailed Design
Plan/PlanVersion/EntitlementSnapshot entity fields; limit-counter table design and contention strategy; proration formulas and dunning timing values; gateway adapter catalog per region; checkout UX flows; entitlement contract test suite.

## Change history
- 2026-09-20: Corrected F-14 section references and restored its suspension/read-only/recovery semantics. No new recovery endpoint or access exception was introduced; DD-04 §11 retains the explicit current runtime boundary.
