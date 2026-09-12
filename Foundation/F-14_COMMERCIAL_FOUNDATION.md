# F-14 — COMMERCIAL FOUNDATION: PLANS · SUBSCRIPTION · LICENSE · ENTITLEMENTS · EFFECTIVE ACCESS
**Document ID:** F-14 · **Version:** 1.1 · **Status:** SPECIFIED · Created: 2026-09-02 (CP-F1-005)

Owns the full Foundation-level commercial model. Extends F-01 §5 (tiers, entitlement chain, plan-limit dimensions, BR-SUB-01…04, BR-AFF-01 remain owned there); nothing here duplicates F-01 — this document deepens it to the Commercial Foundation standard. Provenance: tier set, limit dimensions, lifecycle states, self-serve/sales-assisted split `[SD: S2.2 §26, §38; CR-01]`; all other operational detail `[AC — logged D-DECISIONS AC-18]`. No numeric limit values are invented: concrete per-plan values are configured plan-version data governed by Super Admin; where the corpus defines values they are preserved by the plan-version record, never overridden here.

---

## 1. Plan Catalog (Free · Starter · Pro · Premium · Enterprise)

**Plan = versioned commercial template** owned by Super Admin: `plan_code · version · status (draft/active/retired) · positioning · eligibility · route policy · entitlement template · limit set · commercial rules`. A subscription always references one plan version; retiring a version never alters live subscriptions until their next renewal/change event.

**Dimensions defined for every plan (the plan-version record carries a value or an explicit “unlimited/not-included/add-on” marker for each):** users/seats · branches · storage · AI usage (tokens/credits/media, F-05 §8) · API access & rate class · integrations class · industries enable-able (count/class) · Management Systems per industry · modules/submodules · mobile apps · desktop surfaces · reporting/analytics class · automation class · communication quotas (Email/SMS/WhatsApp/Push) · support/service level · configurable dimensions (branding, domains, templates) · commercial rules (trial eligibility, billing cycles, overage policy) `[SD: S2.2 §26 dimension list]`.

| Plan | Purpose / target profile | Eligibility & route (§7) | Included capability posture | Key exclusions/constraints |
|---|---|---|---|---|
| **Free** | Evaluation and micro-tenants; permanent entry tier, not a time-boxed trial | Self-serve signup | Minimum viable: 1 industry, entry MS/module subset, basic reporting, community support; entry limits on every dimension | No API/integration production use; no desktop; no custom domain; AI at evaluation quota; upgrade CTA on every denied capability |
| **Starter** | Small single-branch organizations going operational | Self-serve | 1 industry full MS set per entitlement template, standard reports, email support, mobile apps | Single branch; capped seats/storage/AI; limited integrations; no sales-assisted terms |
| **Pro** | Growing multi-branch organizations | Self-serve **or** sales-assisted per route policy (§7) | Multi-branch, full primary-industry suite, API access, standard integrations, automation, priority support | Optional industries limited; enterprise controls (residency choice, SSO/LDAP class) not included by default |
| **Premium** | Larger organizations needing breadth | Self-serve **or** sales-assisted per route policy (§7) | Multiple enabled industries, advanced analytics/automation, higher quotas, desktop surfaces, premium support | Contractual/regulated postures (custom DPA, residency guarantees, dedicated environments) remain Enterprise |
| **Enterprise** | Regulated/government/large enterprises; contractual terms | Sales-assisted (quote/contract) | Full catalog eligibility: all industries per contract, custom limits, residency selection (F-11), SSO/LDAP/PKI classes, SLA-backed support, sandbox+production API | Values set per contract as a negotiated plan version; never bypasses the entitlement chain or platform governance |

**Plan relationships:** Plan → provides the **entitlement template** + **limit set** consumed at subscription activation (§2); License records instantiate industry/MS/seat grants (§3); Entitlements are computed, never read directly off the plan (§4). Plan alone NEVER grants application access (§5).

**Commercial rules (per plan version):** trial policy (duration, eligible tiers), billing cycles, proration policy on mid-cycle change, overage handling per metered dimension (block / notify / pay-as-you-go where enabled), add-on catalog eligibility (AI packs, storage packs, seat packs — marketplace items per F-05 §8).

## 2. Subscription Model

**Concept:** the commercial contract instance binding one Tenant to one plan version with effective dates, billing linkage, and lifecycle state. **Owner:** Tenant Owner (commercial); Super Admin (platform governance). **Cardinality:** exactly one active subscription per tenant; historical subscriptions preserved immutably.

