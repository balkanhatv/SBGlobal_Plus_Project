-- SBGlobal Plus — Verification 0036: PLATFORM_GLOBAL ABAC mutation requires Control Plane.

DO $$
DECLARE policy_count integer;
BEGIN
  SELECT count(*) INTO policy_count
  FROM pg_policy policy
  JOIN pg_class relation ON relation.oid=policy.polrelid
  JOIN pg_namespace namespace ON namespace.oid=relation.relnamespace
  WHERE namespace.nspname='core_authz'
    AND relation.relname='abac_policy'
    AND NOT policy.polpermissive
    AND policy.polname IN (
      'abac_policy_platform_insert_floor',
      'abac_policy_platform_update_floor',
      'abac_policy_platform_delete_floor'
    );

  IF policy_count <> 3 THEN
    RAISE EXCEPTION 'expected three restrictive PLATFORM_GLOBAL ABAC write-floor policies, found %', policy_count;
  END IF;

  IF NOT has_table_privilege('sbg_control_plane_rw','core_authz.abac_policy','SELECT,INSERT,UPDATE,DELETE') THEN
    RAISE EXCEPTION 'Control Plane must own ABAC policy lifecycle privileges';
  END IF;
END $$;

BEGIN;

INSERT INTO core_authz.abac_policy (
  id,code,tenant_id,industry_context_id,applies_to_permission_pattern,priority,effect,
  expression_version,expression_ast_json,valid_from,valid_until,status,created_at,updated_at
) VALUES (
  '36000000-0000-0000-0000-000000000001',
  'verify.platform.abac.floor',
  NULL,
  NULL,
  'core.identity.role.assign',
  100,
  'DENY',
  1,
  '{"op":"exists","attribute":"subject.principalId"}'::jsonb,
  NULL,
  NULL,
  'ACTIVE',
  now(),
  now()
);

SET LOCAL ROLE sbg_app_rw;
SELECT set_config('app.scope_class','PLATFORM_GLOBAL',true);
SELECT set_config('app.tenant_id','',true);
SELECT set_config('app.industry_context_id','',true);

DO $$
BEGIN
  BEGIN
    INSERT INTO core_authz.abac_policy (
      id,code,tenant_id,industry_context_id,applies_to_permission_pattern,priority,effect,
      expression_version,expression_ast_json,valid_from,valid_until,status,created_at,updated_at
    ) VALUES (
      '36000000-0000-0000-0000-000000000002',
      'verify.platform.abac.forbidden.insert',
      NULL,
      NULL,
      'core.identity.role.assign',
      100,
      'DENY',
      1,
      '{"op":"exists","attribute":"subject.principalId"}'::jsonb,
      NULL,
      NULL,
      'ACTIVE',
      now(),
      now()
    );
    RAISE EXCEPTION 'sbg_app_rw unexpectedly inserted a PLATFORM_GLOBAL ABAC policy';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END $$;

DO $$
DECLARE affected bigint;
BEGIN
  UPDATE core_authz.abac_policy
  SET priority=999
  WHERE id='36000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN
    RAISE EXCEPTION 'sbg_app_rw unexpectedly updated a PLATFORM_GLOBAL ABAC policy';
  END IF;

  DELETE FROM core_authz.abac_policy
  WHERE id='36000000-0000-0000-0000-000000000001';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN
    RAISE EXCEPTION 'sbg_app_rw unexpectedly deleted a PLATFORM_GLOBAL ABAC policy';
  END IF;
END $$;

RESET ROLE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM core_authz.abac_policy
    WHERE id='36000000-0000-0000-0000-000000000001'
      AND priority=100
  ) THEN
    RAISE EXCEPTION 'PLATFORM_GLOBAL ABAC fixture was unexpectedly mutated';
  END IF;
END $$;

ROLLBACK;
