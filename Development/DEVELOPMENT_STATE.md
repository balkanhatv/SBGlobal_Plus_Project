# DEVELOPMENT STATE — SBGlobal Plus
**Updated:** 2026-09-18 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-AUTHZ-READ-STORE-001`

Development is **IN PROGRESS — AUTHORIZATION / CORE SERVICES**.

Verified executable: `4916b30359cea056a352245176dcb33f739fc0a0` (tree `16e1a322620de4a0591222356e6db3dd5f0428bf`).
- Core/server acceptance: **75/75 PASS** (Core Service Verify run `35252274497`, job `105307252647`).
- Real PostgreSQL: **15/15 PASS** (Core Service Verify run `35252274497`, job `105307252908`).
- Database: **36 migrations / 30 verification files PASS** (Database Verify run `35252274557`, job `105307253170`).
- SQL Industry scope remains **9 Current Supported Industries / 41 canonical MS / 181 Industry tables**.

Current executable scope includes DD-041/DD-042 compiled-Authorization and Industry-presentation reads, DD-043 protected PLATFORM_GLOBAL scope enforcement, DD-044 Clerk session-security, `DEV-AUTHZ-PDP-001` PLATFORM_GLOBAL Authorization persistence, `DEV-AUTHZ-POLICY-GRAMMAR-001` deterministic Permission Set v1 / ABAC Expression v1 contracts, migration 0036 PLATFORM_GLOBAL ABAC write-boundary hardening, and `DEV-AUTHZ-READ-STORE-001`.

The Authorization reader selects only exact CURRENT tenant/platform compiled snapshots, keeps tenant and PLATFORM_GLOBAL paths separate, returns only ACTIVE/effective-window ABAC policies, validates persisted payloads through the locked v1 grammar, preserves sibling-Industry isolation, and fails closed on missing/current-version/scope/payload/dependency errors. It does **not** evaluate authorization or publish compiled snapshots.

Next governed task: **implement only the fail-closed `AuthorizationDecisionPort` PDP/ABAC evaluator with DD-17 AUTH acceptance**, consuming the verified reader. RBAC stays primary; ABAC may only narrow/restrict/deny.

Still unfinished: PDP/ABAC evaluator, Authorization compiler write boundary, Commercial current-state integration, broader repositories, transports/rate limiter/idempotency, UI/mobile/desktop, deployment and production-security validation.

RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 remains review-only/draft.
