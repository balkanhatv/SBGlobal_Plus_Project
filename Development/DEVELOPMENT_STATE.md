# DEVELOPMENT STATE — SBGlobal Plus
**Updated:** 2026-09-17 · **Branch:** `docs/architecture-branch-2` · **Checkpoint:** `DEV-AUTHZ-POLICY-GRAMMAR-001`

Development is **IN PROGRESS — AUTHORIZATION / CORE SERVICES**.

Verified executable: `1b0f90dc900e0ab49cde2f8305f11cfadadae31c` (tree `a48a2b8cd4d9447522ca2c5721d23a85175dbfa8`).
- Core/server acceptance: **71/71 PASS** (Core Service Verify run `35247193977`, job `105290285420`).
- Real PostgreSQL: **13/13 PASS** (Core Service Verify run `35247193977`, job `105290285531`).
- Database: **35 migrations / 29 verification files PASS** (Database Verify run `35247193986`, job `105290285053`).
- SQL Industry scope remains **9 Current Supported Industries / 41 canonical MS / 181 Industry tables**.

Current executable scope includes DD-041/DD-042 compiled-Authorization and Industry-presentation reads, DD-043 protected PLATFORM_GLOBAL scope enforcement, DD-044 Clerk session-security, `DEV-AUTHZ-PDP-001` PLATFORM_GLOBAL Authorization persistence, and `DEV-AUTHZ-POLICY-GRAMMAR-001` deterministic Permission Set v1 / ABAC Expression v1 parser contracts.

The grammar is intentionally data-only and bounded: canonical sorted permission facts; allowlisted server-derived ABAC attributes/operators; exact/terminal-prefix permission patterns; no arbitrary JavaScript/eval, SQL, shell, regex/glob AST, template, network/filesystem/provider or dynamic-object execution. It does not claim PDP evaluation or compiler publication.

Zero-trust CI history remains explicit: the first 0035 implementation (`c4ceff50…`) failed the legacy RLS registry vocabulary; the next correction (`07d7a760…`) exposed deferred-FK verification ambiguity; `54e6fd09…` corrected both and passed before grammar work proceeded.

Next governed task: **implement only the Authorization read store for tenant + platform CURRENT compiled snapshots and applicable ACTIVE ABAC policies, using the locked v1 parsers and fail-closed scope/version/payload behavior**. The PDP/ABAC evaluator follows only after the reader is independently verified.

Still unfinished: PDP/ABAC evaluator, Authorization compiler write boundary, Commercial current-state integration, broader repositories, transports/rate limiter/idempotency, UI/mobile/desktop, deployment and production-security validation.

RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 remains review-only/draft.
