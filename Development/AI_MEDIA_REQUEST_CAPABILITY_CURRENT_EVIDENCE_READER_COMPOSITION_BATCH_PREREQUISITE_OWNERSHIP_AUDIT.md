# AIMediaRequest capability current-evidence reader composition prerequisite ownership audit

**Date:** 2026-10-06  
**Baseline checkpoint:** `DEV-AI-MEDIA-REQUEST-PROMPT-TEMPLATE-CURRENT-EVIDENCE-READER-001`  
**Verified entry HEAD:** `9ca4308f0f1049b1738ab6f806298d514b9f2f51`  
**Verified entry tree:** `4acd8f4c0e06c8d0968651cef718dd3d532dd418`  
**Governed batch:** DD-598 through DD-602

## Entry gate

DD-593…DD-597 state closure is exact-head verified. Core Service Verify run `37494017091`: Core job `112373782473` **1509/1509 PASS**, PostgreSQL job `112373782793` **540/540 PASS**, fail/skip 0; full database bootstrap PASS. Database Verify run `37494017118` / job `112373785249` PASS with repository inventory **48 migrations / 42 SQL verification files**. Web Boundary Verify run `37494017122` / job `112373781692` PASS.

This closes DD-593…DD-597 at its bounded optional PromptTemplate current-binding evidence scope. PR #2 remains draft/unmerged; RawSource remains unchanged; `main` remains unmerged.

## Reconciled owners and determination

- DD-125 owns persisted `AIMediaRequest` evidence including exact `capabilityCode`.
- DD-109 owns the global `AICapability` catalog row and the read ports `loadById` / `loadByCode`.
- `PostgresAICapabilityCatalogMetadataStore.loadByCode(code)` is a source-owned exact global-catalog read boundary. It returns the unique row by raw code and preserves category, nullable required entitlement, default policy class, schema version and raw status.
- DD-202 already owns the pure persisted relationship floor `matchesAIMediaRequestCapabilityBindingFloors(request, capability)`, requiring exact `capability.code === request.capabilityCode` with no trim/case normalization/fallback.
- DD-202 explicitly leaves capability lifecycle/category/entitlement/default-policy/schema semantics uninterpreted. In particular, raw `status='ACTIVE'` is **not** request-time capability eligibility.
- A-07 / DD-09 keep entitlement/policy, Tenant configuration, provisioning snapshots, sensitivity/residency, moderation, provider/model routing, budget/quota, guardrails, metering and execution behind separately governed boundaries.

**SOURCE-COMPLETE:** compose the exact AIMediaRequest read with exactly one global capability-by-code read and apply only the existing DD-202 exact binding floor. No schema, RLS, new catalog policy, default capability selection or execution policy is required.

## Frozen decisions

**DD-598 — exact AIMediaRequest first.** Add `loadAIMediaRequestCapabilityCurrentEvidence(...)`. Read the exact media request under the supplied RequestContext and mediaRequestId first. Null returns null. Request-reader dependency errors propagate unchanged. Capability access must not occur before a request exists.

**DD-599 — exactly one raw capability-by-code read.** For a present request, call `AICapabilityCatalogMetadataByCodeReadPort.loadByCode(request.capabilityCode)` exactly once using the exact persisted code. Do not trim, case-fold, alias, normalize, substitute, select defaults or perform alternate id/code fallback. Null returns null; dependency/persistence errors propagate unchanged.

**DD-600 — apply only the existing DD-202 binding floor.** Require `matchesAIMediaRequestCapabilityBindingFloors(request, capability)`. Exact code equality passes; mismatch or malformed relevant request/capability shape fails closed. Do not add ACTIVE/current/eligible semantics or interpret category, requiredEntitlement, defaultPolicyClass or schemaVersion.

**DD-601 — immutable exact-reference evidence.** Success returns frozen `{ request, capability }` preserving the exact loaded object references without cloning, normalization or mutation.

**DD-602 — relationship evidence is not authorization or execution authority.** Success proves only exact persisted AIMediaRequest→AICapability code binding evidence. It does not establish principal currentness/authorization, capability eligibility, entitlement/policy satisfaction, Tenant/Industry allowlisting, PromptTemplate rendering/approval, input-document access, sensitivity/residency admission, moderation, provisioning, provider/model suitability/routing, budget/quota, media execution/publication, mutation or event authority.

## Fixed acceptance before implementation

- **AIMEDIA-CAPREAD-BASE-001** exact AIMediaRequest is loaded first with unchanged RequestContext/id and null short-circuits before capability access.
- **AIMEDIA-CAPREAD-BASE-002** AIMediaRequest dependency errors propagate unchanged before capability access.
- **AIMEDIA-CAPREAD-READ-001** exactly one capability `loadByCode` uses the exact persisted request.capabilityCode.
- **AIMEDIA-CAPREAD-READ-002** missing capability returns null and capability dependency errors propagate unchanged with no id/code/default fallback.
- **AIMEDIA-CAPREAD-FLOOR-001** exact DD-202 code binding passes and preserves exact request/capability references.
- **AIMEDIA-CAPREAD-FLOOR-002** mismatched or malformed relevant binding evidence fails closed; equality remains exact with no normalization.
- **AIMEDIA-CAPREAD-EVID-001** success is frozen and leaves capability status/category/requiredEntitlement/defaultPolicyClass/schemaVersion plus unrelated request fields raw and unchanged.
- **AIMEDIA-CAPREAD-BOUND-001** output exposes no capability eligibility, entitlement/policy/allowlist decision, prompt/document authorization, moderation/provisioning/routing/budget/execution/publication/mutation/event authority.

Expected executable delta: Core **1509 → 1517**. PostgreSQL remains **540**. Database inventory remains **48 migrations / 42 SQL verification files**.

## Explicit exclusions

No schema, migration, verification SQL, RLS, role, grant, route, frontend, RawSource, provider SDK, worker or scheduler change.

This batch does **not**:
- interpret raw capability status as request-time eligibility;
- evaluate `requiredEntitlement` or `defaultPolicyClass`;
- select or compile effective Tenant/Industry AI capability configuration;
- read or authorize input Documents;
- render/approve/override PromptTemplates;
- resolve moderation, provider/model, residency/sensitivity, budget/quota or guardrail policy;
- dispatch media generation, publish media, mutate request state or emit events.

After this source-audit commit passes exact-head Core/PostgreSQL/Database/Web, implement only DD-598…DD-602 and the fixed acceptances.
