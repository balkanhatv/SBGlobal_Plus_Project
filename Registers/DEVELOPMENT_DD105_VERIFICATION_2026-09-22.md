# Development DD-105 verification — 2026-09-22

**Branch:** `docs/architecture-branch-2`  
**Verified executable HEAD/tree:** `d654a5e8d969d880a0d9a5ebc064c924f6c25e8c` / `1a5a94a4c435b756e623a9cf4328cf04047d4409`  
**Checkpoint target:** `DEV-AUTOMATION-DEFINITION-READ-001`

## Source audit and implementation

`Development/AUTOMATION_DEFINITION_READER_PREREQUISITE_OWNERSHIP_AUDIT.md` reconciled DD-05, migration 0026 AutomationDefinition schema/FORCE-RLS, migration 0027 Workflow worker SELECT-only catalog privileges, migration 0031 creator/approver/reference integrity and the existing Workflow PostgreSQL boundary.

DD-105 adds:
- `src/core/workflow/automation-definition.ts`;
- Core export;
- `src/server/workflow/postgres-automation-definition-store.ts`;
- `tests/postgres/automation-definition-store.test.mjs`;
- DD-105 decision and WFA-DEF-PG-001…007 acceptance traceability.

The reader is exact-by-id. It validates only schema-owned owner/enums/positive integer/timestamp shape, deep-normalizes trigger/config JSON into immutable values and preserves optional condition-rule / OperationContract / WorkflowDefinition references as raw evidence. It does not select an active/effective automation, interpret EVENT/SCHEDULE/MANUAL triggers, evaluate conditions, dispatch operations/workflows or create/update AutomationRun.

## Failed exact-head isolation and targeted correction

The first executable head `fe30e3f6501bd2b159dde2058133e0eb82f99fdb` failed PostgreSQL job `106621156067` before WFA-DEF assertions executed. The shared fixture `before()` reused one bind parameter through incompatible UUID/text inference and PostgreSQL raised `42P08` (`inconsistent types deduced for parameter $1`).

Correction commit `d654a5e8d969d880a0d9a5ebc064c924f6c25e8c` changes only the PostgreSQL test fixture parameter typing. No production adapter, migration, verification SQL, role, grant, RLS policy or product policy changed.

## Exact-head CI evidence

| Verification | Run | Job | Result |
|---|---:|---:|---|
| Core Service Verify / Core | 35689772269 | 106624071181 | **311/311 PASS**, 0 fail, 0 skip |
| Core Service Verify / PostgreSQL | 35689772269 | 106624071049 | **183/183 PASS**, 0 fail, 0 skip |
| Database Verify | 35689772258 | 106624070955 | **PASS**, 47 migrations + 41 verification files |
| Web Boundary Verify | 35689772279 | 106624071193 | **PASS**, TypeScript + Next.js build |

All four workflows executed against exact head `d654a5e8d969d880a0d9a5ebc064c924f6c25e8c`; the PostgreSQL adapter/RLS step completed successfully.

## Acceptance and invariants

WFA-DEF-PG-001…007 pass:
- exact Tenant Industry definition preserves immutable raw trigger/config/reference evidence;
- sibling Industry definition is hidden by owner-scope FORCE-RLS;
- Tenant definition remains same-Tenant visible and preserves schema-permitted raw values;
- PLATFORM definition is not Tenant fallback and requires PLATFORM_GLOBAL context;
- foreign Tenant definition is hidden while its owning Tenant may read raw evidence;
- malformed id / database route mismatch fails closed;
- Workflow worker UPDATE is denied and the catalog row remains unchanged.

The verified executable feature tree contains **521 blobs / 211 Markdown / 132 TypeScript source files / 76 test files**, plus **47 migrations / 41 verification files**. No migration or verification SQL changed. Canonical promotion traceability is contiguous through **DD-105** after the traceability-sync commit.

RawSource blobs remain `a9f63a64448a347edd0f2b0c74094284ee953c1b` and `91c461de5e0d171f71d0bb89cd039953a1f1ecfd`. `main` remains `3911590ff2020993ce51b32d7b091efd6f5f466f`; no merge is performed.

## Promotion gate

This connector-authored register commit intentionally triggers the normal Core/PostgreSQL/Database/Web workflows after DD-105 + WFA-DEF-PG-001…007 canonical traceability was added. Checkpoint/state surfaces must not be promoted until these exact-head invariant checks are green.

## Remaining boundary

AutomationDefinition persistence is not automation execution authority. Active/effective selection, schedule/event/manual interpretation, condition evaluation, OperationContract dispatch, WorkflowDefinition execution and AutomationRun runtime remain unimplemented. The next continuation must source-audit the next independent source-complete slice before implementation.
