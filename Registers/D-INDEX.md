# D-INDEX — Current Canonical / Development Index
**Current checkpoint:** `DEV-AI-RAG-CHUNK-SOURCE-DOCUMENT-MODEL-PROVIDER-CURRENT-EVIDENCE-READER-001`
**Current executable audit basis:** `3c23b1e034630dfa76ea9263b683b9063371f059` / tree `6c681a2ca41ad47edcc365b9c890bd0f332a8716`
**Updated:** 2026-10-07 · **Branch:** `docs/architecture-branch-2`

> **Current audit gate (2026-10-07):** DD-643…DD-647 RAGChunk source/Document + eligible embedding Model/Provider lineage evidence is implemented and exact-head verified at the basis above. This canonical promotion must independently pass before batch closure. Complete-project downstream audit remains **CLEAN / CLOSED** through VC27-111. Production readiness is **NOT CLAIMED**.

DD-643…DD-647 is the current governed backend-only RAGChunk→parent RAGSource→optional current Document lineage composed with eligible embedding AIModel→exact AIProvider binding evidence. It reuses exact DD-642 evidence, reads exactly preserved chunk.sourceId once under the same RequestContext, applies DD-194, then follows DD-193 with zero-or-one exact Document metadata read.

Verified exact-head implementation basis `3c23b1e034630dfa76ea9263b683b9063371f059` / tree `6c681a2ca41ad47edcc365b9c890bd0f332a8716`: **1596/1596 Core**, **540/540 PostgreSQL** plus full bootstrap, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests.

Success proves only composed DD-642 + DD-194 + DD-193 lineage/current relationship evidence. Provider status/health/credentials/capabilities/regions/security/residency/version, Provider/Model routing compatibility, Tenant/Industry allowlists, RAGSource latest/current selection, Document ACL/access/storage/source-resource/signed-url authority, chunk ACL interpretation, retrieval/filtering/ranking/grounding/citation/prompt-injection policy and AI/provider execution remain separate.

Evidence: `Registers/DEVELOPMENT_DD643_DD647_VERIFICATION_2026-10-07.md`. Source audit: `Development/RAG_CHUNK_SOURCE_DOCUMENT_MODEL_PROVIDER_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`. Current status is bounded Development **IN PROGRESS**; production readiness is **NOT CLAIMED**.

Next: Verify this canonical promotion at its exact HEAD with Core/PostgreSQL/Database/Web. Once green, record promotion evidence and stage DD-643…DD-647 state closure before another source audit.

Invariants: **9 equal Industries / 41 canonical MS / 181 Industry tables / 2,962 preserved source requirements**; exactly `TENANT_STAFF_APP` and `TENANT_USER_APP` as logical Tenant mobile app classes. RawSource unchanged; `main` unmerged; PR #2 draft/unmerged.
