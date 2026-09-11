# SBGlobal Plus — A-07 AI PLATFORM ARCHITECTURE
**Document ID:** A-07 · **Version:** 1.0 · **Status:** ARCHITECTURE COMPLETE (CP-A1-002) · **Date:** 09-09-2026
**Traces to:** F-05 (AI layers, providers, assistants/agents, RAG, routing, governance, BR-AI-01 isolation), F-11 (residency constraints on inference/egress), F-14 (AI quotas as plan dimensions) · **Decisions:** ADR-010 (→ A-12)

---

## 1. Position in the System
The AI Platform (L2, A-00 §3) is a **Core-hosted module group behind one choke point**: the **AI Gateway**. Every AI use — platform features, tenant assistants, industry-suite AI capabilities, background enrichment — passes through it (A-00 principle 6). No module, experience or agent may call an AI provider directly; the egress allow-list (A-03 §5, AI egress zone) makes bypass a network impossibility, not just a code-review rule.

## 2. AI Gateway Responsibilities (ADR-010)
```
Request → AI Gateway:
 1 Context check: RequestContext present (**tenant + industry context + user/resource ACL context + entitlements + security/residency policy**)
 2 Entitlement/quota gate: plan AI dimensions (A-04 §5); metering reserve
 3 Policy gate: tenant AI policy (allowed capabilities, data classes,
   provider/residency constraints)
 4 Redaction pass: sensitivity-classed fields (A-05 §7) masked per policy
 5 Route: model registry → provider adapter (capability + cost + residency)
 6 Execute with timeout/fallback chain → output guardrails (§6)
 7 Meter usage (tokens/calls) → usage ledger → entitlement counters
 8 Audit append (purpose, model class, decision trail — not raw content
   unless tenant policy opts in)
```

## 3. Provider Abstraction
**AIProviderPort** (A-06 §6) with per-capability adapters: chat/completion, embedding, transcription, vision. A **model registry** (platform-owned configuration) maps abstract model classes (`fast`, `balanced`, `reasoning`, `embedding`) to concrete provider models with cost, context-window, residency-region and capability metadata. Routing selects by: tenant policy → residency constraint (F-11: inference egress restricted to allowed regions per tenant's compliance profile) → plan's model-class ceiling (F-14) → cost preference → health/fallback order. Providers are swappable per adapter; adding a provider is registry + adapter work, never product code change.

## 4. RAG Architecture
- **Ingestion:** outbox events (A-06 §4) and Document-module uploads feed a per-tenant ingestion pipeline: extract → chunk → embed (embedding model class per registry) → store in **pgvector** tables in the tenant's data home (A-05 §1—derived, rebuildable, residency-pinned).
- **Index scope:** every vector row carries **`tenant_id` + `industry_context_id` + source entity reference + source ACL descriptor + sensitivity/residency classification**. Shared Core knowledge is explicitly classified as Core/global rather than silently omitting industry scope.
- **Retrieval:** tenant filter (RLS) → **industry-context filter** (unless a governed Core/shared scope is explicitly requested) → resource/user ACL filter against the requesting user's effective permissions (A-03 §3) → entitlement/security/residency policy gate → similarity search → re-rank. **BR-AI-01 isolation** holds at three layers: RLS on vector tables, ACL filter in the retriever, and gateway policy — a retrieval can never cross tenants **or leak across enabled Industry Contexts inside the same tenant**, and never surfaces content the asking user could not read directly or is not entitled/policy-permitted to process.
- Index rebuild is a per-tenant governed operation (source-of-truth is always the owning module's data, never the index).

## 5. Assistants, Agents, Skills & Tools
- **Assistant:** a configured conversational surface (platform-level or per-tenant, per F-05) = system context + allowed skill set + model class + RAG scopes.
- **Skill:** a declared capability composed of prompts + tool bindings.
- **Tool:** a typed binding onto a Core module service contract (A-01 §4) — *tools are the only way agents act*. A tool invocation executes as the acting user through the full kernel guard pipeline (steps 1–4, A-01 §3): an agent can do nothing its user could not do; every action is entitlement-checked, authorized and audited identically to a human action.
- **Agent runs** (multi-step) execute in worker processes with per-run budgets (steps, tokens, wall-clock) from plan dimensions; runs are resumable and their step trail is audit data.
- Write actions above a configurable risk class require human confirmation (tenant-configurable per F-05 governance) — realized as Workflow-module approval tasks, not bespoke UI.

## 6. Guardrails
Input side: prompt-injection screening for content sourced from documents/web; sensitivity redaction (§2 step 4). Output side: schema validation for structured outputs; content policy filters; grounding checks for RAG answers (citations reference retrieved chunks; low-grounding responses are flagged). Tenant-visible AI policy controls: enable/disable per capability, data-class ceilings, provider/region pinning, retention of AI interaction logs. All guardrail decisions carry reason codes into the audit trail.

## 7. Metering & Commercial Integration
Usage ledger rows (tenant, capability, model class, tokens, cost class) aggregate into entitlement counters (A-04 §5) and billing exports. Quota exhaustion behavior per plan: hard-stop or overage-billed (F-14 dimension). The ledger is financial-adjacent → append-only (A-05 §7).

## 8. Deferred to Detailed Design
Model registry schema; per-capability adapter contracts; chunking/embedding strategies per content type; agent run-state machine; per-suite AI capability catalogs (named in A-09 §6); guardrail rule sets; evaluation harness.
