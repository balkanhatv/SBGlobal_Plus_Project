# AI ProvisioningSnapshot lifecycle/validity prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-AI-PROVISIONING-SNAPSHOT-GOVERNED-SHAPE-FLOORS-001`
**Verified entry HEAD:** `9fd20afab23256edc8dae4c6018b8ed2596ce04d`
**Verified entry tree:** `f7284e50de6b786e40c30a69af3469adde7f7157`
**Governed candidate:** DD-219

## Entry gate

DD-218 canonical promotion and state closure are exact-head verified:
- Core `36455876975` / `109041952933`: **805/805 PASS**, zero failed/skipped.
- PostgreSQL `109041953066`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database `36455876827` / `109041952559`: PASS.
- Web `36455876788` / `109041952231`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged.

## Source ownership reconciled

Freshly reconciled:
- migration 0011 `core_ai.ai_provisioning_snapshot`;
- DD-124 `PersistedAIProvisioningSnapshot`;
- `PostgresAIProvisioningSnapshotStore`;
- DD-218 remaining governed-shape floor.

Migration 0011 physically owns the remaining intrinsic lifecycle/validity facts:
- `version bigint NOT NULL CHECK (version > 0)`;
- `status core_ai.provisioning_status NOT NULL`;
- enum vocabulary exactly `ACTIVE | SUPERSEDED | REVOKED`;
- `compiled_at timestamptz NOT NULL`;
- `valid_until timestamptz`;
- `CHECK (valid_until IS NULL OR valid_until > compiled_at)`.

DD-124 exposes immutable `version`, `status`, `compiledAt`, and optional `validUntil` evidence. The PostgreSQL reader preserves version as exact positive bigint text, status as the exact source vocabulary and timestamps as normalized ISO instants. No new reader, schema, RLS, role or grant is required.

## Determination and locked DD-219 detailed contract

**SOURCE-COMPLETE for intrinsic ProvisioningSnapshot persisted version/status/validity ordering only.**

Authorize pure helper:

`matchesAIProvisioningSnapshotLifecycleValidityFloors(snapshot)`

It returns boolean and never mutates input.

1. Require snapshot object with UUID-shaped `id` and `tenantId`.
2. Require `version` to be canonical positive integer text: `^[1-9][0-9]*$`.
3. Require raw `status` exactly one of `ACTIVE | SUPERSEDED | REVOKED`; no case/whitespace normalization.
4. Require `compiledAt` to be a string representing a finite timestamp instant.
5. Allow `validUntil === undefined`.
6. If `validUntil` is present, require it to be a string representing a finite timestamp instant and strictly later than `compiledAt`.
7. Do not require `validUntil` to be in the future relative to wall-clock time. This helper re-evaluates persisted relational integrity, not current validity.
8. Do not interpret status as authorization/currentness.
9. Do not interpret commercial/config/Industry versions, pack maps, Capability/Provider/API/Model classes, budget, routing or execution.

## Fixed acceptance before implementation

- **AIPROVSNAP-LIFE-CUR-001**: positive canonical version, exact allowed status, valid compiledAt and absent/future-relative-to-compiledAt validUntil pass.
- **AIPROVSNAP-LIFE-CUR-002**: zero, negative, signed, decimal, leading-zero, whitespace or non-string version evidence fails closed.
- **AIPROVSNAP-LIFE-CUR-003**: ACTIVE/SUPERSEDED/REVOKED pass exactly; unknown/case/whitespace/non-string status fails.
- **AIPROVSNAP-LIFE-CUR-004**: malformed/non-string/non-finite compiledAt evidence fails closed.
- **AIPROVSNAP-LIFE-CUR-005**: present malformed/non-string validUntil, equal instant or earlier instant fails closed.
- **AIPROVSNAP-LIFE-CUR-006**: an already-expired-in-wall-clock snapshot still passes when its persisted validUntil is strictly after compiledAt; no "now" semantics are invented.
- **AIPROVSNAP-LIFE-CUR-007**: malformed snapshot/Tenant identities fail closed; unrelated fields remain uninterpreted.
- **AIPROVSNAP-LIFE-CUR-008**: input remains unchanged and the helper grants no current/effective/authorized semantics.

Expected executable delta after this source-audit commit independently passes exact-head verification:
- Core **805 → 813**;
- PostgreSQL remains **525**;
- Database remains **48 migrations / 42 verification files**;
- Web unchanged.

## Explicit exclusions

DD-219 changes no schema, migration, RLS, role, grant, route, public API or product policy.

A true DD-219 result does not prove:
- snapshot is current/latest or presently unexpired;
- ACTIVE status authorizes use;
- Subscription/Entitlement/Industry/TenantAIConfig currentness;
- pack currentness or entitlement;
- effective AI provisioning;
- Provider/model routing or AI execution.

After the DD-219 source-audit commit independently passes exact-head Core/PostgreSQL/Database/Web verification, implement only the pure helper, eight fixed acceptance tests and Core export.
