-- SBGlobal Plus — Migration 0012: AI RAG, conversation, memory and usage
BEGIN;

CREATE TYPE core_ai.memory_class AS ENUM ('SESSION','USER_PREFERENCE','TENANT_KNOWLEDGE','INDUSTRY_KNOWLEDGE','WORKING_CONTEXT');
CREATE TYPE core_ai.memory_status AS ENUM ('ACTIVE','SUPERSEDED','ERASED','EXPIRED');

CREATE TABLE core_ai.assistant_definition (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  allowed_capabilities text[] NOT NULL DEFAULT '{}',
  rag_scope_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  prompt_template_id uuid NOT NULL REFERENCES core_ai.prompt_template(id),
  tool_set_id uuid,
  model_policy_id uuid,
  retention_policy_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope='PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope='TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope='INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id)
);

CREATE UNIQUE INDEX assistant_definition_scope_code_version_uq
ON core_ai.assistant_definition(
  owner_scope,
  COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
  code,
  version
);

CREATE TABLE core_ai.ai_conversation (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  scope_class text NOT NULL CHECK (scope_class IN ('TENANT_CORE','TENANT_INDUSTRY')),
  owner_principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  assistant_definition_id uuid REFERENCES core_ai.assistant_definition(id),
  sensitivity_class text NOT NULL CHECK (
    sensitivity_class IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')
  ),
  retention_class text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  last_activity_at timestamptz NOT NULL,
  CHECK (
    (scope_class='TENANT_CORE' AND industry_context_id IS NULL)
    OR (scope_class='TENANT_INDUSTRY' AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id)
);

CREATE INDEX ai_conversation_owner_idx
  ON core_ai.ai_conversation(tenant_id,industry_context_id,owner_principal_id,last_activity_at DESC);

CREATE TABLE core_ai.ai_message (
  id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES core_ai.ai_conversation(id),
  role text NOT NULL,
  content_ref_or_encrypted_content text NOT NULL,
  source_refs_json jsonb,
  model_route_id uuid,
  created_at timestamptz NOT NULL,
  deleted_at timestamptz
);

CREATE INDEX ai_message_conversation_time_idx
  ON core_ai.ai_message(conversation_id,created_at);

CREATE TABLE core_ai.token_usage (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  principal_id uuid REFERENCES core_identity.platform_principal(id),
  capability_code text NOT NULL REFERENCES core_ai.ai_capability(code),
  provider_id uuid NOT NULL REFERENCES core_ai.ai_provider(id),
  model_id uuid NOT NULL REFERENCES core_ai.ai_model(id),
  input_units numeric NOT NULL DEFAULT 0 CHECK (input_units >= 0),
  output_units numeric NOT NULL DEFAULT 0 CHECK (output_units >= 0),
  media_units numeric CHECK (media_units IS NULL OR media_units >= 0),
  occurred_at timestamptz NOT NULL,
  correlation_id uuid NOT NULL,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id)
);

CREATE INDEX token_usage_scope_time_idx
  ON core_ai.token_usage(tenant_id,industry_context_id,occurred_at DESC);

CREATE TABLE core_ai.ai_cost (
  usage_id uuid PRIMARY KEY REFERENCES core_ai.token_usage(id),
  cost_currency char(3) NOT NULL,
  estimated_minor_units bigint NOT NULL CHECK (estimated_minor_units >= 0),
  provider_rate_version text NOT NULL,
  billable_class text NOT NULL,
  finalized_at timestamptz
);

CREATE TABLE core_ai.rag_source (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  scope_class text NOT NULL CHECK (scope_class IN ('TENANT_CORE','TENANT_INDUSTRY')),
  source_module text NOT NULL,
  management_system_id text,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  document_id uuid REFERENCES core_document.document_meta(id),
  document_version integer,
  sensitivity_class text NOT NULL CHECK (
    sensitivity_class IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')
  ),
  residency_region text NOT NULL,
  retention_class text NOT NULL,
  acl_policy_ref text,
  status text NOT NULL,
  source_version bigint NOT NULL CHECK (source_version > 0),
  chunking_policy_version text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (scope_class='TENANT_CORE' AND industry_context_id IS NULL)
    OR (scope_class='TENANT_INDUSTRY' AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id)
);

CREATE UNIQUE INDEX rag_source_resource_version_uq
  ON core_ai.rag_source(
    tenant_id,
    COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
    source_module,
    resource_type,
    resource_id,
    source_version
  );

CREATE TABLE core_ai.rag_chunk (
  id uuid PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES core_ai.rag_source(id),
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  scope_class text NOT NULL CHECK (scope_class IN ('TENANT_CORE','TENANT_INDUSTRY')),
  chunk_ordinal integer NOT NULL CHECK (chunk_ordinal >= 0),
  text_ref_or_encrypted_text text NOT NULL,
  content_hash text NOT NULL,
  token_count integer NOT NULL CHECK (token_count >= 0 AND token_count <= 1200),
  acl_projection_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  sensitivity_class text NOT NULL CHECK (
    sensitivity_class IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')
  ),
  residency_region text NOT NULL,
  retention_class text NOT NULL,
  embedding_model_id uuid NOT NULL REFERENCES core_ai.ai_model(id),
  embedding_version text NOT NULL,
  embedding vector NOT NULL,
  metadata_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL,
  CHECK (
    (scope_class='TENANT_CORE' AND industry_context_id IS NULL)
    OR (scope_class='TENANT_INDUSTRY' AND industry_context_id IS NOT NULL)
  ),
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  UNIQUE(source_id,chunk_ordinal,embedding_model_id,embedding_version)
);

