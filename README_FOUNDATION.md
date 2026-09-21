# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `DEV-COMMERCIAL-IMMUTABILITY-AUDIT-CORRECTION-001`  
**Branch:** `docs/architecture-branch-2`

Verified executable basis `ffe74ed8c3169c77b3a1135e615ae5d07a711e1e` / `db85be98f256fd856635fc178ab3220b97d01ba3`:
- **199/199 Core PASS**
- **56/56 PostgreSQL PASS**
- **46 migrations / 40 verification files PASS**
- **Next.js 15.5.25 production build + deterministic lock/generated-state PASS**
- **9 Industries / 41 canonical MS / 181 Industry tables**
- **359-blob exact-tree audit completed**

Current Development includes the verified shared Core/Authorization/Commercial kernel, Clerk session boundary, tRPC/Next.js first-party composition, workspace/current-entitlements queries, DD-063…070 Commercial prerequisites, and the 2026-09-21 published-PlanVersion/runtime-enum audit correction.

The latest correction does **not** promote a new feature: DD-070 remains the latest feature slice. It physicalizes existing published PlanVersion immutability, rejects malformed Commercial runtime enum/value-type inputs, and synchronizes stale current-state evidence.

**Next governed work:** deterministic DD-04 baseline → override → resolver-eligible add-on precedence with ambiguous meter mapping fail-closed. Concrete eligibility/pricing/payment/approval rules and public `core.commercial.subscription.changePlan` remain unfinished.

See `Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-21.md`.
