# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-AI-RAG-CHUNK-BOUND-DOCUMENT-ACL-CURRENT-EFFECT-EVIDENCE-READER-001`
**Current executable audit basis:** `cbe35ba3ba32a43f37b2ee9ab19473be17ad5152` / tree `86cdb892b2a62e8052db9f44d4873255e0dee6b8`
**Updated:** 2026-10-07 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-07):** DD-648…DD-652 canonical promotion passed exact-head Core/PostgreSQL/Database/Web at the basis above. This state-closure commit must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-648…DD-652 is the current governed backend-only composition of exact DD-647 RAGChunk→RAGSource→optional current Document + embedding Model/Provider lineage with optional bound-Document DD-562 ACL current-effect evidence. Unbound sources perform zero ACL-layer reads; bound sources re-read the exact persisted Document under the same RequestContext using one explicit caller-supplied DocumentAclPermission and trusted currentTimeIso.

Verified canonical promotion basis `cbe35ba3ba32a43f37b2ee9ab19473be17ad5152` / tree `86cdb892b2a62e8052db9f44d4873255e0dee6b8`: **1606/1606 Core**, **540/540 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success proves only DD-647 lineage plus exact DD-562 ACL-layer current-effect evidence with re-read Document identity/version/security continuity. DENY/ALLOW/NONE remains ACL-layer evidence only. No RAG→Document permission mapping, source-resource fallback, final authorization, raw RAGSource/RAGChunk ACL interpretation, retrieval/filter/ranking/reranking/grounding/citation, prompt-injection policy, provider/model routing, inference, mutation/event or AI execution authority is introduced.

Evidence: `Registers/DEVELOPMENT_DD648_DD652_VERIFICATION_2026-10-07.md`. Source audit: `Development/RAG_CHUNK_BOUND_DOCUMENT_ACL_CURRENT_EFFECT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this state-closure commit at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, DD-648…DD-652 is closed; source-audit the next independently source-complete backend batch.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
