# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-18 · **Current checkpoint:** `DEV-COMMERCIAL-CURRENT-001`

| Layer | Owner / evidence | Current boundary |
|---|---|---|
| Governance | Governing/MASTER_INSTRUCTION_v2_5.md; MASTER_PROMPT_v2_5.md | Active |
| Source | RawSourceCorpus; SOURCE_REGISTRY.md | Immutable provenance |
| Foundation | F-00…F-15 | Revalidated completed scope |
| Architecture | A-00…A-12 / ADR-001…020 | Revalidated completed scope |
| Detailed Design | DD-00…DD-31; nine Industry DDs; DD-041/DD-045 in DD-18; DD-04 current-state floor | Commercial exact-current integration contract active |
| Development | ../Development/CORE_SERVICE_CHECKPOINT.md | Authorization chain + Commercial current-state tested; resource/workflow/transports unfinished |
| SQL / CI | migrations 0001…0037; 31 verification files | exact-head PostgreSQL+pgvector regression verified at `e050dc5f…` |
| State | ../State/PROJECT_STATE.md; ../State/PROJECT_MANIFEST.json | current projections |

Verified current executable: `e050dc5f52c3e1925c5ea2bce38e886e997be7c1` (tree `6d1269d1e71eff340922d149b5f2da66c2fad8a2`): **103 Core / 21 PostgreSQL / 37 migrations / 31 verification files PASS**. Industry scope remains **9/41/181**.

Next governed action: **resource/workflow authorization integration only (AUTH-004/AUTH-005)**. RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
