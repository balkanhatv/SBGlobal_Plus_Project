-- SBGlobal Plus — Verification 0030: cross-scope reference/event attacks

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_commercial','subscription_transition','subscription_transition_same_tenant_fk'),
    ('core_commercial','license','license_subscription_same_tenant_fk'),
    ('core_commercial','tenant_add_on','tenant_add_on_subscription_same_tenant_fk'),
    ('core_commercial','entitlement_snapshot','entitlement_snapshot_subscription_same_tenant_fk'),
    ('core_tenancy','tenant','tenant_current_subscription_same_tenant_fk'),
    ('core_commercial','entitlement_snapshot_fact','entitlement_snapshot_fact_parent_same_tenant_fk'),
    ('core_integration','outbox_event','outbox_event_catalog_scope_fk'),
    ('core_integration','webhook_delivery','webhook_delivery_identity_full_fk')
  ) expected(schema_name,table_name,constraint_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint constraint_row
    JOIN pg_class relation ON relation.oid=constraint_row.conrelid
    JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
    WHERE namespace.nspname=expected.schema_name AND relation.relname=expected.table_name
      AND constraint_row.conname=expected.constraint_name AND constraint_row.contype='f'
  );
  IF missing<>0 THEN
    RAISE EXCEPTION '0030 same-scope foreign-key contracts missing: %',missing;
  END IF;
END $$;

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_identity','api_credential','allowed_industry_context_ids'),
    ('core_commercial','entitlement_snapshot_fact','tenant_id'),
    ('core_integration','outbox_event','scope_class'),
    ('core_audit','audit_event','source_industry_context_id'),
    ('core_audit','audit_event','target_industry_context_id')
  ) expected(schema_name,table_name,column_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns column_row
    WHERE column_row.table_schema=expected.schema_name AND column_row.table_name=expected.table_name
      AND column_row.column_name=expected.column_name
  );
  IF missing<>0 THEN
    RAISE EXCEPTION '0030 required ownership columns missing: %',missing;
  END IF;

  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_authz','role_assignment','role_assignment_scope_integrity'),
    ('core_identity','api_credential','api_credential_scope_integrity'),
    ('core_integration','idempotency_record','idempotency_actor_scope_integrity'),
    ('core_integration','tenant_integration','tenant_integration_scope_integrity'),
    ('core_integration','sync_cursor','sync_cursor_scope_integrity'),
    ('core_integration','outbox_event','outbox_envelope_scope_integrity'),
    ('core_integration','webhook_subscription','webhook_subscription_scope_integrity'),
    ('core_integration','webhook_delivery','webhook_delivery_scope_integrity'),
    ('core_tenancy','tenant','tenant_primary_industry_integrity'),
    ('core_tenancy','industry_context','industry_context_primary_integrity')
  ) expected(schema_name,table_name,trigger_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_trigger trigger_row
    JOIN pg_class relation ON relation.oid=trigger_row.tgrelid
    JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
    WHERE namespace.nspname=expected.schema_name AND relation.relname=expected.table_name
      AND trigger_row.tgname=expected.trigger_name AND NOT trigger_row.tgisinternal
  );
  IF missing<>0 THEN
    RAISE EXCEPTION '0030 required integrity triggers missing: %',missing;
  END IF;

  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_integration','webhook_subscription','webhook_subscription_secret_version_ck'),
    ('core_integration','webhook_subscription','webhook_subscription_verified_active_ck'),
    ('core_integration','webhook_subscription','webhook_subscription_filter_object_ck')
  ) expected(schema_name,table_name,constraint_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_constraint constraint_row
    JOIN pg_class relation ON relation.oid=constraint_row.conrelid
    JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
    WHERE namespace.nspname=expected.schema_name AND relation.relname=expected.table_name
      AND constraint_row.conname=expected.constraint_name AND constraint_row.contype='c'
  );
  IF missing<>0 THEN
    RAISE EXCEPTION '0030 webhook activation constraints missing: %',missing;
  END IF;
END $$;

DO $$
DECLARE
  bad_partitions integer;
