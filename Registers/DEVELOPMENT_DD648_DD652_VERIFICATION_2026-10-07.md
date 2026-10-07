# DD-648…DD-652 verification — RAG bound-Document ACL current-effect evidence

**Date:** 2026-10-07  
**Source audit:** `Development/RAG_CHUNK_BOUND_DOCUMENT_ACL_CURRENT_EFFECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source-audit HEAD:** `07ce0255ba156f112b6ab131c98f1831a1129889`  
**Verified implementation HEAD/tree:** `52f961bf63d46457023421c56c457d497aec2866` / `ca0ec46e73f2d9f4e63fcae255b7d7b4679708fc`

## Entry gate

DD-643…DD-647 state closure `d48e5084722ad4754e7fc05afa4727242589430a` / tree `b52e92ca84dd83a1ae84a7ff72951f8f52ffc891` passed exact-head Core **1596/1596**, PostgreSQL **540/540** plus bootstrap, Database 48/42 and Web. DD-648…DD-652 source-audit HEAD then passed exact-head Core/PostgreSQL/Database/Web before implementation.

## Exact-head implementation gate

Implementation HEAD `52f961bf63d46457023421c56c457d497aec2866` / tree `ca0ec46e73f2d9f4e63fcae255b7d7b4679708fc` passed:
- Core push run `37657356452` / job `112915743971`: **1606/1606 PASS**, fail/skip 0.
- PostgreSQL same run / job `112915743471`: **540/540 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37657356156` / job `112915742444`: PASS; database inventory remains **48 migrations / 42 SQL verification files**.
- Web run `37657356254` / job `112915742308`: PASS.
- Pull-request Core/Database/Web workflows on the same implementation HEAD also passed.

## Bounded result

The batch reuses exact DD-647 evidence first. Unbound RAG sources perform zero ACL-layer reads and return frozen parent-only evidence without inferring access. Bound sources invoke DD-562 exactly once with the same RequestContext, persisted Document id, explicit supplied DocumentAclPermission and trusted currentTimeIso, then require exact Document identity/version/security continuity.

The exact DD-562 envelope, including current/expired entries and DENY/ALLOW/NONE effect evidence, remains evidence only. The implementation does not infer RAG→Document permission mapping, source-resource fallback, final authorization, raw RAGSource/RAGChunk ACL semantics, retrieval/ranking/grounding/citation, prompt-injection policy, provider/model routing, inference, mutation/events or AI execution. No schema/RLS/role/grant/route/frontend/worker/scheduler/RawSource change occurred.

## Canonical promotion gate

Canonical DD/traceability/state promotion must independently pass exact-head Core/PostgreSQL/Database/Web before DD-648…DD-652 state closure.

## Canonical promotion verified; state closure staged — 2026-10-07

Canonical promotion HEAD `cbe35ba3ba32a43f37b2ee9ab19473be17ad5152` / tree `86cdb892b2a62e8052db9f44d4873255e0dee6b8` passed exact-head push gates:
- Core run `37659848435` / job `112924260005`: **1606/1606 PASS**, fail/skip 0.
- PostgreSQL same run / job `112924259462`: **540/540 PASS**, fail/skip 0; full database bootstrap PASS.
- Database run `37659848249` / job `112924259451`: PASS with **48 migrations / 42 SQL verification files**.
- Web run `37659848285` / job `112924260829`: PASS.

Pull-request Core/Database/Web workflows on the same promotion HEAD also passed. This state-closure commit must independently pass the same four gates before DD-648…DD-652 is closed and another source audit may open.
