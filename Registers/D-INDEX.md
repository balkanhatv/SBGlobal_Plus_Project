# D-INDEX — Current Canonical / Development Index
**Updated:** 2026-09-21 · **Checkpoint:** `DEV-API-REST-001`

| Layer | Current boundary |
|---|---|
| Governing sources | MI/MP v2.5; RawSource immutable; current explicit user direction |
| Foundation / Architecture | Existing owners retained; current work implements A-06/ADR-005 |
| Detailed Design | Product/implementation decisions DD-001–080 |
| Core / API | Shared context/auth/authz/Commercial, three first-party tRPC queries and unmounted REST adapter floor |
| REST | DD-080 ordering/projection implemented; routes, credential syntax and OpenAPI remain unbound |
| Verification | VC-01–04 corrections + REPO-001–006 invariants remain active |
| SQL | 47 migrations / 41 verification files; 9 Industries / 41 MS / 181 tables |
| Unfinished | Named Commercial dependencies, broad Industry APIs/UI, live AI, clients and production operations |

Verified executable `ce4708eec15f6b0a35ae9a77d13505221fe55d51` / tree `9655553773e2b1f63ba1e36a479ef3d574ec6077`: **290/290 Core**, **65/65 PostgreSQL**, **47 migrations / 41 SQL verification files bootstrap**, **Next.js 15.5.25 build** and **Database Verify PASS**. Zero failed/skipped tests. Verified executable inventory: **409 blobs / 161 Markdown / 83 source / 63 test files**.

Evidence: `Registers/DEVELOPMENT_DD080_VERIFICATION_2026-09-21.md`; source audit: `Development/REST_ADAPTER_PREREQUISITE_OWNERSHIP_AUDIT.md`; vision audit: `VISION_CENTRIC_AUDIT_2026-09-21.md`.

Next: concrete REST exposure remains blocked on an exact external credential scheme and public route catalog; the DD-076 evaluator remains blocked on its named policy/evidence definitions. Source-audit another independent source-complete item before implementation and retain exact-head CI/repository invariants.
