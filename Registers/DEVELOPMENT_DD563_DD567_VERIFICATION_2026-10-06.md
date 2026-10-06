# DD-563…DD-567 verification — Document ACL current-effect + physical StorageObject binding evidence

**Date:** 2026-10-06  
**Source audit:** `Development/DOCUMENT_ACCESS_ACL_CURRENT_EFFECT_STORAGE_BINDING_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD/tree:** `0635b217eac453f3c82b96d02d06ddcaa744be39` / `7a8abb776b4293d4c09f82b9f7d7ee9c86541009`  
**Implementation HEAD/tree:** `f4777cbc0d3dce1ec7c93c7bc926357150cf8b21` / `dc0160d0bd2237bb0b4d206ae3319488aa0de054`

## Entry gate

DD-558…DD-562 state closure `6c0bed30054c6afa4d58c9e109aec015f191d46f` passed exact-head Core **1453/1453**, PostgreSQL **536/536** plus bootstrap, Database and Web. The DD-563…DD-567 source-audit HEAD subsequently passed exact-head Core/PostgreSQL/Database/Web before implementation.

## Implementation verification so far

Implementation HEAD `f4777cbc0d3dce1ec7c93c7bc926357150cf8b21` passed:
- Core push run `37401669757` / job `112070011924`: **1461/1461 PASS**, fail/skip 0.
- PostgreSQL same run / job `112070011740`: **536/536 PASS**, fail/skip 0; full database bootstrap PASS.
- Web push run `37401669777` / job `112070011743`: PASS.

Database Verify did not trigger for the two-file server-reader/test implementation path. This register commit exists specifically to place the exact implementation tree under the repository's Core/PostgreSQL/Database/Web verification paths. No exact-head Database claim is made until this staging commit passes.

## Bounded implementation result

The new server-internal reader establishes exact DD-562 current ACL-effect evidence first, then performs exactly one DD-086 physical binding read using only the exact `parent.parent.candidate.documentId + storageObjectId` linkage. Binding null returns null; binding dependency errors propagate unchanged. Success returns frozen `{ parent, binding }` preserving exact references.

ACL `effectEvidence`, current/expired partitions and raw physical locator/integrity fields retain their existing meanings only. The composition does not choose explicit ACL versus source-resource inheritance, treat `NONE` as deny/fallback, map an OperationContract to an ACL permission, evaluate RBAC/ABAC/entitlement/commercial/sensitivity/residency/step-up policy, decrypt/select provider metadata, sign grants, expose download/share/delete authority, dispatch StoragePort or mutate Document/Storage/ACL state.

No schema, migration, SQL verification, RLS, role, grant, route, frontend, worker, scheduler or RawSource change occurred.

## Exact-head staging gate

This verification-staging commit must pass Core/PostgreSQL/Database/Web on the same HEAD before canonical DD-563…DD-567 promotion. Production readiness is not claimed.

## Exact-head staging verified; canonical promotion staged — 2026-10-06

Verification-staging HEAD `66d6a0b6bbbd0aa694768a03ec05af8c28ac4926` / tree `b0eafbc82217c76999c09e07c66f90498fa3ce9c` passed exact-head push gates:
- Core run `37401819394` / job `112070486915`: **1461/1461 PASS**, fail/skip 0.
- PostgreSQL same run / job `112070486920`: **536/536 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37401819367` / job `112070486701`: PASS; inventory remains **48 migrations / 42 SQL verification files**.
- Web run `37401819369` / job `112070486797`: PASS.
Pull-request Core/Database/Web workflows on the same staging HEAD also passed.

Canonical promotion is staged; its own exact-head Core/PostgreSQL/Database/Web gates must pass before state closure.

## Canonical promotion verified; state closure staged — 2026-10-06

Corrected canonical promotion HEAD `9633b14ba1068a3ca619562aa4dbcbb3e192d7ab` / tree `eb14f5f3c0ec9ea15024dc678998712f8d6e126d` passed exact-head push gates:
- Core run `37404758594` / job `112079732679`: **1461/1461 PASS**, fail/skip 0.
- PostgreSQL same run / job `112079732525`: **536/536 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37404758622` / job `112079732454`: PASS with **48 migrations / 42 SQL verification files**.
- Web run `37404758619` / job `112079732598`: PASS.

Initial promotion `81ac5e802235cdcba0ae1d71e999beca51b085fe` was rejected only because active projection update dates remained 2026-10-05 while the manifest moved to 2026-10-06 (REPO-011). Forward-only correction `9633b14ba1068a3ca619562aa4dbcbb3e192d7ab` aligned those current projection dates without changing runtime/design semantics.

This state-closure commit must independently pass Core/PostgreSQL/Database/Web before DD-563…DD-567 is closed and another source audit opens.
