-- SBGlobal Plus — Verification 0048: definition scope predicates are total/fail-closed

DO $$
DECLARE
  tenant_a uuid := '48000000-0000-4000-8000-000000000001';
  tenant_b uuid := '48000000-0000-4000-8000-000000000002';
  industry_a uuid := '48000000-0000-4000-8000-000000000011';
  industry_b uuid := '48000000-0000-4000-8000-000000000012';
BEGIN
  IF core_tenancy.definition_applies_to_scope(
    'PLATFORM',NULL,NULL,tenant_a,NULL
  ) IS DISTINCT FROM true THEN
    RAISE EXCEPTION '0048 PLATFORM definition must apply to Tenant-Core target';
  END IF;

  IF core_tenancy.definition_applies_to_scope(
    'PLATFORM',NULL,NULL,tenant_a,industry_a
  ) IS DISTINCT FROM true THEN
    RAISE EXCEPTION '0048 PLATFORM definition must apply to Tenant-Industry target';
  END IF;

  IF core_tenancy.definition_applies_to_scope(
    'TENANT',tenant_a,NULL,tenant_a,NULL
  ) IS DISTINCT FROM true OR core_tenancy.definition_applies_to_scope(
    'TENANT',tenant_a,NULL,tenant_a,industry_a
  ) IS DISTINCT FROM true THEN
    RAISE EXCEPTION '0048 same-Tenant definition applicability regressed';
  END IF;

  IF core_tenancy.definition_applies_to_scope(
    'TENANT',tenant_a,NULL,tenant_b,NULL
  ) IS DISTINCT FROM false THEN
    RAISE EXCEPTION '0048 foreign-Tenant definition applicability must be false';
  END IF;

  IF core_tenancy.definition_applies_to_scope(
    'INDUSTRY',tenant_a,industry_a,tenant_a,industry_a
  ) IS DISTINCT FROM true THEN
    RAISE EXCEPTION '0048 exact Industry definition applicability must be true';
  END IF;

  IF core_tenancy.definition_applies_to_scope(
    'INDUSTRY',tenant_a,industry_a,tenant_a,industry_b
  ) IS DISTINCT FROM false THEN
    RAISE EXCEPTION '0048 sibling Industry definition applicability must be false';
  END IF;

  IF core_tenancy.definition_applies_to_scope(
    'INDUSTRY',tenant_a,industry_a,tenant_a,NULL
  ) IS DISTINCT FROM false THEN
    RAISE EXCEPTION '0048 Industry definition must not apply to Tenant-Core target';
  END IF;

  IF core_tenancy.definition_contains_definition(
    'INDUSTRY',tenant_a,industry_a,'TENANT',tenant_a,NULL
  ) IS DISTINCT FROM false THEN
    RAISE EXCEPTION '0048 Industry parent must not contain broader Tenant definition';
  END IF;

  IF core_tenancy.definition_applies_to_scope(
    NULL,NULL,NULL,tenant_a,NULL
  ) IS DISTINCT FROM false
  OR core_tenancy.definition_applies_to_scope(
    'TENANT',NULL,NULL,tenant_a,NULL
  ) IS DISTINCT FROM false
  OR core_tenancy.definition_applies_to_scope(
    'INDUSTRY',tenant_a,NULL,tenant_a,industry_a
  ) IS DISTINCT FROM false THEN
    RAISE EXCEPTION '0048 malformed/null definition scope inputs must fail closed';
  END IF;
END $$;

DO $$
DECLARE
  tenant_a uuid := '48000000-0000-4000-8000-000000000001';
  industry_a uuid := '48000000-0000-4000-8000-000000000011';
BEGIN
  IF NOT core_tenancy.definition_applies_to_scope(
    'INDUSTRY',tenant_a,industry_a,tenant_a,NULL
  ) THEN
    NULL;
  ELSE
    RAISE EXCEPTION '0048 trigger-style NOT predicate must reject Industry-to-Tenant-Core';
  END IF;
END $$;

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='core_tenancy'
    AND p.proname IN ('definition_applies_to_scope','definition_contains_definition')
    AND p.provolatile<>'i';
  IF bad<>0 THEN
    RAISE EXCEPTION '0048 definition scope helpers must remain IMMUTABLE';
  END IF;

  SELECT count(*) INTO bad
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid=p.pronamespace
  CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) acl
  WHERE n.nspname='core_tenancy'
    AND p.proname IN ('definition_applies_to_scope','definition_contains_definition')
    AND acl.grantee=0
    AND acl.privilege_type='EXECUTE';
  IF bad<>0 THEN
    RAISE EXCEPTION '0048 definition scope helpers must not be executable by PUBLIC';
  END IF;
END $$;
