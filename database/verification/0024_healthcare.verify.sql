-- SBGlobal Plus — Verification 0024: Healthcare suite database wave

DO $$
DECLARE missing integer;
BEGIN
 SELECT count(*) INTO missing
 FROM (VALUES
 ('hlt_hms_encounter','HLT-HMS'),
 ('hlt_hms_admission','HLT-HMS'),
 ('hlt_hms_bed','HLT-HMS'),
 ('hlt_hms_bed_transfer','HLT-HMS'),
 ('hlt_hms_order','HLT-HMS'),
 ('hlt_hms_nursing_observation','HLT-HMS'),
 ('hlt_hms_ot_case','HLT-HMS'),
 ('hlt_hms_discharge_summary','HLT-HMS'),
 ('hlt_lis_order','HLT-LIS'),
 ('hlt_lis_order_test','HLT-LIS'),
 ('hlt_lis_specimen','HLT-LIS'),
 ('hlt_lis_rejection','HLT-LIS'),
 ('hlt_lis_result','HLT-LIS'),
 ('hlt_lis_critical_alert','HLT-LIS'),
 ('hlt_lis_delta_check','HLT-LIS'),
 ('hlt_lis_report','HLT-LIS'),
 ('hlt_lis_test_catalog','HLT-LIS'),
 ('hlt_ris_order','HLT-RIS'),
 ('hlt_ris_appointment','HLT-RIS'),
 ('hlt_ris_contrast_screen','HLT-RIS'),
 ('hlt_ris_exam','HLT-RIS'),
 ('hlt_ris_report','HLT-RIS'),
 ('hlt_ris_critical_finding','HLT-RIS'),
 ('hlt_pms_prescription','HLT-PMS'),
 ('hlt_pms_prescription_line','HLT-PMS'),
 ('hlt_pms_batch','HLT-PMS'),
 ('hlt_pms_dispense','HLT-PMS'),
 ('hlt_pms_dispense_line','HLT-PMS'),
 ('hlt_pms_controlled_register','HLT-PMS'),
 ('hlt_pms_recall','HLT-PMS'),
 ('hlt_pms_indent','HLT-PMS'),
 ('hlt_cms_appointment','HLT-CMS'),
 ('hlt_cms_encounter','HLT-CMS'),
 ('hlt_cms_procedure','HLT-CMS'),
 ('hlt_cms_referral','HLT-CMS'),
 ('hlt_cms_followup','HLT-CMS'),
 ('hlt_cms_teleconsult','HLT-CMS')
 ) AS expected(table_name,owner_module)
 WHERE NOT EXISTS (
  SELECT 1 FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  JOIN core_authz.rls_table_registry r ON r.schema_name=n.nspname AND r.table_name=c.relname
  WHERE n.nspname='ind_hlt'
    AND c.relname=expected.table_name
    AND c.relrowsecurity AND c.relforcerowsecurity
    AND r.scope_class='TENANT_INDUSTRY'
    AND r.owner_module=expected.owner_module
    AND r.status='ACTIVE'
 );
 IF missing<>0 THEN RAISE EXCEPTION 'Healthcare RLS/MS registry coverage missing: %',missing; END IF;
END $$;

DO $$
DECLARE bad integer;
BEGIN
 SELECT count(*) INTO bad
 FROM information_schema.columns c
 WHERE c.table_schema='ind_hlt'
   AND c.table_name IN ('hlt_hms_encounter','hlt_hms_admission','hlt_hms_bed','hlt_hms_bed_transfer','hlt_hms_order','hlt_hms_nursing_observation','hlt_hms_ot_case','hlt_hms_discharge_summary','hlt_lis_order','hlt_lis_order_test','hlt_lis_specimen','hlt_lis_rejection','hlt_lis_result','hlt_lis_critical_alert','hlt_lis_delta_check','hlt_lis_report','hlt_lis_test_catalog','hlt_ris_order','hlt_ris_appointment','hlt_ris_contrast_screen','hlt_ris_exam','hlt_ris_report','hlt_ris_critical_finding','hlt_pms_prescription','hlt_pms_prescription_line','hlt_pms_batch','hlt_pms_dispense','hlt_pms_dispense_line','hlt_pms_controlled_register','hlt_pms_recall','hlt_pms_indent','hlt_cms_appointment','hlt_cms_encounter','hlt_cms_procedure','hlt_cms_referral','hlt_cms_followup','hlt_cms_teleconsult')
   AND c.column_name IN ('tenant_id','industry_context_id')
   AND c.is_nullable<>'NO';
 IF bad<>0 THEN RAISE EXCEPTION 'Healthcare ownership columns must be NOT NULL: %',bad; END IF;
END $$;

DO $$
DECLARE ms_count integer; table_count integer;
BEGIN
 SELECT count(DISTINCT owner_module),count(*)
 INTO ms_count,table_count
 FROM core_authz.rls_table_registry
 WHERE schema_name='ind_hlt' AND status='ACTIVE';
 IF ms_count<>5 THEN RAISE EXCEPTION 'Expected 5 Healthcare canonical MS owners, found %',ms_count; END IF;
 IF table_count<>37 THEN RAISE EXCEPTION 'Expected 37 Healthcare canonical tables, found %',table_count; END IF;
END $$;

DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='ind_hlt' AND indexname='hlt_hms_one_active_bed_idx')
 THEN RAISE EXCEPTION 'HMS one-active-bed invariant missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='ind_hlt' AND tablename='hlt_lis_specimen' AND indexdef LIKE '%barcode_value%')
 THEN RAISE EXCEPTION 'LIS scoped barcode uniqueness missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='ind_hlt' AND indexname='hlt_pms_recall_active_uq')
 THEN RAISE EXCEPTION 'PMS active recall uniqueness missing'; END IF;
END $$;

DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint c
   JOIN pg_class t ON t.oid=c.conrelid
   JOIN pg_namespace n ON n.oid=t.relnamespace
   WHERE n.nspname='ind_hlt' AND t.relname='hlt_cms_encounter'
     AND c.contype='c' AND pg_get_constraintdef(c.oid) LIKE '%signed_at%'
 ) THEN RAISE EXCEPTION 'CMS signed encounter evidence constraint missing'; END IF;
 IF NOT EXISTS (
   SELECT 1 FROM pg_indexes
   WHERE schemaname='ind_hlt' AND tablename='hlt_lis_report'
     AND indexdef LIKE '%order_id%version_no%'
 ) THEN RAISE EXCEPTION 'LIS report version uniqueness missing'; END IF;
END $$;
