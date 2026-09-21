# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-APPLY-EVIDENCE-GATE-001`

| Layer | Current boundary |
|---|---|
| Governance | Active; promotion paths exact-head CI-covered |
| RawSourceCorpus | Immutable; accepted blobs unchanged |
| Foundation / Architecture | Revalidated completed scope |
| Detailed Design | DD-00…DD-31 + implementation decisions through **DD-077** |
| Development | Shared Core/Authz/Commercial + first-party Next.js/tRPC + DD-063…077 Commercial prerequisites |
| SQL/CI | 46 migrations / 40 verification files; no DD-077 DB schema change |
| Industry SQL | 9 Industries / 41 MS / 181 tables; Tenant+Industry/FORCE-RLS verified |
| DD-075 | deterministic final target preview |
| DD-076 | server-owned initial-assessment preparation seam |
| DD-077 | persisted DD-066 apply-evidence read gate; latest evidence/live binding/fingerprint/timing fail-closed |
| DD-065 publication | atomic Subscription/snapshot/outbox/audit primitive exists but does not yet consume DD-066 evidence in same transaction |
| Public changePlan | intentionally unbound; concrete producers + atomic evidence/publication orchestration unfinished |

Verified feature basis `1704259d61c77937eaf866162ca67689dee3b714` / `c5656d68ddc50b480fec63117d267e8a0def1bd2`: **265 Core / 61 PostgreSQL PASS + full DB bootstrap + Web + Database Verify**.

Next: **atomic DD-077 evidence validation inside DD-065 publication transaction**. RawSourceCorpus immutable; `main` unmerged; PR #2 draft.
