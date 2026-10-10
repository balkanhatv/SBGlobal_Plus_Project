# AIMemoryRecord optional AssistantDefinition current-binding evidence — source/prerequisite ownership audit

**Date:** 2026-10-08  
**Verified entry state-closure HEAD/tree:** `0274d74e942d1d495482f80922c3ab0335ce8f44` / `f833109f3565893ac2838e9400be6b557fd9f80e`  
**Completed entry batch:** DD-668…DD-672 (exact-head state closure verified)  
**Frozen candidate:** DD-673…DD-677  
**Status:** Source-audit only; implementation is not authorized until this audit commit passes its own Core/PostgreSQL/Database/Web gates.

## Entry, scope and source owners

DD-668…DD-672 state closure `0274d74e942d1d495482f80922c3ab0335ce8f44` passed push Core run `37790130182` (Core `113355009278` **1639/1639 PASS**, PostgreSQL `113355009574` **540/540 PASS**, fail/skip 0 and full bootstrap), Database run `37790130155` / job `113355010163` PASS (48 migrations / 42 SQL verification files), and Web PR run `37790137515` / job `113355033906` PASS. RawSource and `main` remain unchanged; PR #2 remains draft/unmerged.

- DD-09 §17 owns scoped AIMemoryRecord semantics. Memory lookup needs scope + ACL; raw visibility is not authorized recall and Tenant-Core raw visibility does not imply cross-Industry history carry.
- DD-129 and migration 0012 own the exact `AIMemoryRecordReadPort.loadForContext({requestContext,memoryRecordId})` read, FORCE RLS, optional persisted `assistantDefinitionId`, memory ownership, and raw metadata.
- DD-117 owns `AIAssistantDefinitionReadPort.loadForContext({requestContext,assistantDefinitionId})` and exact immutable raw AssistantDefinition metadata.
- Migration 0031 and DD-186 own the optional AssistantDefinition relationship: absent association needs no referenced record; bound record must match the exact persisted id, have raw status ACTIVE, and satisfy PLATFORM/TENANT/INDUSTRY applicability to the memory Tenant and nullable Industry scope.
- Existing `matchesAIMemoryAssistantBindingFloors(memory,assistant?)` already implements that pure relationship, with source-owned id/scope validation and no nested PromptTemplate/ToolSet revalidation.
- DD-668…DD-672 supersession evidence is independent; this candidate must not traverse or infer direct/indirect supersession, parent status or latest/current memory.
- DD-188 principal-currentness remains blocked by absent membership/elevation write-time provenance and is not to be approximated using AssistantDefinition evidence.

**Determination:** SOURCE-COMPLETE for one scoped memory read and, only if the persisted assistantDefinitionId exists and is a structurally valid UUID, one exact AssistantDefinition read under the *identical* RequestContext, followed by the already-owned DD-186 pure relationship floor. The result is internal necessary evidence, not Assistant selection, memory recall or execution authorization.

## Frozen decisions

**DD-673 — exact scoped memory evidence first.** Introduce `loadAIMemoryAssistantBindingCurrentEvidence({requestContext,memoryRecordId}, memoryReader,assistantReader)`. Load exactly one memory first using the unmodified request context and id. Child null returns null. Dependency errors propagate unchanged. Do not synthesize identity, switch scope, list/search or read memory content.

**DD-674 — no-assistant branch.** For absent memory.assistantDefinitionId, apply `matchesAIMemoryAssistantBindingFloors(memory)` and return frozen `{memory}` only if it passes. Perform zero AssistantDefinition reads. An unbound result is not Assistant selection or authorization.

**DD-675 — exact AssistantDefinition read.** For a present persisted assistantDefinitionId, require structurally valid UUID before dependency access, then read exactly that id once with the *same RequestContext object*. Missing/invisible assistant returns null, dependency errors propagate unchanged. No lookup by code, latest version, alternate Tenant/Industry context or scope fallback.

**DD-676 — reapply only DD-186 relationship and preserve evidence.** Evaluate the existing pure `matchesAIMemoryAssistantBindingFloors(memory,assistant)` once on exact returned references. Exact ACTIVE applicable PLATFORM/TENANT/INDUSTRY owner/id relationship passes; inactive, malformed or mismatched id/owner/scope fails closed. Success returns frozen `{memory,assistant}` preserving exact reference identities and raw status/version/policy/retention/content fields without mutation.

**DD-677 — evidence-only authority boundary.** No principal-currentness, ActingPrincipal ACL, effective/latest/current memory selection, supersession resolution/chain traversal, retention/expiry/erasure or decryption. No nested DD-179 PromptTemplate/ToolSet/model/provider eligibility, cross-context history carry, client disclosure, prompt assembly, RAG, tool/agent/AI execution, mutation or route. Do not claim a successful relationship is sufficient for memory lookup.

## Fixed executable acceptances

- **AIMEM-ASTREAD-BASE-001:** exactly one scoped memory read first with unchanged context/id and no unnecessary dependency access.
- **AIMEM-ASTREAD-BASE-002:** memory null and memory dependency errors short-circuit/propagate before AssistantDefinition access.
- **AIMEM-ASTREAD-UNBOUND-001:** valid unbound memory returns frozen exact memory-only evidence and zero AssistantDefinition reads.
- **AIMEM-ASTREAD-UNBOUND-002:** malformed unbound memory identity/scope fails closed without AssistantDefinition read.
- **AIMEM-ASTREAD-READ-001:** bound memory reads exact persisted assistant id once under identical RequestContext.
- **AIMEM-ASTREAD-READ-002:** malformed bound id and null/invisible AssistantDefinition fail closed, and dependency errors propagate unchanged without fallback.
- **AIMEM-ASTREAD-FLOOR-001:** matching ACTIVE exact applicable PLATFORM/TENANT/INDUSTRY owner relationships pass.
- **AIMEM-ASTREAD-FLOOR-002:** wrong id, non-ACTIVE, malformed owner, foreign Tenant or sibling Industry fails closed.
- **AIMEM-ASTREAD-EVID-001:** output frozen; exact memory/assistant references and raw ACL/retention/source/content/version metadata unchanged.
- **AIMEM-ASTREAD-BOUND-001:** output confers no principal/ACL/expiry/retention/supersession/current-memory/cross-context carry/prompt/RAG/provider/tool/AI execution authority.

Expected Core count **1639 → 1649** (10 new tests). PostgreSQL **540** unchanged; Database **48 migrations / 42 SQL verification files** unchanged.

## Explicit exclusions and next gate

No schema, SQL/RLS/roles/grants, session context or identity resolution, API/routes, frontend, worker, provider adapter or RawSource change. No new AssistantDefinition owner rule or memory access-policy rule. Current memory and client disclosure remain separate and unimplemented by this batch.

Only after this source-audit HEAD passes exact-head Core/PostgreSQL/Database/Web may DD-673…DD-677 implementation proceed. If any gate fails, stop and make the smallest forward-only correction before implementation.
