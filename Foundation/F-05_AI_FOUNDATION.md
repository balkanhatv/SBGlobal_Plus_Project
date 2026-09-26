# F-05 — AI FOUNDATION
**Document ID:** F-05 · **Version:** 0.2 · **Status:** SPECIFIED · Cross-refs: F-01 (entitlements), F-03 (security), F-04 §8 (knowledge data), F-07…F-09 (industry AI).

---

## 1. Layered AI Context Model `[SD: MI §16]`
One shared **Core AI Platform**; context layers: Core AI → Platform AI → Tenant AI → Industry AI → Role AI → Management System AI → Module AI → Workflow AI. AI always obeys: Tenant, Industry, Role, Permission, Subscription, License, Security, Compliance, Data Residency, AI Policy.

## 2. Provider Abstraction `[SD: S2.6 — single domain owner]`
Canonical provider registry (13): OpenAI · Anthropic Claude · Google Gemini · Amazon Bedrock · Azure OpenAI · OpenRouter · Ollama (self-hosted) · LM Studio · Hugging Face Inference · AWS SageMaker · Grok · DeepSeek · Custom Enterprise LLM. **No single AI model is hard-coded (LG-13).** Capability matrix maps providers → capabilities (reasoning, documentation, code gen/review, agent orchestration, vision, OCR, STT/TTS, translation, embeddings, RAG, image/illustration/SVG/video/audio generation, moderation, safety) via a dynamic Model Registry; provider replacement requires no business-logic change.

## 3. Assistants, Agents, Skills & Tools `[SD: S2.6 Expansion]`
- **Core assistants:** Enterprise · Organization · Tenant · Personal AI Assistant.
- **Industry assistants (provisioned by suite/plan/role):** Healthcare, Education, Retail & Commerce, Manufacturing, Hospitality, Professional Services, Security & Facility, Government & NGO AI Assistants.
- **Platform agents:** Knowledge, Workflow, Automation, Analytics, Notification, Integration, Support, Security.
- **Industry agents:** defined per Suite (F-07…F-09); Healthcare's Patient/Doctor/Lab-Technician agents are Healthcare-scoped, never templates for other suites.
- **Skills/tools:** function calling, streaming, JSON mode, REST/SDK/Webhook/**MCP** integration.

## 4. Knowledge & RAG `[SD: S2.6]`
RAG · knowledge bases · vector DB · embedding store · document index · project knowledge · reference documents · memory (conversation/tenant/user/session/knowledge). Document Intelligence: secure upload, OCR, parsing, classification, metadata extraction, validation, summarization, translation, comparison, insights, workflow routing, digital-signature integration, audit logging — for PDF, Office, images, medical reports, identity documents, contracts, invoices, certificates.

## 5. Model Routing & Workflows `[SD: S2.6]`
Routing considers: task type, industry vertical, user role, plan, feature availability, cost/performance policy, latency, availability, fallback strategy. (Product-level routing is distinct from the build-execution Model Routing Policy — never conflated `[SD: MI §25]`.) AI Workflow Engine: multi-step processing, human approval, AI approval, conditional routing, scheduled tasks, event-driven automation, retry, queues, long-running jobs, parallel processing — integrated with the Core Workflow Engine (F-01 §7).

## 6. AI Security & Isolation `[SD: S2.6]`
Tenant isolation · role-based access · prompt validation · encryption · PII protection · audit logging · rate limiting · content moderation · prompt-injection protection · jailbreak detection · guardrails · sensitive-data detection · model safety validation. **BR-AI-01:** Trigger: any AI request; condition: request context resolved (tenant+industry+role+plan); action: scope knowledge/memory retrieval strictly to that context; cross-context retrieval denied and audited.

## 7. Governance & Observability `[SD: S2.6; S2.2 §33]`
Provider abstraction, prompt templates & centralized Prompt Management (library, categories, versioning, variables, tenant/industry-specific prompts, approval workflow, testing, rollback, audit), model registry, version control, cost tracking, fallback/retry, monitoring, evaluation, human approval, AI policy management, usage quotas, budget management, model lifecycle, provider health. Observability: request/response metrics, token usage, cost analytics, latency, errors, success/failure rates, AI performance dashboard. AI Development Center reviews (code/security/performance/…) never modify production automatically; every recommendation requires Super Admin approval; every AI operation logged.

## 8. Enterprise AI Platform Expansion + Commercial Packaging `[SD: S2.6 Expansion]`
Required platform capability families include: secure AI API Platform (internal, Tenant, public/partner/developer categories where authorized); provider/resource provisioning; centralized prompt management; governed AI memory; Document Intelligence; AI Marketplace; AI media generation (images, illustrations, SVG/icons/logos, infographics, marketing graphics, presentations, video/animation/voice/audio); and AI observability. Provisioning is driven by Subscription Plan, Industry Suite, feature/MS packs, country/localization packs, Tenant configuration and user role/permission — unauthorized AI capability is not provisioned.

AI billing, credits, usage metering, token consumption, media-generation credits, monthly limits, pay-as-you-go, overage — owned by Subscription & Billing (F-01 §5); AI packs/marketplace licensing owned by the entitlement chain; Marketplace items: assistants, agents, prompt packs, skills, templates, workflows, automations, connectors, plugins, extensions.

**Deferred:** provider-by-capability instantiation table; exact AI API schemas/streaming contracts; provisioning data model; per-industry assistant knowledge scopes; media-generation provider routing; evaluation benchmarks — Architecture/Detailed Design.
