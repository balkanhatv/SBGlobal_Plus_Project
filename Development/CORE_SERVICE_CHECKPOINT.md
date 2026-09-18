# CORE SERVICE CHECKPOINT — DEV-API-DTO-PROJECTION-001
**Updated:** 2026-09-18  
**Branch:** `docs/architecture-branch-2`  
**Status:** IMPLEMENTED / TESTED — Zod DTO single-source bridge + transport-neutral projection floor

## Verified executable snapshot
- Commit: `b0f484eb8100a71c8677fce4c39441a8ab26e881`.
- Tree: `69d2fa367329c1dc2b02d3a829ff80d714a21177`.
- Core/server acceptance: **148/148 PASS**.
- Real PostgreSQL regression: **38/38 PASS**.
- Database: **40 migrations / 34 verification files PASS**.
- Industry SQL scope remains **9 Current Supported Industries / 41 canonical MS / 181 canonical Industry tables**.

## DD-052 boundary
- `zod@4.6.5` is pinned as the A-06 DTO schema implementation;
- exact operationId + input/output schema versions own one Zod DTO definition;
- the same Zod schemas feed DD-051 executor validation and future tRPC/REST/OpenAPI projection;
- Zod input defaults/transforms still pass deterministic JSON normalization before idempotency fingerprinting;
- resource references are derived only from validated normalized input;
- validation field detail exposes only safe JSON-pointer-like paths + normalized issue codes;
- raw rejected values, arbitrary Zod messages, stacks and schema internals are not projected;
- canonical success envelopes and the four A-01 error classes are normalized once;
- Retry-After remains adapter metadata;
- replay / IN_PROGRESS / FINAL_FAILURE remain explicit control projections and never fabricate response DTO bodies.

## Exact evidence
| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / core-service-verify | 35364414471 | 105663244846 | **PASS — 148/148** |
| Core Service Verify / postgres-context-verify | 35364414471 | 105663245159 | **PASS — 38/38** |
| Database Verify / postgres-verify | 35364414463 | 105663245380 | **PASS — 40 migrations / 34 verification files** |

All jobs asserted exact tested HEAD `b0f484eb8100a71c8677fce4c39441a8ab26e881` and tree `69d2fa367329c1dc2b02d3a829ff80d714a21177`.

## Next governed work
Implement only the **first-party tRPC adapter floor** using the already verified OperationExecutor + ZodOperationDtoRegistry + TransportEnvelopeProjector. Start with a bounded baseline Core operation surface and prove:
- router/procedure name → fixed OperationContract ID;
- transport input uses the same registered Zod schema object;
- transport/request correlation is normalized before executor invocation;
- scope remains OperationContract-authoritative;
- tRPC does not duplicate guard/rate/idempotency/domain logic;
- RATE_LIMITED / policy / system errors map from the shared projector without exposing internal details;
- replay control remains explicit.

Do not start REST/OpenAPI or broad module routers until the tRPC floor passes exact-head CI. RawSourceCorpus remains immutable. `main` remains unmerged; PR #2 stays draft/review-only.
