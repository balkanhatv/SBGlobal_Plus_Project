# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `Development/CORE_SERVICE_CHECKPOINT.md`  
**Branch:** `docs/architecture-branch-2`

**Current status:** Development is in progress at `DEV-AUTHZ-COMPILER-001`. Core/context/SQL/session-security, Authorization persistence, deterministic policy grammar, governed read store, fail-closed evaluator and dedicated monotonic compiler publication boundary are implemented/tested within bounded scope. Commercial current-state integration, true RESTRICT payload/reducer semantics, transports/UI and production readiness are unfinished.

## Verified current evidence
Executable `2c9157e3a1ed30f18f8014e1b04aa799f2d73d15`, tree `a1cc883564516222ed6095e692ba6bd1ec33baac`.
- Core: **95/95 PASS**
- PostgreSQL: **18/18 PASS**
- Database: **37 migrations / 31 verification files PASS**
- Industry SQL: **9 Industries / 41 canonical MS / 181 tables**

## Active invariants
- One Unified Enterprise Core; no industry-core forks.
- Exactly two logical Tenant mobile apps: Tenant Staff App + Tenant User App.
- RBAC primary; ABAC narrowing-only.
- `industryContextId = null` never means all industries.
- Compiler writer is separate from app/control-plane roles and cannot mutate Authorization source truth or delete compiled truth.
- Persisted RESTRICT remains fail-closed DENY until a governed restriction payload/reducer exists.
- RawSourceCorpus is immutable.
- Draft PR #2 remains review-only; `main` remains unmerged.

## Active technology
Next.js 15 · React 19 · TypeScript 5.x · Node.js 22+ · PostgreSQL · Payload CMS 3 · tRPC · Clerk · React Native+Expo · Tauri 2.0 · pgvector · PM2/VPS / governed deployment targets.

## Next
Implement **Commercial current-state integration only**: exact current EntitlementSnapshot/Subscription/License reads, snapshot-version validation, and server-owned Authorization supplemental facts. Do not move Commercial truth into Authorization and do not start DD-06 transports yet.
