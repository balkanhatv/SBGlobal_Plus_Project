# S2.6 AI ARCHITECTURE STANDARDS RECONCILIATION — 2026-09-27

**Scope:** S2.6-U207…U238 in the immutable AI Architecture Standards source.

## Preserved AI architecture

The canonical 13-provider registry remains unchanged: OpenAI, Anthropic Claude, Google Gemini, Amazon Bedrock, Azure OpenAI, OpenRouter, Ollama, LM Studio, Hugging Face Inference, AWS SageMaker, Grok, DeepSeek and Custom Enterprise LLM. Provider/model capability mapping remains dynamic; business modules do not hard-code a provider/model.

RAG/knowledge, memory, security/guardrails, provider-independent routing, AI workflows, prompt management, document intelligence, provisioning, media generation and observability remain owned by F-05 → A-07 → DD-09 with the normal Core Identity/Commercial/Data/Document boundaries.

## Nine Current Supported Industry assistant families

The source expansion combined Government and NGO into one “Government & NGO AI Assistant.” That source label is preserved in traceability, but the current product has nine equal Current Supported Industries and two independent suite/context owners:

- Government & Public Sector AI Assistant
- NGO / Temple / Trust AI Assistant

Together with Healthcare & Diagnostics, Education, Retail & Commerce, Hospitality, Manufacturing, Professional Services and Security & Facility Management, this restores nine independent suite-owned assistant families.

A shared Platform/Tenant assistant may work across authorized contexts only under its own governed scope; it cannot replace or merge suite-owned assistant identities.

## AI approval boundary

The source AI Workflow Engine includes both Human Approval and AI Approval. AI-generated approval/recommendation may support policy-authorized low-risk automation or create an approval request. It cannot satisfy a checkpoint requiring an authorized principal, cannot grant permissions/entitlements, and cannot bypass a high-risk tool approval. DD-17 AI-019 records this acceptance boundary.

## Correct downstream ownership

- **Enterprise Pack / AI licensing:** F-14/A-04 Commercial/Entitlement ownership.
- **AI billing, credits, metering, PAYG/overage:** F-14/A-04/DD-04; DD-09 usage/cost rows are evidence inputs, not invoice authority.
- **AI API Platform:** AI Gateway + A-06/DD-06 API boundary. UD-TECH-01 makes tRPC the first-party typed interface and REST/OpenAPI the external interoperability surface; source GraphQL remains historical unless explicitly re-authorized.
- **AI Marketplace:** platform Marketplace catalog plus F-14/A-04 entitlement/licensing enforcement.
- **AI Provisioning:** DD-09 AIProvisioningSnapshot plus live Commercial/Context/Policy revalidation.

## Boundary

This is a Foundation/Architecture/DD/traceability correction only. It adds no provider, runtime AI execution, schema, RLS, role/grant or executable test. DD-208 remains the latest governed development checkpoint and effective AI execution remains locked.
