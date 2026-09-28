-- Current-state adversarial correction: DD-037 / DEV-DB-AC-010 / DBA-010.
-- A PLATFORM_GLOBAL context selector alone must not authorize catalog mutation.
BEGIN;

DO $$
DECLARE target record;
BEGIN
  FOR target IN
    SELECT n.nspname AS schema_name,c.relname AS table_name
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid AND a.attname='owner_scope'
      AND a.attnum>0 AND NOT a.attisdropped
    WHERE c.relkind='r' AND NOT c.relispartition AND left(n.nspname,5)='core_'
  LOOP
    -- Restrictive policies intersect the existing permissive scope policies.
    -- They never grant visibility or replace Tenant/Industry checks.
    EXECUTE format('CREATE POLICY platform_definition_insert_floor ON %I.%I AS RESTRICTIVE FOR INSERT WITH CHECK (owner_scope <> ''PLATFORM'' OR current_user = ''sbg_control_plane_rw'')',target.schema_name,target.table_name);
    EXECUTE format('CREATE POLICY platform_definition_update_floor ON %I.%I AS RESTRICTIVE FOR UPDATE USING (owner_scope <> ''PLATFORM'' OR current_user = ''sbg_control_plane_rw'') WITH CHECK (owner_scope <> ''PLATFORM'' OR current_user = ''sbg_control_plane_rw'')',target.schema_name,target.table_name);
    EXECUTE format('CREATE POLICY platform_definition_delete_floor ON %I.%I AS RESTRICTIVE FOR DELETE USING (owner_scope <> ''PLATFORM'' OR current_user = ''sbg_control_plane_rw'')',target.schema_name,target.table_name);
    EXECUTE format('GRANT USAGE ON SCHEMA %I TO sbg_control_plane_rw',target.schema_name);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I.%I TO sbg_control_plane_rw',target.schema_name,target.table_name);
  END LOOP;
END $$;

-- Parent-owned children cannot be used to mutate a protected platform definition.
DO $$
DECLARE target record; predicate text;
BEGIN
  FOR target IN SELECT * FROM (VALUES
    ('core_config','form_field_definition','form_definition','form_definition_id'),
    ('core_authz','role_permission','role_template','role_id'),
    ('core_ai','ai_tool_set_member','ai_tool_set','tool_set_id'),
    ('core_ai','ai_prompt_set_member','ai_prompt_set','prompt_set_id')
  ) AS item(schema_name,table_name,parent_name,parent_key)
  LOOP
    predicate:=format('EXISTS (SELECT 1 FROM %I.%I parent WHERE parent.id=%I.%I AND (parent.owner_scope <> ''PLATFORM'' OR current_user=''sbg_control_plane_rw''))',target.schema_name,target.parent_name,target.table_name,target.parent_key);
    EXECUTE format('CREATE POLICY platform_parent_insert_floor ON %I.%I AS RESTRICTIVE FOR INSERT WITH CHECK (%s)',target.schema_name,target.table_name,predicate);
    EXECUTE format('CREATE POLICY platform_parent_update_floor ON %I.%I AS RESTRICTIVE FOR UPDATE USING (%s) WITH CHECK (%s)',target.schema_name,target.table_name,predicate,predicate);
    EXECUTE format('CREATE POLICY platform_parent_delete_floor ON %I.%I AS RESTRICTIVE FOR DELETE USING (%s)',target.schema_name,target.table_name,predicate);
    EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON %I.%I TO sbg_control_plane_rw',target.schema_name,target.table_name);
  END LOOP;
END $$;
COMMIT;
