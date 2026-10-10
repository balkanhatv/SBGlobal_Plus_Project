# DD-718…DD-722 — AIToolDefinition → global AICapability exact-code evidence: source/prerequisite ownership audit

**Date:** 2026-10-10.
**Entry checkpoint:** DD-713…DD-717 independently state-closed at `9512f7b4fcd1912e30fda3f8a7b1c4b21d286e9a` / tree `53e819a13722dfd803e2ef60fb884e287392f4cb`.
**Source-audit entry HEAD:** `981a60ca58c2aaf0a2fb1f8f96de1be3d9c4636a` / tree `b1be6f1070ab990113fc3b12b9b82e82257a6ef3`.
**Status:** SOURCE AUDIT ONLY. Do not implement or canonically promote this batch until this audit commit independently passes exact-HEAD Core/PostgreSQL/Database/Web.

## Exact entry gates

The source-audit entry HEAD `981a60ca58c2aaf0a2fb1f8f96de1be3d9c4636a` / tree `b1be6f1070ab990113fc3b12b9b82e82257a6ef3` passed all four workflows:
- [Core Service Verify 38069719696](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38069719696): Core job `114264478993` **1719/1719 PASS**; PostgreSQL-context job `114264479121` **540/540 PASS**, zero failed/skipped, full bootstrap.
- [Database Verify 38069719720](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38069719720): job `114264478936`, **48 migrations / 42 SQL verification files PASS**.
- [Web Boundary Verify 38069719686](https://github.com/balkanhatv/SBGlobal_Plus_Project/actions/runs/38069719686): job `114264478878`, **PASS**.

All four jobs completed successfully for the exact entry HEAD. DD-717 state closure is recorded in the canonical manifest and verification register. PR #2 remains OPEN/DRAFT/UNMERGED; `main` is not merged. RawSource remains immutable.

## Source and dependency ownership

1. **DD-09 / A-07** govern AI tool metadata and execution boundaries. Persisted catalog evidence is not acting-principal authorization, entitlement satisfaction, policy approval, tool eligibility or execution authority.
2. **Migration 0013** defines `core_ai.ai_tool_definition.capability_code text NOT NULL REFERENCES core_ai.ai_capability(code)`. `ai_tool_definition` has a global catalog row keyed by UUID `id`, unique `tool_id`, exact raw `capability_code`, and separate operation/scope/permission/entitlement/schema/side-effect/approval/idempotency/audit/status/version metadata. The table has no Tenant/Industry ownership columns.
3. **Migration 0014** grants the dedicated `sbg_ai_gateway_rw` role SELECT on `core_ai.ai_tool_definition` and `core_ai.ai_capability`; catalog write authority is not granted by that SELECT grant. This audit authorizes no role/grant/schema change and does not infer runtime eligibility from the read privilege.
4. **DD-110** exposes `AIToolDefinitionCatalogMetadataReadPort.loadById(id)`; the existing PostgreSQL adapter performs one exact `WHERE id=$1::uuid` read and returns the immutable raw catalog metadata object. It does not take a RequestContext because this is global catalog metadata.
5. **DD-109** exposes `AICapabilityCatalogMetadataByCodeReadPort.loadByCode(code)`; the existing PostgreSQL adapter performs one exact `WHERE code=$1` global lookup. DD-713…DD-717 already independently verifies this by-code port and its raw-string behavior.
6. **DD-203** / `Development/AI_TOOL_DEFINITION_CAPABILITY_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md` / `src/core/ai/tool-definition-capability-binding-floors.ts` own `matchesAIToolDefinitionCapabilityBindingFloors(toolDefinition, capability?)`: valid ToolDefinition UUID + string capabilityCode, valid capability UUID + string code, and exact case-sensitive code equality. The helper is pure and unchanged.
7. **DD-203 verification** is recorded in `Registers/DEVELOPMENT_DD203_VERIFICATION_2026-09-26.md`. Existing ToolSetMember/ToolDefinition, AgentStep, and other tool predicates govern different relationships; they do not compose this independent ToolDefinition→AICapability FK with persisted catalog reads.

**Determination:** SOURCE-COMPLETE only for a read-only composition of one global AIToolDefinition-by-id read, one global AICapability-by-exact-code read, and the existing DD-203 direct code-FK predicate. No new port, database query implementation, schema, RLS, grant, role or product policy is authorized. The two reads are not an atomic snapshot.

## Frozen detailed decisions

**DD-718 — Read the exact global AIToolDefinition first.** `loadAIToolDefinitionCapabilityCurrentEvidence({toolDefinitionId}, toolDefinitionReader, capabilityReader)` calls `toolDefinitionReader.loadById(toolDefinitionId)` exactly once with the supplied ID. Missing definition returns `null`; the original read error propagates by identity, without retry/fallback. No capability read follows a missing definition or read error.

**DD-719 — Validate only the persisted child identity before global capability access.** Require returned ToolDefinition evidence to be an object with a valid DD-203 UUID `id` and `typeof capabilityCode === "string"`. Malformed evidence returns `null` before calling the capability reader. Do not validate or interpret `scopeClass`, `status`, `toolId`, OperationContract, permission/entitlement, schemas, side effects, approval, idempotency, audit or version fields in this relationship floor. A schema-valid empty raw capability code remains possible and must not be normalized or rejected by invented non-empty rules.

**DD-720 — Perform one exact global capability-by-code read.** After child validation, call `capabilityReader.loadByCode(toolDefinition.capabilityCode)` exactly once with the exact persisted string. Missing capability returns `null`; the original catalog exception propagates by identity. No code normalization, alias, ID lookup, search/list, retry, alternate port, context invention or fallback is allowed.

**DD-721 — Reuse DD-203 strict FK equality and preserve source references.** Apply the existing `matchesAIToolDefinitionCapabilityBindingFloors(toolDefinition, capability)` unchanged. Missing/malformed capability ID/code and every unequal, case-different or whitespace-different code fail closed. On success return a frozen envelope `{toolDefinition, capability}` preserving the original immutable source object references and all opaque metadata. Do not deep-clone, enrich, mutate or reinterpret either source.

**DD-722 — Relationship evidence is not tool or AI execution authority.** True proves only the persisted `AIToolDefinition.capability_code → AICapability(code)` relationship. It grants no capability ACTIVE/currentness/eligibility, entitlement or policy satisfaction, acting-principal permission, Tenant/Industry allowlisting, ToolDefinition authorization, ToolSet membership, AgentStep/RBAC/approval satisfaction, OperationContract execution, input/output schema validation, idempotency, audit, credential resolution, provider/model routing, tool invocation, RAG, agent execution, mutation, API/UI or AI inference authority. Separate reads provide no atomic cross-record snapshot.

## Frozen executable acceptance IDs

- **AITOOL-CAPREAD-BASE-001:** one exact ToolDefinition-by-ID read occurs first and receives the supplied ID unchanged.
- **AITOOL-CAPREAD-BASE-002:** missing ToolDefinition returns `null`; original ToolDefinition-read errors propagate unchanged and short-circuit the capability read.
- **AITOOL-CAPREAD-CHILD-001:** malformed returned ToolDefinition ID or capabilityCode type fails closed before capability access; exact empty/raw code remains unnormalized.
- **AITOOL-CAPREAD-READ-001:** one global `loadByCode(toolDefinition.capabilityCode)` call receives the exact persisted raw string.
- **AITOOL-CAPREAD-READ-002:** missing capability returns `null`; original capability-read errors propagate unchanged without retry/fallback.
- **AITOOL-CAPREAD-FLOOR-001:** reuse DD-203 equality; missing/malformed capability identity/code and code mismatch/case/whitespace variants fail closed.
- **AITOOL-CAPREAD-EVID-001:** frozen result preserves exact original ToolDefinition and capability references, opaque fields and input immutability.
- **AITOOL-CAPREAD-BOUND-001:** status, entitlement, permission, scope, OperationContract, schema, side-effect, approval, idempotency, audit and version remain uninterpreted; no authorization or execution authority is returned.

Expected Core delta **1719 → 1727** (+8 fixed cases, target only). PostgreSQL remains **540** with full bootstrap. Database remains **48 migrations / 42 SQL verification files**. Web boundary remains unchanged.

## Mandatory ordered CI and exclusions

After this **source-audit commit** independently passes exact-HEAD Core/PostgreSQL/Database/Web, implement only the reader, its Core index export and the eight frozen acceptance tests. Independently verify that implementation commit. Then atomically promote the eight DD-17 acceptance entries, five DD-18 decisions, DD-19 traceability, verification register, manifest and active projections with correct implementation/promotion CI pointers; independently verify the promotion. Finally publish and independently verify a separate state-closure commit. Any genuine defect requires STOP and the smallest forward-only correction with new independent exact-HEAD CI.

No RawSource/main changes, PR merge, force-push, test weakening, migration/schema/RLS/role/grant changes, new read port, Provider/Model read, billing/credentials, public API/UI, ToolSet/AgentStep execution, or AI execution. Preserve **9 equal Industries / 41 canonical Management Systems / 181 Industry tables / 2,962 source requirement IDs / exactly TENANT_STAFF_APP and TENANT_USER_APP**. Production readiness is **NOT CLAIMED**.
