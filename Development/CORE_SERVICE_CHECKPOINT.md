# CORE SERVICE CHECKPOINT — DEV-API-IDEMPOTENCY-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — transport-neutral exact-scope idempotency runtime boundary

## Verified executable snapshot
- Commit: `5a6a93b9d509f56599ee1e6f3eed00d63d8484bf`.
- Tree: `55e32eaabafdc1da9aa57d19689dea2cf8c7b862`.
- Database: **39 migrations / 33 verification files**.
- Industry SQL scope: **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.
- Core/server acceptance inventory: **122 tests**.
- Real PostgreSQL inventory: **33 tests**.

## Current DD-06 idempotency boundary
DD-049 / `DEV-API-IDEMPOTENCY-001` is implemented:
- REQUIRED key missing fails before domain mutation;
- OPTIONAL without key and NONE bypass persistence;
- only TENANT_CORE/TENANT_INDUSTRY COMMAND paths are supported by this physical runtime slice;
- plaintext keys/request bodies never persist;
- versioned SHA-256 key/request fingerprints are server-derived from validated canonical input;
- same key + different fingerprint => deterministic conflict;
- IN_PROGRESS prevents a second execution claim;
- SUCCEEDED returns replay metadata only;
- FAILED_RETRYABLE may atomically reclaim; FAILED_FINAL stays final;
- expired keys may reinitialize only after row lock;
- concurrent identical first claims produce exactly one STARTED claimant;
- migration 0039 fixes the legacy null-Industry wildcard RLS defect;
- `sbg_app_rw` has only SELECT/INSERT/UPDATE on idempotency truth and no DELETE.

## Exact executable evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35335799295 | 105570227470 | **PASS — 122/122** |
| Core Service Verify / postgres-context-verify | 35335799295 | 105570227217 | **PASS — 33/33** |
| Database Verify / postgres-verify | 35335799285 | 105570227205 | **PASS — 39 migrations / 33 verification files** |

All jobs asserted exact tested HEAD `5a6a93b9d509f56599ee1e6f3eed00d63d8484bf` and tree `55e32eaabafdc1da9aa57d19689dea2cf8c7b862`.

## Next governed work
Next shared-Core prerequisite: **DD-06 runtime rate-limit enforcement only**, consuming the locked DD-022/DD-028 rate-class policy. It must remain transport-neutral, apply the tightest applicable principal/IP/credential/Tenant/security-risk bucket, fail closed on limiter dependency/state errors, and produce deterministic RATE_LIMITED + retry metadata.

Do not start tRPC/REST adapters until the rate-limit prerequisite passes exact-head CI.

Still unfinished: concrete per-module resource/workflow adapters, dedicated Commercial restricted-mode/UPGRADE_CTA, enforceable ABAC RESTRICT payload/reducer, PUBLIC/EXPLICIT_CROSS_CONTEXT audit/idempotency paths, UI/mobile/desktop, deployment and production certification. RawSourceCorpus immutable; `main` unmerged; PR #2 draft/review-only.
