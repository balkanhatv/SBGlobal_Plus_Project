-- SBGlobal Plus — Migration 0026: Workflow, Automation & Notification persistence
BEGIN;

CREATE TYPE core_workflow.workflow_lifecycle_state AS ENUM ('OPEN','WAITING','COMPLETED','CANCELLED');
CREATE TYPE core_workflow.workflow_task_type AS ENUM ('APPROVAL','REVIEW','ACTION');
CREATE TYPE core_workflow.workflow_task_subject_type AS ENUM ('PRINCIPAL','ROLE','ORG_UNIT');
CREATE TYPE core_workflow.workflow_task_state AS ENUM ('PENDING','CLAIMED','APPROVED','REJECTED','COMPLETED','CANCELLED','EXPIRED');
CREATE TYPE core_workflow.automation_trigger_type AS ENUM ('EVENT','SCHEDULE','MANUAL');
CREATE TYPE core_workflow.automation_run_status AS ENUM ('PENDING','RUNNING','SUCCEEDED','FAILED','CANCELLED');

CREATE TYPE core_notification.notification_channel AS ENUM ('EMAIL','SMS','WHATSAPP','PUSH','IN_APP');
CREATE TYPE core_notification.notification_delivery_status AS ENUM ('QUEUED','SENDING','SENT','DELIVERED','FAILED','SUPPRESSED','CANCELLED');

CREATE TABLE core_workflow.workflow_definition (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status core_config.definition_status NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  state_machine_json jsonb NOT NULL,
  approval_policy_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  rule_refs text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  approved_by uuid REFERENCES core_identity.platform_principal(id),
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope='PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope='TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope='INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id)
);
CREATE UNIQUE INDEX workflow_definition_scope_version_uq
ON core_workflow.workflow_definition(
  owner_scope,
  COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
  code,version
);
CREATE UNIQUE INDEX workflow_definition_active_uq
ON core_workflow.workflow_definition(
  owner_scope,
  COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
  code
) WHERE status='ACTIVE';

CREATE TABLE core_workflow.workflow_instance (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  scope_class text NOT NULL CHECK (scope_class IN ('TENANT_CORE','TENANT_INDUSTRY')),
  workflow_definition_id uuid NOT NULL REFERENCES core_workflow.workflow_definition(id),
  workflow_definition_version integer NOT NULL CHECK (workflow_definition_version > 0),
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  current_state text NOT NULL,
  lifecycle_state core_workflow.workflow_lifecycle_state NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_by uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (
    (scope_class='TENANT_CORE' AND industry_context_id IS NULL)
    OR (scope_class='TENANT_INDUSTRY' AND industry_context_id IS NOT NULL)
  ),
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);
CREATE INDEX workflow_instance_resource_idx
  ON core_workflow.workflow_instance(tenant_id,industry_context_id,resource_type,resource_id,lifecycle_state);
CREATE INDEX workflow_instance_state_idx
  ON core_workflow.workflow_instance(tenant_id,industry_context_id,current_state,updated_at);

CREATE TABLE core_workflow.workflow_task (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  workflow_instance_id uuid NOT NULL REFERENCES core_workflow.workflow_instance(id),
  task_type core_workflow.workflow_task_type NOT NULL,
  assigned_subject_type core_workflow.workflow_task_subject_type NOT NULL,
  assigned_subject_id uuid NOT NULL,
  permission_code text NOT NULL,
  state core_workflow.workflow_task_state NOT NULL,
  due_at timestamptz,
  claimed_by uuid REFERENCES core_identity.platform_principal(id),
  completed_by uuid REFERENCES core_identity.platform_principal(id),
  completed_at timestamptz,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (completed_at IS NULL OR state IN ('APPROVED','REJECTED','COMPLETED','CANCELLED','EXPIRED'))
);
CREATE INDEX workflow_task_assignment_state_idx
  ON core_workflow.workflow_task(tenant_id,industry_context_id,assigned_subject_type,assigned_subject_id,state,due_at);
CREATE INDEX workflow_task_instance_idx
  ON core_workflow.workflow_task(tenant_id,industry_context_id,workflow_instance_id,state);

CREATE TABLE core_workflow.workflow_transition (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  workflow_instance_id uuid NOT NULL REFERENCES core_workflow.workflow_instance(id),
  from_state text NOT NULL,
  action_code text NOT NULL,
  to_state text NOT NULL,
  actor_principal_id uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  reason_code text,
  expected_instance_version bigint NOT NULL CHECK (expected_instance_version > 0),
  resulting_instance_version bigint NOT NULL CHECK (resulting_instance_version > expected_instance_version),
  occurred_at timestamptz NOT NULL,
  correlation_id uuid NOT NULL,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id)
);
CREATE INDEX workflow_transition_instance_time_idx
  ON core_workflow.workflow_transition(tenant_id,industry_context_id,workflow_instance_id,occurred_at);

