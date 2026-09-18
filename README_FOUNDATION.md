# SBGlobal Plus — Canonical Development Branch

**Current checkpoint:** `DEV-AUTHZ-SOURCE-COMPILER-001`  
**Branch:** `docs/architecture-branch-2`

Current verified executable `13346932455c79637e9644f970db47052c1fe6ad` / tree `32ee41587e5569e598bc600b8d2ce9f8db602252`:
- **117/117 Core PASS**
- **27/27 PostgreSQL PASS**
- **38 migrations / 32 verification files PASS**
- **9 Industries / 41 canonical MS / 181 Industry tables**

The shared Authorization chain now includes deterministic RBAC source calculation in addition to compiler publication/read/evaluator, Commercial current-state checks, resource/workflow PEP and durable final Authorization audit.

Key invariants remain: one Unified Core; exactly two Tenant mobile app classes; RBAC primary; ABAC narrowing-only; Tenant+Industry isolation; null Industry never means all; RawSourceCorpus immutable; `main` unmerged.

**Next:** implement DD-06 transport-neutral idempotency runtime enforcement, then rate limiting, before tRPC/REST transport adapters.
