# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-24 · **Checkpoint:** `DEV-SYNC-CURSOR-CURRENT-BINDING-FLOORS-001`

| Layer | Current boundary |
|---|---|
| Governing sources | Primary Vision → current explicit user direction → MI/MP v2.5 → immutable RawSource provenance → canonical owners |
| Primary source provenance | S1 `Disorganized Data 1.md` is titled **Master Enterprise Architecture & Product Requirements Source — Final v1.1**; accepted blob unchanged |
| Foundation / Architecture | Revalidated owners retained; 9 Current Supported Industries remain equal; Core remains industry-neutral |
| Detailed Design | Product/implementation decisions contiguous DD-001–164 |
| Mobile invariant | Exactly two logical Tenant app classes: `TENANT_STAFF_APP` + `TENANT_USER_APP`; Platform Mobile is separate |
| Current Development | DD-164 SyncCursor current parent/capability binding necessary floors |
| Machine auth | DD-162 floor retained; final verifier/token/CIDR/profile/use-audit evidence blocked |
| Webhook execution | DD-163 floor retained; filter/endpoint/SSRF/signing/catalog lifecycle/dispatcher/retry/DLQ/replay/cross-context/network execution unclaimed |
| Sync execution | DD-164 binding floor only; cursor semantics/freshness/provider/secret/resume/replay/network authority unclaimed |
| Verification | REPO-001–006 + exact-head Core/PostgreSQL/Database/Web CI |
| SQL | 47 migrations / 41 verification files; 9 Industries / 41 MS / 181 tables |
| Production readiness | NOT CLAIMED |

Verified canonical DD-164 promotion `b37242298bff0c2b8e95a9b957896d6a7278e8fd` / tree `749064f6d423f4d685c715e905538a06dbc77613`: **402/402 Core**, **497/497 PostgreSQL**, Database/Web PASS.

Evidence: `Registers/DEVELOPMENT_DD164_VERIFICATION_2026-09-24.md`; current vision audit: `Registers/VISION_CENTRIC_AUDIT_2026-09-24.md`.

Next: source-audit the next named unfinished prerequisite. Open a new DD only when deterministic semantics, authority and executable acceptance are source-complete.
