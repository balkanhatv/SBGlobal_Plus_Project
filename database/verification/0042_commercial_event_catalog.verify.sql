-- SBGlobal Plus — Verification 0042: Commercial event catalog v1

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM (VALUES
    ('subscription.transitioned',1,'subscriptionId'),
    ('entitlement.recompiled',1,'tenantId')
  ) AS expected(event_type,event_version,ordering_key)
  LEFT JOIN core_integration.event_catalog catalog
    ON catalog.event_type=expected.event_type
   AND catalog.event_version=expected.event_version
  WHERE catalog.event_type IS NULL
     OR catalog.producer_module <> 'Commercial'
     OR catalog.scope_class <> 'TENANT_CORE'
     OR catalog.sensitivity_class <> 'INTERNAL'
     OR catalog.ordering_key <> expected.ordering_key
     OR catalog.webhook_eligible
     OR catalog.backward_compatibility <> 'V1_ADDITIVE_ONLY'
     OR catalog.status <> 'ACTIVE'
     OR catalog.payload_schema_json->>'type' <> 'object'
     OR catalog.payload_schema_json->>'additionalProperties' <> 'false';

  IF bad <> 0 THEN
    RAISE EXCEPTION 'Commercial event catalog v1 metadata mismatch: %', bad;
  END IF;
END $$;

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('subscription.transitioned','transitionId'),
    ('subscription.transitioned','subscriptionId'),
    ('subscription.transitioned','fromState'),
    ('subscription.transitioned','toState'),
    ('subscription.transitioned','fromPlanVersionId'),
    ('subscription.transitioned','toPlanVersionId'),
    ('subscription.transitioned','subscriptionVersion'),
    ('subscription.transitioned','triggerCode'),
    ('subscription.transitioned','effectiveAt'),
    ('entitlement.recompiled','snapshotId'),
    ('entitlement.recompiled','snapshotVersion'),
    ('entitlement.recompiled','sourceSubscriptionId'),
    ('entitlement.recompiled','sourcePlanVersionId'),
    ('entitlement.recompiled','validFrom')
  ) AS required_field(event_type,field_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM core_integration.event_catalog catalog,
         jsonb_array_elements_text(catalog.payload_schema_json->'required') required(value)
    WHERE catalog.event_type=required_field.event_type
      AND catalog.event_version=1
      AND required.value=required_field.field_name
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Commercial event required payload fields missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  leaked integer;
BEGIN
  SELECT count(*) INTO leaked
  FROM core_integration.event_catalog catalog
  WHERE catalog.event_type IN ('subscription.transitioned','entitlement.recompiled')
    AND catalog.event_version=1
    AND lower(catalog.payload_schema_json::text)
      ~ '(payment|card|token|secret|price|amount|approvalpayload|entitlementfacts|denyset|licenseids)';

  IF leaked <> 0 THEN
    RAISE EXCEPTION 'Commercial event payload schema contains prohibited sensitive/financial detail';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT has_table_privilege('sbg_app_rw','core_integration.event_catalog','SELECT') THEN
    RAISE EXCEPTION 'sbg_app_rw must retain read-only event catalog access';
  END IF;

  IF has_table_privilege('sbg_app_rw','core_integration.event_catalog','INSERT')
     OR has_table_privilege('sbg_app_rw','core_integration.event_catalog','UPDATE')
     OR has_table_privilege('sbg_app_rw','core_integration.event_catalog','DELETE') THEN
    RAISE EXCEPTION 'sbg_app_rw must not mutate event catalog';
  END IF;
END $$;
