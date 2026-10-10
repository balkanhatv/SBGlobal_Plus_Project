-- SBGlobal Plus — Migration 0015: Education Industry database wave
-- Canonical MS: EDU-SMS, EDU-CUM, EDU-CTM, EDU-LMS, EDU-EMS
BEGIN;

CREATE OR REPLACE FUNCTION core_tenancy.industry_row_visible(p_tenant_id uuid, p_industry_context_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT p_tenant_id = core_tenancy.current_tenant_id()
     AND p_industry_context_id = core_tenancy.current_industry_context_id()
$$;

CREATE TYPE ind_edu.sms_student_status AS ENUM ('APPLICANT','ENROLLED','ACTIVE','TRANSFERRED','GRADUATED','WITHDRAWN');
CREATE TYPE ind_edu.sms_admission_state AS ENUM ('ENQUIRY','APPLICATION','VERIFICATION','ASSESSMENT','OFFERED','WAITLISTED','ENROLLED','REJECTED','WITHDRAWN');
CREATE TYPE ind_edu.sms_class_section_status AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE ind_edu.sms_attendance_state AS ENUM ('PRESENT','ABSENT','LATE','EXCUSED');

CREATE TYPE ind_edu.cum_program_status AS ENUM ('ACTIVE','INACTIVE');
CREATE TYPE ind_edu.cum_enrollment_state AS ENUM ('APPLIED','VERIFIED','ADMITTED','REGISTERED','ACTIVE','COMPLETED','WITHDRAWN');
CREATE TYPE ind_edu.cum_course_offering_status AS ENUM ('PLANNED','OPEN','CLOSED');

CREATE TYPE ind_edu.ctm_enquiry_state AS ENUM ('NEW','CONTACTED','COUNSELING','DEMO','OFFERED','CONVERTED','LOST');
CREATE TYPE ind_edu.ctm_enrollment_state AS ENUM ('OFFERED','ENROLLED','ATTENDING','COMPLETED','DROPPED');
CREATE TYPE ind_edu.ctm_batch_state AS ENUM ('PLANNED','OPEN','RUNNING','COMPLETED','MERGED');

CREATE TYPE ind_edu.lms_course_state AS ENUM ('DRAFT','REVIEW','PUBLISHED','RETIRED');
CREATE TYPE ind_edu.lms_enrollment_state AS ENUM ('ENROLLED','IN_PROGRESS','COMPLETED','DROPPED');
CREATE TYPE ind_edu.lms_item_type AS ENUM ('CONTENT','ASSIGNMENT','QUIZ');
CREATE TYPE ind_edu.lms_grade_state AS ENUM ('SUBMITTED','GRADING','GRADED','RETURNED');

CREATE TYPE ind_edu.ems_exam_state AS ENUM ('DRAFT','SCHEDULED','CONDUCTED','EVALUATING','MODERATION','APPROVED','PUBLISHED','CLOSED');
CREATE TYPE ind_edu.ems_evaluation_state AS ENUM ('DRAFT','SUBMITTED','MODERATED','FINAL');
CREATE TYPE ind_edu.ems_result_state AS ENUM ('PREPARED','APPROVED','PUBLISHED','SUPERSEDED');

CREATE TABLE ind_edu.edu_sms_admission (
  id uuid PRIMARY KEY,
  application_no text NOT NULL,
  applicant_name text NOT NULL,
  class_id uuid NOT NULL,
  source text,
  state ind_edu.sms_admission_state NOT NULL,
  submitted_at timestamptz NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id, industry_context_id, application_no)
);
CREATE INDEX edu_sms_admission_class_idx ON ind_edu.edu_sms_admission(tenant_id,industry_context_id,class_id);

CREATE TABLE ind_edu.edu_sms_class_section (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL,
  class_code text NOT NULL,
  section_code text NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  homeroom_principal_id uuid,
  status ind_edu.sms_class_section_status NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,session_id,class_code,section_code)
);
CREATE INDEX edu_sms_class_section_active_idx ON ind_edu.edu_sms_class_section(tenant_id,industry_context_id,updated_at) WHERE deleted_at IS NULL;

CREATE TABLE ind_edu.edu_sms_student (
  id uuid PRIMARY KEY,
  student_no text NOT NULL,
  principal_id uuid,
  admission_id uuid,
  class_id uuid,
  section_id uuid,
  guardian_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  status ind_edu.sms_student_status NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,student_no),
  FOREIGN KEY (tenant_id,industry_context_id,admission_id)
    REFERENCES ind_edu.edu_sms_admission(tenant_id,industry_context_id,id)
);
CREATE INDEX edu_sms_student_status_idx ON ind_edu.edu_sms_student(tenant_id,industry_context_id,status,updated_at);

