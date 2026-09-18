# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `Development/CORE_SERVICE_CHECKPOINT.md`  
**Branch:** `docs/architecture-branch-2`

**Current status:** Development is in progress at `DEV-AUTHZ-RESOURCE-RULE-001`. Core/context/SQL/session-security, Authorization persistence/grammar/read/evaluator/compiler, exact Commercial current-state integration, and the fail-closed resource/workflow PEP boundary are implemented/tested within bounded scope. Concrete per-module rule adapters, durable authorization audit emission, true RESTRICT semantics, transports/UI and production readiness remain unfinished.

## Verified current evidence
Executable `ed36486e45011c6dc2bae1bcc87c2a13574e177c`, tree `92a5dfc0b2d2e3e8246a75a7eadda52329c5a9e6`.
- Core: **108/108 PASS**
- PostgreSQL: **21/21 PASS**
- Database: **37 migrations / 31 verification files PASS**
- Industry SQL: **9 Industries / 41 canonical MS / 181 tables**

## Active invariants
- One Unified Enterprise Core; no industry-core forks.
- Exactly two logical Tenant mobile apps: Tenant Staff App + Tenant User App.
- RBAC primary; ABAC narrowing-only.
- `industryContextId = null` never means all industries.
- Commercial truth remains Commercial-owned; Authorization consumes server-derived facts only.
- Resource/workflow business rules are narrowing-only and module-owned.
- Missing/failing resource rule adapters deny; no generic executable domain-rule DSL is invented.
- Persisted RESTRICT remains fail-closed DENY until a governed restriction payload/reducer exists.
- RawSourceCorpus is immutable.
- Draft PR #2 remains review-only; `main` remains unmerged.

## Active technology
Next.js 15 · React 19 · TypeScript 5.x · Node.js 22+ · PostgreSQL · Payload CMS 3 · tRPC · Clerk · React Native+Expo · Tauri 2.0 · pgvector · PM2/VPS / governed deployment targets.

## Next
Implement **durable Authorization decision audit emission (AUTH-008) only**. Do not start DD-06 transports yet.
