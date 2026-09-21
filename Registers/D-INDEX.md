# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-RESTRICTION-INPUT-001`

| Layer | Current boundary |
|---|---|
| Governance | Active; promotion paths exact-head CI-covered |
| RawSourceCorpus | Immutable; accepted blobs unchanged |
| Foundation / Architecture | Revalidated completed scope |
| Detailed Design | DD-00…DD-31 + implementation decisions through **DD-072** |
| Development | Shared Core/Authz/Commercial + first-party Next.js/tRPC + DD-063…072 Commercial prerequisites |
| SQL/CI | 46 migrations / 40 verification files; no DD-072 DB schema change |
| Industry SQL | 9 Industries / 41 MS / 181 tables; Tenant+Industry/FORCE-RLS verified |
| First-party web | Next.js 15.5.25 App Router composition verified |
| DD-071 | baseline → override → eligible additive add-on precedence verified |
| DD-072 | server-owned exact-target DENY-only compliance/security restriction input seam verified |
| Public changePlan | intentionally unbound; concrete restriction source/application, usage/lifecycle/apply producers unfinished |

Verified feature basis `b0ff514b4063b648f8869a7e12008a68ebd8fe5a` / `d7b28ba1310bc77283cc479002052fbde2febe7b`: **216 Core / 56 PostgreSQL PASS + full DB bootstrap + Web build**.

Next: **usage-meter target-impact source audit/implementation** as an independent prerequisite. Final target preview still requires concrete governed compliance/security restriction authority/application plus lifecycle overlay. RawSourceCorpus immutable; `main` unmerged; PR #2 draft.