CREATE TABLE ind_edu.edu_sms_attendance (
  id uuid PRIMARY KEY,
  student_id uuid NOT NULL,
  attendance_date date NOT NULL,
  period_code text,
  state ind_edu.sms_attendance_state NOT NULL,
  marked_by uuid NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,student_id,attendance_date,period_code),
  FOREIGN KEY (tenant_id,industry_context_id,student_id)
    REFERENCES ind_edu.edu_sms_student(tenant_id,industry_context_id,id)
);

CREATE TABLE ind_edu.edu_cum_program (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  name text NOT NULL,
  department_id uuid NOT NULL,
  level text NOT NULL,
  duration_terms integer NOT NULL CHECK (duration_terms > 0),
  status ind_edu.cum_program_status NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,code)
);
CREATE INDEX edu_cum_program_status_idx ON ind_edu.edu_cum_program(tenant_id,industry_context_id,status,updated_at);

CREATE TABLE ind_edu.edu_cum_enrollment (
  id uuid PRIMARY KEY,
  student_ref uuid NOT NULL,
  program_id uuid NOT NULL,
  term_id uuid NOT NULL,
  enrollment_no text NOT NULL,
  state ind_edu.cum_enrollment_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,enrollment_no),
  FOREIGN KEY (tenant_id,industry_context_id,program_id)
    REFERENCES ind_edu.edu_cum_program(tenant_id,industry_context_id,id)
);
CREATE INDEX edu_cum_enrollment_student_idx ON ind_edu.edu_cum_enrollment(tenant_id,industry_context_id,student_ref);

CREATE TABLE ind_edu.edu_cum_course_offering (
  id uuid PRIMARY KEY,
  course_code text NOT NULL,
  term_id uuid NOT NULL,
  faculty_principal_id uuid,
  capacity integer NOT NULL CHECK (capacity > 0),
  credits numeric NOT NULL CHECK (credits >= 0),
  status ind_edu.cum_course_offering_status NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,term_id,course_code)
);
CREATE INDEX edu_cum_course_offering_active_idx ON ind_edu.edu_cum_course_offering(tenant_id,industry_context_id,updated_at) WHERE deleted_at IS NULL;

CREATE TABLE ind_edu.edu_cum_progress (
  id uuid PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  term_id uuid NOT NULL,
  credits_attempted numeric NOT NULL CHECK (credits_attempted >= 0),
  credits_earned numeric NOT NULL CHECK (credits_earned >= 0),
  gpa numeric,
  standing text NOT NULL,
  finalized_at timestamptz,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,enrollment_id,term_id),
  FOREIGN KEY (tenant_id,industry_context_id,enrollment_id)
    REFERENCES ind_edu.edu_cum_enrollment(tenant_id,industry_context_id,id)
);

CREATE TABLE ind_edu.edu_ctm_batch (
  id uuid PRIMARY KEY,
  course_code text NOT NULL,
  trainer_id uuid NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  state ind_edu.ctm_batch_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  CHECK (end_at > start_at)
);
CREATE INDEX edu_ctm_batch_state_idx ON ind_edu.edu_ctm_batch(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_edu.edu_ctm_enquiry (
  id uuid PRIMARY KEY,
  enquiry_no text NOT NULL,
  source text NOT NULL,
  counselor_id uuid,
  prospect_name text NOT NULL,
  state ind_edu.ctm_enquiry_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,enquiry_no)
);
CREATE INDEX edu_ctm_enquiry_state_idx ON ind_edu.edu_ctm_enquiry(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_edu.edu_ctm_enrollment (
  id uuid PRIMARY KEY,
  student_ref uuid NOT NULL,
  batch_id uuid NOT NULL,
  fee_plan_ref uuid,
  state ind_edu.ctm_enrollment_state NOT NULL,
  enrolled_at timestamptz NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,student_ref,batch_id),
  FOREIGN KEY (tenant_id,industry_context_id,batch_id)
    REFERENCES ind_edu.edu_ctm_batch(tenant_id,industry_context_id,id)
);
CREATE INDEX edu_ctm_enrollment_student_idx ON ind_edu.edu_ctm_enrollment(tenant_id,industry_context_id,student_ref);

CREATE TABLE ind_edu.edu_ctm_completion (
  id uuid PRIMARY KEY,
  enrollment_id uuid NOT NULL,
  attendance_percent numeric NOT NULL CHECK (attendance_percent >= 0 AND attendance_percent <= 100),
  assessment_status text NOT NULL,
  eligible boolean NOT NULL,
  certificate_document_id uuid,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,enrollment_id),
  FOREIGN KEY (tenant_id,industry_context_id,enrollment_id)
    REFERENCES ind_edu.edu_ctm_enrollment(tenant_id,industry_context_id,id)
);

