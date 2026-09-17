# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-17 · **Current checkpoint:** `DEV-AUTHZ-POLICY-GRAMMAR-001`

| Layer | Owner / evidence | Current boundary |
|---|---|---|
| Governance | Governing/MASTER_INSTRUCTION_v2_5.md; MASTER_PROMPT_v2_5.md | Active v2.5 plus dated reconciliations |
| Source | RawSourceCorpus; SOURCE_REGISTRY.md | Immutable provenance; current explicit authority resolves interpretation |
| Foundation | F-00…F-15 | WHAT/WHY/WHO; completed scope revalidated |
| Architecture | A-00…A-12 / ADR-001…020 | HOW; completed scope revalidated |
| Detailed Design | DD-00…DD-31; nine Industry DDs; DD-036…044 decisions in DD-18 | Exact contracts; DD-044 Clerk session-security executable; Authorization grammar is now executable Development contract; reader/evaluator/compiler remain unfinished |
| Source traceability | F5_END_TO_END_SOURCE_REQUIREMENT_TRACEABILITY.md | 2,962 stable child IDs; dependency routes, not executable claims |
| Development | ../Development/CORE_SERVICE_CHECKPOINT.md; ../Development/AUTHORIZATION_PDP_ABAC_PERSISTENCE_PREREQUISITE.md; ../Development/AUTHORIZATION_POLICY_GRAMMAR_V1.md | Core + Clerk security + PLATFORM_GLOBAL Authorization persistence + deterministic policy grammar tested; reader/evaluator/Commercial/transports unfinished |
| SQL / CI | migrations 0001…0035; 29 verification files; apply-and-verify.sh | Exact-head PostgreSQL+pgvector regression verified at `1b0f90dc…` |
| Current audit | ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-17.md | Zero-trust findings/correction lineage; current continuation is projected by this index/checkpoint |
| Historical all-stages audit | ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md | Historical defects/corrections/evidence retained |
| Historical all-stages file scope | ALL_STAGES_FILE_COVERAGE_2026-09-13.md | Historical complete file classification/coverage |
| State | ../State/PROJECT_STATE.md; ../State/PROJECT_MANIFEST.json | Human- and machine-readable current projections synchronized after executable checkpoint advances |

Current verified executable checkpoint: `1b0f90dc900e0ab49cde2f8305f11cfadadae31c` (tree `a48a2b8cd4d9447522ca2c5721d23a85175dbfa8`).
- Core Service Verify `35247193977`: jobs `105290285420` (**71/71 Core**) and `105290285531` (**13/13 PostgreSQL**) PASS.
- Database Verify `35247193986`: job `105290285053` PASS.
- Current inventory: 71 Core/server tests, 13 PostgreSQL tests, 35 migrations, 29 verification files, 9 Industries / 41 canonical MS / 181 Industry tables.

Next governed action: implement only the Authorization read store for exact CURRENT tenant/platform compiled snapshots plus applicable ACTIVE ABAC policies, validating persisted v1 payloads through the locked grammar. PDP evaluation/compiler work follows later.

RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 remains draft/review only.
