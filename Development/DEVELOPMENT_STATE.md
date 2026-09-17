# DEVELOPMENT STATE — SBGlobal Plus
**Updated:** 2026-09-17 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-AUTHZ-PDP-001`

Development is **IN PROGRESS — AUTHORIZATION / CORE SERVICES**.

Verified executable: `54e6fd0972699e31c4650e54faa9e41086f55755`.
- Core/server acceptance inventory: **65 tests; Core Service Verify PASS** (run `35242938042`, job `105275719996`).
- Real PostgreSQL: **13 tests; postgres-context-verify PASS** (run `35242938042`, job `105275720386`).
- Database: **35 migrations / 29 verification files; Database Verify PASS** (run `35242938026`, job `105275719655`).
- SQL Industry scope remains **9 Current Supported Industries / 41 canonical MS / 181 Industry tables**.

Current executable scope includes DD-041/DD-042 compiled-Authorization and Industry-presentation reads, DD-043 protected PLATFORM_GLOBAL scope enforcement, DD-044 Clerk session-security integration, and the `DEV-AUTHZ-PDP-001` PLATFORM_GLOBAL Authorization persistence prerequisite in migration/verification 0035.

Fresh exact-head validation found and corrected two 0035 blockers before this checkpoint was promoted: the RLS registry scope vocabulary did not yet admit `PLATFORM_GLOBAL`, and the rollback-only verification fixture addressed a schema-local deferred FK by an unqualified constraint name. Migrations `0001`–`0035`, all verification scripts, Core acceptance, and pooled PostgreSQL/RLS isolation now pass at the exact verified executable above.

Next governed task: **define deterministic permission-set v1 and ABAC expression v1 grammar with no arbitrary JavaScript/SQL/shell/dynamic execution**. After that, implement the Authorization read store, then the fail-closed PDP/ABAC evaluator. Commercial integration and DD-06 transports follow later.

Still unfinished: Authorization compiler write boundary, Commercial current-state integration, broader repositories, transports/rate limiter/idempotency, UI/mobile/desktop, deployment and production-security validation.

RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 remains review-only/draft.
