-- SBGlobal Plus — Follow-up migration 0002
-- Parent-aware RLS for form_field_definition.
BEGIN;

ALTER TABLE core_config.form_field_definition ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_config.form_field_definition FORCE ROW LEVEL SECURITY;

CREATE POLICY form_field_definition_parent_context_policy
ON core_config.form_field_definition
USING (
  EXISTS (
    SELECT 1
    FROM core_config.form_definition parent
    WHERE parent.id = form_definition_id
      AND core_config.row_visible_to_current_context(
        parent.owner_scope,
        parent.tenant_id,
        parent.industry_context_id
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM core_config.form_definition parent
    WHERE parent.id = form_definition_id
      AND core_config.row_visible_to_current_context(
        parent.owner_scope,
        parent.tenant_id,
        parent.industry_context_id
      )
  )
);

COMMIT;
