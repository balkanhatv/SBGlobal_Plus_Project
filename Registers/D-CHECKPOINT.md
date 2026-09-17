# D-CHECKPOINT — DEV-AUTHZ-POLICY-GRAMMAR-001
**Updated:** 2026-09-17 · **Branch:** `docs/architecture-branch-2`

The current executable checkpoint is [Development/CORE_SERVICE_CHECKPOINT.md](../Development/CORE_SERVICE_CHECKPOINT.md). The grammar contract is [DEV-AUTHZ-POLICY-GRAMMAR-001](../Development/AUTHORIZATION_POLICY_GRAMMAR_V1.md); the preceding PLATFORM_GLOBAL persistence prerequisite remains [DEV-AUTHZ-PDP-001](../Development/AUTHORIZATION_PDP_ABAC_PERSISTENCE_PREREQUISITE.md).

Verified executable commit: `1b0f90dc900e0ab49cde2f8305f11cfadadae31c`; tree `a48a2b8cd4d9447522ca2c5721d23a85175dbfa8`.
- Core Service Verify run `35247193977`, core-service job `105290285420`: **PASS — 71/71**.
- Core Service Verify run `35247193977`, postgres-context job `105290285531`: **PASS — 13/13**.
- Database Verify run `35247193986`, postgres-verify job `105290285053`: **PASS**.
- Current inventory: **71 Core/server tests, 13 real PostgreSQL tests, 35 migrations, 29 verification files**; Industry SQL scope remains **9/41/181**.

Gate: **IMPLEMENTED / TESTED — PERMISSION SET v1 + ABAC EXPRESSION v1 GRAMMAR; PDP READER/EVALUATOR NOT CLAIMED**.

The grammar is schema-version-aligned, canonical, bounded and data-only. Unknown fields/operators/attributes reject. No arbitrary JavaScript/eval, SQL, shell, regex/glob AST, template, network/filesystem/provider or dynamic traversal is permitted as executable policy input. Existing RBAC deny precedence and ABAC DENY/RESTRICT narrowing semantics are preserved.

Next governed action: implement **only the Authorization read store** for the exact tenant/platform CURRENT compiled snapshot and applicable ACTIVE ABAC policies, using the locked v1 parsers and fail-closed scope/version/payload behavior. Evaluator/compiler work follows only after that reader passes exact-head verification.

RawSourceCorpus stays immutable; `main` stays unmerged; PR #2 remains draft/review only.