CREATE TABLE ind_edu.edu_lms_course (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  title text NOT NULL,
  owner_principal_id uuid NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  state ind_edu.lms_course_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,code,version)
);
CREATE INDEX edu_lms_course_state_idx ON ind_edu.edu_lms_course(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_edu.edu_lms_enrollment (
  id uuid PRIMARY KEY,
  course_id uuid NOT NULL,
  learner_principal_id uuid NOT NULL,
  state ind_edu.lms_enrollment_state NOT NULL,
  progress_percent numeric NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,course_id,learner_principal_id),
  FOREIGN KEY (tenant_id,industry_context_id,course_id)
    REFERENCES ind_edu.edu_lms_course(tenant_id,industry_context_id,id)
);
CREATE INDEX edu_lms_enrollment_course_idx ON ind_edu.edu_lms_enrollment(tenant_id,industry_context_id,course_id);

CREATE TABLE ind_edu.edu_lms_item (
  id uuid PRIMARY KEY,
  course_id uuid NOT NULL,
  item_type ind_edu.lms_item_type NOT NULL,
  sequence_no integer NOT NULL CHECK (sequence_no >= 0),
  title text NOT NULL,
  document_id uuid,
  max_score numeric CHECK (max_score IS NULL OR max_score >= 0),

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,course_id,sequence_no),
  FOREIGN KEY (tenant_id,industry_context_id,course_id)
    REFERENCES ind_edu.edu_lms_course(tenant_id,industry_context_id,id)
);
CREATE INDEX edu_lms_item_active_idx ON ind_edu.edu_lms_item(tenant_id,industry_context_id,updated_at) WHERE deleted_at IS NULL;

CREATE TABLE ind_edu.edu_lms_submission (
  id uuid PRIMARY KEY,
  item_id uuid NOT NULL,
  learner_principal_id uuid NOT NULL,
  attempt_no integer NOT NULL CHECK (attempt_no > 0),
  document_id uuid,
  score numeric CHECK (score IS NULL OR score >= 0),
  grade_state ind_edu.lms_grade_state NOT NULL,
  graded_by uuid,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,item_id,learner_principal_id,attempt_no),
  FOREIGN KEY (tenant_id,industry_context_id,item_id)
    REFERENCES ind_edu.edu_lms_item(tenant_id,industry_context_id,id)
);

CREATE TABLE ind_edu.edu_ems_exam (
  id uuid PRIMARY KEY,
  code text NOT NULL,
  term_ref uuid NOT NULL,
  type text NOT NULL,
  state ind_edu.ems_exam_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,code)
);
CREATE INDEX edu_ems_exam_state_idx ON ind_edu.edu_ems_exam(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_edu.edu_ems_candidate (
  id uuid PRIMARY KEY,
  exam_id uuid NOT NULL,
  student_ref uuid NOT NULL,
  eligible boolean NOT NULL,
  hold_reason_code text,
  hold_note text,
  hall_ticket_document_id uuid,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,exam_id,student_ref),
  FOREIGN KEY (tenant_id,industry_context_id,exam_id)
    REFERENCES ind_edu.edu_ems_exam(tenant_id,industry_context_id,id)
);
CREATE INDEX edu_ems_candidate_exam_idx ON ind_edu.edu_ems_candidate(tenant_id,industry_context_id,exam_id);

CREATE TABLE ind_edu.edu_ems_evaluation (
  id uuid PRIMARY KEY,
  exam_id uuid NOT NULL,
  student_ref uuid NOT NULL,
  subject_code text NOT NULL,
  evaluator_id uuid NOT NULL,
  marks numeric NOT NULL,
  state ind_edu.ems_evaluation_state NOT NULL,
  version integer NOT NULL CHECK (version > 0),

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,exam_id,student_ref,subject_code,version),
  FOREIGN KEY (tenant_id,industry_context_id,exam_id)
    REFERENCES ind_edu.edu_ems_exam(tenant_id,industry_context_id,id)
);
CREATE INDEX edu_ems_evaluation_state_idx ON ind_edu.edu_ems_evaluation(tenant_id,industry_context_id,state,updated_at);

CREATE TABLE ind_edu.edu_ems_result (
  id uuid PRIMARY KEY,
  exam_id uuid NOT NULL,
  approval_ref uuid NOT NULL,
  publication_version integer NOT NULL CHECK (publication_version > 0),
  published_at timestamptz,
  result_document_ref uuid,
  state ind_edu.ems_result_state NOT NULL,

  tenant_id uuid NOT NULL REFERENCES core_tenancy.tenant(id),
  industry_context_id uuid NOT NULL,
  row_version bigint NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL,
  created_by uuid,
  updated_at timestamptz NOT NULL,
  updated_by uuid,
  deleted_at timestamptz,
  deleted_by uuid,
  is_demo boolean NOT NULL DEFAULT false,
  FOREIGN KEY (tenant_id, industry_context_id)
    REFERENCES core_tenancy.industry_context(tenant_id, id),
  UNIQUE (tenant_id, industry_context_id, id),
  UNIQUE (tenant_id,industry_context_id,exam_id,publication_version),
  FOREIGN KEY (tenant_id,industry_context_id,exam_id)
    REFERENCES ind_edu.edu_ems_exam(tenant_id,industry_context_id,id)
);


