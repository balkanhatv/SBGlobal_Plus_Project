-- SBGlobal Plus — Verification 0008: partitioned evidence identity + isolation

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_audit','audit_event'),
    ('core_integration','outbox_event'),
    ('core_integration','webhook_delivery')
  ) AS expected(schema_name, table_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname=expected.schema_name
      AND c.relname=expected.table_name
      AND c.relkind='p'
      AND c.relrowsecurity
      AND c.relforcerowsecurity
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Expected partitioned forced-RLS evidence parents missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_audit','audit_event_identity','audit_event_identity_pkey'),
    ('core_integration','outbox_event_identity','outbox_event_identity_pkey'),
    ('core_integration','webhook_delivery_identity','webhook_delivery_identity_pkey')
  ) AS expected(schema_name, table_name, constraint_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname=expected.schema_name
      AND t.relname=expected.table_name
      AND c.conname=expected.constraint_name
      AND c.contype='p'
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Global evidence identity primary key missing: %', missing;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname='core_integration'
      AND tablename='webhook_delivery_identity'
      AND indexdef LIKE '%subscription_id%event_id%attempt_no%'
  ) THEN
    RAISE EXCEPTION 'Webhook attempt global idempotency constraint/index missing';
  END IF;
END $$;

DO $$
DECLARE
  month_key text := to_char(date_trunc('month', current_date), 'YYYYMM');
  next_key text := to_char(date_trunc('month', current_date + interval '1 month'), 'YYYYMM');
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_audit','audit_event_' || month_key),
    ('core_integration','outbox_event_' || month_key),
    ('core_integration','webhook_delivery_' || month_key),
    ('core_audit','audit_event_' || next_key),
    ('core_integration','outbox_event_' || next_key),
    ('core_integration','webhook_delivery_' || next_key)
  ) AS expected(schema_name, table_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname=expected.schema_name
      AND c.relname=expected.table_name
      AND c.relispartition
      AND c.relrowsecurity
      AND c.relforcerowsecurity
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Expected current/next forced-RLS monthly partitions missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('core_audit','audit_event'),
    ('core_integration','outbox_event'),
    ('core_integration','webhook_subscription'),
    ('core_integration','webhook_delivery')
  ) AS expected(schema_name, table_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM core_authz.rls_table_registry r
    WHERE r.schema_name=expected.schema_name
      AND r.table_name=expected.table_name
      AND r.status='ACTIVE'
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Evidence table missing from RLS registry: %', missing;
  END IF;
END $$;
