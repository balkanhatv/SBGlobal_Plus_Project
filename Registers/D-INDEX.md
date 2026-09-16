# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-17 · **Current checkpoint:** `../Development/CORE_SERVICE_CHECKPOINT.md`

| Layer | Owner / evidence | Current boundary |
|---|---|---|
| Governance | Governing/MASTER_INSTRUCTION_v2_5.md; MASTER_PROMPT_v2_5.md | Active v2.5 plus dated reconciliations |
| Source | RawSourceCorpus; SOURCE_REGISTRY.md | Immutable provenance; current explicit authority resolves interpretation |
| Foundation | F-00…F-15 | WHAT/WHY/WHO; completed scope revalidated |
| Architecture | A-00…A-12 / ADR-001…020 | HOW; completed scope revalidated |
| Detailed Design | DD-00…DD-31; nine Industry DDs | Exact contracts, including DD-036…040 decisions and DBA-001…013; unbound Core read contracts recorded in DEV-CORE-MAP-001 |
| Source traceability | F5_END_TO_END_SOURCE_REQUIREMENT_TRACEABILITY.md | 2,962 stable child IDs; dependency routes, not executable claims |
| Development | ../Development/CORE_SERVICE_CHECKPOINT.md; ../Development/CORE_PERSISTENCE_ADAPTER_MAP.md | Tested Core kernel / pooled PostgreSQL adapter and pending read-side persistence contracts; prior database counts remain in DB_IMPLEMENTATION_MATRIX.md |
| SQL / CI | migrations 0001…0032; 26 verification files; apply-and-verify.sh | Clean PostgreSQL+pgvector checkpoint verified |
| Historical all-stages audit | ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md | Defects, corrections, blast radius, actual Git/CI and gate |
| Historical all-stages file scope | ALL_STAGES_FILE_COVERAGE_2026-09-13.md | Every start/final file; classification and coverage |
| State | ../State/PROJECT_MANIFEST.json | Machine-readable current checkpoint |

Current Core/PostgreSQL checkpoint: `DEV-CORE-PLATFORM-SCOPE-001`; executable evidence and continuation are owned by `../Development/CORE_SERVICE_CHECKPOINT.md`.

Historical all-stages PostgreSQL+pgvector PASS: commit `2c36b43a7d55c6600b71f9714389e025a06df580`, Database Verify run `34800144921`, job `103841023234`. All 32 migrations and 26 verification files executed, including 0099. The workflow log asserts the tested branch commit; the completed all-stages audit and metadata closure are recorded in `Registers/ALL_STAGES_CURRENT_STATE_AUDIT_2026-09-13.md`.

Next governed action: use `../Development/CORE_SERVICE_CHECKPOINT.md`; historical Database-only continuation instructions are superseded.