CREATE INDEX rag_chunk_scope_source_idx
  ON core_ai.rag_chunk(tenant_id,industry_context_id,source_id,chunk_ordinal);
CREATE INDEX rag_chunk_content_hash_idx
  ON core_ai.rag_chunk(tenant_id,industry_context_id,content_hash);

CREATE TABLE core_ai.ai_memory_record (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  principal_id uuid REFERENCES core_identity.platform_principal(id),
  assistant_definition_id uuid REFERENCES core_ai.assistant_definition(id),
  memory_class core_ai.memory_class NOT NULL,
  content_ref_or_encrypted_content text NOT NULL,
  source_ref text,
  sensitivity_class text NOT NULL CHECK (
    sensitivity_class IN ('PUBLIC','INTERNAL','CONFIDENTIAL','SENSITIVE_PERSONAL','REGULATED')
  ),
  retention_class text NOT NULL,
  acl_policy_ref text,
  status core_ai.memory_status NOT NULL,
  created_at timestamptz NOT NULL,
  expires_at timestamptz,
  supersedes_id uuid REFERENCES core_ai.ai_memory_record(id),
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (expires_at IS NULL OR expires_at > created_at),
  CHECK (
    memory_class <> 'INDUSTRY_KNOWLEDGE'
    OR industry_context_id IS NOT NULL
  )
);

CREATE INDEX ai_memory_scope_idx
  ON core_ai.ai_memory_record(tenant_id,industry_context_id,principal_id,status,created_at DESC);

ALTER TABLE core_ai.assistant_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.assistant_definition FORCE ROW LEVEL SECURITY;
CREATE POLICY assistant_definition_scope_policy ON core_ai.assistant_definition
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));

ALTER TABLE core_ai.ai_conversation ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_conversation FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_conversation_context_policy ON core_ai.ai_conversation
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND owner_principal_id=core_tenancy.current_principal_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND owner_principal_id=core_tenancy.current_principal_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  );

ALTER TABLE core_ai.ai_message ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_message FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_message_parent_context_policy ON core_ai.ai_message
  USING (
    EXISTS (
      SELECT 1 FROM core_ai.ai_conversation parent
      WHERE parent.id=conversation_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core_ai.ai_conversation parent
      WHERE parent.id=conversation_id
    )
  );

ALTER TABLE core_ai.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.token_usage FORCE ROW LEVEL SECURITY;
CREATE POLICY token_usage_context_policy ON core_ai.token_usage
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  );

ALTER TABLE core_ai.ai_cost ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_cost FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_cost_parent_context_policy ON core_ai.ai_cost
  USING (
    EXISTS (
      SELECT 1 FROM core_ai.token_usage parent
      WHERE parent.id=usage_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core_ai.token_usage parent
      WHERE parent.id=usage_id
    )
  );

ALTER TABLE core_ai.rag_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.rag_source FORCE ROW LEVEL SECURITY;
CREATE POLICY rag_source_context_policy ON core_ai.rag_source
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  );

ALTER TABLE core_ai.rag_chunk ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.rag_chunk FORCE ROW LEVEL SECURITY;
CREATE POLICY rag_chunk_context_policy ON core_ai.rag_chunk
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
    AND EXISTS (
      SELECT 1 FROM core_ai.rag_source parent
      WHERE parent.id=source_id
        AND parent.tenant_id=tenant_id
        AND parent.industry_context_id IS NOT DISTINCT FROM industry_context_id
    )
  );

ALTER TABLE core_ai.ai_memory_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.ai_memory_record FORCE ROW LEVEL SECURITY;
CREATE POLICY ai_memory_context_policy ON core_ai.ai_memory_record
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
    AND (principal_id IS NULL OR principal_id=core_tenancy.current_principal_id())
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
    AND (principal_id IS NULL OR principal_id=core_tenancy.current_principal_id())
  );

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('core_ai','assistant_definition','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','AI',true,now()),
('core_ai','ai_conversation','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY+PRINCIPAL','AI',true,now()),
('core_ai','ai_message','MIXED_SCOPED','RLS-PARENT-SCOPE','AI',true,now()),
('core_ai','token_usage','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','AI',true,now()),
('core_ai','ai_cost','MIXED_SCOPED','RLS-PARENT-SCOPE','AI',true,now()),
('core_ai','rag_source','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','AI',true,now()),
('core_ai','rag_chunk','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','AI',true,now()),
('core_ai','ai_memory_record','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY+PRINCIPAL','AI',true,now());

COMMIT;
