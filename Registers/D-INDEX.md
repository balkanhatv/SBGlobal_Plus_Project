# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-18 · **Current checkpoint:** `DEV-AUTHZ-AUDIT-001`

| Layer | Owner / evidence | Current boundary |
|---|---|---|
| Governance | Governing/MASTER_INSTRUCTION_v2_5.md; MASTER_PROMPT_v2_5.md | Active |
| Source | RawSourceCorpus; SOURCE_REGISTRY.md | Immutable provenance |
| Foundation | F-00…F-15 | Revalidated completed scope |
| Architecture | A-00…A-12 / ADR-001…020 | Revalidated completed scope |
| Detailed Design | DD-00…DD-31; nine Industry DDs; DD-041/DD-045/DD-046/DD-047 | durable Authorization audit contract active |
| Development | ../Development/CORE_SERVICE_CHECKPOINT.md | shared authz chain through durable audit tested; source compiler calculation/transports unfinished |
| SQL / CI | migrations 0001…0037; 31 verification files | exact-head regression verified at `09d81fc2…` |
| State | ../State/PROJECT_STATE.md; ../State/PROJECT_MANIFEST.json | current projections |

Verified current executable: `09d81fc23d44747ac566fa4fe1957c1efe32479f` (tree `64ac15c7f06933c52c7ed1e8a3ffadc6204540d8`): **114 Core / 24 PostgreSQL / 37 migrations / 31 verification files PASS**. Industry scope remains **9/41/181**.

Next governed shared-Core action: **Authorization source-to-snapshot compiler calculation algorithm only**. RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
