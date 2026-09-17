# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-18 · **Current checkpoint:** `DEV-AUTHZ-EVAL-001`

| Layer | Owner / evidence | Current boundary |
|---|---|---|
| Governance | Governing/MASTER_INSTRUCTION_v2_5.md; MASTER_PROMPT_v2_5.md | Active v2.5 plus dated reconciliations |
| Source | RawSourceCorpus; SOURCE_REGISTRY.md | Immutable provenance |
| Foundation | F-00…F-15 | completed scope revalidated |
| Architecture | A-00…A-12 / ADR-001…020 | completed scope revalidated |
| Detailed Design | DD-00…DD-31; nine Industry DDs; DD-045 in DD-18 | Fail-closed evaluator floor locked; RESTRICT payload/reducer still future |
| Development | ../Development/CORE_SERVICE_CHECKPOINT.md | Core + session-security + Authorization persistence/grammar/read/evaluator floor tested; compiler/Commercial/transports unfinished |
| SQL / CI | migrations 0001…0036; 30 verification files | exact-head PostgreSQL+pgvector regression verified at `96b051ca…` |
| State | ../State/PROJECT_STATE.md; ../State/PROJECT_MANIFEST.json | current human/machine projections |

Current verified executable: `96b051ca6feef26d3f8534ce6d3240f6843dc31e` (tree `1e9d6151cc4fa01232b4ee1e7397a33fa81249b0`).
- Core: **87/87**; PostgreSQL: **15/15**; Database: **36 migrations / 30 verification files**.
- Industry scope: **9 Industries / 41 canonical MS / 181 Industry tables**.

Next governed action: **dedicated Authorization compiler write boundary only**. Runtime app roles remain read-only; no main merge.

RawSourceCorpus remains immutable. PR #2 remains draft/review-only.
