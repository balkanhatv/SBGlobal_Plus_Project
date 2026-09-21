# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-ATOMIC-APPLY-EVIDENCE-001`

| Layer | Current boundary |
|---|---|
| Governance | Active; promotion paths exact-head CI-covered |
| RawSourceCorpus | Immutable; accepted blobs unchanged |
| Foundation / Architecture | Revalidated completed scope |
| Detailed Design | DD-00…DD-31 + implementation decisions through **DD-078** |
| Development | Shared Core/Authz/Commercial + first-party Next.js/tRPC + DD-063…078 Commercial prerequisites |
| SQL/CI | **47 migrations / 41 verification files** |
| Industry SQL | 9 Industries / 41 MS / 181 tables; Tenant+Industry/FORCE-RLS verified |
| DD-075 | deterministic final target preview |
| DD-076 | server-owned initial-assessment preparation seam |
| DD-077 | persisted DD-066 read-side apply-evidence gate |
| DD-078 | same-assessment DD-066 evidence validation serialized inside DD-065 publication |
| Public changePlan | intentionally unbound; concrete assessment/Billing/Workflow producer chain unfinished |

Verified feature basis `8fa3963f691ccc8d4d913c880556bea5512cc0a3` / `e79fedbecc4560ebcd5a5d5c876dd4870e7a5699`: **265 Core / 63 PostgreSQL PASS + full 47/41 DB bootstrap + Web + Database Verify**.

Next: **DD-076 prepared assessment → DD-066 persistence/orchestration audit**. RawSourceCorpus immutable; `main` unmerged; PR #2 draft.
