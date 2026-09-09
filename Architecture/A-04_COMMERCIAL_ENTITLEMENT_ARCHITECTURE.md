# SBGlobal Plus — A-04 COMMERCIAL & ENTITLEMENT ARCHITECTURE
**Document ID:** A-04 · **Version:** 1.0 · **Status:** ARCHITECTURE BASELINE (CP-A1-002) · **Date:** 09-09-2026
**Traces to:** F-14 (plans, subscription, license, entitlements, effective access, lifecycles, routes), F-01 §5 (subscription/entitlement anchor, BR-SUB-01…04), F-02 W-03/W-04 (acquisition & provisioning), F-10 §4 (offline revalidation), F-11 (residency selection) · **Decisions:** ADR-008 (→ A-12)

---

## 1. Commercial Object Model
```
PlanVersion (immutable) ← Plan (5 tiers: Free/Starter/Pro/Premium/Enterprise, CR-01)
   → Subscription (tenant ↔ plan version, lifecycle state)
      → License (seat/branch/device/named-capacity grants)
         → Entitlement (computed, per tenant)
            → Effective Access (entitlement ∩ RBAC ∩ ABAC, → A-03 §3)
```
- **Plans are versioned and immutable once published.** A tenant subscription pins a PlanVersion; plan changes create new versions, never mutate history — pricing/limit disputes are resolvable from the record alone.
- A **Subscription** is the commercial contract instance and owns the lifecycle state machine (F-14 §6). One active subscription per tenant; add-ons attach to it.
- **Licenses** quantify capacity (seats, branches, devices, MS activations) inside the subscribed plan. Licenses never widen plan scope; they instantiate it.
- **Entitlements** are computed facts, never hand-edited data. Plan alone grants no access (F-14 negation preserved): access requires the full chain to evaluate true at runtime.

## 2. Entitlement Computation (ADR-008)
- **Sources & precedence (high → low):** platform policy (kill-switch/compliance) → PlanVersion definition → subscription state modifiers (trial/grace/suspended) → license quantities → tenant-admin narrowing (may only narrow, mirror of ABAC rule A-03 §4).
- **Deny-wins:** any source that denies a capability denies it finally; conflicts never resolve upward.
- **Recalculation triggers:** subscription lifecycle transition, plan-version migration, license change, add-on change, platform policy change, manual operator correction (reason-captured, audited). Recalculation is transactional and emits `entitlement.recalculated` via the outbox (→ A-06 §3).

## 3. Entitlement Snapshot & Distribution
The computed result is materialized as a **versioned per-tenant Entitlement Snapshot** (monotonic version counter). The kernel loads it into `RequestContext.entitlementSnapshot` (→ A-01 §5) from cache; the `entitlement.recalculated` event invalidates caches on all Core replicas. Offline-capable surfaces (desktop POS, mobile) carry a snapshot with TTL and **must revalidate on reconnect; expiry degrades to read-only per F-10 §4** — server remains authoritative, client copies are advisory.

## 4. Runtime Enforcement
Enforced at kernel guard step 3 (→ A-01 §3), before authorization, on every entry point:
1. **Activation gate** — is the industry/MS/module enabled for this tenant?
2. **Feature gate** — is the specific capability in the snapshot?
3. **Quantitative limits** — seats/records/storage/AI-usage counters checked atomically against the limit at the moment of consumption (Postgres row-level counters per tenant + limit; no read-then-write races).
Denials raise the distinct `ENTITLEMENT_DENIAL` error class (not an AuthZ error), are user-explainable (which limit/plan), audited, and feed upgrade prompts in the experience layer (→ A-08).

## 5. Plan-Change & Subscription Lifecycle
Architecture realization of the F-14 §6 state machine; states and transitions are Workflow-module definitions, not code branches.
- **Upgrade:** immediate; recalculation + proration record; no data impact.
- **Downgrade:** guarded (BR-SUB-04 / AC-01): a **downgrade feasibility check** runs against live usage (seats in use, active MS, storage); blocking excess is reported to the tenant admin for resolution — the platform never silently deletes or hides data.
- **Trial → paid, renewal, failed-renewal → grace → suspension → reactivation, cancellation → expiry:** each transition recalculates entitlements and pauses/resumes integrations per A-02 §6 (suspension keeps tenant-admin billing scope alive).
- **Routes:** Free/Starter self-serve; Pro/Premium governed dual-route; Enterprise sales-assisted (F-14 §7, CR-01) — route logic lives in the commercial workflow definitions, not in Core code.

## 6. Billing & Payment Architecture
- **Gateway adapter contract** in the Billing module; concrete gateways (region-appropriate per data home, → F-11) are pluggable adapters. Card data never enters the Core: tokenization at the gateway keeps the platform out of PCI scope beyond SAQ-A posture (F-03 compliance mapping).
- Invoices are generated from subscription + metering facts and are **immutable post-approval; corrections are reversal documents (AC-05).**
- **Dunning** is a Workflow-module state machine bound to failed-renewal events; notification via A-06 §6 channels.

## 7. Metering
Usage counters (API calls, storage, AI tokens, seats, documents) are derived from audit/usage events into the metering store (→ A-05 §6 read models); they feed limit enforcement (§4), billing (§6) and operator analytics (→ A-11 §5). Metering is eventually consistent; **hard limits use the transactional counters, not metering aggregates.**

## 8. Deferred to Detailed Design
Plan/PlanVersion/Subscription/License/Entitlement schemas; proration formulas and currency handling; gateway selection matrix per region; dunning timing values; upgrade-prompt UX; per-plan numeric limit values (owner-priced, never invented — F-14 rule).