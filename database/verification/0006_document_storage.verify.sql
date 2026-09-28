-- SBGlobal Plus — Verification 0006: Document & Storage

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('document_meta'),
    ('document_upload_session'),
    ('document_acl')
  ) AS expected(table_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='core_document'
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Expected forced RLS missing on % document tables', missing;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema='core_document'
      AND table_name='share_grant'
  ) THEN
    RAISE EXCEPTION 'External anonymous/public ShareGrant must not exist in current DD';
  END IF;
END $$;

DO $$
DECLARE
  public_privileges integer;
BEGIN
  SELECT count(*) INTO public_privileges
  FROM information_schema.role_table_grants
  WHERE table_schema='core_document'
    AND table_name='storage_object'
    AND grantee='PUBLIC';

  IF public_privileges <> 0 THEN
    RAISE EXCEPTION 'PUBLIC must have no privileges on storage_object';
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    INSERT INTO core_document.document_meta (
      id, tenant_id, industry_context_id, scope_class,
      source_module, source_resource_type, source_resource_id,
      filename_display, media_type, size_bytes, checksum_sha256,
      storage_object_id, sensitivity_class, retention_class,
      residency_region, status, virus_scan_status, version_no,
      is_demo, row_version, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000001001',
      '00000000-0000-0000-0000-000000001002',
      NULL,
      'TENANT_INDUSTRY',
      'verification',
      'verification',
      'verification',
      'verification.txt',
      'text/plain',
      0,
      repeat('0',64),
      '00000000-0000-0000-0000-000000001003',
      'INTERNAL',
      'OPERATIONAL_STANDARD',
      'test-region',
      'UPLOADING',
      'PENDING',
      1,
      false,
      1,
      now(),
      now()
    );
    RAISE EXCEPTION 'TENANT_INDUSTRY document without industry_context_id must be rejected';
  EXCEPTION
    WHEN check_violation THEN NULL;
    WHEN foreign_key_violation THEN NULL;
    WHEN insufficient_privilege THEN NULL;
  END;
END $$;
