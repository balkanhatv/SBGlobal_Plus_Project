# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-LIFECYCLE-OVERLAY-001
**Updated:** 2026-09-21  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — DD-074 subscription lifecycle target overlay

## Verified executable basis
- Commit: `d89b3c9b5ae68ef45b4a2e8a7e9979f2b4655269`.
- Tree: `014ffdd543f71d4aeddaeb3ac5050c6916d30b54`.
- Core/server acceptance: **233/233 PASS**.
- Real PostgreSQL regression: **56/56 PASS**.
- Full database bootstrap at the same feature HEAD: **46 migrations / 40 verification files PASS**.
- Next.js 15.5.25 production build: **PASS**.
- Database Verify: **PASS**.
- Feature-tree inventory: **375 blobs / 145 Markdown / 77 source / 53 test files**.

## DD-074 executable boundary
- canonical states are exactly PENDING, TRIAL, ACTIVE, GRACE, SUSPENDED, EXPIRED and CANCELLED;
- TRIAL / ACTIVE / GRACE map to `FULL_ACCESS`; GRACE retains full access and ordinary writes subject to later guards;
- SUSPENDED maps to `RESTRICTED`; generic protected operations and ordinary business writes are denied;
- EXPIRED / CANCELLED map to `PRESERVATION_ONLY`; generic protected operations and writes remain denied;
- PENDING maps to `ACTIVATION_PENDING`; generic application access is not activated;
- restricted/non-active states require dedicated non-generic paths rather than inferred snapshot permission;
- data-preservation is retained for every posture;
- PAST_DUE, Renewed-as-state and unknown lifecycle values fail closed;
- output is deterministic and immutable.

DD-074 deliberately does **not** mutate entitlement facts/limits, synthesize lifecycle deny-set entries, invent recovery/export operation IDs, predict a future NEXT_RENEWAL state, execute dunning/payment policy or authorize reactivation.

## Still unfinished
- concrete production add-on eligibility resolver;
- concrete governed compliance/security restriction source/resolver + application;
- production usage current-period selector and `reserved_value` reconciliation rule;
- final target-preview orchestration/fact materialization/fingerprint;
- DD-066 impact/diff/remediation producer integration;
- Billing/payment/proration + Workflow approval producers;
- public `core.commercial.subscription.changePlan`;
- dedicated suspended/expired/cancelled recovery/read-only/billing/export OperationContracts;
- broad REST/OpenAPI and product UI/deployment readiness.

**Next governed work:** source-audit the remaining target-preview orchestration gap: apply prepared DD-072 DENY restrictions to DD-071 output and define final target-preview materialization only where existing source contracts are sufficient. Production usage-source and concrete compliance/security resolver bindings remain explicit blockers.

Evidence: `Registers/DEVELOPMENT_DD074_VERIFICATION_2026-09-21.md`.
