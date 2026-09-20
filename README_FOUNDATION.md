# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `DEV-COMMERCIAL-AUDIT-CORRECTION-001`  
**Branch:** `docs/architecture-branch-2`

Verified executable basis `895f0c6c53dd2cabcf5b3d53f8b5f053803e9122` / `5e4bee4f8ede04024ac3cf4ac0cad8d356106224`:
- **194/194 Core PASS**
- **53/53 PostgreSQL PASS**
- **45 migrations / 39 verification files PASS**
- **Next.js 15.5.25 production build + deterministic lock/generated-state PASS**
- **9 Industries / 41 canonical MS / 181 Industry tables**

Current Development includes the verified shared Core/Authorization/Commercial kernel, Clerk session boundary, tRPC/Next.js first-party composition, workspace/current-entitlements queries, DD-063…069 Commercial event/write/publication/evidence/schema/baseline/adjustment prerequisites, and the 2026-09-20 current-state hardening correction.

The latest audit correction does **not** promote a new feature: it reconciles the canonical Industry lifecycle (PENDING is valid but ineligible), revalidates effective/current Commercial publication state, and makes checkpoint/state promotion paths trigger exact-head Core/Web/Database verification.

**Next governed work:** lock add-on eligibility + active adjustment-source read semantics, then deterministic precedence. Public `core.commercial.subscription.changePlan` remains unbound.
