# CORE SERVICE CHECKPOINT — DEV-API-RATE-LIMIT-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — distributed SecurityRatePolicy v1 runtime

## Verified executable snapshot
- Commit: `4defa98c18e5314cf647700740de5bff33d3807e`.
- Tree: `ade7862646c873b65db915c11b59338912811de8`.
- Database: **40 migrations / 34 verification files**.
- Industry SQL scope: **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **128 tests**.
- Real PostgreSQL inventory: **38 tests**.

## Current DD-06 rate-limit boundary
DD-050 / `DEV-API-RATE-LIMIT-001` is implemented:
- SecurityRatePolicy v1 combines DD-022/DD-028 sustained/security ceilings with DD-06 §19 burst and concurrency scopes;
- AUTH_HIGH_COST→ADMIN_SENSITIVE, AI_COSTED→AI and WEBHOOK_ADMIN→WEBHOOK aliases are locked;
- applicable principal/IP/credential/Tenant/endpoint buckets are combined and the tightest denial wins;
- Tenant requests also enforce TENANT_AGGREGATE; credential requests also enforce API_CREDENTIAL;
- stricter tenant/plan/risk overrides are accepted; any relaxation beyond v1 is POLICY_DENIED;
- no ungoverned HIGH-risk multiplier was invented;
- token-bucket burst capacities and concurrency scopes follow DD-06 §19 exactly (PUBLIC by IP; authenticated sensitive classes by governed principal/IP/credential scope; BULK/AI/TENANT_AGGREGATE by Tenant; WEBHOOK by endpoint);
- all applicable bucket rows lock in deterministic hash order and no token/lease is consumed when any bucket denies;
- only SHA-256 bucket identities are persisted—no raw Tenant/Industry/principal/credential/IP identifiers;
- dedicated `sbg_rate_limiter_rw` owns limiter state; ordinary app/integration/compiler/control-plane roles cannot read it;
- throttle returns deterministic RATE_LIMITED + retry metadata only after the safe throttle-signal port succeeds.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35341100630 | 105586948419 | **PASS — 128/128** |
| Core Service Verify / postgres-context-verify | 35341100630 | 105586948582 | **PASS — 38/38** |
| Database Verify / postgres-verify | 35341100619 | 105586948446 | **PASS — 40 migrations / 34 verification files** |

All jobs asserted exact tested HEAD `4defa98c18e5314cf647700740de5bff33d3807e` and tree `ade7862646c873b65db915c11b59338912811de8`.

## Scope limits / next governed work
The DD-06 idempotency + rate-limit runtime prerequisites are now verified. Before real tRPC/REST wiring, the next shared API prerequisite is **canonical input validation/canonicalization + transport-neutral operation execution orchestration**: resolve an OperationContract, validate/schema-normalize server input, obtain RequestContext, enforce rate limit + Commercial/Authorization/resource guards, bind idempotency for commands, call only the declared domain service port, and normalize safe output/error metadata.

No tRPC/REST package adapter should be added until that execution contract is locked and tested. Concrete per-module domain services/resource adapters, UI/mobile/desktop, deployment and production certification remain unfinished. RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
