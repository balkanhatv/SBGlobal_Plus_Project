# DD-09 — AI / RAG / AGENT DETAILED DESIGN
**Wave:** 2 · **Status:** PHASE 3 REVALIDATED — AI PLATFORM CONTRACTS  
**Traces:** F-05 · A-07 · ADR-008/010/012 · DD-02/DD-03/DD-04/DD-05/DD-06/DD-07/DD-08/DD-15

## 1. AI Gateway invariant
All AI inference, RAG, assistants, agents and tools enter through one AI Gateway. Domain modules and clients do not call provider SDKs directly. Gateway constructs policy from verified RequestContext, entitlement snapshot, AI config, sensitivity/residency, capability and budget.

## 2. Core entities
### AIProvider
`id uuid PK, code text UNIQUE, status, adapter_type, supported_regions text[], supported_capabilities text[], security_class, residency_metadata jsonb, credential_ref, health_state, version, created_at, updated_at`.
Credential is a secret reference only.

### AIModel
`id, provider_id, model_code, display_name, capabilities[], context_window_class, input_modalities[], output_modalities[], residency_regions[], sensitivity_ceiling, cost_class, latency_class, status, version, metadata_json`.
Provider model string is registry data, not hard-coded in business modules.

### AICapability
`id, code UNIQUE, category(CHAT,EMBEDDING,EXTRACTION,CLASSIFICATION,RERANK,OCR,IMAGE,VIDEO,AUDIO,PRESENTATION,DOCUMENT_INTELLIGENCE,AGENT,TOOL,API), required_entitlement?, default_policy_class, schema_version, status`.

### TenantAIConfig
`id, tenant_id, enabled, allowed_capabilities[], allowed_provider_ids[], allowed_model_ids[], max_sensitivity_class, residency_policy_id, monthly_budget_policy_ref?, retention_policy_id, prompt_override_policy_id, version, updated_at`.

### IndustryAIConfig
`id, tenant_id, industry_context_id, enabled, allowed_capabilities[], provider/model overrides constrained by tenant policy, domain_prompt_set_id?, country_pack_refs[], localization_profile_ref?, version`. Cannot widen TenantAIConfig.

### AIPolicy
`id, owner_scope, tenant_id?, industry_context_id?, code, priority, effect(ALLOW,DENY,RESTRICT), condition_ast_json, constraint_json, version, status`.

### PromptTemplate
`id, owner_scope(PLATFORM/TENANT/INDUSTRY), tenant_id?, industry_context_id?, code, version, system_template, variable_schema_json, grounding_required boolean, allowed_override_fields[], status, created_by, approved_by?, created_at`.
Tenant/industry variants may add domain instructions but cannot override security/authorization/system policy.

### AIConversation
`id, tenant_id, industry_context_id?, scope_class, owner_principal_id, assistant_definition_id?, sensitivity_class, retention_class, status, created_at, last_activity_at`.

### AIMessage
`id, conversation_id, role, content_ref_or_encrypted_content, source_refs_json?, model_route_id?, created_at, deleted_at?`. Persistence follows policy; not every AI interaction must be retained.

### AIAuditEvent
Uses DD-15 AuditEvent with AI fields: capability, routeDecisionId, model/provider classes, guardrail result, toolRunId?, usageRef; never raw prohibited prompt/secret.

## 2A. AI provisioning / API / media contracts

### AIProvisioningSnapshot
`id uuid PK, tenant_id NOT NULL, industry_context_id?, version bigint NOT NULL, subscription_version, entitlement_snapshot_version, industry_activation_version?, ms_pack_versions jsonb, country_pack_versions jsonb, tenant_ai_config_version, allowed_capability_ids uuid[] NOT NULL, allowed_api_classes text[] NOT NULL, allowed_provider_ids uuid[] NOT NULL, allowed_model_classes text[] NOT NULL, budget_policy_ref?, status enum(ACTIVE,SUPERSEDED,REVOKED), compiled_at, valid_until?`.
UNIQUE(tenant_id, industry_context_id, version). Lower-layer configuration cannot add a capability absent from entitlement or TenantAIConfig.

### AI API access classes
`INTERNAL_FIRST_PARTY`, `TENANT_API`, `PARTNER_API`, `PUBLIC_DEVELOPER_API`.
Every AI API OperationContract declares `apiAccessClass, capabilityCode, requiredEntitlement, requiredPermission, scopeClass, requestSchemaVersion, responseSchemaVersion, streamingMode, ratePolicyRef, dataClassCeiling, residencyPolicyRef, auditClass`. No class bypasses the AI Gateway or DD-03/DD-04 authorization.

