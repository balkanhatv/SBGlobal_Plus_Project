# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-24 · **Checkpoint:** `DEV-TENANT-INTEGRATION-DEFINITION-CAPABILITY-CURRENT-FLOORS-001`

| Layer | Current boundary |
|---|---|
| Detailed Design | DD-001–166 contiguous |
| Current Development | DD-166 TenantIntegration Definition/config/enabled-capability current-set floor |
| Mobile invariant | Exactly two logical Tenant app classes: `TENANT_STAFF_APP` + `TENANT_USER_APP` |
| Industries | Exactly 9 equal Current Supported Industry Suites / 41 canonical MS / 181 Industry tables |
| Machine auth | DD-162 bounded floor; final verifier blocked |
| Webhook | DD-163 bounded floor; execution semantics blocked |
| Sync | DD-164 bounded current binding; runtime semantics blocked |
| Credential binding | DD-165 current binding; secret/provider semantics blocked |
| Integration registry set | DD-166 current Definition/config/enabled-capability floor; execution authority unclaimed |
| Verification | REPO-001–006 + exact-head Core/PostgreSQL/Database/Web CI |
| Production readiness | NOT CLAIMED |

Verified canonical DD-166 promotion `b16bf902aba7bc0c8324048cd1b4506b2363ebc8` / tree `4ee6a211b760b6dce34ff187df1d63473f970dfa`: **416/416 Core**, **497/497 PostgreSQL**, **47 migrations / 41 SQL verification files**, Database/Web PASS. Exact-head runs: Core `35962194480` (Core job `107512961272`, PostgreSQL job `107512961095`), Database `35962194510` (job `107512961584`), Web `35962194556` (job `107512961646`).

Next: source-audit DD-165 ∧ DD-166 composition only if no new semantics are added.