ALTER TABLE ind_edu.edu_sms_admission ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_sms_admission FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_sms_admission_industry_policy ON ind_edu.edu_sms_admission
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_sms_class_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_sms_class_section FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_sms_class_section_industry_policy ON ind_edu.edu_sms_class_section
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_sms_student ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_sms_student FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_sms_student_industry_policy ON ind_edu.edu_sms_student
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_sms_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_sms_attendance FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_sms_attendance_industry_policy ON ind_edu.edu_sms_attendance
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_cum_program ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_cum_program FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_cum_program_industry_policy ON ind_edu.edu_cum_program
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_cum_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_cum_enrollment FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_cum_enrollment_industry_policy ON ind_edu.edu_cum_enrollment
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_cum_course_offering ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_cum_course_offering FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_cum_course_offering_industry_policy ON ind_edu.edu_cum_course_offering
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_cum_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_cum_progress FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_cum_progress_industry_policy ON ind_edu.edu_cum_progress
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_ctm_batch ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_ctm_batch FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_ctm_batch_industry_policy ON ind_edu.edu_ctm_batch
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_ctm_enquiry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_ctm_enquiry FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_ctm_enquiry_industry_policy ON ind_edu.edu_ctm_enquiry
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_ctm_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_ctm_enrollment FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_ctm_enrollment_industry_policy ON ind_edu.edu_ctm_enrollment
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_ctm_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_ctm_completion FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_ctm_completion_industry_policy ON ind_edu.edu_ctm_completion
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_lms_course ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_lms_course FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_lms_course_industry_policy ON ind_edu.edu_lms_course
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_lms_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_lms_enrollment FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_lms_enrollment_industry_policy ON ind_edu.edu_lms_enrollment
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_lms_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_lms_item FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_lms_item_industry_policy ON ind_edu.edu_lms_item
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_lms_submission ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_lms_submission FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_lms_submission_industry_policy ON ind_edu.edu_lms_submission
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_ems_exam ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_ems_exam FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_ems_exam_industry_policy ON ind_edu.edu_ems_exam
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_ems_candidate ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_ems_candidate FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_ems_candidate_industry_policy ON ind_edu.edu_ems_candidate
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_ems_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_ems_evaluation FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_ems_evaluation_industry_policy ON ind_edu.edu_ems_evaluation
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

ALTER TABLE ind_edu.edu_ems_result ENABLE ROW LEVEL SECURITY;
ALTER TABLE ind_edu.edu_ems_result FORCE ROW LEVEL SECURITY;
CREATE POLICY edu_ems_result_industry_policy ON ind_edu.edu_ems_result
  USING (core_tenancy.industry_row_visible(tenant_id,industry_context_id))
  WITH CHECK (core_tenancy.industry_row_visible(tenant_id,industry_context_id));

INSERT INTO core_authz.rls_table_registry
(schema_name,table_name,scope_class,policy_class,owner_module,force_rls_required,registered_at)
VALUES
('ind_edu','edu_sms_admission','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-SMS',true,now()),
('ind_edu','edu_sms_class_section','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-SMS',true,now()),
('ind_edu','edu_sms_student','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-SMS',true,now()),
('ind_edu','edu_sms_attendance','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-SMS',true,now()),
('ind_edu','edu_cum_program','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-CUM',true,now()),
('ind_edu','edu_cum_enrollment','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-CUM',true,now()),
('ind_edu','edu_cum_course_offering','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-CUM',true,now()),
('ind_edu','edu_cum_progress','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-CUM',true,now()),
('ind_edu','edu_ctm_batch','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-CTM',true,now()),
('ind_edu','edu_ctm_enquiry','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-CTM',true,now()),
('ind_edu','edu_ctm_enrollment','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-CTM',true,now()),
('ind_edu','edu_ctm_completion','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-CTM',true,now()),
('ind_edu','edu_lms_course','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-LMS',true,now()),
('ind_edu','edu_lms_enrollment','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-LMS',true,now()),
('ind_edu','edu_lms_item','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-LMS',true,now()),
('ind_edu','edu_lms_submission','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-LMS',true,now()),
('ind_edu','edu_ems_exam','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-EMS',true,now()),
('ind_edu','edu_ems_candidate','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-EMS',true,now()),
('ind_edu','edu_ems_evaluation','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-EMS',true,now()),
('ind_edu','edu_ems_result','TENANT_INDUSTRY','RLS-INDUSTRY-READ/WRITE','EDU-EMS',true,now());

COMMIT;
