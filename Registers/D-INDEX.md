# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-24 · **Checkpoint:** `DEV-TENANT-INTEGRATION-CREDENTIAL-CURRENT-FLOORS-001`

| Layer | Current boundary |
|---|---|
| Governing sources | Primary Vision → current explicit user direction → MI/MP v2.5 → immutable RawSource provenance → canonical owners |
| Foundation / Architecture | Revalidated owners retained; 9 Current Supported Industries remain equal; Core remains industry-neutral |
| Detailed Design | Product/implementation decisions contiguous DD-001–165 |
| Mobile invariant | Exactly two logical Tenant app classes: `TENANT_STAFF_APP` + `TENANT_USER_APP`; Platform Mobile is separate |
| Current Development | DD-165 TenantIntegration→CredentialReference current-binding necessary floors |
| Machine auth | DD-162 necessary floor retained; final verifier/token/CIDR/profile/use-audit evidence blocked |
| Webhook execution | DD-163 necessary floor retained; filter/endpoint/SSRF/signing/catalog lifecycle/dispatcher/retry/cross-context/network execution blocked |
| Sync execution | DD-164 current binding only; cursor freshness/provider/network authority unclaimed |
| Credential runtime | DD-165 current binding only; secret/rotation/provider/health/profile/network authority unclaimed |
| Verification | REPO-001–006 + exact-head Core/PostgreSQL/Database/Web CI |
| SQL | 47 migrations / 41 verification files; 9 Industries / 41 MS / 181 tables |
| Production readiness | NOT CLAIMED |

Verified canonical DD-165 promotion `d6c09a2fde3f173892c311af36335dc1f6ef8313` / tree `daec42114b4a76fa4f25edf71b410f230d3a37d0`: **409/409 Core**, **497/497 PostgreSQL**, **47 migrations / 41 SQL verification files**, Database/Web PASS. Exact-head runs: Core `35961356094` (Core job `107510411453`, PostgreSQL job `107510411660`), Database `35961356136` (job `107510411709`), Web `35961356138` (job `107510411745`).

Evidence: `Registers/DEVELOPMENT_DD165_VERIFICATION_2026-09-24.md`.

Next: fresh source-audit another independent unfinished prerequisite; do not infer blocked semantics.
