# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-17 · **Current checkpoint:** `DEV-AUTHZ-PDP-001`

| Layer | Owner / evidence | Current boundary |
|---|---|---|
| Governance | Governing/MASTER_INSTRUCTION_v2_5.md; MASTER_PROMPT_v2_5.md | Active v2.5 plus dated reconciliations |
| Source | RawSourceCorpus; SOURCE_REGISTRY.md | Immutable provenance; current explicit authority resolves interpretation |
| Foundation | F-00…F-15 | WHAT/WHY/WHO; completed scope revalidated |
| Architecture | A-00…A-12 / ADR-001…020 | HOW; completed scope revalidated |
| Detailed Design | DD-00…DD-31; nine Industry DDs; DD-036…044 decisions in DD-18 | Exact contracts; DD-044 Clerk session-security executable; PDP grammar/evaluator remain Development work |
| Source traceability | F5_END_TO_END_SOURCE_REQUIREMENT_TRACEABILITY.md | 2,962 stable child IDs; dependency routes, not executable claims |
| Development | ../Development/CORE_SERVICE_CHECKPOINT.md; ../Development/AUTHORIZATION_PDP_ABAC_PERSISTENCE_PREREQUISITE.md | Core + Clerk security + PLATFORM_GLOBAL Authorization persistence prerequisite tested; PDP grammar/evaluator/Commercial/transports unfinished |
| SQL / CI | migrations 0001…0035; 29 verification files; apply-and-verify.sh | Exact-head PostgreSQL+pgvector regression verified at `54e6fd0…` |
| Current audit | ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-17.md | Zero-trust current-state findings and continuation order |
| Historical all-stages audit | ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md | Historical defects/corrections/evidence retained |
| Historical all-stages file scope | ALL_STAGES_FILE_COVERAGE_2026-09-13.md | Historical complete file classification/coverage |
| State | ../State/PROJECT_STATE.md; ../State/PROJECT_MANIFEST.json | Human-readable current state; machine-readable projection requires exact-evidence synchronization whenever executable checkpoint advances |

Current verified executable checkpoint: `54e6fd0972699e31c4650e54faa9e41086f55755`.
- Core Service Verify `35242938042`: jobs `105275719996` and `105275720386` PASS.
- Database Verify `35242938026`: job `105275719655` PASS.
- Current inventory: 65 Core/server tests, 13 PostgreSQL tests, 35 migrations, 29 verification files, 9 Industries / 41 canonical MS / 181 Industry tables.

Next governed action: lock deterministic executable permission-set v1 + ABAC expression v1 grammar before implementing Authorization reader/evaluator/compiler work.

RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 remains draft/review only.
