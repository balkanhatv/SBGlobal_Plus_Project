# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-ADJUSTMENT-PRECEDENCE-001`

| Layer | Current boundary |
|---|---|
| Governance | Active; promotion paths exact-head CI-covered |
| RawSourceCorpus | Immutable; accepted blobs unchanged |
| Foundation / Architecture | Revalidated completed scope |
| Detailed Design | DD-00…DD-31 + implementation decisions through **DD-071** |
| Development | Shared Core/Authz/Commercial + first-party Next.js/tRPC + DD-063…071 Commercial prerequisites |
| SQL/CI | 46 migrations / 40 verification files; no DD-071 DB schema change |
| Industry SQL | 9 Industries / 41 MS / 181 tables; Tenant+Industry/FORCE-RLS verified |
| First-party web | Next.js 15.5.25 App Router composition verified |
| DD-071 | baseline → override → eligible additive add-on precedence verified |
| Public changePlan | intentionally unbound; restriction/usage/lifecycle/apply producers unfinished |

Verified feature basis `1c8844ec982ef91cacc3545576d102fbac3fcaf9` / `0792a28622e000beba2e785ce1f0a3282b1fff96`: **207 Core / 56 PostgreSQL PASS + full DB bootstrap + Web build**.

Next: **compliance/security restriction input contract**, then usage impact/lifecycle overlay. RawSourceCorpus immutable; `main` unmerged; PR #2 draft.
