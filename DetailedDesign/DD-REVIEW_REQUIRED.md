# DD REVIEW REQUIRED
**Updated:** 2026-09-11

| ID | Severity | Scope | Item | Status | Disposition |
|---|---|---|---|---|---|
| DD-RR-001 | P2 | Wave 1 | Numeric API rate limits not source/contract backed | DEFERRED | Define in plan/version or security design; no arbitrary value in Wave 1 |
| DD-RR-002 | P2 | Wave 1 | Dunning/grace timing values not authorized | DEFERRED | Remain configurable commercial data; DD-04 defines fields, not invented values |
| DD-RR-003 | P2 | Wave 1 | Exact audit retention day counts vary by compliance profile | DEFERRED | DD-15 defines retention class contract; values assigned later by approved profile |
| DD-RR-004 | P2 | Wave 1 | Vendor-specific telemetry stack not selected | DEFERRED | DD-15 defines vendor-neutral schema and SLI contracts |
| DD-RR-005 | P2 | Wave 1 | Physical object-store provider/key implementation not selected | DEFERRED | DD-08 fixes metadata/security contract; provider topology is DD-14 |

## Gate interpretation
Deferred P2 items above are intentionally outside Wave-1 authorization or require later approved inputs. There are no open P0/P1 items for Wave 1 at initialization; DD-20 must re-check this before the wave gate closes.