BEGIN
  SELECT count(*) INTO bad_partitions
  FROM pg_inherits inheritance
  JOIN pg_class parent ON parent.oid=inheritance.inhparent
  JOIN pg_namespace parent_namespace ON parent_namespace.oid=parent.relnamespace
  JOIN pg_class child ON child.oid=inheritance.inhrelid
  JOIN pg_namespace child_namespace ON child_namespace.oid=child.relnamespace
  WHERE (parent_namespace.nspname,parent.relname) IN (
    ('core_audit','audit_event'),('core_integration','outbox_event')
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_policies policy
    WHERE policy.schemaname=child_namespace.nspname AND policy.tablename=child.relname
      AND policy.policyname=CASE parent.relname
        WHEN 'audit_event' THEN 'audit_event_context_policy'
        ELSE 'outbox_event_context_policy' END
      AND (COALESCE(policy.qual,'')||COALESCE(policy.with_check,'')) LIKE
        CASE parent.relname WHEN 'audit_event' THEN '%audit_row_visible%'
          ELSE '%outbox_row_visible%' END
  );
  IF bad_partitions<>0 THEN
    RAISE EXCEPTION '0030 exact-scope policy missing from % evidence partitions',bad_partitions;
  END IF;
END $$;

BEGIN;
INSERT INTO platform_directory.data_home
  (id,code,region_code,jurisdiction_code,topology_class,status,routing_version,metadata_json)
VALUES ('30000000-0000-0000-0000-000000000001','V30','R','J','TEST','ACTIVE',1,'{}');
INSERT INTO core_tenancy.tenant
  (id,tenant_code,legal_name,display_name,status,primary_industry_code,data_home_id,residency_region_code,created_at,updated_at)
VALUES
('30000000-0000-0000-0000-000000000011','V30-A','A','A','PROVISIONING','EDU','30000000-0000-0000-0000-000000000001','R',now(),now()),
('30000000-0000-0000-0000-000000000012','V30-B','B','B','PROVISIONING','HLT','30000000-0000-0000-0000-000000000001','R',now(),now());
INSERT INTO core_tenancy.industry_context
  (id,tenant_id,industry_code,status,is_primary,activation_version,created_at,updated_at)
VALUES
('30000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000011','EDU','ACTIVE',true,1,now(),now()),
('30000000-0000-0000-0000-000000000022','30000000-0000-0000-0000-000000000011','RTL','ACTIVE',false,1,now(),now()),
('30000000-0000-0000-0000-000000000023','30000000-0000-0000-0000-000000000012','HLT','ACTIVE',true,1,now(),now());
INSERT INTO core_identity.platform_principal
  (id,principal_type,status,display_name,auth_epoch,created_at,updated_at)
VALUES
('30000000-0000-0000-0000-000000000031','HUMAN','ACTIVE','A',1,now(),now()),
('30000000-0000-0000-0000-000000000032','HUMAN','ACTIVE','B',1,now(),now());
INSERT INTO core_identity.tenant_membership
  (id,tenant_id,principal_id,status,membership_version,created_at,updated_at)
VALUES
('30000000-0000-0000-0000-000000000041','30000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000031','ACTIVE',1,now(),now()),
('30000000-0000-0000-0000-000000000042','30000000-0000-0000-0000-000000000012','30000000-0000-0000-0000-000000000032','ACTIVE',1,now(),now());
UPDATE core_tenancy.tenant SET status='ACTIVE' WHERE id IN (
  '30000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000012'
);
SET CONSTRAINTS ALL IMMEDIATE;

INSERT INTO core_commercial.commercial_route_policy
  (id,code,self_serve_enabled,sales_assisted_enabled,market_scope_json,approval_required,version,status,created_at)
VALUES ('30000000-0000-0000-0000-000000000051','V30',true,false,'{}',false,1,'ACTIVE',now());
INSERT INTO core_commercial.plan (id,code,name,status,created_at,updated_at)
VALUES ('30000000-0000-0000-0000-000000000052','V30','V30','ACTIVE',now(),now());
INSERT INTO core_commercial.plan_version
  (id,plan_id,version_no,status,route_policy_id,entitlement_template_json,limit_set_json,
   billing_policy_json,support_class,published_at,created_by,created_at)
