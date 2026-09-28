# Commercial Provisioning version raw evidence reader prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-AI-PROVISIONING-SNAPSHOT-INDUSTRY-ACTIVATION-FLOORS-001`
**Verified entry HEAD:** `60c80fbec81a0258582fbc592cc7f460603b66ad`
**Verified entry tree:** `78f04672001b9732b4a753280a6ff83fdc64facc`
**Governed candidate:** DD-216

## Entry gate

DD-215 canonical promotion and state closure are exact-head verified.

At the entry HEAD above:
- Core `36437895821` / `108980464023`: **789/789 PASS**, zero failed/skipped.
- PostgreSQL `108980464131`: **518/518 PASS**, zero failed/skipped; database bootstrap PASS.
- Database `36437895775` / `108980463514`: PASS.
- Web `36437900275` / `108980479717`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged.

## Source ownership reconciled

Freshly reconciled:
- migration 0001 `core_tenancy.tenant.current_subscription_id`;
- migration 0004 `core_commercial.subscription.version`, `entitlement_snapshot.version/status`, Tenant-scoped FORCE-RLS and uniqueness;
- migrations 0009/0043 application read privileges and Commercial write-owner hardening;
- migration 0031 ProvisioningSnapshot commercial-version predicate;
- existing `RequestScopedSql` and `PostgresCommercialCurrentStateStore`.

Migration 0031 requires two independent same-Tenant facts:
1. an EntitlementSnapshot with exact persisted snapshot version and raw status `CURRENT`;
2. the Subscription referenced by `tenant.current_subscription_id` with exact persisted Subscription version.

The existing `CommercialCurrentStateRead` is intentionally unsuitable as the raw source for this predicate because it additionally requires valid-time window and source-subscription/plan linkage semantics not present in migration 0031. Reusing it would make the application predicate stricter than the canonical trigger.

Migration 0004 owns:
- Subscription `id`, `tenant_id`, positive/default bigint `version`;
- EntitlementSnapshot `id`, `tenant_id`, positive bigint `version`, raw lifecycle `status`;
- uniqueness of `(tenant_id,version)`;
- at most one `CURRENT` EntitlementSnapshot per Tenant.

Migration 0001 owns nullable `tenant.current_subscription_id`.

Ordinary application Commercial reads are already Tenant-scoped by FORCE-RLS; migration 0043 removes Commercial mutation authority from general app/worker roles. No schema, RLS, role or grant change is required.

## Determination and locked DD-216 implementation boundary

**SOURCE-COMPLETE for a minimal same-Tenant raw Commercial provisioning-version evidence reader.**

Add Core contract:

`CommercialProvisioningVersionReadPort.loadForContext({requestContext})`

Return one immutable evidence object for the resolved Tenant:
- `tenantId`;
- optional raw `currentSubscriptionId`;
- optional matched current-Subscription `subscriptionVersion` as exact bigint text;
- optional current EntitlementSnapshot `entitlementSnapshotId`;
- optional current EntitlementSnapshot `entitlementSnapshotVersion` as exact bigint text.

Reader behavior:
1. support only resolved `TENANT_CORE` and `TENANT_INDUSTRY` contexts;
2. derive Tenant solely from `requestContext.tenantId`; expose no arbitrary Tenant-id lookup;
3. use existing `RequestScopedSql`;
4. read `tenant.current_subscription_id`;
5. left-join only the exact same-Tenant Subscription referenced by that pointer;
6. left-join only the same-Tenant EntitlementSnapshot whose raw status is exactly `CURRENT`;
7. preserve Subscription and EntitlementSnapshot bigint versions as canonical decimal text, never JS numbers;
8. preserve absence: null current-subscription pointer, unmatched pointer or missing CURRENT snapshot yields absent corresponding evidence rather than invented defaults;
9. freeze returned evidence;
10. expose no list/latest/write/compile/authorize method.

The reader does not apply EntitlementSnapshot valid_from/expires_at checks and does not require its source_subscription_id to equal the current Subscription, because migration 0031 does not own those conditions.

## Fixed acceptance before implementation

- **COMPROVVER-PG-001**: Tenant Core context returns frozen exact current-subscription id/version + CURRENT EntitlementSnapshot id/version evidence.
- **COMPROVVER-PG-002**: same-Tenant Industry context returns the same Tenant-owned commercial version evidence.
- **COMPROVVER-PG-003**: non-CURRENT snapshots are ignored; missing CURRENT snapshot is preserved as absence.
- **COMPROVVER-PG-004**: missing current-subscription pointer or unmatched pointer is preserved as absent Subscription version evidence.
- **COMPROVVER-PG-005**: PostgreSQL bigint versions, including max bigint, remain exact decimal text.
- **COMPROVVER-PG-006**: malformed/unsupported contexts fail closed and RLS prevents cross-Tenant leakage.
- **COMPROVVER-PG-007**: port exposes no list/latest/create/update/delete/compile/authorize authority; inputs and returned evidence are immutable.

Expected executable delta after this source-audit commit independently passes exact-head verification:
- Core remains **789**;
- PostgreSQL **518 → 525**;
- Database remains **48 migrations / 42 verification files**;
- Web remains unchanged.

## Critical semantic boundary

A successful DD-216 read proves only persisted raw evidence selected by the migration-0031 commercial-version ownership rules.

It does **not** prove:
- that an AIProvisioningSnapshot commercial version matches;
- EntitlementSnapshot valid-time currentness beyond raw status `CURRENT`;
- source Subscription/Plan linkage;
- commercial operation authorization;
- entitlement/license sufficiency;
- effective AI provisioning;
- routing or AI execution.

Only after DD-216 implementation and exact-head verification may the separate ProvisioningSnapshot commercial-version equality predicate be source-audited.

## Explicit exclusions

DD-216 changes no schema, migration, RLS, role, grant, public route or product policy.