**States `[SD: BR-SUB-01]`:** `Pending → Trial → Active → Grace → Suspended → Expired → Cancelled` (+ `Renewed` as an Active re-entry event, not a distinct resting state).

**Transition table (trigger · condition · action · notification — all transitions audited):**
- Pending→Trial/Active: signup or sales order completes; verification done (BR-W03-1); action: activate entitlement computation, start billing anchor; notify owner.
- Trial→Active (conversion): payment method + first payment success before trial end; entitlements recomputed to paid template.
- Trial→Expired: trial end without conversion; BR-SUB-02 posture applies (no data deletion; billing/renewal/export only).
- Active→Grace: renewal charge failed or invoice unpaid at due date; condition: within configured grace window; action: full access retained, dunning ladder starts (retry schedule + notices).
- Grace→Active (recovery): payment success during grace; no entitlement change; audit records recovery.
- Grace→Suspended: grace window exhausted; action: restricted mode — read-only business data + billing/renewal/export; all writes denied with upgrade/renew CTA; integrations and API paused.
- Suspended→Active (reactivation): outstanding settled; entitlements recomputed against current plan version; audit + notify.
- Suspended→Expired: suspension window exhausted per policy; BR-SUB-02 permanent posture (never deletion).
- Expired→Active (reactivation): governed re-activation with settlement; if plan version retired → nearest active version chosen explicitly by owner.
- Any→Cancelled: owner cancellation request honoring notice policy; effective at period end by default (immediate only via governed exception); data preservation + export window per policy; never silent.
**Failed renewal** is not a distinct state: it is the Active→Grace trigger with dunning; **auto-renewal** is a per-subscription flag honoring plan policy.

**Exception handling:** payment-provider outage (billing events queued, no punitive transition while platform-side failure is attested); disputed invoices freeze dunning under Super Admin review; clock/effective-date rules — all transitions anchored to billing timezone recorded on the subscription. **Data preservation:** every state honors BR-SUB-02 — expiry/downgrade/suspension never deletes tenant data. **Audit/notifications:** every transition writes the immutable financial/audit event (W-12/W-13) and notifies Tenant Owner (+ configured admins) through the notification engine.

## 3. License Model

**Concept:** the enforceable grant record derived from a subscription — the bridge between commercial state and entitlement computation. Licenses instantiate: **industry licenses** (per enabled industry), **MS licenses** (per management system where plan gates them), **seat licenses** (named-user grants within plan seat limits), **surface licenses** (desktop instances where gated), **API/service-account licenses**.
**Relationships:** Subscription 1→N Licenses; each license carries: type · subject (industry/MS/user/surface) · status (`pending → active → suspended → revoked → expired`) · validity window · limits · assignment metadata · audit trail.
**Lifecycle rules:** created/activated on subscription activation or later assignment; **assignment** (e.g., seat→user) is auditable and reversible; **suspension** follows subscription suspension or targeted governance action (e.g., abuse) — targeted suspension affects only its subject; **revocation** is permanent with reason + approver; **expiry** follows subscription/validity window. License validation is step 4 of the validation chain (F-03 §3): an operation requires every applicable license (industry + MS + seat) valid — subscription Active/Grace alone is insufficient.

## 4. Entitlement Model

**Concept:** the computed, cached, server-authoritative answer to “what may this tenant/user use, at what limit, right now.” **Sources (precedence order):** 1. Plan entitlement template (baseline) → 2. License instantiation (industries/MS/seats actually granted) → 3. Tenant-specific overrides (governed: Super Admin-approved, reasoned, audited, expiry-dated — e.g., pilot enablement, contractual add-on) → 4. Add-on packs → 5. Compliance/security constraints (F-03) which may only restrict, never expand.
**Inheritance:** tenant-level entitlements flow to industry context → MS → module → role scope; explicit deny at any level beats inherited allow. **Conflict rule:** most-specific-wins for limits; deny-wins for access; overlapping add-ons sum only for metered quotas.
**Dimensions:** industries · management systems · modules/submodules · users/seats · storage · AI (tokens/credits/media) · API (access + rate class) · integrations · mobile · desktop · reporting/analytics · automation · communication quotas · support/service class `[SD: S2.2 §26]`.
**Recalculation triggers:** subscription transition, plan change, license change, override grant/expiry, add-on purchase/expiry, compliance event. Recalculation is atomic per tenant, versioned (entitlement snapshot id), effective-dated, audited; surfaces re-read the snapshot — no surface caches beyond the snapshot TTL; offline clients revalidate on sync (F-03 §3).
**Auditability:** every effective-entitlement change stores before/after snapshot references, source event, actor.

