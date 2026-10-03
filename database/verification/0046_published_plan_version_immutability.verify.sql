-- Real control-plane writes, not only trigger/privilege metadata checks.
BEGIN;

INSERT INTO core_identity.platform_principal
(id,principal_type,status,created_at,updated_at)
VALUES ('46000000-0000-4000-8000-000000000001','HUMAN','ACTIVE',now(),now());

INSERT INTO core_commercial.commercial_route_policy
(id,code,self_serve_enabled,sales_assisted_enabled,version,status,created_at)
VALUES ('46000000-0000-4000-8000-000000000002','V46-ROUTE',true,false,1,'ACTIVE',now());

INSERT INTO core_commercial.plan
(id,code,name,status,created_at,updated_at)
VALUES ('46000000-0000-4000-8000-000000000003','V46-PLAN','V46 Plan','ACTIVE',now(),now());

SET LOCAL ROLE sbg_control_plane_rw;

INSERT INTO core_commercial.plan_version
(id,plan_id,version_no,status,route_policy_id,entitlement_template_json,limit_set_json,
 trial_policy_json,billing_policy_json,support_class,created_by,created_at)
VALUES
('46000000-0000-4000-8000-000000000004','46000000-0000-4000-8000-000000000003',1,'DRAFT',
 '46000000-0000-4000-8000-000000000002','{"schemaVersion":1,"facts":[]}',
 '{"schemaVersion":1,"limits":[]}',NULL,'{}','DRAFT',
 '46000000-0000-4000-8000-000000000001',now());

DO $$
DECLARE mutation text; actual_message text; before_payload jsonb; changed integer;
BEGIN
  UPDATE core_commercial.plan_version SET support_class='EDITED_DRAFT'
  WHERE id='46000000-0000-4000-8000-000000000004';
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed<>1 THEN RAISE EXCEPTION '0046 draft edit did not execute'; END IF;

  UPDATE core_commercial.plan_version SET status='ACTIVE',published_at=now()
  WHERE id='46000000-0000-4000-8000-000000000004';
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed<>1 THEN RAISE EXCEPTION '0046 draft publication did not execute'; END IF;

  SELECT to_jsonb(version)-'status' INTO STRICT before_payload
  FROM core_commercial.plan_version version
  WHERE id='46000000-0000-4000-8000-000000000004';

  FOREACH mutation IN ARRAY ARRAY[
    'entitlement_template_json = ''{"changed":true}''::jsonb',
    'limit_set_json = ''{"changed":true}''::jsonb',
    'trial_policy_json = ''{"changed":true}''::jsonb',
    'billing_policy_json = ''{"changed":true}''::jsonb',
    'support_class = ''REWRITTEN''',
    'effective_from = now()-interval ''1 day''',
    'effective_to = now()+interval ''1 day''',
    'published_at = NULL',
    'created_at = created_at-interval ''1 day''',
    'version_no = version_no+1',
    'plan_id = ''46000000-0000-4000-8000-000000000099''::uuid',
    'route_policy_id = ''46000000-0000-4000-8000-000000000099''::uuid',
    'created_by = ''46000000-0000-4000-8000-000000000099''::uuid',
    'id = ''46000000-0000-4000-8000-000000000099''::uuid',
    'status = ''DRAFT''',
    'status = ''RETIRED'', support_class = ''REWRITTEN'''
  ] LOOP
    BEGIN
      EXECUTE 'UPDATE core_commercial.plan_version SET '||mutation||
        ' WHERE id=''46000000-0000-4000-8000-000000000004''';
      RAISE EXCEPTION '0046 published mutation unexpectedly succeeded: %',mutation;
    EXCEPTION WHEN check_violation THEN
      GET STACKED DIAGNOSTICS actual_message=MESSAGE_TEXT;
      IF actual_message<>'published PlanVersion content is immutable; publish a new version' THEN
        RAISE EXCEPTION '0046 mutation failed for the wrong reason: %',actual_message;
      END IF;
    END;
  END LOOP;

  -- Retirement is permitted without altering any pinned commercial content.
  UPDATE core_commercial.plan_version SET status='RETIRED'
  WHERE id='46000000-0000-4000-8000-000000000004';
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed<>1 THEN RAISE EXCEPTION '0046 retirement did not execute'; END IF;
  IF (SELECT to_jsonb(version)-'status' FROM core_commercial.plan_version version
      WHERE id='46000000-0000-4000-8000-000000000004') IS DISTINCT FROM before_payload THEN
    RAISE EXCEPTION '0046 retirement changed published content';
  END IF;

  BEGIN
    UPDATE core_commercial.plan_version SET status='DRAFT',published_at=NULL
    WHERE id='46000000-0000-4000-8000-000000000004';
    RAISE EXCEPTION '0046 retired version was reopened for editing';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE core_commercial.plan_version SET billing_policy_json='{"changed":true}'
    WHERE id='46000000-0000-4000-8000-000000000004';
    RAISE EXCEPTION '0046 retired content was rewritten';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    DELETE FROM core_commercial.plan_version
    WHERE id='46000000-0000-4000-8000-000000000004';
    RAISE EXCEPTION '0046 runtime erased PlanVersion history';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;

  -- Publishing a successor remains possible; the previous version stays pinned.
  INSERT INTO core_commercial.plan_version
  (id,plan_id,version_no,status,route_policy_id,entitlement_template_json,limit_set_json,
   billing_policy_json,support_class,published_at,created_by,created_at)
  SELECT '46000000-0000-4000-8000-000000000005',plan_id,2,'ACTIVE',route_policy_id,
         entitlement_template_json,limit_set_json,billing_policy_json,'SUCCESSOR',now(),created_by,now()
  FROM core_commercial.plan_version WHERE id='46000000-0000-4000-8000-000000000004';
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed<>1 THEN RAISE EXCEPTION '0046 successor publication did not execute'; END IF;
END $$;

RESET ROLE;
DO $$
DECLARE runtime_role text;
BEGIN
  FOR runtime_role IN SELECT rolname FROM pg_roles
    WHERE left(rolname,4)='sbg_' AND rolname<>'sbg_migration_admin'
  LOOP
    IF has_table_privilege(runtime_role,'core_commercial.plan_version','DELETE')
       OR has_table_privilege(runtime_role,'core_commercial.plan_version','TRUNCATE') THEN
      RAISE EXCEPTION '0046 runtime role retains PlanVersion deletion: %',runtime_role;
    END IF;
  END LOOP;
END $$;
ROLLBACK;
