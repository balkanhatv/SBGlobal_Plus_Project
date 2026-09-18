# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `Development/CORE_SERVICE_CHECKPOINT.md`  
**Branch:** `docs/architecture-branch-2`

**Current status:** Development is in progress at `DEV-COMMERCIAL-CURRENT-001`. Core/context/SQL/session-security, Authorization persistence/grammar/read/evaluator/compiler publication, and exact Commercial current-state runtime integration are implemented/tested within bounded scope. Resource/workflow rule integration, true RESTRICT semantics, transports/UI and production readiness remain unfinished.

## Verified current evidence
Executable `e050dc5f52c3e1925c5ea2bce38e886e997be7c1`, tree `6d1269d1e71eff340922d149b5f2da66c2fad8a2`.
- Core: **103/103 PASS**
- PostgreSQL: **21/21 PASS**
- Database: **37 migrations / 31 verification files PASS**
- Industry SQL: **9 Industries / 41 canonical MS / 181 tables**

## Active invariants
- One Unified Enterprise Core; no industry-core forks.
- Exactly two logical Tenant mobile apps: Tenant Staff App + Tenant User App.
- RBAC primary; ABAC narrowing-only.
- `industryContextId = null` never means all industries.
- Commercial truth remains Commercial-owned; Authorization consumes server-derived facts only.
- Current entitlement snapshot id/version is revalidated server-side before guarded access.
- Persisted RESTRICT remains fail-closed DENY until a governed restriction payload/reducer exists.
- RawSourceCorpus is immutable.
- Draft PR #2 remains review-only; `main` remains unmerged.

## Active technology
Next.js 15 · React 19 · TypeScript 5.x · Node.js 22+ · PostgreSQL · Payload CMS 3 · tRPC · Clerk · React Native+Expo · Tauri 2.0 · pgvector · PM2/VPS / governed deployment targets.

## Next
Implement **resource/workflow authorization integration only (AUTH-004/AUTH-005)**. Do not start DD-06 transports yet.
