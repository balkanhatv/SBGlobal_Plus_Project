-- SBGlobal Plus — Migration 0013: AI agents, tools and approvals
BEGIN;

CREATE TYPE core_ai.agent_run_status AS ENUM ('PENDING','RUNNING','WAITING_APPROVAL','SUCCEEDED','FAILED','CANCELLED');
CREATE TYPE core_ai.agent_step_type AS ENUM ('PLAN','RAG','TOOL','APPROVAL','INFERENCE');
CREATE TYPE core_ai.agent_step_status AS ENUM ('PENDING','RUNNING','SUCCEEDED','FAILED','SKIPPED','CANCELLED');
CREATE TYPE core_ai.tool_side_effect_class AS ENUM ('NONE','LOW','CONTROLLED','HIGH');
CREATE TYPE core_ai.approval_status AS ENUM ('PENDING','APPROVED','REJECTED','EXPIRED');

CREATE TABLE core_ai.ai_tool_definition (
  id uuid PRIMARY KEY,
  tool_id text NOT NULL UNIQUE,
  capability_code text NOT NULL REFERENCES core_ai.ai_capability(code),
  operation_contract_id text NOT NULL,
  scope_class text NOT NULL,
  required_permission text NOT NULL,
  required_entitlement text,
  input_schema_version integer NOT NULL CHECK (input_schema_version > 0),
  output_schema_version integer NOT NULL CHECK (output_schema_version > 0),
  side_effect_class core_ai.tool_side_effect_class NOT NULL,
  approval_policy_id uuid,
  idempotency_required boolean NOT NULL,
  audit_class text NOT NULL,
  status text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE core_ai.agent_definition (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  objective_class text NOT NULL,
  allowed_tool_set_id uuid NOT NULL,
  max_risk_class text NOT NULL,
  approval_policy_id uuid NOT NULL,
  budget_policy_id uuid NOT NULL,
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
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id)
);

CREATE UNIQUE INDEX agent_definition_scope_code_version_uq
ON core_ai.agent_definition(
  owner_scope,
  COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
  code,
  version
);

CREATE TABLE core_ai.agent_run (
  id uuid PRIMARY KEY,
  agent_definition_id uuid NOT NULL REFERENCES core_ai.agent_definition(id),
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  acting_principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  membership_id uuid REFERENCES core_identity.tenant_membership(id),
  entitlement_snapshot_version bigint NOT NULL,
  permission_version bigint NOT NULL,
  requested_resource_scope_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status core_ai.agent_run_status NOT NULL,
  step_budget_class text NOT NULL,
  token_budget_class text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  correlation_id uuid NOT NULL,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE INDEX agent_run_scope_status_idx
  ON core_ai.agent_run(tenant_id,industry_context_id,status,started_at DESC);

CREATE TABLE core_ai.agent_step (
  id uuid PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES core_ai.agent_run(id),
  ordinal integer NOT NULL CHECK (ordinal >= 0),
  step_type core_ai.agent_step_type NOT NULL,
  input_ref text,
  output_ref text,
  tool_binding_id uuid,
  approval_id uuid,
  status core_ai.agent_step_status NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  audit_ref uuid REFERENCES core_audit.audit_event_identity(id),
  UNIQUE(run_id,ordinal),
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE TABLE core_ai.agent_approval (
  id uuid PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES core_ai.agent_run(id),
  step_id uuid NOT NULL REFERENCES core_ai.agent_step(id),
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  requested_by_agent boolean NOT NULL,
  approval_type text NOT NULL,
  required_permission text NOT NULL,
  approver_principal_id uuid REFERENCES core_identity.platform_principal(id),
  status core_ai.approval_status NOT NULL,
  request_summary_safe text NOT NULL,
  approved_at timestamptz,
  reason text,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (
    (status='APPROVED' AND approver_principal_id IS NOT NULL AND approved_at IS NOT NULL)
    OR status <> 'APPROVED'
  )
);

ALTER TABLE core_ai.agent_step
  ADD CONSTRAINT agent_step_approval_fk
  FOREIGN KEY (approval_id) REFERENCES core_ai.agent_approval(id);

ALTER TABLE core_ai.agent_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.agent_definition FORCE ROW LEVEL SECURITY;
CREATE POLICY agent_definition_scope_policy ON core_ai.agent_definition
  USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id))
  WITH CHECK (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));

ALTER TABLE core_ai.agent_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.agent_run FORCE ROW LEVEL SECURITY;
CREATE POLICY agent_run_context_policy ON core_ai.agent_run
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND acting_principal_id=core_tenancy.current_principal_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND acting_principal_id=core_tenancy.current_principal_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  );

ALTER TABLE core_ai.agent_step ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.agent_step FORCE ROW LEVEL SECURITY;
CREATE POLICY agent_step_parent_context_policy ON core_ai.agent_step
  USING (
    EXISTS (
      SELECT 1 FROM core_ai.agent_run parent
      WHERE parent.id=run_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core_ai.agent_run parent
      WHERE parent.id=run_id
    )
  );

ALTER TABLE core_ai.agent_approval ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_ai.agent_approval FORCE ROW LEVEL SECURITY;
CREATE POLICY agent_approval_context_policy ON core_ai.agent_approval
  USING (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  )
  WITH CHECK (
    tenant_id=core_tenancy.current_tenant_id()
    AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
  );

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('core_ai','agent_definition','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','AI',true,now()),
('core_ai','agent_run','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY+PRINCIPAL','AI',true,now()),
('core_ai','agent_step','MIXED_SCOPED','RLS-PARENT-SCOPE','AI',true,now()),
('core_ai','agent_approval','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','AI',true,now());

COMMIT;
