# DD-688…DD-692 — AICost direct TokenUsage binding verification

**Date:** 2026-10-09  
**Source audit:** `Development/AI_COST_TOKEN_USAGE_CURRENT_EVIDENCE_READER_COMPOSITION_BATCH_PREREQUISITE_OWNERSHIP_AUDIT.md`  
**Source audit HEAD:** `e8b93eceed52bb54d2a5bd7e63e0de494e37bb13` (exact-head Core/PostgreSQL/Database/Web all PASS)  
**Initial implementation HEAD:** `b086f080dcbea18f2752cb6d113f7e97af84ea13`  
**Corrected verified implementation HEAD/tree:** `c7896cbefc115e96f77a0a9859759bb1e3dab1e4` / `5fd94558be45924a9a521c57f21710b9157686a5`.

## Forward-only test correction

Initial Core run 37876295759 executed 1675 tests: 1674 passed, 1 failed, 0 skipped. The failure was only the AICOST-USAGEREAD-FLOOR-001 test fixture: the digits-only UUID was unchanged by `.toUpperCase()` and therefore did not exercise case-sensitive mismatch. Correction `c7896cbefc115e96f77a0a9859759bb1e3dab1e4` changed that fixture to a valid letter-containing UUID; no production implementation, assertion, authorization semantics or other tests were weakened. The failed initial HEAD is not promoted.

## Exact corrected implementation proof

- Core push run `37876411373` / job `113645944525`: **1675/1675 PASS**, fail 0, skipped 0.
- Real PostgreSQL push run `37876411373` / job `113645944348`: **540/540 PASS**, fail 0, skipped 0; database bootstrap PASS.
- Database push run `37876411411` / job `113645944540`: **PASS**, unchanged **48 migrations / 42 SQL verification files**.
- Web push run `37876411416` / job `113645944369`: **PASS**.

## Bounded code scope

`src/core/ai/cost-token-usage-current-evidence-reader.ts` composes DD-123 cost first, validates DD-198 necessary UUID, reads DD-122 exact persisted TokenUsage id under the *same RequestContext reference*, and applies DD-198 exact equality before returning frozen `{cost,usage}` with raw unchanged records. Eight explicit `tests/core/ai-cost-token-usage-current-evidence-reader.test.mjs` acceptance tests cover sequencing, null/errors, malformed linkage, same-context lookup, hidden/wrong parent, exact case parity, raw precision/reference identity and non-authorizing boundary.

No pricing/rate/billability/finalization computation, invoice/tax/payment/ledger, quota/budget, entitlement, principal currentness, catalog eligibility, provider/model routing, AI execution, API/UI, schema, migration, RLS, role/grant or RawSource change. Nine equal Industries / 41 MS / 181 Industry tables / 2,962 source requirements / two logical Tenant apps unchanged. PR #2 remains open/draft/unmerged; main unchanged; production readiness not claimed.

## Next gates

This canonical promotion commit is only **STAGED** until its own exact-head Core/PostgreSQL/Database/Web PASS. Then separately synchronize state projections and verify the state-closure commit at its exact HEAD. Do not infer those future results from this implementation basis.