CREATE TABLE core_workflow.automation_definition (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status core_config.definition_status NOT NULL,
  schema_version integer NOT NULL CHECK (schema_version > 0),
  trigger_type core_workflow.automation_trigger_type NOT NULL,
  trigger_config_json jsonb NOT NULL,
  condition_rule_ref text,
  operation_contract_id text,
  workflow_definition_id uuid REFERENCES core_workflow.workflow_definition(id),
  config_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  approved_by uuid REFERENCES core_identity.platform_principal(id),
  effective_from timestamptz,
  effective_to timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (
    (owner_scope='PLATFORM' AND tenant_id IS NULL AND industry_context_id IS NULL)
    OR (owner_scope='TENANT' AND tenant_id IS NOT NULL AND industry_context_id IS NULL)
    OR (owner_scope='INDUSTRY' AND tenant_id IS NOT NULL AND industry_context_id IS NOT NULL)
  ),
  CHECK (operation_contract_id IS NOT NULL OR workflow_definition_id IS NOT NULL),
  CHECK (effective_to IS NULL OR effective_from IS NULL OR effective_to > effective_from),
  FOREIGN KEY (tenant_id) REFERENCES core_tenancy.tenant(id),
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id)
);
CREATE UNIQUE INDEX automation_definition_scope_version_uq
ON core_workflow.automation_definition(
  owner_scope,
  COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
  code,version
);
CREATE UNIQUE INDEX automation_definition_active_uq
ON core_workflow.automation_definition(
  owner_scope,
  COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
  code
) WHERE status='ACTIVE';

CREATE TABLE core_workflow.automation_run (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  automation_definition_id uuid NOT NULL REFERENCES core_workflow.automation_definition(id),
  trigger_ref text NOT NULL,
  idempotency_key_hash text NOT NULL,
  status core_workflow.automation_run_status NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  correlation_id uuid NOT NULL,
  last_error_code text,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);
CREATE UNIQUE INDEX automation_run_scope_idempotency_uq
ON core_workflow.automation_run(
  tenant_id,
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
  automation_definition_id,
  idempotency_key_hash
);

CREATE TABLE core_notification.notification_template (
  id uuid PRIMARY KEY,
  owner_scope core_config.owner_scope NOT NULL,
  tenant_id uuid,
  industry_context_id uuid,
  code text NOT NULL,
  channel core_notification.notification_channel NOT NULL,
  locale_code text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  status core_config.definition_status NOT NULL,
  subject_template text,
  body_template text NOT NULL,
  safe_preview_template text,
  variable_schema_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES core_identity.platform_principal(id),
  approved_by uuid REFERENCES core_identity.platform_principal(id),
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
CREATE UNIQUE INDEX notification_template_scope_version_uq
ON core_notification.notification_template(
  owner_scope,
  COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
  code,channel,locale_code,version
);
CREATE UNIQUE INDEX notification_template_active_uq
ON core_notification.notification_template(
  owner_scope,
  COALESCE(tenant_id,'00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(industry_context_id,'00000000-0000-0000-0000-000000000000'::uuid),
  code,channel,locale_code
) WHERE status='ACTIVE';

CREATE TABLE core_notification.notification_delivery (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid,
  scope_class text NOT NULL CHECK (scope_class IN ('TENANT_CORE','TENANT_INDUSTRY')),
  template_id uuid REFERENCES core_notification.notification_template(id),
  template_version integer,
  recipient_principal_id uuid REFERENCES core_identity.platform_principal(id),
  recipient_reference text,
  channel core_notification.notification_channel NOT NULL,
  tenant_integration_id uuid REFERENCES core_integration.tenant_integration(id),
  correlation_id uuid NOT NULL,
  source_event_id uuid,
  status core_notification.notification_delivery_status NOT NULL,
  queued_at timestamptz NOT NULL,
  sent_at timestamptz,
  delivered_at timestamptz,
  last_error_code text,
  row_version bigint NOT NULL DEFAULT 1,
  FOREIGN KEY (tenant_id,industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id,id),
  CHECK (
    (scope_class='TENANT_CORE' AND industry_context_id IS NULL)
    OR (scope_class='TENANT_INDUSTRY' AND industry_context_id IS NOT NULL)
  ),
  CHECK (recipient_principal_id IS NOT NULL OR recipient_reference IS NOT NULL),
  CHECK (sent_at IS NULL OR sent_at >= queued_at),
  CHECK (delivered_at IS NULL OR sent_at IS NOT NULL)
);
CREATE INDEX notification_delivery_scope_state_idx
  ON core_notification.notification_delivery(tenant_id,industry_context_id,status,queued_at);
CREATE INDEX notification_delivery_correlation_idx
  ON core_notification.notification_delivery(tenant_id,correlation_id);

CREATE TABLE core_notification.notification_delivery_attempt (
  id uuid PRIMARY KEY,
  delivery_id uuid NOT NULL REFERENCES core_notification.notification_delivery(id),
  attempt_no integer NOT NULL CHECK (attempt_no > 0),
  provider_message_ref text,
  normalized_status text NOT NULL,
  normalized_error_code text,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  UNIQUE(delivery_id,attempt_no),
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);

ALTER TABLE core_workflow.workflow_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_workflow.workflow_definition FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_definition_scope_policy ON core_workflow.workflow_definition
 USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id))
 WITH CHECK (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));

