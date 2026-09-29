# SBGlobal Plus — Canonical Development Branch
**Current checkpoint:** `DEV-AI-REQUEST-PRE-ROUTING-FLOORS-001`
**Current executable audit basis:** `6903bf671d5b99e78d2ebc8b2d94ce55dd4411b7` / tree `66b417fde1f543200cb26e815464484daad1a34e`
**Updated:** 2026-09-29 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-09-28):** complete-project downstream semantic/file-coverage/adversarial audit remains **CLEAN / CLOSED** through VC27-111 with open current-scope P0/P1 = 0. DD-243…DD-247 canonical promotion is exact-head verified at the basis above; this state-closure commit must independently pass before the next governed backend batch opens. Production readiness is **NOT CLAIMED**.

DD-243…DD-247 is the current governed backend-only AIRequest pre-routing batch. It proves only exact DD-09 request-envelope shape, deeply immutable projection, exact capability-code coherence and exact input-schema-version coherence against the canonical AI operation declaration.

Verified canonical promotion basis `6903bf671d5b99e78d2ebc8b2d94ce55dd4411b7` / tree `66b417fde1f543200cb26e815464484daad1a34e`: **883/883 Core**, **525/525 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36529908920` (jobs `109281027307`, `109281026707`), Database `36529908923` (job `109281026728`), Web `36529908900` (job `109281026678`).

Frontend/UI remains untouched. RequestContext trust, Authentication/Authorization/entitlement, residency/grounding policy, output-schema business validation, AIPolicy/quota/budget, candidate/model mapping, Provider health/scoring, route/fallback/retry, credentials, provider SDK execution, metering, output guardrails and final audit remain separately governed.

Evidence: `Registers/DEVELOPMENT_DD243_DD247_VERIFICATION_2026-09-29.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: this state-closure commit must independently pass exact-head Core/PostgreSQL/Database/Web. Once green, DD-243…DD-247 is closed and the next independently source-complete governed backend batch may be source-audited.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.











