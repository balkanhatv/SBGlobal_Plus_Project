# COMMERCIAL CHANGE-PLAN PREREQUISITE AUDIT
**Date:** 2026-09-19  
**Branch:** `docs/architecture-branch-2`  
**Starting checkpoint:** `DEV-COMMERCIAL-ENTITLEMENTS-QUERY-001`  
**Verified executable floor:** `3bb86bc4b1b313c6bee8c8d65406992bb6b28cc7` / `07ebd925d3c0176907ebd257e0cdecb5d0f3840e`

## Verdict

**DIRECT `core.commercial.subscription.changePlan` IMPLEMENTATION: BLOCKED BY PREREQUISITES.**

The blocker is not the already-verified query/transport kernel. The blocker is the missing deterministic write-side Commercial contract and physical boundaries required by F-14/A-04/DD-04/DD-07.

## Findings

| ID | Finding | Evidence-based status | Required next action |
|---|---|---|---|
| CP-01 | DD-06 put `idempotencyKey` in DTO while DD-049/DD-054 use transport metadata | **CORRECTED** | DTO excludes key; OperationContract will be REQUIRED |
| CP-02 | `effectiveTiming` enum was unnamed | **CORRECTED** | exact vocabulary `IMMEDIATE | NEXT_RENEWAL` |
| CP-03 | F-14 requires checkout/payment or order/approval before plan mutation | **CONTRACT LOCKED — DD-062** | implement physical server-owned assessment/resolution evidence; direct apply still blocked |
| CP-04 | downgrade requires impact assessment + explicit remediation | **CONTRACT LOCKED — DD-062** | persist/version assessment + remediation evidence before apply runtime |
| CP-05 | A-04 assigns proration to Billing; no Billing/payment/proration runtime exists | **HANDOFF CONTRACT LOCKED — DD-062; RUNTIME BLOCKING** | Billing/approval producer runtime remains required; Commercial must not calculate money |
| CP-06 | no Commercial mutation/compiler runtime existed under `src/` | **VERIFIED — DD-065 / migration 0044 / executable publication store** | keep primitive internal until DD-062 evidence/runtime gates are physical |
| CP-07 | DD-07 requires cataloged events; executable code/catalog lacked `subscription.transitioned` / `entitlement.recompiled` | **VERIFIED — DD-063 / migration 0042** | require PostgreSQL verification before writer/compiler work |
| CP-08 | `sbg_app_rw` historically has broad Commercial DML; no dedicated plan-change/compiler writer role exists | **VERIFIED — DD-064 / migration 0043** | require real PostgreSQL privilege + same-Tenant cross-Industry isolation verification |

## Repository evidence

- Commercial runtime now includes read-side current state plus `src/core/commercial/publication.ts`, dedicated compiler database adapter and PostgreSQL atomic publication store.
- Subscription/Transition/License/Snapshot persistence is now backed by DD-064/065 least-privilege atomic publication code; a plan-change request/assessment/resolution persistence entity is still absent.
- DD-064 migration 0043 now introduces and verifies the dedicated Commercial transition/compiler role.
- DD-063 migration 0042 now catalogs the required Commercial v1 transition/recompile events and DD-065 emits them atomically.
- Shared idempotency is already complete in DD-049/migration 0039/executor and therefore must be reused, not duplicated.

## Dependency-safe continuation

Next work must close **DD-061 write-contract prerequisites** before command code. The safest order is:

1. ~~lock server-owned plan-change resolution/impact/remediation/Billing handoff contract~~ **DONE — DD-062**;
2. ~~lock Commercial event v1 payload/catalog contracts~~ **VERIFIED — DD-063 / migration 0042**;
3. ~~design and implement least-privilege Commercial write/compiler DB boundary~~ **VERIFIED — DD-064 / migration 0043**;
4. ~~implement immutable entitlement snapshot publication transaction + outbox/audit atomicity~~ **VERIFIED — DD-065**;
5. implement persisted/versioned DD-062 assessment/remediation + Billing/approval resolution evidence producers;
6. only then bind `core.commercial.subscription.changePlan` through the existing OperationExecutor/tRPC/Next chain.

RawSourceCorpus remains immutable. `main` remains unmerged.
