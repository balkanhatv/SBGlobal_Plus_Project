-- SBGlobal Plus — Verification 0034: PLATFORM_GLOBAL identity/API-credential scope floor
BEGIN;

INSERT INTO core_identity.platform_principal
(id,principal_type,status,display_name,auth_epoch,service_code,owning_module,allowed_scope_classes,created_at,updated_at)
VALUES
('34000000-0000-0000-0000-000000000001','HUMAN','ACTIVE','tenant-human',1,NULL,NULL,NULL,now(),now()),
('34000000-0000-0000-0000-000000000002','API_CLIENT','ACTIVE','api-client',1,NULL,NULL,NULL,now(),now()),
('34000000-0000-0000-0000-000000000003','SERVICE','ACTIVE','platform-service',1,'PLATFORM-SVC','Core',ARRAY['PLATFORM_GLOBAL'],now(),now()),
('34000000-0000-0000-0000-000000000004','SERVICE','ACTIVE','tenant-only-service',1,'TENANT-SVC','Core',ARRAY['TENANT_CORE'],now(),now()),
('34000000-0000-0000-0000-000000000005','PLATFORM_OPERATOR','ACTIVE','operator',1,NULL,NULL,NULL,now(),now());

DO $$
BEGIN
  BEGIN
    INSERT INTO core_identity.api_credential
    (id,tenant_id,principal_id,key_prefix,secret_hash,status,allowed_industry_context_ids,credential_version,created_at)
    VALUES ('34000000-0000-0000-0000-000000000011',NULL,'34000000-0000-0000-0000-000000000001',
      'V34-H','HASH','ACTIVE','{}',1,now());
    RAISE EXCEPTION 'global HUMAN credential unexpectedly accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  BEGIN
    INSERT INTO core_identity.api_credential
    (id,tenant_id,principal_id,key_prefix,secret_hash,status,allowed_industry_context_ids,credential_version,created_at)
    VALUES ('34000000-0000-0000-0000-000000000012',NULL,'34000000-0000-0000-0000-000000000002',
      'V34-A','HASH','ACTIVE','{}',1,now());
    RAISE EXCEPTION 'global API_CLIENT credential unexpectedly accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  BEGIN
    INSERT INTO core_identity.api_credential
    (id,tenant_id,principal_id,key_prefix,secret_hash,status,allowed_industry_context_ids,credential_version,created_at)
    VALUES ('34000000-0000-0000-0000-000000000013',NULL,'34000000-0000-0000-0000-000000000004',
      'V34-T','HASH','ACTIVE','{}',1,now());
    RAISE EXCEPTION 'non-global SERVICE credential unexpectedly accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;

  BEGIN
    INSERT INTO core_identity.api_credential
    (id,tenant_id,principal_id,key_prefix,secret_hash,status,allowed_industry_context_ids,credential_version,created_at)
    VALUES ('34000000-0000-0000-0000-000000000014',NULL,'34000000-0000-0000-0000-000000000005',
      'V34-O','HASH','ACTIVE','{}',1,now());
    RAISE EXCEPTION 'PLATFORM_OPERATOR API credential unexpectedly accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;

INSERT INTO core_identity.api_credential
(id,tenant_id,principal_id,key_prefix,secret_hash,status,allowed_industry_context_ids,credential_version,created_at)
VALUES ('34000000-0000-0000-0000-000000000015',NULL,'34000000-0000-0000-0000-000000000003',
  'V34-S','HASH','ACTIVE','{}',1,now());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM core_identity.api_credential
    WHERE id='34000000-0000-0000-0000-000000000015'
      AND tenant_id IS NULL AND status='ACTIVE'
  ) THEN
    RAISE EXCEPTION 'allowlisted platform SERVICE credential was not persisted';
  END IF;
END $$;

ROLLBACK;
