# CORE SERVICE CHECKPOINT — DEV-API-RATE-LIMIT-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — distributed SecurityRatePolicy v1 runtime

## Verified executable snapshot
- Commit: `f97eb4fca54623a49d6405681f5bda4c3751bb84`.
- Tree: `32e24b9ed495aa33c88d8ad91b22262f53509f65`.
- Database: **40 migrations / 34 verification files**.
- Industry SQL scope: **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **128 tests**.
- Real PostgreSQL inventory: **38 tests**.

## Current DD-06 rate-limit boundary
DD-050 / `DEV-API-RATE-LIMIT-001` is implemented:
- DD-022/DD-028 SecurityRatePolicy v1 numeric defaults are executable;
- AUTH_HIGH_COST→ADMIN_SENSITIVE, AI_COSTED→AI and WEBHOOK_ADMIN→WEBHOOK aliases are locked;
- applicable principal/IP/credential/Tenant/endpoint buckets are combined and the tightest denial wins;
- Tenant requests also enforce TENANT_AGGREGATE; credential requests also enforce API_CREDENTIAL;
- stricter tenant/plan/risk overrides are accepted; any relaxation beyond v1 is POLICY_DENIED;
- no ungoverned HIGH-risk multiplier was invented;
- token-bucket state and AI/BULK Tenant-only concurrency leases are distributed through PostgreSQL;
- all applicable bucket rows lock in deterministic hash order and no token/lease is consumed when any bucket denies;
- only SHA-256 bucket identities are persisted—no raw Tenant/Industry/principal/credential/IP identifiers;
- dedicated `sbg_rate_limiter_rw` owns limiter state; ordinary app/integration/compiler/control-plane roles cannot read it;
- throttle returns deterministic RATE_LIMITED + retry metadata only after the safe throttle-signal port succeeds.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35339582066 | 105582175189 | **PASS — 128/128** |
| Core Service Verify / postgres-context-verify | 35339582066 | 105582174829 | **PASS — 38/38** |
| Database Verify / postgres-verify | 35339582094 | 105582174796 | **PASS — 40 migrations / 34 verification files** |

All jobs asserted exact tested HEAD `f97eb4fca54623a49d6405681f5bda4c3751bb84` and tree `32e24b9ed495aa33c88d8ad91b22262f53509f65`.

## Scope limits / next governed work
The DD-06 idempotency + rate-limit runtime prerequisites are now verified. Before real tRPC/REST wiring, the next shared API prerequisite is **canonical input validation/canonicalization + transport-neutral operation execution orchestration**: resolve an OperationContract, validate/schema-normalize server input, obtain RequestContext, enforce rate limit + Commercial/Authorization/resource guards, bind idempotency for commands, call only the declared domain service port, and normalize safe output/error metadata.

No tRPC/REST package adapter should be added until that execution contract is locked and tested. Concrete per-module domain services/resource adapters, UI/mobile/desktop, deployment and production certification remain unfinished. RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
