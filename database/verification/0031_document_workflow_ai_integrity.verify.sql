-- SBGlobal Plus — Verification 0031: document/workflow/notification/AI cross-layer attacks

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_ai','ai_tool_set'),('core_ai','ai_tool_set_member'),
    ('core_ai','ai_prompt_set'),('core_ai','ai_prompt_set_member')
  ) expected(schema_name,table_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
    WHERE namespace.nspname=expected.schema_name AND relation.relname=expected.table_name
      AND relation.relkind='r' AND relation.relrowsecurity AND relation.relforcerowsecurity
  ) OR NOT EXISTS (
    SELECT 1 FROM core_authz.rls_table_registry registry
    WHERE registry.schema_name=expected.schema_name AND registry.table_name=expected.table_name
      AND registry.status='ACTIVE'
  );
  IF missing<>0 THEN
    RAISE EXCEPTION '0031 ToolSet physical owner/RLS/registry missing: %',missing;
  END IF;

  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_ai','assistant_definition','assistant_definition_tool_set_fk'),
    ('core_ai','agent_definition','agent_definition_tool_set_fk'),
    ('core_ai','agent_step','agent_step_tool_binding_fk'),
    ('core_ai','token_usage','token_usage_model_provider_fk'),
    ('core_ai','ai_provisioning_snapshot','ai_provisioning_tenant_config_fk'),
    ('core_ai','industry_ai_config','industry_ai_config_prompt_set_fk'),
    ('core_document','document_meta','document_meta_ai_media_request_fk'),
    ('core_document','document_meta','document_meta_ai_model_provider_fk'),
    ('core_notification','notification_delivery','notification_delivery_source_event_fk')
  ) expected(schema_name,table_name,constraint_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint constraint_row
    JOIN pg_class relation ON relation.oid=constraint_row.conrelid
    JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
    WHERE namespace.nspname=expected.schema_name AND relation.relname=expected.table_name
      AND constraint_row.conname=expected.constraint_name AND constraint_row.contype='f'
  );
  IF missing<>0 THEN
    RAISE EXCEPTION '0031 cross-layer foreign keys missing: %',missing;
  END IF;

  SELECT count(*) INTO missing
  FROM pg_constraint constraint_row
  JOIN pg_class relation ON relation.oid=constraint_row.conrelid
  JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
  WHERE left(namespace.nspname,4)='ind_' AND constraint_row.contype='f'
    AND constraint_row.conname LIKE '%document_scope_fk';
  IF missing<>18 THEN
    RAISE EXCEPTION '0031 expected 18 exact-scope Industry DocumentMeta FKs, saw %',missing;
  END IF;
END $$;

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_document','document_meta','ai_generated'),
    ('core_document','document_meta','ai_media_request_id'),
    ('core_document','document_meta','ai_provider_id'),
    ('core_document','document_meta','ai_model_id'),
    ('core_document','document_meta','ai_provenance_json'),
    ('core_document','document_meta','ai_moderation_result_json')
  ) expected(schema_name,table_name,column_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns column_row
    WHERE column_row.table_schema=expected.schema_name AND column_row.table_name=expected.table_name
      AND column_row.column_name=expected.column_name
  );
  IF missing<>0 THEN
    RAISE EXCEPTION '0031 AI DocumentMeta provenance columns missing: %',missing;
  END IF;
  IF (SELECT is_nullable FROM information_schema.columns
      WHERE table_schema='core_identity' AND table_name='session_version' AND column_name='tenant_id')<>'YES'
     OR NOT EXISTS (
       SELECT 1 FROM pg_constraint WHERE conname='session_version_scope_uq' AND contype='u'
     ) THEN
    RAISE EXCEPTION '0031 nullable platform SessionVersion uniqueness contract missing';
  END IF;
