# DD-558…DD-562 verification — Document ACL current-effect evidence

**Date:** 2026-10-05  
**Source audit:** `Development/DOCUMENT_ACCESS_ACL_CURRENT_EFFECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD/tree:** `ef673b40f443b272b2a7671f51dd9c11b0571f40` / `ba39c0922239f3c0a4748a7871c4e5f2870ff39e`  
**Implementation HEAD/tree:** `7cbf93ff1295765995bb83a97122920f958cc1f1` / `8b9907bb849f9251d77bbdd977ba456f4a437493`

## Entry gate

DD-553…DD-557 state closure `e1af3f91183d1798498b6d397e333708fe86e2df` / tree `5e676ea6ab9cd176b0f46f225a402e476e8fc978` passed Core **1444/1444**, PostgreSQL **536/536** plus bootstrap, Database and Web. DD-558…DD-562 source-audit HEAD subsequently passed exact-head Core/PostgreSQL/Database/Web before implementation.

## Exact-head implementation gate

Implementation HEAD `7cbf93ff1295765995bb83a97122920f958cc1f1` / tree `8b9907bb849f9251d77bbdd977ba456f4a437493` passed:
- Core run `37350379587` / job `111899449548`: **1453/1453 PASS**, fail/skip 0.
- PostgreSQL same run / job `111899449137`: **536/536 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37350379415` / job `111899446019`: PASS; inventory remains **48 migrations / 42 SQL verification files**.
- Web run `37350379688` / job `111899449933`: PASS.

## Bounded result

The reader reuses exact DD-542 ACL subject evidence, accepts one explicit trusted currentTimeIso, partitions only matched entries into frozen current/expired arrays using optional validUntil, preserves exact matched-entry references/order and derives ACL-layer effectEvidence with explicit DENY precedence.

No upload-session policy, source-resource fallback, full authorization, RBAC/ABAC/entitlement/commercial/sensitivity/residency/step-up decision, StorageObject lookup, signer/grant/download/share/delete/mutation authority, schema/RLS/role/grant/route/frontend/RawSource change is introduced.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-558…DD-562 state closure.
