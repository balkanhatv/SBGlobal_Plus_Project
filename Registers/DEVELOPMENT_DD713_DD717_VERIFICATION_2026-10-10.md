# DD-713…DD-717 — TokenUsage → AICapability(code) exact scoped direct-FK verification

**Date:** 2026-10-10 · **Branch:** `docs/architecture-branch-2`.
**Source audit:** `Development/AI_TOKEN_USAGE_CAPABILITY_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`.
**Source-audit commit:** `eba5fa1f69ccb819ab2087dd7b42e97f8f5690a2` / tree `2ae5deac2a68155f8202c622aafec3ffeb7e7f61`.
**Verified corrected implementation:** `495a19e2608c1c6bf6ec10e04954063dd12b969b` / tree `58f0d4955e62c87a16263e00111428263ade2a09`.
**Status:** SOURCE AUDIT + IMPLEMENTATION INDEPENDENTLY EXACT-HEAD VERIFIED. CANONICAL PROMOTION STAGED/PENDING OWN CI; STATE CLOSURE NOT VERIFIED.

## Ordered exact-HEAD verification

DD-708…DD-712 preceding closure `0144382643016a4b0a14284d8b208054658b594f` separately passed **1711 Core, 540 PostgreSQL with bootstrap, 48/42 Database, Web**.

DD-713…DD-717 source-audit `eba5fa1f69ccb819ab2087dd7b42e97f8f5690a2` separately passed:
- [Core Service Verify 37962745747](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37962745747): Core **1711/1711**, PostgreSQL **540/540** with bootstrap.
- [Database Verify 37962745647](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37962745647): **48 migrations / 42 SQL verifications**.
- [Web Boundary Verify 37962745636](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37962745636): **PASS**.

Initial implementation `3a39aadb4086d82a5037e7fc6b92682ac4585662` was not promoted: immediate self-review caught one test-only expected `mediaUnits` assertion error; a smallest forward-only test correction was committed.

Corrected implementation `495a19e2608c1c6bf6ec10e04954063dd12b969b` independently passed:
- [Core Service Verify 38018578104](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38018578104): Core job `114114304392` **1719/1719 PASS**, fail 0, skipped 0 (+8 fixed cases). PostgreSQL job `114114304545` **540/540 PASS**, fail 0, skipped 0, full bootstrap PASS.
- [Database Verify 38018578077](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38018578077): job `114114304208`, **48 migrations / 42 SQL verifications PASS**.
- [Web Boundary Verify 38018578151](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38018578151): job `114114304476`, **PASS**.

Each push run asserts the exact corrected `head_sha=495a19e2608c1c6bf6ec10e04954063dd12b969b`. No test weakening or removal.

## Bounded code and authority

New `src/core/ai/token-usage-capability-current-evidence-reader.ts`, Core index export, `tests/core/ai-token-usage-capability-current-evidence-reader.test.mjs`, eight `AIUSAGE-CAPREAD-*` acceptance cases. Existing DD-122 scoped usage, DD-109 global exact code metadata read and DD-197 pure FK predicate were reused unchanged. Missing, malformed, unequal and errors fail closed. Frozen {usage,capability} contains unmodified raw sources/decimals and opaque fields; reads are not atomic.

No database migration, schema, RLS, grant, role, RawSource or `main` change. No new capability ACTIVE/currentness/eligibility, entitlement/policy, principal authorization, Tenant/Industry allowlist, Provider/Model compatibility, budget/pricing/billing, routing/inference/RAG/media/tool/agent, API/UI, mutations/events or production-readiness claims.

## Canonical and state gates

This atomic promotion includes DD-17's eight fixed acceptance entries, DD-18's DD-713…DD-717 decisions, DD-19 traceability, the active manifest and 57 prior active checkpoint projections. This staged promotion is **NOT certified** until its own Core/PostgreSQL/Database/Web pass at the exact promotion HEAD. After a PASS, publish a separate independently verified state closure before advancing. Historical VC27 review is not represented as newly performed.

Invariants: **9 equal Industries / 41 canonical Management Systems / 181 Industry tables / 2,962 preserved source requirement IDs / exactly TENANT_STAFF_APP and TENANT_USER_APP**. PR #2 stays OPEN/DRAFT/UNMERGED; production readiness NOT CLAIMED.