END $$;

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_identity','tenant_membership','tenant_membership_principal_integrity'),
    ('core_identity','device_registration','device_registration_principal_integrity'),
    ('core_identity','session_version','session_version_principal_integrity'),
    ('core_authz','operator_elevation','operator_elevation_relationship_integrity'),
    ('core_document','document_meta','document_relationship_integrity'),
    ('core_document','document_upload_session','document_upload_relationship_integrity'),
    ('core_document','document_acl','document_acl_subject_integrity'),
    ('ind_sfm','sfm_pms_incident','sfm_pms_incident_document_scope_integrity'),
    ('core_audit','audit_event','audit_event_relationship_integrity'),
    ('core_config','data_export_request','data_export_relationship_integrity'),
    ('core_workflow','workflow_definition','workflow_definition_relationship_integrity'),
    ('core_workflow','workflow_instance','workflow_instance_relationship_integrity'),
    ('core_workflow','workflow_task','workflow_task_relationship_integrity'),
    ('core_workflow','workflow_transition','workflow_transition_relationship_integrity'),
    ('core_workflow','automation_definition','automation_definition_relationship_integrity'),
    ('core_workflow','automation_run','automation_run_relationship_integrity'),
    ('core_notification','notification_template','notification_template_relationship_integrity'),
    ('core_notification','notification_delivery','notification_delivery_relationship_integrity'),
    ('core_ai','tenant_ai_config','tenant_ai_configuration_integrity'),
    ('core_ai','industry_ai_config','industry_ai_configuration_integrity'),
    ('core_ai','ai_provisioning_snapshot','ai_provisioning_snapshot_integrity'),
    ('core_ai','prompt_template','prompt_template_relationship_integrity'),
    ('core_ai','ai_prompt_set_member','ai_prompt_set_member_integrity'),
    ('core_ai','ai_tool_set_member','ai_tool_set_member_integrity'),
    ('core_ai','assistant_definition','assistant_definition_relationship_integrity'),
    ('core_ai','ai_conversation','ai_conversation_relationship_integrity'),
    ('core_ai','token_usage','token_usage_relationship_integrity'),
    ('core_ai','rag_source','rag_source_relationship_integrity'),
    ('core_ai','rag_chunk','rag_chunk_relationship_integrity'),
    ('core_ai','ai_memory_record','ai_memory_relationship_integrity'),
    ('core_ai','ai_media_request','ai_media_request_relationship_integrity'),
    ('core_ai','agent_definition','agent_definition_relationship_integrity'),
    ('core_ai','agent_run','agent_run_relationship_integrity'),
    ('core_ai','agent_step','agent_step_relationship_integrity'),
    ('core_ai','agent_approval','agent_approval_relationship_integrity')
  ) expected(schema_name,table_name,trigger_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_trigger trigger_row
    JOIN pg_class relation ON relation.oid=trigger_row.tgrelid
    JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
    WHERE namespace.nspname=expected.schema_name AND relation.relname=expected.table_name
      AND trigger_row.tgname=expected.trigger_name AND NOT trigger_row.tgisinternal
  );
  IF missing<>0 THEN
    RAISE EXCEPTION '0031 integrity triggers missing: %',missing;
  END IF;
  IF NOT has_table_privilege('sbg_ai_gateway_rw','core_ai.ai_tool_set','SELECT')
     OR NOT has_table_privilege('sbg_ai_gateway_rw','core_ai.ai_tool_set_member','INSERT')
     OR NOT has_table_privilege('sbg_ai_gateway_rw','core_ai.ai_prompt_set','SELECT')
     OR NOT has_table_privilege('sbg_control_plane_rw','core_ai.ai_prompt_set_member','UPDATE')
     OR has_table_privilege('sbg_app_rw','core_ai.ai_tool_set','SELECT')
     OR has_table_privilege('sbg_app_rw','core_ai.ai_prompt_set','SELECT') THEN
    RAISE EXCEPTION '0031 ToolSet service-role privilege boundary incorrect';
  END IF;
END $$;

BEGIN;
INSERT INTO platform_directory.data_home
  (id,code,region_code,jurisdiction_code,topology_class,status,routing_version,metadata_json)
