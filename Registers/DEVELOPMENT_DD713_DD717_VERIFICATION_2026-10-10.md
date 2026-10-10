# DD-713…DD-717 — TokenUsage → AICapability(code) exact scoped direct-FK verification

**Date:** 2026-10-10 · **Branch:** `docs/architecture-branch-2`.
**Source audit:** `Development/AI_TOKEN_USAGE_CAPABILITY_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`.
**Source-audit commit:** `eba5fa1f69ccb819ab2087dd7b42e97f8f5690a2` / tree `2ae5deac2a68155f8202c622aafec3ffeb7e7f61`.
**Verified corrected implementation:** `495a19e2608c1c6bf6ec10e04954063dd12b969b` / tree `58f0d4955e62c87a16263e00111428263ade2a09`.
**Status:** SOURCE AUDIT, CORRECTED IMPLEMENTATION, CANONICAL PROMOTION, AND SEPARATE STATE CLOSURE INDEPENDENTLY EXACT-HEAD VERIFIED. DD-717 STATE CLOSED; DD-718 IMPLEMENTATION REMAINS GATED BY THE NEXT SOURCE AUDIT.

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

This atomic promotion includes DD-17's eight fixed acceptance entries, DD-18's DD-713…DD-717 decisions, DD-19 traceability, the active manifest and 57 prior active checkpoint projections. Canonical promotion `5240e4b06c9ec798b1d36a5a1cd9436336c70eef` / tree `e7df7e43a1dc761c6c925bbd7c7678ea9797fdfe` independently passed its exact-HEAD gates:
- [Core Service Verify 38019578643](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38019578643): Core job `114117364506` **1719/1719 PASS**; PostgreSQL job `114117364443` **540/540 PASS** with full bootstrap.
- [Database Verify 38019578597](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38019578597): job `114117364263`, **48 migrations / 42 SQL verifications PASS**.
- [Web Boundary Verify 38019578615](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38019578615): job `114117364157`, **PASS**.

The earlier state-closure attempt `39e39a745c7e563a1954d4780cd8fc1f39cc473a` failed Core projection-consistency guards and is **not certified**. The forward-only correction `9512f7b4fcd1912e30fda3f8a7b1c4b21d286e9a` independently passed all four exact-HEAD gates; DD-717 state closure is effective. Historical VC27 review is not represented as newly performed.

## Separate state-closure verification

The state-closure correction `9512f7b4fcd1912e30fda3f8a7b1c4b21d286e9a` / tree `53e819a13722dfd803e2ef60fb884e287392f4cb` passed independently:
- [Core Service Verify `38069092853`](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38069092853): Core job `114262659078` **1719/1719 PASS**, fail 0, skipped 0.
- The same Core workflow's PostgreSQL-context job `114262659232`: **540/540 PASS**, fail 0, skipped 0, full bootstrap.
- [Database Verify `38069092864`](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38069092864): job `114262659806`, **48 migrations / 42 SQL verification files PASS**.
- [Web Boundary Verify `38069092859`](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38069092859): job `114262659094`, **PASS**.

No RawSource, test, migration, RLS or application code changes were part of the state-closure correction.

Invariants: **9 equal Industries / 41 canonical Management Systems / 181 Industry tables / 2,962 preserved source requirement IDs / exactly TENANT_STAFF_APP and TENANT_USER_APP**. PR #2 stays OPEN/DRAFT/UNMERGED; production readiness NOT CLAIMED.
