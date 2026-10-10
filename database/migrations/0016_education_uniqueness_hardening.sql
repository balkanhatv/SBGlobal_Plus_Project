-- SBGlobal Plus — Migration 0016: Education attendance uniqueness hardening

ALTER TABLE ind_edu.edu_sms_attendance
  DROP CONSTRAINT IF EXISTS edu_sms_attendance_tenant_id_industry_context_id_student_id_attendance_date_period_code_key;

CREATE UNIQUE INDEX edu_sms_attendance_scope_day_period_uq
  ON ind_edu.edu_sms_attendance(
    tenant_id,
    industry_context_id,
    student_id,
    attendance_date,
    COALESCE(period_code,'')
  );
