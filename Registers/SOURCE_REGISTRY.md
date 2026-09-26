# SOURCE REGISTRY — SBGlobal Plus
**Current checkpoint:** `DEV-AI-MESSAGE-CONVERSATION-BINDING-FLOORS-001`
**Status:** ACTIVE · **Updated:** 2026-09-26

## Authority
1. Primary Vision
2. Current explicit user direction
3. MASTER_INSTRUCTION + MASTER_PROMPT v2.5
4. RawSourceCorpus as immutable knowledge/provenance under its governed source precedence
5. Reconciled canonical owners: Foundation WHAT/WHY/WHO → Architecture/ADR HOW → Detailed Design exact contract → Development implementation → Verification/CI evidence
6. Registers/State/checkpoints are projections and evidence; they cannot override product or canonical owners

RawSourceCorpus is knowledge/provenance, not automatic active architecture. A current explicit user decision may supersede a source implementation requirement for active Foundation/Architecture **without changing source bytes**; the supersession must be recorded in D-DECISIONS and traceability.

## Active immutable source baseline
| ID | File | Source title / role | Accepted blob | Active status |
|---|---|---|---|---|
| S1 | `RawSourceCorpus/Disorganized Data 1.md` | **Master Enterprise Architecture & Product Requirements Source — Final v1.1** (repository-resident source corresponding to the requested Primary Source of Truth EA/PRD source) | `a9f63a64448a347edd0f2b0c74094284ee953c1b` | IMMUTABLE active source/history |
| S2 | `RawSourceCorpus/Disorganized Data 2.md` | Master Development Instruction + Product Specification/Business Requirement + specialized standards corpus | `91c461de5e0d171f71d0bb89cd039953a1f1ecfd` | IMMUTABLE active source/history |

The literal filename `Primary Source of Truth Enterprise Architecture & Product Requirements Source.md` is not present at the audited branch tree. No duplicate/renamed source is invented; S1's in-file title establishes the repository provenance mapping. Earlier source variants remain historical Git evidence only.

## Current decisions
- `UD-TECH-01`: active technology/deployment baseline.
- `UD-PHASE-01`: Foundation = WHAT/WHY/WHO; Architecture = HOW; Detailed Design = exact schemas/endpoints/payloads/implementation mechanics.
- `UD-SOURCE-01`: accepted S1/S2 blobs are the active immutable baseline; explicit user decisions may supersede active interpretation without rewriting source.
- `UD-COMM-01`: canonical commercial route/lifecycle model.

## Evidence rule
`TRACEABILITY_MATRIX_UNIT.md` owns the 372 parent/source-heading inventory. `TRACEABILITY_MATRIX_REQUIREMENTS.md` preserves **2,962** source child IDs and original disposition evidence. `F5_END_TO_END_SOURCE_REQUIREMENT_TRACEABILITY.md` owns current dependency routing. `MS_COMPLETENESS_MATRIX.md` projects the 41 named MS owners. No current source requirement may depend on an external ZIP as its only evidence.

## Current canonical invariants
- 9 equal Current Supported Industry Suites; Future Industry promotion remains separately governed.
- 41 canonical Management Systems and 181 registered Industry tables with Tenant+Industry ownership/forced-RLS verification.
- exactly two logical Tenant mobile app classes: `TENANT_STAFF_APP` + `TENANT_USER_APP`; Platform Mobile is not a Tenant app.
- API-first/server-authoritative, multi-tenant/multi-industry, configuration/metadata-driven, plugin/event-ready, AI-powered and secure-by-design architecture remains binding.

## Current audit / continuation evidence — 2026-09-26

DD-199 implements only AIMessage → AIConversation exact conversation-id parent foreign-key continuity. Conversation authorization/currentness, assistant validity, content/source access, model-route authority and AI execution remain outside this checkpoint.

Verified canonical DD-199 promotion `9e896908b814044f78d3f3f9e66137c5a405a8fa` / tree `da7d79e5b01c962c62eb0c65d4417c9da5b082a0`: **638/638 Core**, **504/504 PostgreSQL**, **48 migrations / 42 SQL verification files**, Database/Web PASS; zero failed/skipped tests. Exact-head runs: Core `36228554432` (jobs `108367146787`, `108367146941`), Database `36228554434` (job `108367146755`), Web `36228554438` (job `108367147299`).

Evidence: `Registers/DEVELOPMENT_DD199_VERIFICATION_2026-09-26.md`. Next: Verify the DD-200 AIModel → AIProvider exact provider-id binding candidate against the fixed source audit, then implement only that direct FK continuity floor. Provider/model currentness, routing, credentials and AI execution remain locked.


## Pending source-complete candidate — DD-200

The next governed prerequisite is the direct AIModel → AIProvider exact provider-id foreign-key continuity only. Source audit: `Development/AI_MODEL_PROVIDER_BINDING_PREREQUISITE_OWNERSHIP_AUDIT.md`. Provider/model currentness, routing, credentials and AI execution remain outside the candidate.
