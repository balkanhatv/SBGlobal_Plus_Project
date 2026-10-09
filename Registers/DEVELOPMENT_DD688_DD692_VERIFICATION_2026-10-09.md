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

## Canonical promotion correction and independent proof — 2026-10-09

The initial canonical projection commit `bf08f89a3ccac6469dbc984f740a11e62e986266` failed REPO-011, REPO-007 and REPO-009 metadata consistency assertions (1672/1675 Core; no production reader failure). Targeted forward-only correction `84dc51e5fec0069466ef298e80cf068b018bfca1` / tree `dfdaed2478e29dc1eaf30a48806a987cded0f891` synchronized the 57 active projection headers, 14 current narratives, canonical manifest and downstream evidence. No assertions, tests, feature logic or historical source records were weakened.

The corrected canonical promotion independently passed at exact HEAD `84dc51e5fec0069466ef298e80cf068b018bfca1`:
- Core run `37877047684`, job `113647922914`: **1675/1675 PASS**, 0 fail/skip.
- PostgreSQL run `37877047684`, job `113647923186`: **540/540 PASS**, 0 fail/skip; database bootstrap PASS.
- Database run `37877047670`, job `113647922618`: **48 migrations / 42 verification files PASS**.
- Web run `37877047672`: **PASS**.
- Same-head PR Core/Database/Web runs `37877052615` / `37877052654` / `37877052662`: **PASS**.

All DD-17/18/19 contracts, `State/PROJECT_MANIFEST.json`, active projections, and this register are at the corrected verified canonical promotion baseline. This separate state-closure commit requires its **own** exact-HEAD Core/PostgreSQL/Database/Web PASS before DD-688…DD-692 batch closure. No self-reference to the state-closure SHA is asserted. Production readiness is not claimed.
