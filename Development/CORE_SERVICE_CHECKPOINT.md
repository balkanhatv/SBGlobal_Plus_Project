# CORE SERVICE CHECKPOINT — DEV-COMMERCIAL-APPLY-EVIDENCE-GATE-001
**Updated:** 2026-09-21  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — DD-077 persisted Commercial apply-evidence gate

## Verified executable basis
- Commit: `1704259d61c77937eaf866162ca67689dee3b714`.
- Tree: `c5656d68ddc50b480fec63117d267e8a0def1bd2`.
- Core/server acceptance: **265/265 PASS**.
- Real PostgreSQL regression: **61/61 PASS**.
- Full database bootstrap at the same feature HEAD: **46 migrations / 40 verification files PASS**.
- Next.js 15.5.25 production build: **PASS**.
- Database Verify: **PASS**.
- Feature-tree inventory: **389 blobs / 151 Markdown / 81 source / 57 test files**.

## DD-077 executable boundary
- SERVICE + TENANT_CORE-only read-side apply-evidence gate;
- reads DD-066 evidence through existing `sbg_commercial_transition_compiler_rw` SELECT authority;
- exact requested assessment version must be the latest version for that assessment id;
- current Tenant pointer, Subscription version/source PlanVersion and usable lifecycle are revalidated;
- target PlanVersion/Plan/route policy remain ACTIVE/effective and route id/version/enablement must match assessment;
- latest route-resolution evidence is authoritative;
- SELF_SERVE SATISFIED requires Billing producer; SALES_ASSISTED SATISFIED requires Workflow producer;
- PENDING remediation blocks;
- current SATISFIED remediation reassessment requires persisted prior-version Commercial remediation evidence;
- source fingerprint is compared by exact opaque equality only; no hash algorithm is invented;
- NEXT_RENEWAL requires server-owned effectiveAt and remains blocked until that time;
- stale/missing/corrupt evidence fails closed.

## Deliberate boundary
DD-077 is **not** an atomic evidence-to-publication gate. Its evidence read occurs before any later DD-065 publication transaction, so the DD-04 same-authoritative-transaction invariant remains unfinished. DD-065 still independently revalidates Subscription/target/snapshot truth, but it does not yet consume DD-066 evidence in the same mutation transaction.

Also unfinished:
- concrete production DD-076 assessment evaluator;
- actual DD-066 assessment write orchestration from DD-076;
- Billing/payment/proration producer runtime;
- Workflow approval producer runtime;
- snapshot-fact materialization/fingerprint producer completion;
- atomic DD-077 evidence validation inside DD-065 publication;
- public `core.commercial.subscription.changePlan`.

**Next governed work:** source-audit and implement the smallest safe atomic binding that revalidates DD-066 satisfied evidence inside the DD-065 publication transaction, without weakening current publication guards or pretending missing producer runtimes exist.

Evidence: `Registers/DEVELOPMENT_DD077_VERIFICATION_2026-09-21.md`.