ALTER TABLE core_workflow.workflow_instance ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_workflow.workflow_instance FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_instance_context_policy ON core_workflow.workflow_instance
 USING (
   tenant_id=core_tenancy.current_tenant_id()
   AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
 )
 WITH CHECK (
   tenant_id=core_tenancy.current_tenant_id()
   AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
 );

ALTER TABLE core_workflow.workflow_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_workflow.workflow_task FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_task_parent_context_policy ON core_workflow.workflow_task
 USING (
   EXISTS (SELECT 1 FROM core_workflow.workflow_instance parent WHERE parent.id=workflow_instance_id)
 )
 WITH CHECK (
   EXISTS (
     SELECT 1 FROM core_workflow.workflow_instance parent
     WHERE parent.id=workflow_instance_id
       AND parent.tenant_id=tenant_id
       AND parent.industry_context_id IS NOT DISTINCT FROM industry_context_id
   )
 );

ALTER TABLE core_workflow.workflow_transition ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_workflow.workflow_transition FORCE ROW LEVEL SECURITY;
CREATE POLICY workflow_transition_parent_context_policy ON core_workflow.workflow_transition
 USING (
   EXISTS (SELECT 1 FROM core_workflow.workflow_instance parent WHERE parent.id=workflow_instance_id)
 )
 WITH CHECK (
   EXISTS (
     SELECT 1 FROM core_workflow.workflow_instance parent
     WHERE parent.id=workflow_instance_id
       AND parent.tenant_id=tenant_id
       AND parent.industry_context_id IS NOT DISTINCT FROM industry_context_id
   )
 );

ALTER TABLE core_workflow.automation_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_workflow.automation_definition FORCE ROW LEVEL SECURITY;
CREATE POLICY automation_definition_scope_policy ON core_workflow.automation_definition
 USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id))
 WITH CHECK (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));

ALTER TABLE core_workflow.automation_run ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_workflow.automation_run FORCE ROW LEVEL SECURITY;
CREATE POLICY automation_run_context_policy ON core_workflow.automation_run
 USING (
   tenant_id=core_tenancy.current_tenant_id()
   AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
 )
 WITH CHECK (
   tenant_id=core_tenancy.current_tenant_id()
   AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
 );

ALTER TABLE core_notification.notification_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_notification.notification_template FORCE ROW LEVEL SECURITY;
CREATE POLICY notification_template_scope_policy ON core_notification.notification_template
 USING (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id))
 WITH CHECK (core_config.row_visible_to_current_context(owner_scope,tenant_id,industry_context_id));

ALTER TABLE core_notification.notification_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_notification.notification_delivery FORCE ROW LEVEL SECURITY;
CREATE POLICY notification_delivery_context_policy ON core_notification.notification_delivery
 USING (
   tenant_id=core_tenancy.current_tenant_id()
   AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
 )
 WITH CHECK (
   tenant_id=core_tenancy.current_tenant_id()
   AND (industry_context_id IS NULL OR industry_context_id=core_tenancy.current_industry_context_id())
 );

ALTER TABLE core_notification.notification_delivery_attempt ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_notification.notification_delivery_attempt FORCE ROW LEVEL SECURITY;
CREATE POLICY notification_attempt_parent_context_policy ON core_notification.notification_delivery_attempt
 USING (
   EXISTS (SELECT 1 FROM core_notification.notification_delivery parent WHERE parent.id=delivery_id)
 )
 WITH CHECK (
   EXISTS (SELECT 1 FROM core_notification.notification_delivery parent WHERE parent.id=delivery_id)
 );

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('core_workflow','workflow_definition','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','Workflow',true,now()),
('core_workflow','workflow_instance','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Workflow',true,now()),
('core_workflow','workflow_task','MIXED_SCOPED','RLS-PARENT-SCOPE','Workflow',true,now()),
('core_workflow','workflow_transition','MIXED_SCOPED','RLS-PARENT-SCOPE','Workflow',true,now()),
('core_workflow','automation_definition','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','Automation',true,now()),
('core_workflow','automation_run','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Automation',true,now()),
('core_notification','notification_template','MIXED_SCOPED','RLS-PLATFORM/TENANT/INDUSTRY','Notification',true,now()),
('core_notification','notification_delivery','MIXED_SCOPED','RLS-TENANT/RLS-INDUSTRY','Notification',true,now()),
('core_notification','notification_delivery_attempt','MIXED_SCOPED','RLS-PARENT-SCOPE','Notification',true,now());

COMMIT;
