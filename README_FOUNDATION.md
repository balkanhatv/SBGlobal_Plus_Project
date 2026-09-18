# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `Development/CORE_SERVICE_CHECKPOINT.md`  
**Branch:** `docs/architecture-branch-2`

**Current status:** Development is in progress at `DEV-AUTHZ-AUDIT-001`. Core/context/SQL/session-security, Authorization persistence/grammar/read/evaluator/publication, exact Commercial current-state integration, fail-closed resource/workflow PEP, and durable final Authorization audit emission are implemented/tested within bounded scope.

## Verified current evidence
Executable `09d81fc23d44747ac566fa4fe1957c1efe32479f`, tree `64ac15c7f06933c52c7ed1e8a3ffadc6204540d8`.
- Core: **114/114 PASS**
- PostgreSQL: **24/24 PASS**
- Database: **37 migrations / 31 verification files PASS**
- Industry SQL: **9 Industries / 41 canonical MS / 181 tables**

## Active invariants
- One Unified Enterprise Core; no industry-core forks.
- Exactly two logical Tenant mobile apps: Tenant Staff App + Tenant User App.
- RBAC primary; ABAC narrowing-only.
- `industryContextId = null` never means all industries.
- Commercial truth remains Commercial-owned.
- Resource/workflow business rules are narrowing-only and module-owned.
- Protected access success requires durable audit when required.
- Persisted RESTRICT remains fail-closed DENY until a governed restriction payload/reducer exists.
- RawSourceCorpus is immutable.
- Draft PR #2 remains review-only; `main` remains unmerged.

## Active technology
Next.js 15 · React 19 · TypeScript 5.x · Node.js 22+ · PostgreSQL · Payload CMS 3 · tRPC · Clerk · React Native+Expo · Tauri 2.0 · pgvector · PM2/VPS / governed deployment targets.

## Next
Implement **Authorization source-to-snapshot compiler calculation algorithm only**. Do not start DD-06 transports yet.