VALUES
  ('30000000-0000-0000-0000-000000000053','30000000-0000-0000-0000-000000000052',1,'ACTIVE',
   '30000000-0000-0000-0000-000000000051','{}','{}','{}','TEST',now(),
   '30000000-0000-0000-0000-000000000031',now());
INSERT INTO core_commercial.subscription
  (id,tenant_id,plan_version_id,state,auto_renew,billing_timezone,version,created_at,updated_at)
VALUES
  ('30000000-0000-0000-0000-000000000054','30000000-0000-0000-0000-000000000011',
   '30000000-0000-0000-0000-000000000053','ACTIVE',true,'UTC',1,now(),now());

DO $$ BEGIN
  BEGIN
    INSERT INTO core_commercial.subscription_transition
      (id,tenant_id,subscription_id,to_state,trigger_code,occurred_at,correlation_id)
    VALUES ('30000000-0000-0000-0000-000000000055','30000000-0000-0000-0000-000000000012',
      '30000000-0000-0000-0000-000000000054','ACTIVE','ATTACK',now(),
      '30000000-0000-0000-0000-000000000056');
    RAISE EXCEPTION 'expected cross-tenant subscription rejection';
  EXCEPTION WHEN foreign_key_violation THEN NULL; END;
END $$;

INSERT INTO core_authz.role_template
  (id,code,owner_scope,tenant_id,industry_context_id,industry_code,name,immutable_seed,version,status,created_at,updated_at)
VALUES
  ('30000000-0000-0000-0000-000000000061','V30','INDUSTRY','30000000-0000-0000-0000-000000000011',
   '30000000-0000-0000-0000-000000000021','EDU','V30',false,1,'ACTIVE',now(),now());
DO $$ BEGIN
  BEGIN
    INSERT INTO core_authz.role_assignment
      (id,tenant_id,industry_context_id,membership_id,principal_id,role_id,status,created_by,created_at)
    VALUES ('30000000-0000-0000-0000-000000000062','30000000-0000-0000-0000-000000000011',
      '30000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000042',
      '30000000-0000-0000-0000-000000000032','30000000-0000-0000-0000-000000000061','ACTIVE',
      '30000000-0000-0000-0000-000000000031',now());
    RAISE EXCEPTION 'expected foreign membership rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

DO $$ BEGIN
  BEGIN
    INSERT INTO core_identity.api_credential
      (id,tenant_id,principal_id,key_prefix,secret_hash,status,allowed_industry_context_ids,credential_version,created_at)
    VALUES ('30000000-0000-0000-0000-000000000063','30000000-0000-0000-0000-000000000011',
      '30000000-0000-0000-0000-000000000031','V30','HASH','ACTIVE',
      ARRAY['30000000-0000-0000-0000-000000000023'::uuid],1,now());
    RAISE EXCEPTION 'expected API cross-tenant allowed-context rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

DO $$ BEGIN
  BEGIN
    INSERT INTO core_config.data_export_request
      (id,tenant_id,requester_principal_id,scope_class,export_type,requested_resource_classes,
       residency_policy_version,sensitivity_ceiling,status,created_at,updated_at)
    VALUES ('30000000-0000-0000-0000-000000000064','30000000-0000-0000-0000-000000000011',
      '30000000-0000-0000-0000-000000000031','TENANT_INDUSTRY','TENANT_EXPORT',ARRAY['TEST'],
      'R','INTERNAL','REQUESTED',now(),now());
    RAISE EXCEPTION 'expected null-industry export rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

INSERT INTO core_integration.credential_reference
  (id,tenant_id,secret_store_provider,secret_reference,credential_type,key_version,status,created_at)
