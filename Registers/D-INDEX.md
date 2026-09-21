# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-COMMERCIAL-LIFECYCLE-OVERLAY-001`

| Layer | Current boundary |
|---|---|
| Governance | Active; promotion paths exact-head CI-covered |
| RawSourceCorpus | Immutable; accepted blobs unchanged |
| Foundation / Architecture | Revalidated completed scope |
| Detailed Design | DD-00…DD-31 + implementation decisions through **DD-074** |
| Development | Shared Core/Authz/Commercial + first-party Next.js/tRPC + DD-063…074 Commercial prerequisites |
| SQL/CI | 46 migrations / 40 verification files; no DD-074 DB schema change |
| Industry SQL | 9 Industries / 41 MS / 181 tables; Tenant+Industry/FORCE-RLS verified |
| First-party web | Next.js 15.5.25 App Router composition verified |
| DD-071 | deterministic baseline/override/eligible-add-on precedence |
| DD-072 | server-owned exact-target DENY-only compliance/security restriction input seam |
| DD-073 | source-selected usage-meter target-impact comparison; production period/reservation semantics unbound |
| DD-074 | deterministic lifecycle posture; GRACE full, restricted/non-active states generic-denied |
| Public changePlan | intentionally unbound; final target materialization + production policy/evidence producers unfinished |

Verified feature basis `d89b3c9b5ae68ef45b4a2e8a7e9979f2b4655269` / `014ffdd543f71d4aeddaeb3ac5050c6916d30b54`: **233 Core / 56 PostgreSQL PASS + full DB bootstrap + Web + Database Verify**.

Next: **final target-preview restriction application/materialization audit/implementation**. RawSourceCorpus immutable; `main` unmerged; PR #2 draft.
