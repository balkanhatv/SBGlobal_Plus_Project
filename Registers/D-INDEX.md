# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-FINAL-TARGET-PREVIEW-001`

| Layer | Current boundary |
|---|---|
| Governance | Active; promotion paths exact-head CI-covered |
| RawSourceCorpus | Immutable; accepted blobs unchanged |
| Foundation / Architecture | Revalidated completed scope |
| Detailed Design | DD-00…DD-31 + implementation decisions through **DD-075** |
| Development | Shared Core/Authz/Commercial + first-party Next.js/tRPC + DD-063…075 Commercial prerequisites |
| SQL/CI | 46 migrations / 40 verification files; no DD-075 DB schema change |
| Industry SQL | 9 Industries / 41 MS / 181 tables; Tenant+Industry/FORCE-RLS verified |
| DD-071 | deterministic baseline/override/eligible-add-on precedence |
| DD-072 | exact-target DENY-only compliance/security input seam |
| DD-073 | exact-target usage impact; production period/reservation semantics unbound |
| DD-074 | deterministic lifecycle posture |
| DD-075 | deterministic final target preview with restriction application + usage/lifecycle evidence validation |
| Public changePlan | intentionally unbound; assessment/publication producer bridge and production source bindings unfinished |

Verified feature basis `380999d41b2bc67903c7eabea714f06b459f754d` / `d66f5621dcffb542f1343cc40fc016249f0e6759`: **243 Core / 56 PostgreSQL PASS + full DB bootstrap + Web + Database Verify**.

Next: **final-preview → DD-066 assessment / DD-065 publication bridge audit/implementation**. RawSourceCorpus immutable; `main` unmerged; PR #2 draft.