## 5. Effective Access Model (server-authoritative)

`Authenticate → Tenant → Industry Context → Subscription → License → Session/Device/API Credential → Entitlement Snapshot → RBAC → applicable ABAC/context → Security/Compliance/Residency → Resource/Workflow Rules → Effective Access Decision → Allow / Deny / Restrict / Upgrade-CTA`

Owned jointly with F-03 §3–§4 (chain enforcement) — this sequence is the canonical effective-access chain and may not be reordered into a competing model. This section fixes the commercial semantics: **Plan alone never implies access**; the decision depends on subscription state (§2), license state (§3), computed entitlements (§4), tenant configuration, enabled industries, MS/module availability, RBAC, ABAC, security/compliance constraints, and platform context. Decision outcomes: **Allow** (full), **Deny** (hard, audited), **Restrict** (read-only/limited mode, e.g., Suspended), **Upgrade CTA** (capability exists but not entitled — surface renders governed upgrade path instead of silent absence). Client-side enforcement is presentation only; every decision is re-made server-side (offline clients: last-valid-session scope + revalidation on sync, F-10 §4/§6).

## 6. Plan-Change Lifecycles

**Upgrade:** Current plan → upgrade selection (self-serve catalog or sales quote per §7) → **impact & entitlement preview** (diff of dimensions/limits, price delta, proration) → commercial evaluation (immediate vs next-cycle effective date) → checkout (self-serve) or order/approval (sales-assisted) → payment/approval → subscription updated to new plan version → entitlement recalculation (§4) → newly available capabilities surface (including new-industry/MS enablement flows) → audit + notifications. Failure at payment leaves prior state untouched (atomic).
**Downgrade:** request → **impact assessment** (usage vs target limits per BR-SUB-04) → remediation choice where usage exceeds target (disable modules / archive excess / reduce seats — never silent deletion) → effective date (default: next renewal; immediate allowed after remediation) → subscription update → entitlement recalculation → access restriction on removed capabilities (data preserved read-only/archived per F-04 §11) → audit + notifications. **Downgrade never deletes tenant data.**
**Renewal:** auto-renewal per flag/policy: charge at anchor → success: extend period (Renewed event), entitlement continuity guaranteed (no gap) → failure: Active→Grace dunning (§2). Manual renewal identical minus auto-charge. Notifications at configured pre-renewal offsets.
**Expiry / Grace / Suspension:** defined independently in §2 with restricted-access semantics, reactivation paths, commercial consequences (dunning, settlement), data preservation (BR-SUB-02), audit and notifications at every step. **Cancellation:** §2; export window honored before any retention-policy archival.

## 7. Commercial Routes — Self-Serve vs Sales-Assisted (governed)

Route policy is **plan-version configuration, not hardcoding**: **Free/Starter — self-serve** (BR-W02-1/W-03); **Enterprise — sales-assisted** (quote → contract → provisioned order); **Pro/Premium — governed dual-route**: self-serve checkout enabled by default platform policy, sales-assisted path always available; Super Admin may adjust the route per market/region — the plans are never arbitrarily blocked from purchase. This refines the CR-01 operational note (“others sales-assisted”) into governed route configuration under current user direction; CR-01's tier set is unchanged; both readings preserved in D-DECISIONS AC-18. No contradictory paths: one checkout engine, one order pipeline, route policy resolved per plan version at W-02/W-03.

## 8. Cross-Cutting Guarantees
Every commercial event (plan change, transition, license event, override, route decision) is audited immutably (W-12/W-13, AC-05 reversal-only rule); notified via the Core notification engine per template policy; enforced identically on Web/Mobile/Desktop/API (single chain); tenant data preserved across every lifecycle event (BR-SUB-02, BR-SUB-04); residency unaffected by plan events except governed Enterprise residency selection (F-11).

## 9. Acceptance & Deferrals
**Acceptance:** upgrade, downgrade-with-remediation, renewal-failure→grace→recovery, suspension→reactivation, cancellation-with-export each complete with correct entitlement snapshots and full audit; entitlement loophole tests: no operation succeeds with any chain link invalid; Upgrade-CTA rendered only where the capability is genuinely plan-gated. **Deferred to Architecture (named, not gaps):** plan-version schema, entitlement snapshot storage/TTL, dunning schedule values, proration formulas, checkout/payment provider selection, per-plan concrete limit values (configured data, preserved from S2.2 §26 where source-defined).
