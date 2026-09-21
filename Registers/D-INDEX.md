# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-INITIAL-ASSESSMENT-001`

| Layer | Current boundary |
|---|---|
| Governance | Active; promotion paths exact-head CI-covered |
| RawSourceCorpus | Immutable; accepted blobs unchanged |
| Foundation / Architecture | Revalidated completed scope |
| Detailed Design | DD-00…DD-31 + implementation decisions through **DD-076** |
| Development | Shared Core/Authz/Commercial + first-party Next.js/tRPC + DD-063…076 Commercial prerequisites |
| SQL/CI | 46 migrations / 40 verification files; no DD-076 DB schema change |
| Industry SQL | 9 Industries / 41 MS / 181 tables; Tenant+Industry/FORCE-RLS verified |
| DD-075 | deterministic final target preview |
| DD-076 | server-owned initial-assessment evaluator/preparation seam; known usage blockers cannot disappear |
| DD-066 evidence | physical immutable/versioned assessment/remediation/route-resolution substrate already present |
| Public changePlan | intentionally unbound; concrete assessment evaluator, producer evidence and apply gate unfinished |

Verified feature basis `bdc4f65c7d1f84e5b29e15c7b5dbfb8550c1ca11` / `8854a68a3fdd102ec06159b6da24864f5f42c32e`: **254 Core / 56 PostgreSQL PASS + full DB bootstrap + Web + Database Verify**.

Next: **persisted DD-066 evidence → DD-065 internal apply-gate audit/implementation**. RawSourceCorpus immutable; `main` unmerged; PR #2 draft.
