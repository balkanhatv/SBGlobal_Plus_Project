-- Verification 0026-0027: Workflow/Automation/Notification persistence and role boundaries

DO $$
DECLARE missing integer;
BEGIN
 SELECT count(*) INTO missing
 FROM (VALUES
  ('core_workflow','workflow_definition'),
  ('core_workflow','workflow_instance'),
  ('core_workflow','workflow_task'),
  ('core_workflow','workflow_transition'),
  ('core_workflow','automation_definition'),
  ('core_workflow','automation_run'),
  ('core_notification','notification_template'),
  ('core_notification','notification_delivery'),
  ('core_notification','notification_delivery_attempt')
 ) expected(schema_name,table_name)
 WHERE NOT EXISTS (
  SELECT 1 FROM pg_class c
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname=expected.schema_name
    AND c.relname=expected.table_name
    AND c.relrowsecurity AND c.relforcerowsecurity
 );
 IF missing<>0 THEN RAISE EXCEPTION 'Workflow/Notification scoped tables missing forced RLS: %',missing; END IF;
END $$;

DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='core_workflow' AND indexname='workflow_definition_active_uq')
 THEN RAISE EXCEPTION 'Workflow one-ACTIVE-version index missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='core_workflow' AND indexname='automation_definition_active_uq')
 THEN RAISE EXCEPTION 'Automation one-ACTIVE-version index missing'; END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='core_notification' AND indexname='notification_template_active_uq')
 THEN RAISE EXCEPTION 'Notification template one-ACTIVE-version index missing'; END IF;
END $$;

DO $$
BEGIN
 IF has_table_privilege('sbg_app_rw','core_workflow.workflow_transition','UPDATE')
    OR has_table_privilege('sbg_app_rw','core_workflow.workflow_transition','DELETE') THEN
   RAISE EXCEPTION 'Workflow transition evidence must be append-only to application role';
 END IF;

 IF has_table_privilege('sbg_app_rw','core_notification.notification_delivery_attempt','UPDATE')
    OR has_table_privilege('sbg_app_rw','core_notification.notification_delivery_attempt','DELETE') THEN
   RAISE EXCEPTION 'Notification attempt evidence must be append-only to application role';
 END IF;
END $$;

DO $$
DECLARE bad integer;
BEGIN
 SELECT count(*) INTO bad
 FROM pg_roles
 WHERE rolname IN ('sbg_workflow_worker_rw','sbg_notification_worker_rw')
   AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls);
 IF bad<>0 THEN RAISE EXCEPTION 'Workflow/Notification worker roles must remain least-privilege NOBYPASSRLS'; END IF;

 IF has_table_privilege('sbg_notification_worker_rw','core_integration.credential_reference','SELECT') THEN
   RAISE EXCEPTION 'Notification worker must not read Integration CredentialReference';
 END IF;
END $$;

DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_indexes
   WHERE schemaname='core_notification'
     AND tablename='notification_delivery_attempt'
     AND indexdef LIKE '%delivery_id%attempt_no%'
 ) THEN RAISE EXCEPTION 'Notification delivery-attempt uniqueness missing'; END IF;
END $$;