VALUES
('30000000-0000-0000-0000-000000000071','30000000-0000-0000-0000-000000000011','TEST','A','TEST',1,'ACTIVE',now()),
('30000000-0000-0000-0000-000000000072','30000000-0000-0000-0000-000000000012','TEST','B','TEST',1,'ACTIVE',now());
INSERT INTO core_integration.integration_definition
  (id,code,name,provider_family,adapter_contract_version,owner_scope,status,data_transfer_class,created_at,updated_at)
VALUES ('30000000-0000-0000-0000-000000000073','V30','V30','TEST','1','PLATFORM','ACTIVE','TEST',now(),now());
DO $$ BEGIN
  BEGIN
    INSERT INTO core_integration.tenant_integration
      (id,tenant_id,integration_definition_id,scope_class,display_name,status,credential_reference_id,
       version,created_at,updated_at)
    VALUES ('30000000-0000-0000-0000-000000000074','30000000-0000-0000-0000-000000000011',
      '30000000-0000-0000-0000-000000000073','TENANT_CORE','V30','ACTIVE',
      '30000000-0000-0000-0000-000000000072',1,now(),now());
    RAISE EXCEPTION 'expected cross-tenant integration credential rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

INSERT INTO core_integration.event_catalog
  (event_type,event_version,producer_module,scope_class,payload_schema_json,sensitivity_class,
   consumer_classes_json,retention_audit_posture,webhook_eligible,backward_compatibility,status,created_at)
VALUES ('v30.event',1,'V30','TENANT_INDUSTRY','{}','INTERNAL','[]','TEST',true,'COMPATIBLE','ACTIVE',now());
INSERT INTO core_integration.outbox_event_identity(id,created_at) VALUES
('30000000-0000-0000-0000-000000000081',now()),
('30000000-0000-0000-0000-000000000082',now()),
('30000000-0000-0000-0000-000000000087',now());
INSERT INTO core_integration.outbox_event
  (id,tenant_id,industry_context_id,scope_class,event_type,event_version,aggregate_type,aggregate_id,
   envelope_jsonb,status,available_at,created_at)
SELECT identity_row.id,'30000000-0000-0000-0000-000000000011',context_row.context_id,
  'TENANT_INDUSTRY','v30.event',1,'TEST',identity_row.id::text,
  jsonb_build_object('eventId',identity_row.id,'eventType','v30.event','eventVersion',1,
    'scopeClass','TENANT_INDUSTRY','tenantId','30000000-0000-0000-0000-000000000011',
    'industryContextId',context_row.context_id,'actorType','HUMAN','sourceModule','V30',
    'sourceResourceType','TEST','sourceResourceId',identity_row.id,'correlationId',identity_row.id,
    'occurredAt',identity_row.created_at,'dataSensitivity','INTERNAL','residencyRegion','R',
    'payloadSchema','v30.test/1','payload',jsonb_build_object('test',true)),
  'PENDING',identity_row.created_at,identity_row.created_at
FROM (VALUES
  ('30000000-0000-0000-0000-000000000081'::uuid,'30000000-0000-0000-0000-000000000021'::uuid),
  ('30000000-0000-0000-0000-000000000082'::uuid,'30000000-0000-0000-0000-000000000022'::uuid)
) context_row(event_id,context_id)
JOIN core_integration.outbox_event_identity identity_row ON identity_row.id=context_row.event_id;

DO $$ BEGIN
  BEGIN
    INSERT INTO core_integration.outbox_event
      (id,tenant_id,industry_context_id,scope_class,event_type,event_version,aggregate_type,aggregate_id,
       envelope_jsonb,status,available_at,created_at)
    SELECT id,'30000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000021',
      'TENANT_INDUSTRY','v30.event',1,'TEST',id::text,
      jsonb_build_object('eventId',id,'eventType','v30.event','eventVersion',1,
        'scopeClass','TENANT_INDUSTRY','tenantId','30000000-0000-0000-0000-000000000011',
        'industryContextId','30000000-0000-0000-0000-000000000021'),
      'PENDING',created_at,created_at
    FROM core_integration.outbox_event_identity
    WHERE id='30000000-0000-0000-0000-000000000087';
    RAISE EXCEPTION 'expected incomplete outbox envelope rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

