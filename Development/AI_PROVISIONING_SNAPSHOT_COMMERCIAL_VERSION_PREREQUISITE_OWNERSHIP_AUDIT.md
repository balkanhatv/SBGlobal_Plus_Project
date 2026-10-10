# AI ProvisioningSnapshot commercial-version equality prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-COMMERCIAL-PROVISIONING-VERSION-RAW-READ-001`
**Verified entry HEAD:** `7cccc4b1efdd9af9dda16eb43db1606ad7b2c39b`
**Verified entry tree:** `3d00acb29eccb171ae9314e907d0ab9f14222f21`
**Governed candidate:** DD-217

## Entry gate

DD-216 canonical promotion and state closure are exact-head verified:
- Core `36443336803` / `108999174875`: **789/789 PASS**, zero failed/skipped.
- PostgreSQL `108999174353`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database `36443336865` / `108999176725`: PASS.
- Web `36443336981` / `108999174495`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged.

## Source ownership reconciled

Freshly reconciled:
- migration 0001 `tenant.current_subscription_id`;
- migration 0004 Subscription and EntitlementSnapshot version/status constraints;
- migration 0011 ProvisioningSnapshot persisted commercial version fields;
- migration 0031 ProvisioningSnapshot commercial-version integrity predicate;
- DD-124 `PersistedAIProvisioningSnapshot`;
- DD-216 `CommercialProvisioningVersionEvidence` and PostgreSQL reader.

Migration 0031 accepts the commercial portion of a ProvisioningSnapshot only when both source-owned facts exist for the same Tenant:
1. a raw `CURRENT` EntitlementSnapshot whose `version = snapshot.entitlement_snapshot_version`;
2. the Subscription referenced by `tenant.current_subscription_id` whose `version = snapshot.subscription_version`.

DD-216 already supplies exactly those two raw evidence pairs without imposing valid-time or source-linkage semantics. No new reader, schema, RLS, role or grant is required.

## Determination and locked DD-217 implementation boundary

**SOURCE-COMPLETE for ProvisioningSnapshot commercial-version equality against supplied DD-216 evidence only.**

Authorize pure helper:

`matchesAIProvisioningSnapshotCommercialVersionFloors(snapshot, evidence)`

It returns boolean and never mutates inputs.

1. Validate ProvisioningSnapshot id/Tenant id UUID shape.
2. Validate snapshot `subscriptionVersion` as exact canonical PostgreSQL bigint decimal text, including zero/negative values because the Subscription version column has no positive CHECK.
3. Validate snapshot `entitlementSnapshotVersion` as exact canonical positive PostgreSQL bigint text because referenced EntitlementSnapshot versions are physically constrained `> 0`.
4. Validate evidence Tenant id UUID and require exact same Tenant.
5. Require current-Subscription evidence to be complete: both `currentSubscriptionId` and `subscriptionVersion` present; validate id UUID and version as canonical PostgreSQL bigint text.
6. Require CURRENT EntitlementSnapshot evidence to be complete: both `entitlementSnapshotId` and `entitlementSnapshotVersion` present; validate id UUID and version as canonical positive PostgreSQL bigint text.
7. Require exact textual equality `snapshot.subscriptionVersion === evidence.subscriptionVersion`.
8. Require exact textual equality `snapshot.entitlementSnapshotVersion === evidence.entitlementSnapshotVersion`.
9. Do not interpret Subscription lifecycle state, EntitlementSnapshot valid_from/expires_at, source Subscription/Plan linkage, IDs beyond evidence completeness, snapshot status/validity/Industry/config/capability/provider/model/budget fields, entitlement sufficiency or runtime authorization.

Canonical bigint validation is bounded to PostgreSQL signed bigint range and canonical decimal representation, preserving database evidence exactly.

## Fixed acceptance before implementation

- **AIPROVSNAP-COMVER-CUR-001**: exact same-Tenant complete Subscription + CURRENT EntitlementSnapshot version evidence passes.
- **AIPROVSNAP-COMVER-CUR-002**: foreign Tenant or malformed snapshot/evidence identities fail closed.
- **AIPROVSNAP-COMVER-CUR-003**: missing/incomplete current-Subscription evidence fails closed.
- **AIPROVSNAP-COMVER-CUR-004**: missing/incomplete CURRENT EntitlementSnapshot evidence fails closed.
- **AIPROVSNAP-COMVER-CUR-005**: Subscription version mismatch or malformed/non-canonical/out-of-range bigint text fails closed; signed/zero PostgreSQL bigint values remain representable.
- **AIPROVSNAP-COMVER-CUR-006**: EntitlementSnapshot version mismatch or non-positive/malformed/non-canonical/out-of-range bigint text fails closed.
- **AIPROVSNAP-COMVER-CUR-007**: exact maximum PostgreSQL bigint values pass when evidence matches; no numeric coercion is used.
- **AIPROVSNAP-COMVER-CUR-008**: unrelated fields remain uninterpreted and inputs remain unchanged.

Expected executable delta after this source-audit commit independently passes exact-head verification:
- Core **789 → 797**;
- PostgreSQL remains **525**;
- Database remains **48 migrations / 42 verification files**;
- Web unchanged.

## Critical semantic boundary

A true DD-217 result proves only migration-0031 commercial-version equality against supplied DD-216 raw evidence.

It does **not** prove:
- EntitlementSnapshot wall-clock validity;
- source Subscription/Plan linkage;
- Subscription lifecycle authorization;
- entitlement/license sufficiency;
- ProvisioningSnapshot current/latest/ACTIVE status;
- effective AI provisioning;
- permission/policy/budget/sensitivity/residency suitability;
- Provider/model routing or AI execution.

## Explicit exclusions

DD-217 changes no schema, migration, RLS, role, grant, public route or product policy.

After this source-audit commit independently passes exact-head Core/PostgreSQL/Database/Web verification, implement only the pure helper, eight fixed acceptance tests and Core export.
