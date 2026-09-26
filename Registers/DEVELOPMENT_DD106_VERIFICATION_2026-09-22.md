# Development DD-106 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `0bd4cb33d07836f797d434b21d5e24fcee0a3641` / `e6630c0dc1d01b238e9299c6281cb3ce86ed76e6`  
**Checkpoint:** `DEV-AUTOMATION-RUN-READ-001`

## Source audit and implementation

`Development/AUTOMATION_RUN_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` at `fc12b6f4ee4beac2c3ebe5379bf0b5013ca4cb54` reconciled DD-05, migration 0026 AutomationRun schema/FORCE-RLS, migration 0027 Workflow worker SELECT/INSERT/UPDATE privileges, migration 0031 AutomationRun-to-AutomationDefinition integrity and the existing Workflow PostgreSQL boundary.

DD-106 adds:
- `src/core/workflow/automation-run.ts`;
- Core export;
- `src/server/workflow/postgres-automation-run-store.ts`;
- `tests/postgres/automation-run-store.test.mjs`;
- DD-106 decision and WFA-RUN-PG-001…007 acceptance traceability.

The reader is exact-by-id. It validates only schema-owned UUID/status/timestamp shape plus the persisted completion-time ordering invariant, and preserves raw trigger reference, idempotency hash, correlation id and optional last-error evidence. It does not select/create a run, interpret a trigger, determine replay authority, choose a status transition, schedule retry/finality, dispatch an OperationContract/WorkflowDefinition or mutate AutomationRun.

The Workflow worker's existing schema-owned AutomationRun UPDATE privilege remains unchanged. DD-106 is mutation-free because its Core read port exposes no mutation method; it does not narrow database privileges that belong to later source-owned runtime semantics.

## Exact executable-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35691305850 | 106628678648 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35691305850 | 106628678789 | **190/190 PASS**, 0 fail, 0 skip |
| Database Verify | 35691305768 | 106628678181 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35691305751 | 106628678101 | **PASS**, TypeScript + Next.js build |

All four verification jobs executed against exact executable head `0bd4cb33d07836f797d434b21d5e24fcee0a3641`; the PostgreSQL adapter/RLS step completed successfully.

## Acceptance and invariants

WFA-RUN-PG-001…007 pass:
- exact Tenant Industry run preserves immutable raw trigger/idempotency/status evidence;
- sibling Industry run is hidden by FORCE-RLS;
- Tenant Core run remains same-Tenant visible from Tenant Core and Tenant Industry contexts;
- foreign Tenant run is hidden while its owning Tenant may read raw evidence;
- persisted run evidence exposes no trigger/retry/finality/next-state execution decision;
- malformed id / database route-context mismatch fails closed;
- the schema-owned Workflow worker UPDATE privilege remains while DD-106 exposes no mutation method.

Database bootstrap preserves **47 migrations / 41 verification files** and the executable PostgreSQL invariant checks preserve **9 Industries / 41 canonical Management Systems / 181 registered Industry tables**. Requirement preservation remains **2,962 source requirement IDs/text**. No migration, verification SQL, role, grant, RLS policy, route, RawSource or product-policy change is part of DD-106.

Verified executable inventory is **526 blobs / 213 Markdown / 134 TypeScript source / 77 test files**. This is derived from the previously verified DD-105 executable inventory plus the exact `d654a5e8…0bd4cb33` compare, whose only added blobs are the DD-106 source audit, prior DD-105 verification register, two AutomationRun source files and one AutomationRun test file.

## Canonical traceability

DD-106 and WFA-RUN-PG-001…007 were added to canonical DD-18 / DD-17 by self-removing traceability sync commit `1dd849f0ecda14d8dca67e9b98136261fc5aeb43`.

The first helper run at staged commit `2dde3c4f4aebaa5cc176d79628e88284165144be` failed before editing canonical files because the helper's Node template literal escaped Markdown backticks incorrectly. Workflow-only correction `c096fc2d6cd2c085b3a0d86971081f04aa77bd9b` replaced the helper with literal append blocks; no production source, test, database or policy file changed in that correction.

## Canonical invariant gate

Connector-authored invariant-gate head `48eb8202632324417fe588d6374563ad8e352dcd` / tree `d3cab507557758484fd3bc1597b776c29bd53e4b` passed all standard workflows after canonical DD-106/DD-17 traceability was present:

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35694105062 | 106637088493 | **SUCCESS** |
| Core Service Verify / PostgreSQL | 35694105062 | 106637088273 | **SUCCESS**, full DB baseline + concrete PostgreSQL adapter/RLS step |
| Database Verify | 35694105056 | 106637088194 | **SUCCESS** |
| Web Boundary Verify | 35694105046 | 106637087909 | **SUCCESS** |

This gate preserves the already-established executable test counts **311 Core / 190 PostgreSQL**, **47 migrations / 41 verification files** and the repository invariants above.

## Checkpoint and state promotion

A self-removing state-sync helper was staged at `d31962216dbc18504c42e910838f315155be4868`. It promoted the current checkpoint/state projection at commit `142fefd64337424817da1299580f341615d4159d` / tree `2c1c33f39ee3a21c37f97a4965da5053050e27cd` and removed itself.

The exact compare `48eb8202…142fefd6` modifies only these nine intended state/checkpoint surfaces:
- `DetailedDesign/DD-CHECKPOINT.md`
- `DetailedDesign/DD-INDEX.md`
- `DetailedDesign/DD-PHASE_STATE.md`
- `Development/CORE_SERVICE_CHECKPOINT.md`
- `Development/DEVELOPMENT_STATE.md`
- `State/HANDOFF_NOTE.md`
- `State/PHASE_SUMMARY.md`
- `State/PROJECT_MANIFEST.json`
- `State/PROJECT_STATE.md`

No source, test, database, migration, verification SQL, role, grant, RLS, RawSource or product-policy file changed in state promotion. Current state records `DEV-AUTOMATION-RUN-READ-001`, contiguous ADR-001–020 / DD-001–106, and keeps executable basis `0bd4cb33… / e6630c0d…` to avoid recursive self-hash claims.

This connector-authored register update is the final DD-106 promotion CI trigger. Core/PostgreSQL/Database/Web must pass on its exact resulting head before promotion is considered closed.

## Remaining boundary

AutomationRun persistence is not automation runtime authority. Trigger execution, idempotency/replay decisions, retry/backoff/finality, status-transition authorization/mutation flow, condition evaluation, OperationContract dispatch and WorkflowDefinition execution remain unimplemented. The next continuation must source-audit the next independent source-complete slice before implementation.