### AIMediaRequest
`id, tenant_id, industry_context_id?, principal_id, capability_code, media_type enum(IMAGE,SVG,ICON,INFOGRAPHIC,PRESENTATION,VIDEO,ANIMATION,VOICE,AUDIO), prompt_template_id?, prompt_version?, brand_config_version?, localization_profile_ref?, input_document_refs[], sensitivity_class, residency_requirement, moderation_policy_ref, status, created_at, completed_at?`.
Successful output is registered through DD-08 DocumentMeta with `ai_generated=true`, provider/model route reference, provenance, source/input refs, moderation result and licensing/usage metadata where supplied by provider/policy.

### Prompt publication lifecycle
PromptTemplate status is `DRAFT → REVIEW → PUBLISHED → ACTIVE → RETIRED`; only ACTIVE versions execute. Approval is required for PLATFORM and governed high-risk TENANT/INDUSTRY prompts. Rollback activates a prior PUBLISHED version and appends audit; history is immutable.

## 3. AIRequest
`AIRequest{requestId, capabilityCode, requestContextRef, conversationId?, inputSchemaVersion, input, sensitivityClass, residencyRequirement, groundingMode, requestedOutputSchema?, latencyClass?, budgetClass?, allowedSourceScopes?, correlationId}`.

Gateway enriches from server context; clients do not supply trusted tenant/industry/permission facts.

## 4. Route decision
`AIRouteDecision{id, capability, tenantId, industryContextId?, providerId, modelId, routeReasonCodes[], fallbackChain[], sensitivityClass, residencyRegion, estimatedCostClass, policyVersion, entitlementSnapshotVersion, decidedAt}`.

Routing inputs:
capability → tenant/context policy → provider/model allowlist → sensitivity ceiling → residency allowed regions → model capability/context need → entitlement/budget → latency/cost preference → health/circuit state.

A fallback candidate is filtered by the same security/residency constraints before cost/latency preference. No fallback may cross an impermissible region/provider class.

## 5. Provider adapter contract
`AIProviderPort.generate(request)`
`embed(request)`
`rerank(request)`
`health()`
`estimateUsage(request)`
Normalized output includes provider request ref, model registry ID, finish class, token/usage metrics, safety/guardrail metadata, retryability.

Timeout/retry/circuit classes are policy/config; numeric values are not invented here.

## 6. Usage / cost
### TokenUsage
`id, tenant_id, industry_context_id?, principal_id?, capability_code, provider_id, model_id, input_units, output_units, media_units?, occurred_at, correlation_id`.

### AICost
`usage_id, cost_currency, estimated_minor_units, provider_rate_version, billable_class, finalized_at?`.
Financial-adjacent append-only. Aggregates feed DD-04 usage meters.

## 7. RAG ingestion
Pipeline:
Source Resource → access/classification → content extraction → chunking → metadata → embedding → vector row/index.

### rag_source
`id, tenant_id, industry_context_id?, scope_class, source_module, management_system_id?, resource_type, resource_id, document_id?, document_version?, sensitivity_class, residency_region, retention_class, acl_policy_ref, status, source_version, created_at, updated_at`.

### rag_chunk
`id, source_id, tenant_id, industry_context_id?, scope_class, chunk_ordinal, text_ref_or_encrypted_text, content_hash, token_count, acl_projection_json, sensitivity_class, residency_region, retention_class, embedding_model_id, embedding_version, vector, metadata_json, created_at`.

Indexes/vectors must preserve tenant + industry filters. IndustryContext is required for TENANT_INDUSTRY rows.

Chunking config:
`ChunkingPolicy{contentType, maxTokens, overlapTokens, structuralRules, version}`. **ChunkingPolicy v1 [DD-AC]:** prose/HTML/PDF text `maxTokens=800, overlapTokens=120`; structured table/list `400/50` while preserving row/header boundaries; source/code/config text `600/80` while preserving function/object boundaries; short content below the maximum stays single-chunk. Absolute platform ceiling is 1200 tokens/chunk and overlap MUST be ≤25% of maxTokens. Tenant/industry policy may reduce sizes or choose a content-type profile but cannot exceed the ceiling. Policy/version is stored on ingestion/reindex audit; changing policy creates a new source/chunk version rather than silently rewriting retrieval evidence.

## 8. RAG retrieval pipeline
1 verify RequestContext;
2 classify query/capability;
3 apply tenant filter;
4 apply active industry-context filter unless explicitly governed Core/shared scope;
5 resolve source/resource ACL against acting principal;
6 entitlement/security/sensitivity/residency filter;
7 vector/FTS retrieval;
8 rerank using only already-authorized candidates;
9 grounding/citation assembly;
10 inference;
11 response schema/guardrail check;
12 citation/audit/usage persistence.

Retrieval API never accepts arbitrary tenant/context filters from the model.

## 9. Grounding / citations
`GroundingCitation{sourceResourceType, sourceResourceId, documentId?, chunkId, sourceVersion, safeLabel, relevanceClass}`.
Citation material exposed to client must itself be authorized. Low-grounding result can return `GROUNDING_INSUFFICIENT` or a restricted answer rather than fabricate facts.