DO $$ BEGIN
  BEGIN
    INSERT INTO core_integration.webhook_subscription
      (id,tenant_id,name,endpoint_url,status,allowed_industry_context_ids,created_by,created_at,updated_at)
    VALUES ('30000000-0000-0000-0000-000000000088','30000000-0000-0000-0000-000000000011',
      'UNVERIFIED','https://example.invalid','ACTIVE',ARRAY['30000000-0000-0000-0000-000000000021'::uuid],
      '30000000-0000-0000-0000-000000000031',now(),now());
    RAISE EXCEPTION 'expected unverified ACTIVE webhook rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

DO $$ BEGIN
  BEGIN
    INSERT INTO core_integration.webhook_subscription
      (id,tenant_id,name,endpoint_url,status,allowed_industry_context_ids,created_by,verified_at,created_at,updated_at)
    VALUES ('30000000-0000-0000-0000-000000000083','30000000-0000-0000-0000-000000000011',
      'BAD','https://example.invalid','ACTIVE',ARRAY['30000000-0000-0000-0000-000000000023'::uuid],
      '30000000-0000-0000-0000-000000000031',now(),now(),now());
    RAISE EXCEPTION 'expected webhook cross-tenant allowlist rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
INSERT INTO core_integration.webhook_subscription
  (id,tenant_id,name,endpoint_url,status,allowed_industry_context_ids,created_by,verified_at,created_at,updated_at)
VALUES ('30000000-0000-0000-0000-000000000084','30000000-0000-0000-0000-000000000011',
  'GOOD','https://example.invalid','ACTIVE',ARRAY['30000000-0000-0000-0000-000000000021'::uuid],
  '30000000-0000-0000-0000-000000000031',now(),now(),now());
INSERT INTO core_integration.webhook_delivery_identity
  (id,created_at,subscription_id,event_id,attempt_no)
VALUES ('30000000-0000-0000-0000-000000000085',now(),
  '30000000-0000-0000-0000-000000000084','30000000-0000-0000-0000-000000000082',1);
DO $$ BEGIN
  BEGIN
    INSERT INTO core_integration.webhook_delivery
      (id,subscription_id,event_id,attempt_no,endpoint_snapshot,payload_digest,status,started_at,correlation_id,created_at)
    SELECT id,subscription_id,event_id,attempt_no,'https://example.invalid','HASH','QUEUED',created_at,
      '30000000-0000-0000-0000-000000000086',created_at
    FROM core_integration.webhook_delivery_identity
    WHERE id='30000000-0000-0000-0000-000000000085';
    RAISE EXCEPTION 'expected webhook sibling-context rejection';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

SET LOCAL ROLE sbg_app_rw;
SELECT set_config('app.tenant_id','30000000-0000-0000-0000-000000000011',true);
SELECT set_config('app.industry_context_id','30000000-0000-0000-0000-000000000021',true);
SELECT set_config('app.principal_id','30000000-0000-0000-0000-000000000031',true);
SELECT set_config('app.scope_class','TENANT_INDUSTRY',true);
DO $$
DECLARE visible_events integer;
BEGIN
  SELECT count(*) INTO visible_events FROM core_integration.outbox_event WHERE event_type='v30.event';
  IF visible_events<>1 THEN
    RAISE EXCEPTION '0030 exact outbox RLS expected 1 row, saw %',visible_events;
  END IF;
  IF NOT core_audit.audit_row_visible(
    'EXPLICIT_CROSS_CONTEXT','30000000-0000-0000-0000-000000000011',NULL,
    '30000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000022'
  ) OR core_audit.audit_row_visible(
    'EXPLICIT_CROSS_CONTEXT','30000000-0000-0000-0000-000000000012',NULL,
    '30000000-0000-0000-0000-000000000023','30000000-0000-0000-0000-000000000023'
  ) THEN
    RAISE EXCEPTION '0030 cross-context audit visibility predicate failed closed test';
  END IF;
END $$;
RESET ROLE;
ROLLBACK;