VALUES ('31000000-0000-0000-0000-000000000001','V31','R','J','TEST','ACTIVE',1,'{}');
INSERT INTO core_tenancy.tenant
  (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
VALUES
('31000000-0000-0000-0000-000000000011','V31-A','A','A','PROVISIONING','EDU','31000000-0000-0000-0000-000000000001','R',now(),now()),
('31000000-0000-0000-0000-000000000012','V31-B','B','B','PROVISIONING','HLT','31000000-0000-0000-0000-000000000001','R',now(),now());
INSERT INTO core_tenancy.industry_context
  (id,tenant_id,industry_code,status,is_primary,activation_version,created_at,updated_at)
VALUES
('31000000-0000-0000-0000-000000000021','31000000-0000-0000-0000-000000000011','EDU','ACTIVE',true,1,now(),now()),
('31000000-0000-0000-0000-000000000022','31000000-0000-0000-0000-000000000012','HLT','ACTIVE',true,1,now(),now());
INSERT INTO core_identity.platform_principal
  (id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
VALUES
('31000000-0000-0000-0000-000000000031','HUMAN','ACTIVE','A',1,now(),now()),
('31000000-0000-0000-0000-000000000032','HUMAN','ACTIVE','B',1,now(),now()),
('31000000-0000-0000-0000-000000000033','PLATFORM_OPERATOR','ACTIVE','OP-A',1,now(),now()),
('31000000-0000-0000-0000-000000000034','PLATFORM_OPERATOR','ACTIVE','OP-B',1,now(),now());
INSERT INTO core_identity.tenant_membership
  (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
VALUES
('31000000-0000-0000-0000-000000000041','31000000-0000-0000-0000-000000000011','31000000-0000-0000-0000-000000000031','ACTIVE',1,now(),now()),
('31000000-0000-0000-0000-000000000042','31000000-0000-0000-0000-000000000012','31000000-0000-0000-0000-000000000032','ACTIVE',1,now(),now());
UPDATE core_tenancy.tenant SET status='ACTIVE' WHERE id IN (
  '31000000-0000-0000-0000-000000000011','31000000-0000-0000-0000-000000000012'
);
SET CONSTRAINTS ALL IMMEDIATE;

DO $$ BEGIN
  IF core_identity.principal_is_active_for_tenant(
    '31000000-0000-0000-0000-000000000011','31000000-0000-0000-0000-000000000033',now()
  ) THEN
    RAISE EXCEPTION 'platform operator received tenant authority without elevation';
  END IF;
  BEGIN
    INSERT INTO core_authz.operator_elevation
      (id,operator_principal_id,tenant_id,purpose_code,approved_by,starts_at,expires_at,status,
       permission_profile_id,created_at)
    VALUES ('31000000-0000-0000-0000-000000000043','31000000-0000-0000-0000-000000000033',
      '31000000-0000-0000-0000-000000000011','TEST','31000000-0000-0000-0000-000000000033',
      now()-interval '1 minute',now()+interval '1 hour','ACTIVE',
      '31000000-0000-0000-0000-000000000044',now());
    RAISE EXCEPTION 'expected self-approved operator elevation rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
INSERT INTO core_authz.operator_elevation
  (id,operator_principal_id,tenant_id,purpose_code,approved_by,starts_at,expires_at,status,
   permission_profile_id,created_at)
VALUES ('31000000-0000-0000-0000-000000000045','31000000-0000-0000-0000-000000000033',
  '31000000-0000-0000-0000-000000000011','TEST','31000000-0000-0000-0000-000000000034',
  now()-interval '1 minute',now()+interval '1 hour','ACTIVE',
  '31000000-0000-0000-0000-000000000046',now());
SELECT set_config('app.operator_elevation_id','31000000-0000-0000-0000-000000000045',true);
SELECT set_config('app.tenant_id','31000000-0000-0000-0000-000000000011',true);
SELECT set_config('app.principal_id','31000000-0000-0000-0000-000000000033',true);
DO $$ BEGIN
  IF NOT core_identity.principal_is_active_for_tenant(
    '31000000-0000-0000-0000-000000000011','31000000-0000-0000-0000-000000000033',now()
  ) THEN
    RAISE EXCEPTION 'valid operator elevation was not recognized';
  END IF;
END $$;

INSERT INTO core_identity.session_version(principal_id,tenant_id,version,changed_at,reason_code)
VALUES ('31000000-0000-0000-0000-000000000033',NULL,1,now(),'TEST');
DO $$ BEGIN
  BEGIN
    INSERT INTO core_identity.session_version(principal_id,tenant_id,version,changed_at,reason_code)
    VALUES ('31000000-0000-0000-0000-000000000032','31000000-0000-0000-0000-000000000011',1,now(),'ATTACK');
    RAISE EXCEPTION 'expected cross-tenant human SessionVersion rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

INSERT INTO core_document.storage_object
  (id,data_home_id,bucket_class,object_key,size_bytes,checksum_sha256,encryption_key_ref,status,created_at)
VALUES
('31000000-0000-0000-0000-000000000051','31000000-0000-0000-0000-000000000001','TEST','A',1,'A','K','ACTIVE',now()),
('31000000-0000-0000-0000-000000000052','31000000-0000-0000-0000-000000000001','TEST','B',1,'B','K','ACTIVE',now());
INSERT INTO core_document.document_meta
  (id,tenant_id,industry_context_id,scope_class,source_module,source_resource_type,source_resource_id,
   filename_display,media_type,size_bytes,checksum_sha256,storage_object_id,owner_principal_id,
   sensitivity_class,retention_class,residency_region,status,virus_scan_status,version_no,created_at,created_by,updated_at,updated_by)
VALUES
('31000000-0000-0000-0000-000000000053','31000000-0000-0000-0000-000000000011','31000000-0000-0000-0000-000000000021',
 'TENANT_INDUSTRY','V31','TEST','A','A','text/plain',1,'A','31000000-0000-0000-0000-000000000051',
 '31000000-0000-0000-0000-000000000031','INTERNAL','TEST','R','ACTIVE','CLEAN',1,now(),
 '31000000-0000-0000-0000-000000000031',now(),'31000000-0000-0000-0000-000000000031'),
('31000000-0000-0000-0000-000000000054','31000000-0000-0000-0000-000000000012','31000000-0000-0000-0000-000000000022',
 'TENANT_INDUSTRY','V31','TEST','B','B','text/plain',1,'B','31000000-0000-0000-0000-000000000052',
 '31000000-0000-0000-0000-000000000032','INTERNAL','TEST','R','ACTIVE','CLEAN',1,now(),
 '31000000-0000-0000-0000-000000000032',now(),'31000000-0000-0000-0000-000000000032');

DO $$ BEGIN
  BEGIN
    INSERT INTO core_document.document_meta
      (id,tenant_id,industry_context_id,scope_class,source_module,source_resource_type,source_resource_id,
       filename_display,media_type,size_bytes,checksum_sha256,storage_object_id,sensitivity_class,
       retention_class,residency_region,status,virus_scan_status,version_no,parent_document_id,derivative_type,
       created_at,updated_at)
    VALUES ('31000000-0000-0000-0000-000000000055','31000000-0000-0000-0000-000000000011',
      '31000000-0000-0000-0000-000000000021','TENANT_INDUSTRY','V31','TEST','X','X','text/plain',1,'X',
      '31000000-0000-0000-0000-000000000051','INTERNAL','TEST','R','ACTIVE','CLEAN',1,
      '31000000-0000-0000-0000-000000000054','THUMBNAIL',now(),now());
    RAISE EXCEPTION 'expected cross-tenant document parent rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN
    INSERT INTO core_document.document_acl(id,document_id,subject_type,subject_id,permission,effect,created_at)
    VALUES ('31000000-0000-0000-0000-000000000056','31000000-0000-0000-0000-000000000053',
      'PRINCIPAL','31000000-0000-0000-0000-000000000032','VIEW','ALLOW',now());
    RAISE EXCEPTION 'expected cross-tenant ACL subject rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN
    INSERT INTO core_config.data_export_request
      (id,tenant_id,industry_context_id,requester_principal_id,scope_class,export_type,
       requested_resource_classes,residency_policy_version,sensitivity_ceiling,status,document_id,created_at,updated_at)
    VALUES ('31000000-0000-0000-0000-000000000057','31000000-0000-0000-0000-000000000011',
      '31000000-0000-0000-0000-000000000021','31000000-0000-0000-0000-000000000031',
      'TENANT_INDUSTRY','TENANT_EXPORT',ARRAY['TEST'],'R','REGULATED','READY',
      '31000000-0000-0000-0000-000000000054',now(),now());
    RAISE EXCEPTION 'expected cross-tenant export document rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

INSERT INTO core_workflow.workflow_definition
  (id,owner_scope,tenant_id,industry_context_id,code,version,status,schema_version,state_machine_json,
   created_by,created_at,updated_at)
VALUES ('31000000-0000-0000-0000-000000000061','INDUSTRY','31000000-0000-0000-0000-000000000011',
  '31000000-0000-0000-0000-000000000021','V31',1,'ACTIVE',1,'{}',
  '31000000-0000-0000-0000-000000000031',now(),now());
INSERT INTO core_workflow.workflow_instance
  (id,tenant_id,industry_context_id,scope_class,workflow_definition_id,workflow_definition_version,
   resource_type,resource_id,current_state,lifecycle_state,started_at,created_by,created_at,updated_at)
VALUES ('31000000-0000-0000-0000-000000000062','31000000-0000-0000-0000-000000000011',
  '31000000-0000-0000-0000-000000000021','TENANT_INDUSTRY','31000000-0000-0000-0000-000000000061',
  1,'TEST','A','OPEN','OPEN',now(),'31000000-0000-0000-0000-000000000031',now(),now());
DO $$ BEGIN
  BEGIN
    INSERT INTO core_workflow.workflow_instance
      (id,tenant_id,industry_context_id,scope_class,workflow_definition_id,workflow_definition_version,
       resource_type,resource_id,current_state,lifecycle_state,started_at,created_by,created_at,updated_at)
    VALUES ('31000000-0000-0000-0000-000000000063','31000000-0000-0000-0000-000000000012',
      '31000000-0000-0000-0000-000000000022','TENANT_INDUSTRY','31000000-0000-0000-0000-000000000061',
      1,'TEST','B','OPEN','OPEN',now(),'31000000-0000-0000-0000-000000000032',now(),now());
    RAISE EXCEPTION 'expected cross-tenant workflow definition rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN
    INSERT INTO core_workflow.workflow_task
      (id,tenant_id,industry_context_id,workflow_instance_id,task_type,assigned_subject_type,
       assigned_subject_id,permission_code,state,created_at,updated_at)
    VALUES ('31000000-0000-0000-0000-000000000064','31000000-0000-0000-0000-000000000011',
      '31000000-0000-0000-0000-000000000021','31000000-0000-0000-0000-000000000062',
      'ACTION','PRINCIPAL','31000000-0000-0000-0000-000000000032','test','PENDING',now(),now());
    RAISE EXCEPTION 'expected cross-tenant workflow assignee rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

INSERT INTO core_notification.notification_template
  (id,owner_scope,tenant_id,industry_context_id,code,channel,locale_code,version,status,
   body_template,created_by,created_at,updated_at)
VALUES ('31000000-0000-0000-0000-000000000065','INDUSTRY','31000000-0000-0000-0000-000000000011',
  '31000000-0000-0000-0000-000000000021','V31','EMAIL','en',1,'ACTIVE','test',
  '31000000-0000-0000-0000-000000000031',now(),now());
DO $$ BEGIN
  BEGIN
    INSERT INTO core_notification.notification_delivery
      (id,tenant_id,industry_context_id,scope_class,template_id,template_version,recipient_principal_id,
       channel,correlation_id,status,queued_at)
    VALUES ('31000000-0000-0000-0000-000000000066','31000000-0000-0000-0000-000000000012',
      '31000000-0000-0000-0000-000000000022','TENANT_INDUSTRY','31000000-0000-0000-0000-000000000065',
      1,'31000000-0000-0000-0000-000000000032','EMAIL','31000000-0000-0000-0000-000000000067','QUEUED',now());
    RAISE EXCEPTION 'expected cross-tenant notification template rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

INSERT INTO core_ai.ai_capability
  (id,code,category,default_policy_class,schema_version,status)
VALUES ('31000000-0000-0000-0000-000000000071','V31.CHAT','CHAT','TEST',1,'ACTIVE');
INSERT INTO core_ai.ai_provider
  (id,code,status,adapter_type,security_class,credential_ref,health_state,version,created_at,updated_at)
VALUES
('31000000-0000-0000-0000-000000000072','V31-P1','ACTIVE','TEST','INTERNAL','C1','HEALTHY',1,now(),now()),
('31000000-0000-0000-0000-000000000073','V31-P2','ACTIVE','TEST','INTERNAL','C2','HEALTHY',1,now(),now());
INSERT INTO core_ai.ai_model
  (id,provider_id,model_code,display_name,context_window_class,sensitivity_ceiling,cost_class,latency_class,status,version)
VALUES
('31000000-0000-0000-0000-000000000074','31000000-0000-0000-0000-000000000072','M1','M1','TEST','INTERNAL','TEST','TEST','ACTIVE',1),
('31000000-0000-0000-0000-000000000075','31000000-0000-0000-0000-000000000073','M2','M2','TEST','INTERNAL','TEST','TEST','ACTIVE',1);
INSERT INTO core_ai.tenant_ai_config
  (id,tenant_id,enabled,allowed_capabilities,allowed_provider_ids,allowed_model_ids,max_sensitivity_class,
   residency_policy_id,retention_policy_id,prompt_override_policy_id,version,updated_at)
VALUES ('31000000-0000-0000-0000-000000000076','31000000-0000-0000-0000-000000000011',true,
  ARRAY['V31.CHAT'],ARRAY['31000000-0000-0000-0000-000000000072'::uuid],
  ARRAY['31000000-0000-0000-0000-000000000074'::uuid],'INTERNAL',
  '31000000-0000-0000-0000-000000000077','31000000-0000-0000-0000-000000000078',
  '31000000-0000-0000-0000-000000000079',1,now());
DO $$ BEGIN
  BEGIN
    INSERT INTO core_ai.industry_ai_config
      (id,tenant_id,industry_context_id,enabled,allowed_capabilities,allowed_provider_ids,allowed_model_ids,version,updated_at)
    VALUES ('31000000-0000-0000-0000-000000000080','31000000-0000-0000-0000-000000000011',
      '31000000-0000-0000-0000-000000000021',true,ARRAY['V31.CHAT'],
      ARRAY['31000000-0000-0000-0000-000000000073'::uuid],
      ARRAY['31000000-0000-0000-0000-000000000075'::uuid],1,now());
    RAISE EXCEPTION 'expected Industry AI widening rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

INSERT INTO core_ai.prompt_template
  (id,owner_scope,tenant_id,industry_context_id,code,version,system_template,variable_schema_json,
   status,created_by,created_at,updated_at)
VALUES ('31000000-0000-0000-0000-000000000081','INDUSTRY','31000000-0000-0000-0000-000000000011',
  '31000000-0000-0000-0000-000000000021','V31',1,'test','{}','ACTIVE',
  '31000000-0000-0000-0000-000000000031',now(),now());
INSERT INTO core_ai.ai_prompt_set
  (id,owner_scope,tenant_id,industry_context_id,code,version,status,created_at,updated_at)
VALUES
('31000000-0000-0000-0000-000000000101','INDUSTRY','31000000-0000-0000-0000-000000000011',
 '31000000-0000-0000-0000-000000000021','V31-A',1,'ACTIVE',now(),now()),
('31000000-0000-0000-0000-000000000102','INDUSTRY','31000000-0000-0000-0000-000000000012',
 '31000000-0000-0000-0000-000000000022','V31-B',1,'ACTIVE',now(),now());
INSERT INTO core_ai.ai_prompt_set_member(id,prompt_set_id,prompt_template_id,created_at)
VALUES ('31000000-0000-0000-0000-000000000103','31000000-0000-0000-0000-000000000101',
  '31000000-0000-0000-0000-000000000081',now());
DO $$ BEGIN
  BEGIN
    INSERT INTO core_ai.industry_ai_config
      (id,tenant_id,industry_context_id,enabled,allowed_capabilities,allowed_provider_ids,
       allowed_model_ids,domain_prompt_set_id,version,updated_at)
    VALUES ('31000000-0000-0000-0000-000000000104','31000000-0000-0000-0000-000000000011',
      '31000000-0000-0000-0000-000000000021',true,ARRAY['V31.CHAT'],
      ARRAY['31000000-0000-0000-0000-000000000072'::uuid],
      ARRAY['31000000-0000-0000-0000-000000000074'::uuid],
      '31000000-0000-0000-0000-000000000102',1,now());
    RAISE EXCEPTION 'expected foreign Industry prompt-set rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

SET LOCAL ROLE sbg_ai_gateway_rw;
SELECT set_config('app.scope_class','PLATFORM_GLOBAL',true);
DO $$ BEGIN
  BEGIN
    INSERT INTO core_ai.ai_prompt_set(id,owner_scope,code,version,status,created_at,updated_at)
    VALUES ('31000000-0000-0000-0000-000000000105','PLATFORM','ILLEGAL',1,'ACTIVE',now(),now());
    RAISE EXCEPTION 'expected AI Gateway platform-catalog write rejection';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
INSERT INTO core_ai.ai_tool_definition
  (id,tool_id,capability_code,operation_contract_id,scope_class,required_permission,input_schema_version,
   output_schema_version,side_effect_class,idempotency_required,audit_class,status,version,created_at,updated_at)
VALUES ('31000000-0000-0000-0000-000000000082','V31.TOOL','V31.CHAT','V31.OP','TENANT_INDUSTRY',
  'v31.use',1,1,'NONE',false,'TEST','ACTIVE',1,now(),now());
INSERT INTO core_ai.ai_tool_set
  (id,owner_scope,tenant_id,industry_context_id,code,version,status,created_at,updated_at)
VALUES
('31000000-0000-0000-0000-000000000083','INDUSTRY','31000000-0000-0000-0000-000000000011',
 '31000000-0000-0000-0000-000000000021','V31-A',1,'ACTIVE',now(),now()),
('31000000-0000-0000-0000-000000000084','INDUSTRY','31000000-0000-0000-0000-000000000012',
 '31000000-0000-0000-0000-000000000022','V31-B',1,'ACTIVE',now(),now());
INSERT INTO core_ai.ai_tool_set_member(id,tool_set_id,tool_definition_id,created_at)
VALUES
('31000000-0000-0000-0000-000000000085','31000000-0000-0000-0000-000000000083','31000000-0000-0000-0000-000000000082',now()),
('31000000-0000-0000-0000-000000000086','31000000-0000-0000-0000-000000000084','31000000-0000-0000-0000-000000000082',now());
INSERT INTO core_ai.assistant_definition
  (id,owner_scope,tenant_id,industry_context_id,code,allowed_capabilities,prompt_template_id,tool_set_id,
   retention_policy_id,version,status,created_at,updated_at)
VALUES ('31000000-0000-0000-0000-000000000087','INDUSTRY','31000000-0000-0000-0000-000000000011',
  '31000000-0000-0000-0000-000000000021','V31',ARRAY['V31.CHAT'],'31000000-0000-0000-0000-000000000081',
  '31000000-0000-0000-0000-000000000083','31000000-0000-0000-0000-000000000088',1,'ACTIVE',now(),now());

DO $$ BEGIN
  BEGIN
    INSERT INTO core_ai.rag_source
      (id,tenant_id,industry_context_id,scope_class,source_module,resource_type,resource_id,document_id,
       document_version,sensitivity_class,residency_region,retention_class,status,source_version,
       chunking_policy_version,created_at,updated_at)
    VALUES ('31000000-0000-0000-0000-000000000089','31000000-0000-0000-0000-000000000011',
      '31000000-0000-0000-0000-000000000021','TENANT_INDUSTRY','V31','TEST','A',
      '31000000-0000-0000-0000-000000000054',1,'INTERNAL','R','TEST','ACTIVE',1,'V1',now(),now());
    RAISE EXCEPTION 'expected cross-tenant RAG document rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN
    INSERT INTO core_ai.token_usage
      (id,tenant_id,industry_context_id,capability_code,provider_id,model_id,occurred_at,correlation_id)
    VALUES ('31000000-0000-0000-0000-000000000090','31000000-0000-0000-0000-000000000011',
      '31000000-0000-0000-0000-000000000021','V31.CHAT','31000000-0000-0000-0000-000000000072',
      '31000000-0000-0000-0000-000000000075',now(),'31000000-0000-0000-0000-000000000091');
    RAISE EXCEPTION 'expected model/provider mismatch rejection';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
END $$;
DO $$ BEGIN
  BEGIN
    INSERT INTO core_ai.agent_definition
      (id,owner_scope,tenant_id,industry_context_id,code,objective_class,allowed_tool_set_id,max_risk_class,
       approval_policy_id,budget_policy_id,version,status,created_at,updated_at)
    VALUES ('31000000-0000-0000-0000-000000000092','INDUSTRY','31000000-0000-0000-0000-000000000011',
      '31000000-0000-0000-0000-000000000021','BAD','TEST','31000000-0000-0000-0000-000000000084','LOW',
      '31000000-0000-0000-0000-000000000093','31000000-0000-0000-0000-000000000094',1,'ACTIVE',now(),now());
    RAISE EXCEPTION 'expected foreign ToolSet rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

INSERT INTO core_ai.agent_definition
  (id,owner_scope,tenant_id,industry_context_id,code,objective_class,allowed_tool_set_id,max_risk_class,
   approval_policy_id,budget_policy_id,version,status,created_at,updated_at)
VALUES ('31000000-0000-0000-0000-000000000095','INDUSTRY','31000000-0000-0000-0000-000000000011',
  '31000000-0000-0000-0000-000000000021','GOOD','TEST','31000000-0000-0000-0000-000000000083','LOW',
  '31000000-0000-0000-0000-000000000096','31000000-0000-0000-0000-000000000097',1,'ACTIVE',now(),now());
INSERT INTO core_ai.agent_run
  (id,agent_definition_id,tenant_id,industry_context_id,acting_principal_id,membership_id,
   entitlement_snapshot_version,permission_version,status,step_budget_class,token_budget_class,
   started_at,correlation_id)
VALUES ('31000000-0000-0000-0000-000000000098','31000000-0000-0000-0000-000000000095',
  '31000000-0000-0000-0000-000000000011','31000000-0000-0000-0000-000000000021',
  '31000000-0000-0000-0000-000000000031','31000000-0000-0000-0000-000000000041',1,1,'PENDING',
  'TEST','TEST',now(),'31000000-0000-0000-0000-000000000099');
DO $$ BEGIN
  BEGIN
    INSERT INTO core_ai.agent_step
      (id,run_id,ordinal,step_type,tool_binding_id,status,started_at)
    VALUES ('31000000-0000-0000-0000-000000000100','31000000-0000-0000-0000-000000000098',
      0,'TOOL','31000000-0000-0000-0000-000000000086','PENDING',now());
    RAISE EXCEPTION 'expected ToolSet-binding escape rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

ROLLBACK;
