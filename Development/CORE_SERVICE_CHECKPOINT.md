# CORE SERVICE CHECKPOINT — DEV-API-EXECUTOR-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — canonical schema + transport-neutral OperationContract execution kernel

## Verified executable snapshot
- Commit: `540b5433bfddeed59944b87581806855bfc1d403`.
- Tree: `ccb8611a7ad78cd0ac88be5b7652ece4b0eb5aec`.
- Core/server acceptance: **141/141 PASS**.
- Real PostgreSQL regression: **38/38 PASS**.
- Database: **40 migrations / 34 verification files PASS**.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## DD-051 execution boundary
- route/adapter binds operationId; OperationContract.scopeClass is authoritative over any caller suggestion;
- exact operation/schema versions resolve through a server-owned OperationSchemaRegistry;
- parser output must be JSON-compatible, recursively normalized/frozen and deterministically canonicalized for idempotency;
- resource references are derived only from validated normalized input;
- fixed order: OperationContract → RequestContext → input schema → rate admission → GuardPipeline → command idempotency → declared domain handler → output schema → idempotency completion;
- replay/IN_PROGRESS/FINAL_FAILURE remain explicit transport-neutral results and still pass current context/rate/guard checks before being honored;
- domain dispatch is registry-only; no eval/reflection/arbitrary import;
- only declared DomainOperationError codes may surface; unknown post-dispatch exceptions are mutation-ambiguous and non-retryable;
- output-contract failures after domain return finalize the STARTED idempotency attempt;
- post-domain success-completion persistence failure leaves IN_PROGRESS and is never rewritten to retryable;
- expiring rate-lease cleanup failure does not rewrite a completed business result.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35361748497 | 105654436426 | **PASS — 141/141** |
| Core Service Verify / postgres-context-verify | 35361748497 | 105654436114 | **PASS — 38/38** |
| Database Verify / postgres-verify | 35361748167 | 105654436259 | **PASS — 40 migrations / 34 verification files** |

All jobs asserted exact tested HEAD `540b5433bfddeed59944b87581806855bfc1d403` and tree `ccb8611a7ad78cd0ac88be5b7652ece4b0eb5aec`.

## Next governed work
A-06 requires **Zod DTO schemas as the single source** for tRPC input, REST/OpenAPI and webhook payload projections. Next implement only the **Zod-backed OperationSchema bridge + transport-neutral success/error projection contract**. Do not add concrete tRPC/REST routing until that shared DTO/projection floor is executable and tested.

Still unfinished: concrete per-module schemas/domain handlers across the catalog, module resource/workflow adapters, enforceable ABAC RESTRICT reducer, Commercial restricted-mode/UPGRADE_CTA, tRPC/REST adapters, UI/mobile/desktop, deployment and production certification.

RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays draft/review-only.
