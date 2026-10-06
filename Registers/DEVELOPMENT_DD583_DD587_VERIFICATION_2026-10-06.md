# DD-583…DD-587 verification — Document derivative-parent raw paired ACL evidence

**Date:** 2026-10-06  
**Source audit:** `Development/DOCUMENT_DERIVATIVE_PARENT_RAW_ACL_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD:** `19264d0a10f4832720c172d06b4ab0b8ad0e31e7`  
**Implementation HEAD/tree:** `f416c6107fc3d3c3b96e74b5dc9e829a13764397` / `3671c815820bbc3eeb63e61e79ab69c9aba01935`

## Entry/source-audit gate

DD-578…DD-582 state closure `d0267eab8707d66c09660727cdbc1ea2dbd8dc8c` / tree `f7a6c7c7f0ecfa9c3ca2e28dc89c0c2a5b57a3ac` passed exact-head Core **1483/1483**, PostgreSQL **540/540** plus bootstrap, Database **48 migrations / 42 SQL verification files**, and Web. Source-audit HEAD `19264d0a10f4832720c172d06b4ab0b8ad0e31e7` then passed exact-head Core/PostgreSQL/Database/Web before implementation.

## Exact-head implementation gate

Implementation HEAD `f416c6107fc3d3c3b96e74b5dc9e829a13764397` / tree `3671c815820bbc3eeb63e61e79ab69c9aba01935` passed:
- Core push run `37447950172` / job `112217220427`: **1491/1491 PASS**, fail/skip 0.
- PostgreSQL same run / job `112217220895`: **540/540 PASS**, fail/skip 0; full database bootstrap PASS.
- Database push run `37447949976` / job `112217219541`: PASS with unchanged **48 migrations / 42 SQL verification files**.
- Web push run `37447950048` / job `112217219901`: PASS.

## Bounded implementation result

The implementation invokes exact DD-582 derivative-parent current evidence first, then performs exactly one same-RequestContext raw ACL read for the exact persisted derivative id and exactly one for the exact persisted parent id. Empty arrays remain valid raw evidence. Any returned ACL row bound to another document fails closed. Success preserves exact parent, arrays and entry references in a frozen outer envelope.

No ACL-set comparison, inheritance, merge, reduction, expiry/effect interpretation, subject matching, non-widening decision, source-resource authorization, final access decision, signed grant, StoragePort dispatch, mutation or event authority is introduced. No schema/RLS/role/grant/route/frontend/RawSource change occurred.

## Promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-583…DD-587 can be closed.
