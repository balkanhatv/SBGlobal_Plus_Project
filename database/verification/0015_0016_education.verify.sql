-- SBGlobal Plus — Verification 0015-0016: Education suite database wave

DO $$
DECLARE
  missing integer;
BEGIN
  SELECT count(*) INTO missing
  FROM (VALUES
    ('edu_sms_admission','EDU-SMS'),('edu_sms_class_section','EDU-SMS'),('edu_sms_student','EDU-SMS'),('edu_sms_attendance','EDU-SMS'),
    ('edu_cum_program','EDU-CUM'),('edu_cum_enrollment','EDU-CUM'),('edu_cum_course_offering','EDU-CUM'),('edu_cum_progress','EDU-CUM'),
    ('edu_ctm_batch','EDU-CTM'),('edu_ctm_enquiry','EDU-CTM'),('edu_ctm_enrollment','EDU-CTM'),('edu_ctm_completion','EDU-CTM'),
    ('edu_lms_course','EDU-LMS'),('edu_lms_enrollment','EDU-LMS'),('edu_lms_item','EDU-LMS'),('edu_lms_submission','EDU-LMS'),
    ('edu_ems_exam','EDU-EMS'),('edu_ems_candidate','EDU-EMS'),('edu_ems_evaluation','EDU-EMS'),('edu_ems_result','EDU-EMS')
  ) AS expected(table_name,owner_module)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN core_authz.rls_table_registry r
      ON r.schema_name=n.nspname AND r.table_name=c.relname
    WHERE n.nspname='ind_edu'
      AND c.relname=expected.table_name
      AND c.relrowsecurity
      AND c.relforcerowsecurity
      AND r.scope_class='TENANT_INDUSTRY'
      AND r.owner_module=expected.owner_module
      AND r.status='ACTIVE'
  );

  IF missing <> 0 THEN
    RAISE EXCEPTION 'Education RLS/MS registry coverage missing: %', missing;
  END IF;
END $$;

DO $$
DECLARE
  bad integer;
BEGIN
  SELECT count(*) INTO bad
  FROM information_schema.columns c
  WHERE c.table_schema='ind_edu'
    AND c.table_name IN (
      'edu_sms_admission','edu_sms_class_section','edu_sms_student','edu_sms_attendance',
      'edu_cum_program','edu_cum_enrollment','edu_cum_course_offering','edu_cum_progress',
      'edu_ctm_batch','edu_ctm_enquiry','edu_ctm_enrollment','edu_ctm_completion',
      'edu_lms_course','edu_lms_enrollment','edu_lms_item','edu_lms_submission',
      'edu_ems_exam','edu_ems_candidate','edu_ems_evaluation','edu_ems_result'
    )
    AND c.column_name IN ('tenant_id','industry_context_id')
    AND c.is_nullable <> 'NO';

  IF bad <> 0 THEN
    RAISE EXCEPTION 'Education ownership columns must be NOT NULL: %', bad;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='ind_edu'
      AND indexname='edu_sms_attendance_scope_day_period_uq'
  ) THEN
    RAISE EXCEPTION 'Education attendance nullable-period uniqueness hardening missing';
  END IF;
END $$;

DO $$
DECLARE
  ms_count integer;
BEGIN
  SELECT count(DISTINCT owner_module) INTO ms_count
  FROM core_authz.rls_table_registry
  WHERE schema_name='ind_edu' AND status='ACTIVE';

  IF ms_count <> 5 THEN
    RAISE EXCEPTION 'Expected 5 Education canonical MS owners, found %', ms_count;
  END IF;
END $$;
