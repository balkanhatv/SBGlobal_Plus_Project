# AIMemoryRecord principal-currentness remaining boundary audit

**Date:** 2026-09-25  
**Baseline checkpoint:** `DEV-AI-MEMORY-SUPERSESSION-CONTINUITY-FLOORS-001`  
**Verified closure basis:** `21c6301844d651221c87196fcadc0a8b45067eda` / tree `5c35b6d886a6bd5a6cb56123ba2889dd60e3dfa7`  
**Scope:** next governed dependency check after DD-187.

## Reconciled source

Migration 0031 validates optional `core_ai.ai_memory_record.principal_id` through:

`core_identity.principal_is_active_for_tenant(tenant_id, principal_id, created_at)`.

That authoritative predicate is not equivalent to raw PlatformPrincipal ACTIVE status. It requires an ACTIVE PlatformPrincipal and then admits the principal through one of the source-owned paths:

- `SERVICE` is admitted directly once the principal exists and is ACTIVE;
- other principals may be admitted through an ACTIVE TenantMembership for the same Tenant whose `valid_from` / `valid_until` window contains the memory `created_at`;
- `PLATFORM_OPERATOR` may alternatively be admitted only through the request-local selected `app.operator_elevation_id`, exact operator principal, exact current Tenant/principal settings, Tenant-wide or exact current Industry compatibility, ACTIVE elevation status, and a window containing the memory `created_at`.

DD-129 persists/exposes the memory `principalId`, Tenant, optional Industry Context and `createdAt`. DD-159 exposes raw PlatformPrincipal metadata. Existing OperatorElevation readers/floors expose elevation metadata and bounded currentness predicates.

However, AIMemoryRecord does **not** persist the `app.operator_elevation_id` or the original request-local principal/Tenant/Industry settings used by migration 0031 at write time. The shared Core `MembershipRecord` also omits the persisted membership validity timestamps, and no current governed AIMemoryRecord relationship contract identifies which membership/elevation provenance must be replayed for a later re-evaluation.

This is the same canonical predicate/provenance problem already recorded by `Development/NOTIFICATION_DELIVERY_RECIPIENT_PRINCIPAL_REMAINING_BOUNDARY_AUDIT.md`.

## Determination

A general pure AIMemoryRecord principal-currentness re-evaluation is **not source-complete** from the presently persisted memory row plus current raw principal/elevation evidence.

Reconstructing it by any of the following would change or narrow the migration-owned predicate rather than faithfully re-evaluate it:

- treating ACTIVE PlatformPrincipal status alone as sufficient;
- reusing `matchesCurrentMachinePrincipalFloor` (which accepts API_CLIENT/SERVICE under a different runtime contract);
- assuming every non-SERVICE principal has a current TenantMembership;
- evaluating membership validity without exact `valid_from` / `valid_until` evidence;
- ignoring PLATFORM_OPERATOR elevation;
- selecting an arbitrary or later OperatorElevation;
- using a later request's `app.operator_elevation_id` as historical provenance;
- excluding a principal type that migration 0031 can admit.

The write-time migration constraint remains authoritative and unchanged. This audit does not weaken it.

## Locked boundary

Do **not** create DD-188 for AIMemoryRecord principal currentness until a governing source owns one of:

1. persisted provenance sufficient to replay the original migration-0031 predicate, including the selected OperatorElevation/request-scope provenance when relevant; or
2. an explicit later-time memory-principal validity rule that intentionally differs from write-time validation; or
3. a server-owned authoritative query contract with fully specified membership/elevation selection and evaluation-time semantics.

Any future contract must separately state whether it validates write-time provenance at `created_at` or later-time/current eligibility. Those are not interchangeable.

## Explicitly still unclaimed

This block does not authorize:

- acting-principal access to memory;
- ACL evaluation;
- current/latest/effective memory selection;
- supersession-chain traversal or indirect-cycle handling;
- expiry evaluation against wall clock;
- retention/legal-hold/erasure execution;
- Tenant-Core history carry into Industry experiences;
- Assistant/prompt/model/provider/tool selection;
- AI inference/RAG/agent execution;
- mutation, routes, SQL/RLS/role/grant changes.

## Next valid search boundary

Continue with another independent migration-0031 relationship whose persisted evidence is sufficient for exact re-evaluation. AIMediaRequest optional PromptTemplate binding is a candidate because the request persists `prompt_template_id`, `prompt_version`, Tenant/Industry scope, while the referenced PromptTemplate reader already exposes id/version/status/owner scope. Reconcile that candidate independently before opening a DD.

RawSource remains unchanged. `main` remains unmerged. PR #2 remains draft/unmerged.
