# DD-578…DD-582 verification — Document derivative-parent current evidence

**Date:** 2026-10-06  
**Source audit:** `Development/DOCUMENT_DERIVATIVE_PARENT_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD:** `2a31d0251971dbf93e093b630e320a4cef1c96ef`  
**Corrected implementation HEAD/tree:** `55a88b430cdcc929ea6730582d04b21fc7b154ef` / `cc49b04e46a05045eaa1053d6cc01b4ca13731a8`

## Entry/source-audit gate

DD-573…DD-577 closure `caf999337a7642d1a64fb3363a0185967fe9cb1a` / tree `76489cb02adf88e9d15ab38dbe6f9e74c0c15169` passed exact-head Core **1475/1475**, PostgreSQL **536/536** plus bootstrap, Database **48 migrations / 42 SQL verification files**, Web PASS. Source-audit HEAD `2a31d0251971dbf93e093b630e320a4cef1c96ef` then passed push + pull-request Core/PostgreSQL/Database/Web before implementation.

## Forward-only correction history

Initial implementation `830e05347b830d73a50c87b86412fffec2376707` correctly added the bounded reader/store/tests, but its PostgreSQL fixtures used sensitivity values inconsistent with migration 0031's existing derivative>=parent trigger. PostgreSQL acceptance `DOC-DERIV-PG-001…004` therefore failed during fixture insertion with `document derivative cannot cross scope, residency, or lower sensitivity` (**536/540 pass, 4 fail**). No production schema or trigger defect was found.

Forward-only correction `55a88b430cdcc929ea6730582d04b21fc7b154ef` aligned derivative fixture/test sensitivity with the canonical migration-0031 rank order and retained the runtime non-lowering floor. No authority boundary was widened.

## Exact-head corrected implementation gate

Corrected implementation `55a88b430cdcc929ea6730582d04b21fc7b154ef` / tree `cc49b04e46a05045eaa1053d6cc01b4ca13731a8` passed:
- Core push run `37427814365` / job `112151378654`: **1483/1483 PASS**, fail/skip 0.
- PostgreSQL same run / job `112151378372`: **540/540 PASS**, fail/skip 0; full database bootstrap PASS.
- Database push run `37427814352` / job `112151378163`: PASS with unchanged **48 migrations / 42 SQL verification files**.
- Web push run `37427814232` / job `112151377763`: PASS.
- Pull-request Core/Database/Web workflows on the same corrected implementation HEAD also passed.

## Bounded result

The implementation performs exactly one same-RequestContext derivative-parent relationship read, proves exact persisted derivative/parent linkage and derivativeType, exact Tenant/scope/nullable-Industry/residency continuity, parent ACTIVE+CLEAN currentness and the source-owned migration-0031 sensitivity non-lowering floor. Success preserves the exact relationship reference and raw lifecycle/sensitivity evidence.

ACL inheritance/non-widening remains explicitly unresolved because the current source does not yet own a complete parent-child ACL reduction/comparison contract. No ResourceDescriptor/source-resource authorization, final RBAC/ABAC/commercial/security policy, provider/decryption/signing/grants, download/share/delete, StoragePort dispatch, purge/rebuild/mutation or event authority is added. No schema/RLS/role/grant/route/frontend/RawSource change occurred.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-578…DD-582 can be closed.
