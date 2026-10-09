# DD-703…DD-707 — TokenUsage ↔ AIModel model/provider pair evidence verification

**Date:** 2026-10-09. **Branch:** `docs/architecture-branch-2`.
**Source audit:** `Development/AI_TOKEN_USAGE_MODEL_PAIR_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`.
**Source-audit HEAD:** `e57dc8473e26ae34bfde4c3040f8e4cde3d183bc`.
**Implementation HEAD:** `ed20e0ee0889997a501d3981c22ccce9860ca10e` / tree `ce1a9e2c73a4f9d9f5c1c5fa41807968f76092d6`.

## Ordered exact-HEAD verification

Previous DD-698…DD-702 state closure `522f61f5d2898f6291ee87ec36836391429ded0c` independently passed Core 1695/1695, PostgreSQL 540/540, Database 48 migrations / 42 SQL verification files, and Web. Source-audit `e57dc8473e26ae34bfde4c3040f8e4cde3d183bc` separately passed:
- [Core Service Verify 37943813347](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37943813347): success.
- [Database Verify 37943813541](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37943813541): success.
- [Web Boundary Verify 37943813540](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37943813540): success.

Exact implementation commit `ed20e0ee0889997a501d3981c22ccce9860ca10e` separately passed all push-triggered verification jobs:
- [Core Service Verify 37944290544](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37944290544) / Core job `113866421961`: **1703/1703 PASS**, fail 0 (eight added `AIUSAGE-MODELREAD-*` cases); PostgreSQL job `113866421655`: **540/540 PASS** with full database bootstrap.
- [Database Verify 37944290612](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37944290612) / job `113866422318`: **PASS**, 48 migrations / 42 SQL verification files.
- [Web Boundary Verify 37944290625](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/37944290625) / job `113866422053`: **PASS**.
- Corresponding PR-triggered runs `37944300742`, `37944300686`, `37944300633` also succeeded against the same implementation SHA.

## Bounded implementation

New `src/core/ai/token-usage-model-pair-current-evidence-reader.ts`, its `src/core/index.ts` export and `tests/core/ai-token-usage-model-pair-current-evidence-reader.test.mjs` implement the frozen DD-703…DD-707 source audit.

The reader loads one exact Tenant/Industry-scoped TokenUsage by original `RequestContext` and usage ID, validates necessary DD-196 persisted identifiers, then loads one exact global AIModel by the persisted `modelId`. It reuses the existing DD-196 composite (model,provider) identity predicate, rejects null/malformed/wrong linkage, and returns frozen original raw `{usage,model}` references without numeric conversion or status normalization. Dependency errors propagate; there is no retry/fallback, context widening, Provider lookup or atomic cross-record snapshot.

The evidence grants **no** Provider/model eligibility, active-status admission, current principal authorization, Tenant/Industry allowlist, entitlement/budget/quota, billing, RAG/media/tool/agent/inference execution, API/UI or mutation authority.

No schema/migration/RLS/role/grant, Industry registry, RawSource, existing test, branch-protection or mobile-binary model was changed by this feature. Preserve 9 equal Industries, 41 canonical Management Systems, 181 Industry tables, 2,962 source requirements, and exactly `TENANT_STAFF_APP` and `TENANT_USER_APP`.

## Current gate and next action

**Source audit and implementation are independently VERIFIED at their respective exact HEADs.** This register records the verification without prematurely claiming canonical promotion. The active `State/PROJECT_MANIFEST.json`, DD-17/DD-18/DD-19, checkpoint projections and state files still represent DD-698…DD-702 until DD-703…DD-707 is atomically promoted.

**Next:** Canonically promote the eight fixed acceptance IDs, five DD decisions, DD-19 traceability, active manifest and projections with this already-verified implementation evidence. Preserve the REPO-007 current-CI consistency guard and all historical proof. Independently verify the promotion's exact HEAD with Core/PostgreSQL/Database/Web, then separately verify state closure before subsequent development. Stop forward progress if a real defect appears.

PR #2 remains draft/open/unmerged; do not touch `main`, RawSource or force-push. Development remains **IN PROGRESS**; production readiness **NOT CLAIMED**.
