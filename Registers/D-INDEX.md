# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-24 · **Checkpoint:** `DEV-TENANT-INTEGRATION-CURRENT-INTEGRITY-FLOORS-001`

| Layer | Current boundary |
|---|---|
| Governing sources | Primary Vision → explicit user direction → MI/MP v2.5 → immutable RawSource provenance → canonical owners |
| Foundation / Architecture | Revalidated; 9 Current Supported Industries remain equal; Core remains industry-neutral |
| Detailed Design | Decisions contiguous DD-001–167 |
| Mobile invariant | Exactly two logical Tenant app classes: `TENANT_STAFF_APP` + `TENANT_USER_APP`; Platform Mobile separate |
| Current Development | DD-167 TenantIntegration current-integrity composition |
| Machine auth | DD-162 necessary floor retained; final verifier chain blocked |
| Webhook | DD-163 necessary floor retained; execution semantics blocked |
| Sync | DD-164 current binding only; cursor/runtime authority unclaimed |
| Integration integrity | DD-165 + DD-166 composed by DD-167; lifecycle/provider/secret/network authority unclaimed |
| Verification | REPO-001–006 + exact-head Core/PostgreSQL/Database/Web CI |
| SQL | 47 migrations / 41 verification files; 9 Industries / 41 MS / 181 tables |
| Production readiness | NOT CLAIMED |

Verified canonical DD-167 promotion `ecf694f8bf62082b2d59905591a97b237b866b8b` / tree `dc96af06648f79a606ce5ea24254e52f716c7f94`: **423/423 Core**, **497/497 PostgreSQL**, **47 migrations / 41 SQL verification files**, Database/Web PASS. Exact-head runs: Core `35963182069` (Core job `107515946043`, PostgreSQL job `107515945847`), Database `35963181908` (job `107515945257`), Web `35963181936` (job `107515945440`).

Next: fresh source-audit another independent prerequisite; do not infer blocked semantics.
