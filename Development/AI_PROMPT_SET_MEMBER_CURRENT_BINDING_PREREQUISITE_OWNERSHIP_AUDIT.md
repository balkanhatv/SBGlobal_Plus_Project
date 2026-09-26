# AI PromptSetMember current-binding floors prerequisite ownership audit

**Date:** 2026-09-24  
**Baseline checkpoint:** `DEV-AUTOMATION-DEFINITION-WORKFLOW-CONTAINMENT-FLOORS-001`  
**Verified synchronized basis:** `c7bf0e9ea04c1917e77265c4a9da052514b08c8c`  
**Scope:** next independent source-complete AI relationship prerequisite after DD-176.

## Source reconciliation

Migration 0031 `validate_ai_relationships()`, migration 0048 fail-closed `definition_contains_definition()`, DD-112 raw PromptSet reader, DD-114 raw PromptSetMember reader and DD-115 raw PromptTemplate reader were reconciled.

For `ai_prompt_set_member`, migration 0031 owns one deterministic relationship:

- referenced PromptSet must currently have raw status `ACTIVE`;
- referenced PromptTemplate must currently have raw status `ACTIVE`;
- PromptTemplate scope must contain the PromptSet scope through `definition_contains_definition(...)`;
- member `priority`, `enabled` and timestamps are not part of this relationship predicate.

Containment follows migration 0048:
- PLATFORM PromptSet => PromptTemplate must be PLATFORM;
- TENANT PromptSet => PromptTemplate may be PLATFORM or same-Tenant TENANT;
- INDUSTRY PromptSet => PromptTemplate may be PLATFORM, same-Tenant TENANT or exact same-Tenant INDUSTRY.

## Determination

One pure **PromptSetMember→PromptSet/PromptTemplate current-binding necessary floor** is source-complete:

> Given one already-loaded PromptSetMember, one PromptSet and one PromptTemplate, determine only whether migration-0031's exact id/ACTIVE/containment relationship still matches.

A true result is **not effective-member selection, priority ordering, enabled filtering, prompt rendering or AI execution authority**.

## Authorized DD-177 boundary

Implement:

`matchesAIPromptSetMemberBindingFloors(member, promptSet, promptTemplate)`.

It must:

1. require valid member id, promptSetId and promptTemplateId UUIDs;
2. require valid PromptSet/PromptTemplate ids and exact id equality to member references;
3. require valid PLATFORM/TENANT/INDUSTRY owner shapes for PromptSet and PromptTemplate;
4. require raw `promptSet.status === 'ACTIVE'`;
5. require raw `promptTemplate.status === 'ACTIVE'`;
6. require PromptTemplate broader/equal containment of PromptSet scope exactly per migration 0048;
7. leave priority/enabled/content/version/approval/rendering evidence uninterpreted and inputs unchanged.

## Acceptance target

- **AIPROMPTMEM-CUR-001** — ACTIVE PLATFORM PromptSet + exact ACTIVE PLATFORM PromptTemplate -> true.
- **AIPROMPTMEM-CUR-002** — ACTIVE TENANT PromptSet accepts ACTIVE PLATFORM or same-Tenant TENANT PromptTemplate; foreign/narrower -> false.
- **AIPROMPTMEM-CUR-003** — ACTIVE INDUSTRY PromptSet accepts ACTIVE PLATFORM, same-Tenant TENANT or exact same-Tenant INDUSTRY PromptTemplate; sibling/foreign -> false.
- **AIPROMPTMEM-CUR-004** — wrong PromptSet or PromptTemplate id -> false.
- **AIPROMPTMEM-CUR-005** — any non-ACTIVE PromptSet or PromptTemplate -> false.
- **AIPROMPTMEM-CUR-006** — malformed member/definition UUID or owner shape -> false.
- **AIPROMPTMEM-CUR-007** — member priority/enabled/createdAt and PromptSet/PromptTemplate code/version/content/schema/grounding/override/creator/approver evidence remain uninterpreted; inputs unchanged.

Expected Core delta: +7 tests, from 479 to 486. PostgreSQL acceptance remains 497; database inventory remains 48 migrations / 42 verification files.

## Explicitly unclaimed

DD-177 does **not**:

- list or order PromptSet members;
- filter effective membership by `enabled`;
- choose current/latest PromptSet or PromptTemplate version;
- render templates or validate variable schemas;
- evaluate grounding or override policy;
- resolve IndustryAIConfig prompt sets;
- compose prompts or select provider/model/policy/routing;
- authorize AI inference/tool/agent execution;
- mutate PromptSet/PromptSetMember/PromptTemplate;
- change SQL/RLS/roles/grants/routes.

## Next dependency boundary

After DD-177, PromptSetMember current relationship can be re-evaluated. Effective-set resolution/rendering remains a separate contract and must not be inferred from raw priority/enabled evidence.
