# COMMERCIAL SUBSCRIPTION LIFECYCLE TARGET-OVERLAY AUDIT

**Date:** 2026-09-21  
**Baseline:** `f57b7ac901131dc49c49109b71b8af03399407fd` / `12109c42615e24b1145da55f7fe144979e01374d`  
**Scope:** next deterministic Commercial target-preview prerequisite after DD-073.

## Governing evidence

- F-14 §2 defines the canonical resting states `PENDING | TRIAL | ACTIVE | GRACE | SUSPENDED | EXPIRED | CANCELLED`.
- F-14 explicitly states that ACTIVE→GRACE retains **full access**.
- F-14 states that SUSPENDED is restricted mode: read-only business data plus billing/renewal/export, ordinary writes denied, integrations/API paused.
- F-14 requires data preservation across lifecycle states; expiry/cancellation retain preservation/export/recovery posture rather than deletion.
- A-04 §5 and DD-04 §11 make the safety boundary explicit: restricted-state permitted paths require dedicated operation contracts; the current generic Commercial guard denies PENDING/SUSPENDED/EXPIRED/CANCELLED.
- DD-04's transition matrix treats Renewed as an event and prohibits PAST_DUE as a resting state.

## Safe implementation boundary

DD-074 implements only the deterministic **lifecycle posture classifier**:
- TRIAL / ACTIVE / GRACE → `FULL_ACCESS`; generic protected operations and ordinary business writes remain allowed subject to every later guard.
- SUSPENDED → `RESTRICTED`; generic protected operations and ordinary writes are denied; any allowed read-only/recovery/billing/export path requires a dedicated non-generic contract.
- EXPIRED / CANCELLED → `PRESERVATION_ONLY`; generic protected operations and ordinary writes are denied; dedicated governed paths are required.
- PENDING → `ACTIVATION_PENDING`; generic application access is not activated.
- every posture preserves the F-14 no-silent-deletion requirement.

## What DD-074 deliberately does not do

The lifecycle overlay does **not** mutate entitlement facts, zero limits, synthesize deny-set entries, select recovery/export operation IDs, predict a future subscription state for NEXT_RENEWAL, run dunning/payment timers, or authorize reactivation. Doing any of those would invent semantics owned by operation contracts, Workflow, Billing or the authoritative Subscription transition.

The overlay must be applied from an authoritative server-owned Subscription state at evaluation/apply time. A future effective-time plan change must re-read lifecycle state at apply; DD-074 never predicts that future state from today's row.

## Remaining final-preview blockers

Concrete compliance/security restriction authority/application, production usage-period selection/reservation reconciliation, final fact materialization/fingerprint orchestration and public plan-change apply remain separate work.
