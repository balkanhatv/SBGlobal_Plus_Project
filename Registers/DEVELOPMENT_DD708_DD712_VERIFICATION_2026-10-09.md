# DD-708…DD-712 — scoped TokenUsage → global AIProvider persisted direct-FK verification

**Date:** 2026-10-09. **Branch:** `docs/architecture-branch-2`.
**Source audit:** `Development/AI_TOKEN_USAGE_PROVIDER_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`.
**Source-audit HEAD:** `a8a5668929aa6cf684ddef9db255137afe6f1669` / tree `f57b072b4f7bc732fe9760f437c9a9017dd24c16`.
**Implementation HEAD:** `161c59f7abd1c7dfa58b8cad35ff329937c8cb1b` / tree `e1c2e15c0910851cc39d3b5c845c6a17e3c34235`.
**Status:** SOURCE AUDIT + IMPLEMENTATION EXACT-HEAD VERIFIED. Canonical promotion STAGED / PENDING own CI. State closure NOT YET VERIFIED.

## Ordered verified gates

DD-703…DD-707 closure `8bdb0a86130fb0ca44cf93ef6f5d6c67b28754a8` independently passed Core 1703/1703, PostgreSQL 540/540, Database 48/42, Web.

DD-708…DD-712 source-audit `a8a5668929aa6cf684ddef9db255137afe6f1669` independently passed:
- [Core Service Verify 37960387107](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37960387107) / Core job `113921438690`: **1703/1703 PASS**, fail/skipped 0.
- Same run / PostgreSQL job `113921438948`: **540/540 PASS**, fail/skipped 0, full bootstrap PASS.
- [Database Verify 37960387012](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37960387012) / job `113921438046`: **48 migrations / 42 verification files PASS**.
- [Web Boundary Verify 37960387018](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37960387018) / job `113921438368`: **PASS**.

Bounded implementation `161c59f7abd1c7dfa58b8cad35ff329937c8cb1b` independently passed:
- [Core Service Verify 37960735504](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37960735504) / job `113922619611`: **1711/1711 PASS**, fail 0, skipped 0 (+8 fixed AIUSAGE-PROVREAD cases).
- Same run / PostgreSQL job `113922619203`: **540/540 PASS**, fail 0, skipped 0, full database bootstrap PASS.
- [Database Verify 37960735634](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37960735634) / job `113922620247`: **48 migrations / 42 SQL verification files PASS**.
- [Web Boundary Verify 37960735613](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37960735613) / job `113922619952`: **PASS**.
Every job asserted the exact relevant tested HEAD/tree. PR checks are supplemental evidence.

## Bounded implementation scope

New `src/core/ai/token-usage-provider-current-evidence-reader.ts`, one Core index export and `tests/core/ai-token-usage-provider-current-evidence-reader.test.mjs`. Existing DD-122 scoped TokenUsage port and DD-107 global Provider metadata port are composed under their existing authorities; DD-201 direct TokenUsage→AIProvider FK predicate is reused unchanged. Scoped usage is read first, validation precedes Provider lookup, one exact persisted Provider-ID lookup, null/error fail-closed, frozen original references/raw decimal precision. No atomic cross-record snapshot.

No Provider lifecycle/health/eligibility, credential/secret, principal currentness, Tenant/Industry allowlist, entitlement, budget/billing, routing, inference, agent/tool/embedding/media/RAG, API/UI, events or mutation authority. No migration, schema, RLS, role, grant, RawSource or `main` change; no existing test removed/weakened.

## Canonical promotion staged

DD-17's eight fixed acceptance IDs, DD-18's five bounded decisions (DD-708…DD-712), DD-19 traceability, manifest and all 57 active checkpoint projections are prepared in this atomic canonical promotion. **This report does not certify the promotion commit until that commit's own Core/PostgreSQL/Database/Web gates pass.** If an inconsistency appears, stop and apply the smallest forward-only correction and verify the new HEAD. After independently verifying promotion, publish a separate independently verified state closure before DD-713.

Invariants: **9 equal Industries / 41 Management Systems / 181 Industry tables / 2,962 preserved source requirements / exactly TENANT_STAFF_APP and TENANT_USER_APP**. PR #2 remains OPEN/DRAFT/UNMERGED; production readiness NOT CLAIMED.
