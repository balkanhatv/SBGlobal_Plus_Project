# AIMemoryRecord direct supersession current-evidence reader — source/prerequisite ownership audit

**Date:** 2026-10-08  
**Source-audit baseline HEAD/tree:** `fc0d10341c8f0eac14638aee8a48d619659cff67` / `f70edd572b2eb9228e0cd8ac3a49718388b3f066`  
**Completed entry batch:** DD-663…DD-667 (state closure green)  
**Frozen next batch:** DD-668…DD-672  
**Status:** Source-audit only; implementation requires this audit commit's own exact-head Core/PostgreSQL/Database/Web gates to pass.

## Exact-head entry and invariants

DD-663…DD-667 state closure `fc0d10341c8f0eac14638aee8a48d619659cff67` passed push and PR Core/PostgreSQL/Database/Web workflows. Push Core run `37760217406`: Core job `113254526998` **1630/1630 PASS**, PostgreSQL context job `113254526698` **540/540 PASS**, fail/skip zero, full bootstrap PASS. Database push run `37760217490` job `113254526899` PASS, **48 migrations / 42 SQL verification files**; Web push run `37760217412` job `113254526939` PASS. PR #2 remains open, draft, unmerged; RawSource and main unchanged.

## Source owners and prerequisites

- **DD-09 §17** defines AIMemoryRecord scoped persistence and forbids carrying conversation/memory history automatically across Industry Context switches. Its acceptance requires scope + ACL authorization for any memory lookup.
- **DD-129** already defines `PersistedAIMemoryRecord`, `AIMemoryRecordReadPort.loadForContext({requestContext,memoryRecordId})` and `PostgresAIMemoryRecordStore` as bounded raw reads. They do not grant memory selection, ACL/retention/erasure or decryption authority.
- **Migration 0012** owns `core_ai.ai_memory_record` with FORCE RLS, scoped Tenant/optional Industry, exact principal (if non-null) and persisted `supersedes_id`; its current read is always protected by RequestScopedSql. A null principal is scope-shared raw evidence, not blanket authorized recall.
- **Migration 0031 / DD-187** owns the direct supersession relationship: non-self exact parent id and exact Tenant, null-safe Industry, null-safe principal and exact memory-class continuity. The already-tested pure `matchesAIMemorySupersessionContinuityFloors(child,parent?)` is the only new relationship predicate to apply.
- DD-187 explicitly does **not** require the parent to be SUPERSEDED or child to be ACTIVE, traverse chains, establish chronology or latest/current selection, evaluate expiry/retention/ACL, authorize principal access beyond RLS, or decrypt/dereference content.

**SOURCE-COMPLETE ONLY FOR:** One exact child AIMemoryRecord scoped read, conditionally one exact same-RequestContext parent read from persisted child.supersedesId, DD-187 direct continuity and a frozen internal evidence envelope. Neither branch confers current-memory or disclosure authority.

## Frozen decisions

**DD-668 — exact child read first.** Add `loadAIMemoryDirectSupersessionCurrentEvidence(...)`. Call the existing `AIMemoryRecordReadPort.loadForContext` exactly once with the unmodified caller-supplied RequestContext and exact memoryRecordId. Missing child returns null. Dependency errors propagate unchanged. No identity/context synthesis, fallback, list query or content access.

**DD-669 — no-supersession branch.** If the persisted child.supersedesId is undefined, use `matchesAIMemorySupersessionContinuityFloors(child)` and return frozen `{memory}` only if the direct floor passes; a malformed child fails closed. Perform zero parent reads. Absence of a parent is not proof that the record is current/effective memory.

**DD-670 — exact same-context parent read.** For a present supersedesId, load the parent once using the *same exact* RequestContext object and persisted supersedesId. Missing/invisible parent returns null, and read errors propagate unchanged. Do not elevate principal/context, enumerate inaccessible parents, or use alternate identifiers.

**DD-671 — apply only DD-187 continuity.** Call `matchesAIMemorySupersessionContinuityFloors(child,parent)` once after both raw reads. Reject self-reference, malformed parent/child identifiers and mismatched Tenant/nullable Industry/nullable principal/memoryClass. No additional lifecycle/chronology/status or semantic policy.

**DD-672 — immutable, internal evidence-only boundary.** Successful bound branch returns frozen `{memory,supersededMemory}` preserving exact persisted references; unbound returns frozen `{memory}`. Do not clone/decrypt/dereference content or raw ACL/source fields, select current/latest memory, traverse chains, infer parent SUPERSEDED, evaluate timestamps/retention/erasure/ACL/sensitivity/residency, expose client history, compose prompts, retrieve RAG or execute AI.

## Fixed acceptance before implementation

- **AIMEM-SUPREAD-BASE-001:** exactly one child read first, unchanged RequestContext/id/dependency; success only after valid evidence.
- **AIMEM-SUPREAD-BASE-002:** child null returns null and child read errors propagate unchanged; zero parent reads.
- **AIMEM-SUPREAD-UNBOUND-001:** valid child without supersedesId returns frozen exact child-only evidence, no second read or currentness claim.
- **AIMEM-SUPREAD-UNBOUND-002:** malformed child shape with absent supersedesId fails closed without second read.
- **AIMEM-SUPREAD-BOUND-001:** bound branch reads exact persisted supersedesId once under identical RequestContext object.
- **AIMEM-SUPREAD-BOUND-002:** invisible/missing parent returns null; parent dependency errors propagate unchanged, no fallback.
- **AIMEM-SUPREAD-FLOOR-001:** matching direct DD-187 continuity passes; mismatched id/Tenant/nullable Industry/nullable principal/memoryClass and self-reference fail closed.
- **AIMEM-SUPREAD-EVID-001:** output and references are immutable/exact; persisted records and content/ACL/source refs unchanged.
- **AIMEM-SUPREAD-BOUNDARY-001:** neither output branch grants effective/current memory, supersession chain resolution, ACL/retention/decryption, cross-context carry, client disclosure, prompt, RAG, provider/model routing or AI execution authority.

Expected Core tests **1630 → 1639**, PostgreSQL **540** unchanged; database **48 migrations / 42 SQL verifications** unchanged.

## Explicit exclusions

No new schema, SQL/RLS/roles/grants, APIs/routes, frontend, AI Gateway worker, model/provider adapter, or RawSource change. No new source-owned authorization, automatic memory retrieval, ACL mapping, policy/retention engine, prompt inclusion, supersession chain traversal or client-facing recall. Production readiness is **NOT CLAIMED**.

**Next:** This audit HEAD must independently pass Core/PostgreSQL/Database/Web before implementing DD-668…DD-672. If any gate fails, stop and perform the smallest forward-only correction first.
