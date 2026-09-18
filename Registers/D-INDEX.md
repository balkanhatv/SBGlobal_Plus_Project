# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-18 · **Current checkpoint:** `DEV-AUTHZ-RESOURCE-RULE-001`

| Layer | Owner / evidence | Current boundary |
|---|---|---|
| Governance | Governing/MASTER_INSTRUCTION_v2_5.md; MASTER_PROMPT_v2_5.md | Active |
| Source | RawSourceCorpus; SOURCE_REGISTRY.md | Immutable provenance |
| Foundation | F-00…F-15 | Revalidated completed scope |
| Architecture | A-00…A-12 / ADR-001…020 | Revalidated completed scope |
| Detailed Design | DD-00…DD-31; nine Industry DDs; DD-041/DD-045/DD-046 in DD-18 | resource/workflow PEP contract active |
| Development | ../Development/CORE_SERVICE_CHECKPOINT.md | Authorization + Commercial + resource/workflow PEP floor tested; concrete module adapters/audit/transports unfinished |
| SQL / CI | migrations 0001…0037; 31 verification files | exact-head regression verified at `ed36486e…` |
| State | ../State/PROJECT_STATE.md; ../State/PROJECT_MANIFEST.json | current projections |

Verified current executable: `ed36486e45011c6dc2bae1bcc87c2a13574e177c` (tree `92a5dfc0b2d2e3e8246a75a7eadda52329c5a9e6`): **108 Core / 21 PostgreSQL / 37 migrations / 31 verification files PASS**. Industry scope remains **9/41/181**.

Next governed shared-Core action: **AUTH-008 durable Authorization decision audit emission only**. RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
