# AI ProvisioningSnapshot remaining governed-shape prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-AI-PROVISIONING-SNAPSHOT-COMMERCIAL-VERSION-FLOORS-001`
**Verified entry HEAD:** `42657856e54738c2e7cacb8db6a22ac619d246a3`
**Verified entry tree:** `e5607a0a8ce49cdf3bd6bfd159de7b17579a6023`
**Governed candidate:** DD-218

## Entry gate

DD-217 canonical promotion and state closure are exact-head verified:
- Core `36451555447` / `109027295138`: **797/797 PASS**, zero failed/skipped.
- PostgreSQL `109027295450`: **525/525 PASS**, zero failed/skipped; database bootstrap PASS.
- Database `36451555419` / `109027295040`: PASS.
- Web `36451555482` / `109027293925`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged.

## Source ownership reconciled

Freshly reconciled:
- migration 0011 `core_ai.ai_provisioning_snapshot`;
- migration 0031 `validate_ai_configuration()` ProvisioningSnapshot governed-shape predicate;
- DD-124 `PersistedAIProvisioningSnapshot`;
- DD-211 Provider-subset binding;
- DD-212 capability-id binding;
- DD-213/DD-215 Industry-scope/version floors;
- DD-217 commercial-version equality.

Migration 0031 independently rejects a ProvisioningSnapshot unless:
- `jsonb_typeof(ms_pack_versions) = 'object'`;
- `jsonb_typeof(country_pack_versions) = 'object'`;
- `allowed_capability_ids` is a UUID set;
- `allowed_api_classes` is a duplicate-free non-null text set;
- `allowed_provider_ids` is a UUID set;
- `allowed_model_classes` is a duplicate-free non-null text set;
- every API class is exactly one of `INTERNAL_FIRST_PARTY | TENANT_API | PARTNER_API | PUBLIC_DEVELOPER_API`.

DD-211 already validates the supplied snapshot Provider-id set shape and DD-212 already validates the supplied snapshot Capability-id set shape. Repeating those in DD-218 would create duplicated governance. The still-independent source-owned remainder is therefore:
- both pack-version values are JSON objects;
- API-class duplicate-free text-set shape plus exact vocabulary;
- Model-class duplicate-free raw text-set shape.

## Determination and locked DD-218 detailed contract

**SOURCE-COMPLETE for the remaining intrinsic ProvisioningSnapshot governed-shape floor only.**

Authorize pure helper:

`matchesAIProvisioningSnapshotGovernedShapeFloors(snapshot)`

It returns boolean and never mutates input.

1. Require a snapshot object with UUID-shaped `id` and `tenantId`.
2. Require `msPackVersions` to be a non-null non-array object.
3. Require `countryPackVersions` to be a non-null non-array object.
4. Require `allowedApiClasses` to be an actual dense duplicate-free array of raw strings.
5. Require every API-class string to match exactly one source-owned vocabulary value:
   `INTERNAL_FIRST_PARTY`, `TENANT_API`, `PARTNER_API`, `PUBLIC_DEVELOPER_API`.
6. Require `allowedModelClasses` to be an actual dense duplicate-free array of raw strings.
7. Preserve strings exactly: no trimming, case folding, non-empty rule or inferred Model-class vocabulary.
8. Empty API-class and Model-class sets are valid because migration 0031 imposes no non-empty requirement.
9. Do not re-evaluate `allowedCapabilityIds` or `allowedProviderIds`; DD-212/DD-211 own those supplied-evidence floors.
10. Do not interpret pack map keys/values, snapshot status/validity, commercial/config/Industry versions, budget, Provider/Capability semantics, routing or execution.

The object checks mirror PostgreSQL `jsonb_typeof(...)= 'object'` only. They do not add a pack-version key/value schema that source does not own.

## Fixed acceptance before implementation

- **AIPROVSNAP-SHAPE-CUR-001**: valid object maps plus exact duplicate-free API/Model-class sets pass.
- **AIPROVSNAP-SHAPE-CUR-002**: null/array/scalar pack maps fail; arbitrary nested object content remains uninterpreted.
- **AIPROVSNAP-SHAPE-CUR-003**: duplicate, sparse, non-string or non-array API-class evidence fails closed.
- **AIPROVSNAP-SHAPE-CUR-004**: unknown/case/whitespace API-class variants fail; exact source vocabulary passes.
- **AIPROVSNAP-SHAPE-CUR-005**: duplicate, sparse, non-string or non-array Model-class evidence fails; exact raw strings including empty string remain representable.
- **AIPROVSNAP-SHAPE-CUR-006**: empty API-class and Model-class sets pass with valid object maps.
- **AIPROVSNAP-SHAPE-CUR-007**: Capability/Provider arrays and unrelated snapshot fields remain uninterpreted by this helper.
- **AIPROVSNAP-SHAPE-CUR-008**: input remains unchanged and no normalization/default insertion occurs.

Expected executable delta after this source-audit commit independently passes exact-head verification:
- Core **797 → 805**;
- PostgreSQL remains **525**;
- Database remains **48 migrations / 42 verification files**;
- Web unchanged.

## Explicit exclusions

DD-218 changes no schema, migration, RLS, role, grant, route, public API or product policy.

A true DD-218 result does not prove:
- Capability/Provider binding (DD-212/DD-211 remain separate);
- pack-version key/value currentness or pack activation;
- API entitlement/permission;
- Model-class compatibility;
- snapshot ACTIVE/current/latest/unexpired state;
- effective AI provisioning;
- Provider/model routing or AI execution.

After the DD-218 source-audit commit independently passes exact-head Core/PostgreSQL/Database/Web verification, implement only the pure helper, eight fixed acceptance tests and Core export.
