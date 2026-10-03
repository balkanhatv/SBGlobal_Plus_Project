# AI ProvisioningSnapshot Tenant-Core industry-version prerequisite ownership audit

**Date:** 2026-09-28
**Baseline checkpoint:** `DEV-AI-PROVISIONING-SNAPSHOT-CAPABILITY-FLOORS-001`
**Verified entry HEAD:** `a012406f3fd0825878d5ea1764c337281d7ef048`
**Verified entry tree:** `e020c629904db39ded1c439b318c6f7c7b06aa94`
**Governed candidate:** DD-213

## Entry gate

DD-212 canonical promotion and state closure are exact-head verified.

At the entry HEAD above:
- Core Service Verify run `36404085105`, Core job `108868511981`: **773/773 PASS**, zero failed/skipped.
- PostgreSQL job `108868512216`: **512/512 PASS**, zero failed/skipped; database bootstrap PASS.
- Database Verify run `36404085152`, job `108868511538`: PASS.
- Web Boundary Verify run `36404085028`, job `108868513539`: PASS.

PR #2 remains OPEN + DRAFT + UNMERGED. `main` is unmerged. RawSource is unchanged. DD-212 is the latest governed implemented checkpoint.

## Source ownership reconciled

Freshly reconciled:
- `database/migrations/0031_document_workflow_ai_integrity.sql`;
- `src/core/ai/provisioning-snapshot.ts`;
- `src/server/ai/postgres-ai-provisioning-snapshot-store.ts`;
- `DetailedDesign/DD-02_TENANT_INDUSTRY_CONTEXT_DESIGN.md`;
- `DetailedDesign/DD-09_AI_RAG_AGENT_DESIGN.md`;
- DD-124 raw ProvisioningSnapshot evidence.

Migration 0031 owns a local ProvisioningSnapshot scope-shape rule before any IndustryContext lookup:
- when `industry_context_id IS NULL`, `industry_activation_version` **must also be NULL**;
- otherwise the trigger separately resolves the ACTIVE IndustryContext and compares activation version.

DD-124 exposes both values as canonical optional fields:
- `industryContextId?: string`;
- `industryActivationVersion?: string`.

The current TenantContext reader does **not** expose IndustryContext `activation_version`, so the industry-scoped equality branch is **not source-complete for a pure helper yet** and is explicitly excluded from DD-213. DD-213 therefore implements only the Tenant-Core absence rule that is complete from the snapshot itself.

## Determination and locked DD-213 detailed contract

**SOURCE-COMPLETE for Tenant-Core ProvisioningSnapshot scope shape only: absent IndustryContext ⇒ absent IndustryActivationVersion.**

Authorize pure helper:

`matchesAIProvisioningSnapshotTenantCoreIndustryVersionFloor(snapshot)`

It returns boolean and never mutates input.

1. Validate snapshot object presence, snapshot id UUID shape and Tenant id UUID shape.
2. Treat `industryContextId === undefined` as Tenant-Core evidence.
3. For Tenant-Core evidence, require `industryActivationVersion === undefined`.
4. Any present Tenant-Core industry activation version fails, including syntactically valid, malformed, empty, numeric, null or other non-undefined runtime values.
5. If `industryContextId` is present, require only UUID shape for the context id and return true for this **specific Tenant-Core floor** without interpreting `industryActivationVersion`.
6. Do not infer that an Industry-scoped snapshot is valid; ACTIVE IndustryContext lookup and exact activation-version equality remain separately governed.
7. Do not interpret snapshot status/validity, commercial versions, capability/provider/API/model allowlists, pack versions, Tenant config, budget or runtime semantics.
8. Preserve input unchanged.

## Fixed acceptance before implementation

- **AIPROVSNAP-TCORE-CUR-001**: Tenant-Core snapshot with no Industry activation version passes.
- **AIPROVSNAP-TCORE-CUR-002**: Tenant-Core snapshot carrying a canonical positive activation version fails.
- **AIPROVSNAP-TCORE-CUR-003**: Tenant-Core snapshot carrying any other non-undefined activation-version runtime value fails.
- **AIPROVSNAP-TCORE-CUR-004**: Industry-scoped snapshot with valid IndustryContext id passes this specific floor without proving activation-version equality.
- **AIPROVSNAP-TCORE-CUR-005**: malformed present IndustryContext id fails closed.
- **AIPROVSNAP-TCORE-CUR-006**: malformed snapshot id or Tenant id fails closed.
- **AIPROVSNAP-TCORE-CUR-007**: unrelated ProvisioningSnapshot fields do not affect the result.
- **AIPROVSNAP-TCORE-CUR-008**: input remains unchanged and this predicate does not select/read IndustryContext state.

Expected executable delta after this source-audit commit independently passes exact-head verification: Core **773 → 781**. PostgreSQL remains **512**. Database inventory remains **48 migrations / 42 verification files**. Web behavior remains unchanged.

## Critical semantic boundary

A true DD-213 result proves only that the supplied snapshot does not violate the migration-0031 Tenant-Core null-Industry/null-activation-version rule.

It does **not** prove:
- an Industry-scoped snapshot's IndustryContext exists or is ACTIVE;
- `industryActivationVersion` equals current IndustryContext `activation_version`;
- snapshot ACTIVE/current/latest or unexpired state;
- current Subscription/EntitlementSnapshot versions;
- effective Tenant+Industry AI configuration;
- entitlement/permission/policy/budget/sensitivity/residency authority;
- provider/model/API suitability;
- provisioning compilation, routing or AI execution.

## Explicit exclusions / continuation

DD-213 changes no schema, migration, RLS, role, grant, route, public API or product policy.

The industry-scoped activation-version equality branch is deferred until source ownership provides exact activation-version evidence; do not invent it from current RequestContext or presentation state.

After this source-audit commit independently passes exact-head Core/PostgreSQL/Database/Web verification, implement only:
- the pure Core helper;
- the eight fixed acceptance tests;
- the Core export.
