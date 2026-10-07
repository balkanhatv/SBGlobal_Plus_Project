# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-AI-RAG-CHUNK-SOURCE-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `8d7406744ac6b79006d519146f6ee34a893e3dce` / tree `142ffa9332a753e95c47ee674b0e9045426c484d`
**Updated:** 2026-10-07 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-07):** DD-628…DD-632 RAGChunk→parent RAGSource current-evidence composition is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-628…DD-632 is the current governed backend-only RAGChunk→currently readable parent RAGSource relationship-evidence composition. It reads the exact RAGChunk first, then reads exactly persisted chunk.sourceId once under the same supplied RequestContext and applies only DD-194.

Verified exact-head implementation basis `8d7406744ac6b79006d519146f6ee34a893e3dce` / tree `142ffa9332a753e95c47ee674b0e9045426c484d`: **1570/1570 Core**, **540/540 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success proves only exact DD-194 RAGChunk→RAGSource id/Tenant/null-safe-Industry/scope/residency/retention plus sensitivity non-lowering relationship evidence. RAGSource ACTIVE/latest state, DD-193 Document binding, Document/source ACL/access/storage, chunk ACL interpretation, embedding-model eligibility, vector/search/retrieval/ranking/grounding, provider/model routing and AI execution remain separate.

Evidence: `Registers/DEVELOPMENT_DD628_DD632_VERIFICATION_2026-10-07.md`. Source audit: `Development/RAG_CHUNK_SOURCE_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and stage DD-628…DD-632 state closure before another source audit.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