## 10. Assistant definition
`AssistantDefinition{id, owner_scope, tenant_id?, industry_context_id?, code, allowed_capabilities[], rag_scope_rules, prompt_template_id, tool_set_id?, model_policy_id, retention_policy_id, version, status}`.

## 11. Agent model
### AgentDefinition
`id, owner_scope, tenant_id?, industry_context_id?, code, objective_class, allowed_tool_set_id, max_risk_class, approval_policy_id, budget_policy_id, version, status`.

### AgentRun
`id, agent_definition_id, tenant_id, industry_context_id?, acting_principal_id, membership_id?, entitlement_snapshot_version, permission_version, requested_resource_scope_json, status(PENDING,RUNNING,WAITING_APPROVAL,SUCCEEDED,FAILED,CANCELLED), step_budget_class, token_budget_class, started_at, completed_at?, correlation_id`.

### AgentStep
`id, run_id, ordinal, step_type(PLAN,RAG,TOOL,APPROVAL,INFERENCE), input_ref, output_ref, tool_binding_id?, approval_id?, status, started_at, completed_at, audit_ref`.

Agent permissions are bounded by the acting principal's current AccessDecision at each tool step; startup permission snapshot is not permanent authorization.

## 12. Tool registry
`AIToolDefinition{id, tool_id UNIQUE, capability_code, operation_contract_id, scope_class, required_permission, required_entitlement?, input_schema_version, output_schema_version, side_effect_class(NONE,LOW,CONTROLLED,HIGH), approval_policy_id?, idempotency_required, audit_class, status, version}`.

A tool is an adapter to an existing DD-06 OperationContract, not a new business logic channel.

## 13. Tool execution
1 model proposes tool+arguments;
2 validate tool exists in agent tool set;
3 schema validate;
4 rebuild/verify current RequestContext;
5 DD-03 access decision for required permission/resource;
6 DD-04 entitlement/limits;
7 approval check for risk class;
8 execute OperationContract;
9 capture normalized tool result;
10 append audit/usage; feed only allowed result back to model.

Hallucinated resource IDs are treated exactly as untrusted user input and resolved under RLS/access policy.

## 14. Approval checkpoint
`AgentApproval{id, run_id, step_id, tenant_id, industry_context_id?, requested_by_agent, approval_type, required_permission, approver_principal_id?, status(PENDING,APPROVED,REJECTED,EXPIRED), request_summary_safe, approved_at?, reason?, correlation_id}`.
Tool cannot execute while approval required and status != APPROVED. Approval itself is revalidated for approver permission/context.

## 15. Prompt governance
Order:
platform immutable security/system policy → capability prompt → tenant allowed configuration → industry allowed configuration → user/request content → retrieved context.
Lower layers cannot override higher security rules.

Prohibited override categories include authorization bypass, context switching without verification, secret disclosure, residency bypass, tool allowlist expansion, hidden policy suppression.

## 16. Prompt injection / retrieved content
Retrieved/document/web content is labeled untrusted data. Instructions inside content cannot alter system/tool policy. Tool decisions use structured policy, not free-text model instructions.

## 17. Conversation/memory
### AIMemoryRecord
`id, tenant_id, industry_context_id?, principal_id?, assistant_definition_id?, memory_class enum(SESSION,USER_PREFERENCE,TENANT_KNOWLEDGE,INDUSTRY_KNOWLEDGE,WORKING_CONTEXT), content_ref_or_encrypted_content, source_ref?, sensitivity_class, retention_class, acl_policy_ref, status enum(ACTIVE,SUPERSEDED,ERASED,EXPIRED), created_at, expires_at?, supersedes_id?`.

Conversation storage follows tenant/industry/principal ownership, retention/sensitivity and erasure. Cross-context history is not automatically carried when user switches Industry Context; explicit governed shared assistant scope is required.

## 18. AI observability
Metrics: route success/failure, latency class, provider health, usage/cost, guardrail denials, RAG empty/grounding quality, context-mismatch attempts, tool deny/approval rates, agent step failures. No raw sensitive prompts as metric/log labels.

## 19. Acceptance
- AI API class absent from AIProvisioningSnapshot → `ENTITLEMENT_DENIED`/`PERMISSION_DENIED`; no provider call.
- Country/localization pack may alter language/reference behavior but cannot grant AI capability/permission.
- Inactive/retired prompt version cannot execute.
- AI media result without provenance/DocumentMeta registration is not publishable.
- Tenant/Industry memory lookup requires matching scope + ACL; sibling Industry memory is excluded.
- Public/Partner AI API request still executes the same Gateway security/residency/usage/audit pipeline.
- Tenant A cannot retrieve Tenant B; Industry A cannot retrieve B; denied document cannot enter RAG; prohibited provider never selected as fallback; agent cannot exceed acting user permission; approval cannot be skipped; hallucinated IDs do not bypass ownership; prompt injection cannot modify tool/authorization policy.
