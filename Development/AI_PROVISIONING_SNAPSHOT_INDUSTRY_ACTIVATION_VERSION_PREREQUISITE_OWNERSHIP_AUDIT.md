# AI ProvisioningSnapshot Industry activation-version prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-INDUSTRY-CONTEXT-ACTIVATION-RAW-READ-001`
**Verified entry HEAD:** `7ca0ecb7a801a9dfdac7b315dcc617e15ac61a20`
**Verified entry tree:** `d6f8a9d7828275dd3f4e91d74e40ae58dba43ef5`
**Governed candidate:** DD-215

## Entry gate

DD-214 canonical promotion and state closure are exact-head verified.

At the entry HEAD above:
- Core Service Verify run `36431376049`, Core job `108958134996`: **781/781 PASS**, zero failed/skipped.
- PostgreSQL job `108958134656`: **518/518 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify run `36431375961`, job `108958134123`: PASS.
- Web Boundary Verify run `36431375972`, job `108958134589`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged.

## Source ownership reconciled

Freshly reconciled:
- migration 0011 `core_ai.ai_provisioning_snapshot`;
- migration 0031 ProvisioningSnapshot Industry-scoped activation-version predicate;
- DD-124 `PersistedAIProvisioningSnapshot` raw evidence;
- DD-214 `PersistedIndustryContextActivationEvidence` exact-tuple raw evidence reader;
- DD-213 Tenant-Core null-Industry/null-version floor.

Migration 0031 owns the Industry-scoped branch:
- when `industry_context_id` is present, select `core_tenancy.industry_context.activation_version` for the exact same Tenant+Industry tuple **only when raw status='ACTIVE'**;
- reject when no ACTIVE exact tuple exists;
- reject when `NEW.industry_activation_version IS DISTINCT FROM context_version`.

DD-124 exposes:
- snapshot id;
- Tenant id;
- optional IndustryContext id;
- optional raw Industry activation version as canonical PostgreSQL integer text.

DD-214 exposes exact persisted IndustryContext activation evidence:
- IndustryContext id;
- Tenant id;
- raw constrained status;
- exact PostgreSQL bigint activationVersion text.

Therefore the Industry-scoped equality predicate is now source-complete without any new schema, reader, role, grant or RLS change.

## Determination and locked DD-215 detailed contract

**SOURCE-COMPLETE for an Industry-scoped ProvisioningSnapshot → exact supplied IndustryContext activation evidence ACTIVE/version-equality floor.**

Authorize pure helper:

`matchesAIProvisioningSnapshotIndustryActivationFloors(snapshot, activation)`

It returns boolean and never mutates inputs.

1. Validate snapshot object, snapshot id UUID and Tenant id UUID.
2. Require `snapshot.industryContextId` to be present and UUID-shaped; Tenant-Core snapshots are outside DD-215 and return false here.
3. Require `snapshot.industryActivationVersion` to be canonical PostgreSQL bigint text using `0 | positive decimal | negative decimal` form; no leading zeros, plus sign, whitespace or numeric coercion.
4. Validate activation evidence id/Tenant id UUID shape.
5. Validate activation status as the persisted IndustryContext vocabulary and require raw status exactly `ACTIVE`.
6. Validate activationVersion using the same canonical PostgreSQL bigint-text grammar.
7. Require exact `activation.tenantId === snapshot.tenantId`.
8. Require exact `activation.id === snapshot.industryContextId`.
9. Require exact canonical-text equality `activation.activationVersion === snapshot.industryActivationVersion`.
10. Do not select current/primary IndustryContext; the caller supplies exact evidence.
11. Do not interpret snapshot status/validity, commercial versions, Tenant config, capability/provider/API/model allowlists, packs, budget or runtime semantics.
12. Preserve both inputs unchanged.

Because both values originate from PostgreSQL bigint text readers, exact canonical-text equality is equivalent to the persisted numeric equality owned by migration 0031 while avoiding unsafe JS-number conversion.

## Fixed acceptance before implementation

- **AIPROVSNAP-INDVER-CUR-001**: exact same-Tenant/same-Industry ACTIVE activation evidence with equal canonical bigint version passes.
- **AIPROVSNAP-INDVER-CUR-002**: missing IndustryContext id or missing activation version fails this Industry-scoped predicate.
- **AIPROVSNAP-INDVER-CUR-003**: foreign Tenant or wrong IndustryContext evidence fails.
- **AIPROVSNAP-INDVER-CUR-004**: PENDING/SUSPENDED/DISABLED or malformed status fails; only raw `ACTIVE` passes.
- **AIPROVSNAP-INDVER-CUR-005**: unequal activation versions fail, including stale lower/higher versions.
- **AIPROVSNAP-INDVER-CUR-006**: malformed/non-canonical snapshot or activation bigint text and malformed identities fail closed.
- **AIPROVSNAP-INDVER-CUR-007**: zero, negative and max-range canonical bigint strings compare exactly without JS-number conversion.
- **AIPROVSNAP-INDVER-CUR-008**: unrelated fields remain uninterpreted and inputs remain unchanged.

Expected executable delta after this source-audit commit independently passes exact-head verification:
- Core **781 → 789**;
- PostgreSQL remains **518**;
- Database inventory remains **48 migrations / 42 verification files**;
- Web remains unchanged.

## Critical semantic boundary

A true DD-215 result proves only that the supplied snapshot and supplied exact IndustryContext evidence satisfy migration 0031's same-Tenant/same-Industry/raw-ACTIVE/exact-activation-version relationship.

It does **not** prove:
- current/primary Industry selection;
- that ACTIVE alone authorizes a requested operation;
- snapshot ACTIVE/current/latest or unexpired state;
- current Subscription or EntitlementSnapshot versions;
- effective Tenant+Industry AI configuration;
- entitlement/permission/policy/budget/sensitivity/residency authority;
- Provider/model/API suitability;
- provisioning compilation/currentness;
- routing, fallback, SDK dispatch or any AI execution.

## Explicit exclusions / continuation

DD-215 changes no schema, migration, RLS, role, grant, route, public API or product policy.

After this source-audit commit independently passes exact-head Core/PostgreSQL/Database/Web verification, implement only:
- the pure Core helper;
- the eight fixed acceptance tests;
- the Core export.

Commercial-version integrity remains separately governed.
