# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-18 · **Current checkpoint:** `DEV-AUTHZ-COMPILER-001`

| Layer | Owner / evidence | Current boundary |
|---|---|---|
| Governance | Governing/MASTER_INSTRUCTION_v2_5.md; MASTER_PROMPT_v2_5.md | Active |
| Source | RawSourceCorpus; SOURCE_REGISTRY.md | Immutable provenance |
| Foundation | F-00…F-15 | Revalidated completed scope |
| Architecture | A-00…A-12 / ADR-001…020 | Revalidated completed scope |
| Detailed Design | DD-00…DD-31; nine Industry DDs; DD-041/DD-045 in DD-18 | Compiler publication + fail-closed evaluator contracts active |
| Development | ../Development/CORE_SERVICE_CHECKPOINT.md | Authorization persistence/grammar/read/evaluator/compiler publication tested; Commercial/transports unfinished |
| SQL / CI | migrations 0001…0037; 31 verification files | exact-head PostgreSQL+pgvector regression verified at `2c9157e3…` |
| State | ../State/PROJECT_STATE.md; ../State/PROJECT_MANIFEST.json | current projections |

Verified current executable: `2c9157e3a1ed30f18f8014e1b04aa799f2d73d15` (tree `a1cc883564516222ed6095e692ba6bd1ec33baac`): **95 Core / 18 PostgreSQL / 37 migrations / 31 verification files PASS**. Industry scope remains **9/41/181**.

Next governed action: **Commercial current-state integration only**. RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
