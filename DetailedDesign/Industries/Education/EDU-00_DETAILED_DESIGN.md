# EDUCATION — MANAGEMENT SYSTEM DETAILED DESIGN
**Wave:** 3 · **Status:** DETAILED DESIGN COMPLETE

## EDU-SMS — School Management System
**Foundation owner:** F-13 §4.1 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** K-12 admission, student registry, classes/sections, attendance, timetable and promotion. Actors: School Admin, Principal, Admissions Officer, Teacher, Fee Clerk, Student, Parent. Modules: admissions; student registry; academic structure; timetable; attendance; promotion; notices.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Student / `edu_sms_student` | student_no text, principal_id uuid?, admission_id uuid?, class_id uuid?, section_id uuid?, guardian_refs jsonb, status enum(APPLICANT,ENROLLED,ACTIVE,TRANSFERRED,GRADUATED,WITHDRAWN) | PK id; UNIQUE (tenant_id, industry_context_id,student_no); INDEX (tenant_id, industry_context_id, status, updated_at) | SENSITIVE_PERSONAL; student-record policy |
| AdmissionApplication / `edu_sms_admission` | application_no text, applicant_name text, class_id uuid, source text?, state enum(ENQUIRY,APPLICATION,VERIFICATION,ASSESSMENT,OFFERED,WAITLISTED,ENROLLED,REJECTED,WITHDRAWN), submitted_at timestamptz | PK id; UNIQUE (tenant_id, industry_context_id,application_no); INDEX (tenant_id, industry_context_id, class_id) | SENSITIVE_PERSONAL; student-record policy |
| ClassSection / `edu_sms_class_section` | session_id uuid, class_code text, section_code text, capacity int CHECK >0, homeroom_principal_id uuid?, status enum(ACTIVE,INACTIVE) | PK id; UNIQUE (tenant_id, industry_context_id,session_id,class_code,section_code); PARTIAL INDEX (tenant_id, industry_context_id, updated_at) WHERE deleted_at IS NULL | INTERNAL/CONFIDENTIAL; policy retention |
| AttendanceEntry / `edu_sms_attendance` | student_id uuid, attendance_date date, period_code text?, state enum(PRESENT,ABSENT,LATE,EXCUSED), marked_by uuid | append-only where history/evidence; UNIQUE (tenant_id, industry_context_id,student_id,attendance_date,period_code) | SENSITIVE_PERSONAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **ENQUIRY → APPLICATION → VERIFICATION → ASSESSMENT → OFFERED → ENROLLED**.  
Invalid transition: any transition not in the MS transition table is rejected with `EDU-SMS_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. WAITLISTED, REJECTED and WITHDRAWN are explicit branches; enrollment requires capacity and required-document checks.

### Business rules / approvals
- **EDU-SMS-R01** Enrollment cannot exceed active class/section capacity; waitlist is offered.
- **EDU-SMS-R02** Attendance below configured threshold creates hold/alert; override requires authorized approval.
- **EDU-SMS-R03** Fee restrictions consume Core Billing policy and never delete academic records.
- **EDU-SMS-R04** Promotion/transfer certificate issuance requires finalized academic status.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`edu.sms.admission.view` · `edu.sms.admission.offer` · `edu.sms.admission.enroll` · `edu.sms.attendance.mark` · `edu.sms.promotion.approve` · `edu.sms.certificate.issue`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: admission form, ID, transfer/leaving certificate, fee receipt references. All use DD-08 DocumentMeta.  
Notifications: admission offer/waitlist, attendance alert, fee reminder, promotion result; sensitive payloads use generic push preview.  
Reports/KPIs: enrollment, attendance %, fee realization, promotion rate; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.edu.sms.admission_view` · `ind.edu.sms.admission_offer` · `ind.edu.sms.admission_enroll` · `ind.edu.sms.attendance_mark` · `ind.edu.sms.promotion_approve`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `edu.sms.admission_view` · `edu.sms.admission_offer` · `edu.sms.admission_enroll`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: LMS/EMS service contracts; payment/communication through Core; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: Education assistant may explain status/summarize attendance and draft notices; cannot enroll/promote autonomously. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/edu/sms` list/detail/workflow/report views. Mobile: teacher attendance + student/parent read views. Desktop: optional admin only.  
Offline class: **CONTROLLED_OFFLINE_MUTATION**. Attendance may queue with version/date validation; admissions/promotions stay online.

### Configuration / entitlement / dependencies / audit
Configuration: session, capacity, attendance threshold, promotion policy. Security floors cannot be overridden.  
Entitlement: suite license + `EDU-SMS` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: EDU-LMS, EDU-EMS, Core Billing/Documents/Communication. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: application→enrollment→attendance→promotion. Negative: capacity overflow and unauthorized promotion rejected. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** full lifecycle audited with certificates and context isolation.

---

## EDU-CUM — College & University Management System
**Foundation owner:** F-13 §4.1 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Higher-education programs, departments, terms, enrollment, attendance and progression. Actors: Institution Admin, Dean/Registrar, Admissions Officer, Faculty, Student, Accountant. Modules: programs/departments; admissions; term registration; course enrollment; timetable; attendance; progression.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Program / `edu_cum_program` | code text, name text, department_id uuid, level text, duration_terms int, status enum(ACTIVE,INACTIVE) | PK id; UNIQUE (tenant_id, industry_context_id,code); INDEX (tenant_id, industry_context_id, status, updated_at) | SENSITIVE_PERSONAL; academic-record policy |
| Enrollment / `edu_cum_enrollment` | student_ref uuid, program_id uuid, term_id uuid, enrollment_no text, state enum(APPLIED,VERIFIED,ADMITTED,REGISTERED,ACTIVE,COMPLETED,WITHDRAWN) | PK id; UNIQUE (tenant_id, industry_context_id,enrollment_no); INDEX (tenant_id, industry_context_id, student_ref) | SENSITIVE_PERSONAL; academic-record policy |
| CourseOffering / `edu_cum_course_offering` | course_code text, term_id uuid, faculty_principal_id uuid?, capacity int, credits numeric, status enum(PLANNED,OPEN,CLOSED) | PK id; UNIQUE (tenant_id, industry_context_id,term_id,course_code); PARTIAL INDEX (tenant_id, industry_context_id, updated_at) WHERE deleted_at IS NULL | INTERNAL/CONFIDENTIAL; policy retention |
| AcademicProgress / `edu_cum_progress` | enrollment_id uuid, term_id uuid, credits_attempted numeric, credits_earned numeric, gpa numeric?, standing text, finalized_at timestamptz? | append-only where history/evidence; UNIQUE (tenant_id, industry_context_id,enrollment_id,term_id) | SENSITIVE_PERSONAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **APPLIED → VERIFIED → ADMITTED → REGISTERED → ACTIVE → COMPLETED**.  
Invalid transition: any transition not in the MS transition table is rejected with `EDU-CUM_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. Term registration and progression are versioned; withdrawal is terminal for the affected enrollment unless governed reinstatement.

### Business rules / approvals
- **EDU-CUM-R01** Program/course capacity enforced before registration.
- **EDU-CUM-R02** Attendance/eligibility policy can hold examination access.
- **EDU-CUM-R03** Progression is calculated only from finalized academic evidence.
- **EDU-CUM-R04** Financial restriction is consumed from Core Billing, not embedded.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`edu.cum.program.manage` · `edu.cum.enrollment.admit` · `edu.cum.term.register` · `edu.cum.attendance.mark` · `edu.cum.progress.finalize` · `edu.cum.record.view`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: application, enrollment statement, academic statement, ID. All use DD-08 DocumentMeta.  
Notifications: admission, timetable, attendance, progression notices; sensitive payloads use generic push preview.  
Reports/KPIs: enrollment, retention, attendance, progression, completion; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.edu.cum.program_manage` · `ind.edu.cum.enrollment_admit` · `ind.edu.cum.term_register` · `ind.edu.cum.attendance_mark` · `ind.edu.cum.progress_finalize`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `edu.cum.program_manage` · `edu.cum.enrollment_admit` · `edu.cum.term_register`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: EMS/LMS and payment/identity adapters; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: Education assistant may summarize program progress and answer policy-grounded questions; cannot alter grades/standing. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/edu/cum` list/detail/workflow/report views. Mobile: faculty attendance + student timetable/progress. Desktop: optional registrar.  
Offline class: **READ_OFFLINE**. Timetable/reference data may cache; academic finalization online.

### Configuration / entitlement / dependencies / audit
Configuration: program/term structures, credit rules, capacity, progression policy. Security floors cannot be overridden.  
Entitlement: suite license + `EDU-CUM` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: EDU-EMS, EDU-LMS, Core Billing/Documents. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: admission→term registration→progression. Negative: over-capacity/invalid standing finalization rejected. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** term lifecycle and official academic record are auditable and isolated.

---

## EDU-CTM — Coaching & Training Management System
**Foundation owner:** F-13 §2.1 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Enquiry-to-completion lifecycle for coaching/training institutes. Actors: Center Admin, Counselor, Trainer, Student, Parent. Modules: enquiry; counseling/demo; courses/batches; enrollment; installments; attendance; tests; completion.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Enquiry / `edu_ctm_enquiry` | enquiry_no text, source text, counselor_id uuid?, prospect_name text, state enum(NEW,CONTACTED,COUNSELING,DEMO,OFFERED,CONVERTED,LOST) | PK id; UNIQUE (tenant_id, industry_context_id,enquiry_no); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL; training-record policy |
| BatchEnrollment / `edu_ctm_enrollment` | student_ref uuid, batch_id uuid, fee_plan_ref uuid?, state enum(OFFERED,ENROLLED,ATTENDING,COMPLETED,DROPPED), enrolled_at timestamptz | PK id; UNIQUE (tenant_id, industry_context_id,student_ref,batch_id); INDEX (tenant_id, industry_context_id, student_ref) | SENSITIVE_PERSONAL; training-record policy |
| TrainingBatch / `edu_ctm_batch` | course_code text, trainer_id uuid, start_at timestamptz, end_at timestamptz, capacity int, state enum(PLANNED,OPEN,RUNNING,COMPLETED,MERGED) | PK id; CHECK capacity>0; PARTIAL INDEX (tenant_id, industry_context_id, state) WHERE state NOT IN ('CLOSED','CANCELLED','RETIRED','EXPIRED','REVOKED','COMPLETED') | INTERNAL/CONFIDENTIAL; policy retention |
| CompletionRecord / `edu_ctm_completion` | enrollment_id uuid, attendance_percent numeric, assessment_status text, eligible boolean, certificate_document_id uuid? | append-only where history/evidence; UNIQUE (tenant_id, industry_context_id,enrollment_id) | SENSITIVE_PERSONAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **NEW → COUNSELING → DEMO → OFFERED → CONVERTED → ENROLLED**.  
Invalid transition: any transition not in the MS transition table is rejected with `EDU-CTM_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. Converted enquiry creates enrollment; batch runs independently PLANNED→OPEN→RUNNING→COMPLETED/MERGED.

### Business rules / approvals
- **EDU-CTM-R01** Enrollment blocked at batch capacity; waitlist may be offered.
- **EDU-CTM-R02** Conversion requires source and counselor attribution.
- **EDU-CTM-R03** Overdue installment follows configured reminder/access-hold policy, never deletion.
- **EDU-CTM-R04** Certificate only when configured attendance and assessment criteria pass.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`edu.ctm.enquiry.manage` · `edu.ctm.batch.manage` · `edu.ctm.enrollment.confirm` · `edu.ctm.attendance.mark` · `edu.ctm.completion.approve` · `edu.ctm.certificate.issue`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: offer, enrollment form, fee receipt reference, completion certificate. All use DD-08 DocumentMeta.  
Notifications: counseling/demo, fee, attendance, batch, certificate; sensitive payloads use generic push preview.  
Reports/KPIs: conversion %, batch fill %, fee realization, completion rate, trainer utilization; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.edu.ctm.enquiry_manage` · `ind.edu.ctm.batch_manage` · `ind.edu.ctm.enrollment_confirm` · `ind.edu.ctm.attendance_mark` · `ind.edu.ctm.completion_approve`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `edu.ctm.enquiry_manage` · `edu.ctm.batch_manage` · `edu.ctm.enrollment_confirm`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: LMS/EMS + Core Billing/Communication; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: assistant may summarize learner progress or draft follow-up; cannot approve certificate. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/edu/ctm` list/detail/workflow/report views. Mobile: trainer attendance + learner course/progress. Desktop: optional center admin.  
Offline class: **CONTROLLED_OFFLINE_MUTATION**. Attendance can queue; enrollment/payment/certificate approval online.

### Configuration / entitlement / dependencies / audit
Configuration: batch capacity, completion thresholds, fee access policy. Security floors cannot be overridden.  
Entitlement: suite license + `EDU-CTM` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: EDU-LMS, EDU-EMS, Core Billing. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: enquiry→enrollment→attendance→completion. Negative: capacity/certificate gate failures. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** conversion attribution, completion evidence and certificate audit are complete.

---

## EDU-LMS — Learning Management System
**Foundation owner:** F-13 §4.1 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Governed course/content delivery, assignments, quizzes, grading and completion. Actors: LMS Admin, Teacher/Trainer, Student. Modules: course authoring; modules/content; enrollment; assignment/quiz; submissions; grading; completion.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Course / `edu_lms_course` | code text, title text, owner_principal_id uuid, version int, state enum(DRAFT,REVIEW,PUBLISHED,RETIRED) | PK id; UNIQUE (tenant_id, industry_context_id,code,version); INDEX (tenant_id, industry_context_id, state, updated_at) | CONFIDENTIAL; learning-record policy |
| CourseEnrollment / `edu_lms_enrollment` | course_id uuid, learner_principal_id uuid, state enum(ENROLLED,IN_PROGRESS,COMPLETED,DROPPED), progress_percent numeric | PK id; UNIQUE (tenant_id, industry_context_id,course_id,learner_principal_id); INDEX (tenant_id, industry_context_id, course_id) | CONFIDENTIAL; learning-record policy |
| LearningItem / `edu_lms_item` | course_id uuid, item_type enum(CONTENT,ASSIGNMENT,QUIZ), sequence_no int, title text, document_id uuid?, max_score numeric? | PK id; UNIQUE (tenant_id, industry_context_id,course_id,sequence_no); PARTIAL INDEX (tenant_id, industry_context_id, updated_at) WHERE deleted_at IS NULL | INTERNAL/CONFIDENTIAL; policy retention |
| SubmissionGrade / `edu_lms_submission` | item_id uuid, learner_principal_id uuid, attempt_no int, document_id uuid?, score numeric?, grade_state enum(SUBMITTED,GRADING,GRADED,RETURNED), graded_by uuid? | append-only where history/evidence; UNIQUE (tenant_id, industry_context_id,item_id,learner_principal_id,attempt_no) | CONFIDENTIAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **DRAFT → REVIEW → PUBLISHED → ENROLLMENT → DELIVERY → COMPLETED**.  
Invalid transition: any transition not in the MS transition table is rejected with `EDU-LMS_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. Course publication requires authorized review; completion certificate derives from immutable completion evidence.

### Business rules / approvals
- **EDU-LMS-R01** Only authorized instructor/admin publishes a course version.
- **EDU-LMS-R02** A published version is not destructively edited; new material uses version/change workflow.
- **EDU-LMS-R03** Submission grading records actor/time and bounded regrade history.
- **EDU-LMS-R04** Completion certificate is versioned if corrected.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`edu.lms.course.author` · `edu.lms.course.publish` · `edu.lms.enrollment.manage` · `edu.lms.submission.grade` · `edu.lms.completion.finalize` · `edu.lms.certificate.issue`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: course materials, assignment briefs, learner submissions, certificate. All use DD-08 DocumentMeta.  
Notifications: publish, due, grade, completion; sensitive payloads use generic push preview.  
Reports/KPIs: completion, engagement, submission %, pass rate; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.edu.lms.course_author` · `ind.edu.lms.course_publish` · `ind.edu.lms.enrollment_manage` · `ind.edu.lms.submission_grade` · `ind.edu.lms.completion_finalize`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `edu.lms.course_author` · `edu.lms.course_publish` · `edu.lms.enrollment_manage`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: SMS/CUM registry and EMS for formal exams; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: learning assistant may summarize authorized content and give formative suggestions; cannot publish official grades. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/edu/lms` list/detail/workflow/report views. Mobile: student content/assignment and teacher review where suitable. Desktop: none required.  
Offline class: **READ_OFFLINE**. Approved content may cache; graded/official submissions require governed sync and are online by default.

### Configuration / entitlement / dependencies / audit
Configuration: completion thresholds, attempt rules, grading schemes. Security floors cannot be overridden.  
Entitlement: suite license + `EDU-LMS` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: EDU-SMS/CUM, EDU-EMS, Core Documents. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: author→publish→enroll→grade→complete. Negative: unauthorized publish and stale-version grading rejected. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** published course and completion evidence are versioned/auditable.

---

## EDU-EMS — Examination Management System
**Foundation owner:** F-13 §4.1 · **Status:** DETAILED DESIGN COMPLETE · **Scope:** TENANT_INDUSTRY

**Purpose / actors / modules.** Exam definition through controlled evaluation, moderation, publication and re-evaluation. Actors: Examination Controller, Faculty/Evaluator, Student, Admin. Modules: exam setup; eligibility; scheduling; hall tickets; evaluation; moderation; results; re-evaluation.

### Entity design
All tables carry `tenant_id uuid NOT NULL`, `industry_context_id uuid NOT NULL`, `row_version bigint`, audit timestamps/actors, `is_demo boolean default false`; indexes start with tenant+industry.

| Entity / table | Domain fields (in addition to baseline) | Constraints / indexes | Sensitivity / retention |
|---|---|---|---|
| Exam / `edu_ems_exam` | code text, term_ref uuid, type text, state enum(DRAFT,SCHEDULED,CONDUCTED,EVALUATING,MODERATION,APPROVED,PUBLISHED,CLOSED) | PK id; UNIQUE (tenant_id, industry_context_id,code); INDEX (tenant_id, industry_context_id, state, updated_at) | SENSITIVE_PERSONAL; official-academic-record policy |
| ExamCandidate / `edu_ems_candidate` | exam_id uuid, student_ref uuid, eligible boolean, hold_reason_code text?, hold_note text?, hall_ticket_document_id uuid? | PK id; UNIQUE (tenant_id, industry_context_id,exam_id,student_ref); INDEX (tenant_id, industry_context_id, exam_id) | SENSITIVE_PERSONAL; official-academic-record policy |
| Evaluation / `edu_ems_evaluation` | exam_id uuid, student_ref uuid, subject_code text, evaluator_id uuid, marks numeric, state enum(DRAFT,SUBMITTED,MODERATED,FINAL), version int | PK id; UNIQUE (tenant_id, industry_context_id,exam_id,student_ref,subject_code,version); PARTIAL INDEX (tenant_id, industry_context_id, state) WHERE state NOT IN ('CLOSED','CANCELLED','RETIRED','EXPIRED','REVOKED','COMPLETED') | INTERNAL/CONFIDENTIAL; policy retention |
| ResultPublication / `edu_ems_result` | exam_id uuid, approval_ref uuid, publication_version int, published_at timestamptz, result_document_ref uuid?, state enum(PREPARED,APPROVED,PUBLISHED,SUPERSEDED) | append-only where history/evidence; UNIQUE (tenant_id, industry_context_id,exam_id,publication_version) | SENSITIVE_PERSONAL; evidentiary retention |

Relationships are FK-constrained within the same tenant+industry context; cross-MS references store owning resource IDs and are resolved through service/projection contracts, never direct foreign-table reads. Ownership columns are immutable.

### Workflow / state machine
Canonical primary state: **DRAFT → SCHEDULED → CONDUCTED → EVALUATING → MODERATION → APPROVED → PUBLISHED**.  
Invalid transition: any transition not in the MS transition table is rejected with `EDU-EMS_STATE_INVALID`. Required transition facts: expected row version, actor, permission, reason where exceptional, correlation ID. Re-evaluation creates a new evaluation/publication version; no published result is edited in place.

### Business rules / approvals
- **EDU-EMS-R01** Result publication requires Examination Controller approval.
- **EDU-EMS-R02** Attendance/eligibility hold prevents hall ticket unless approved override.
- **EDU-EMS-R03** Evaluator cannot silently overwrite submitted marks; corrections version.
- **EDU-EMS-R04** Published result is immutable; re-evaluation produces superseding version.
Approval-required actions use Core Workflow tasks; approver must still pass DD-03 in the same Tenant+Industry Context.

### Permissions / ABAC
`edu.ems.exam.define` · `edu.ems.exam.schedule` · `edu.ems.candidate.eligibility` · `edu.ems.evaluation.submit` · `edu.ems.result.approve` · `edu.ems.result.publish`.  
ABAC dimensions: org unit/branch/site, resource ownership, workflow state, sensitivity, time/device where relevant. ABAC may restrict but never grant beyond RBAC. 

### Documents / notifications / reporting
Documents: hall ticket, mark sheet/result, re-evaluation record. All use DD-08 DocumentMeta.  
Notifications: schedule, hall ticket, result, re-evaluation; sensitive payloads use generic push preview.  
Reports/KPIs: pass %, evaluation TAT, moderation backlog, re-evaluation rate; projections preserve Tenant+Industry ownership and exports require report/export permission.

### APIs / events / integrations
tRPC operations: `ind.edu.ems.exam_define` · `ind.edu.ems.exam_schedule` · `ind.edu.ems.candidate_eligibility` · `ind.edu.ems.evaluation_submit` · `ind.edu.ems.result_approve`. REST only for real external integration. Inputs include resource ID/version and domain fields; outputs use DD-06 envelope; writes are idempotent where retryable.  
Events v1: `edu.ems.exam_define` · `edu.ems.exam_schedule` · `edu.ems.candidate_eligibility`. Payloads include aggregate ID/state/version and minimal domain facts in DD-07 envelope.  
Integrations: SMS/CUM student registry, Core Documents/Communication; adapters use DD-06 IntegrationDefinition/ProviderAdapter and secret references.

### AI / experience / offline
AI: AI may assist anomaly/format checks and explain published results; never assign official marks autonomously. RAG sources inherit ACL/sensitivity; tools bind the listed OperationContracts and acting-user permission; high-risk side effects require approval.  
Web routes: `/app/edu/ems` list/detail/workflow/report views. Mobile: student schedule/result read; evaluator web/mobile optional. Desktop: optional exam office.  
Offline class: **ONLINE_ONLY**. Official evaluation/publication requires live authorization/current state.

### Configuration / entitlement / dependencies / audit
Configuration: grading scheme, eligibility, moderation and approval chains. Security floors cannot be overridden.  
Entitlement: suite license + `EDU-EMS` MS entitlement + module/feature entitlements; business services never hard-code plan names.  
Dependencies: EDU-SMS/CUM, Core Documents. Audit: every approval, state transition, financial/regulated correction, export and cross-module handoff records action/resource/state/reason/correlation.

### Tests / acceptance
Positive: define→conduct→evaluate→approve→publish. Negative: publish before approval/held candidate blocked. Isolation: wrong tenant and same-tenant wrong Industry Context must return no data/effect. Entitlement-disabled MS must deny. AI retrieval/tool uses same authorization. Unauthorized document/event consumer denied.  
**Acceptance:** published results are immutable/versioned and fully audited.


## Fable 5 deterministic contract binding
The Education MS sections above remain the canonical domain entity/module/permission/document/integration owners. The following remediation artifacts are **normative extensions of each listed MS**, not optional commentary:
- MS set: `EDU-SMS`, `EDU-CUM`, `EDU-CTM`, `EDU-LMS`, `EDU-EMS`.
- Deterministic per-MS tests: `DD-21_MS_ACCEPTANCE_TEST_CONTRACTS.md` → `<MS>-T001…T014`.
- Exact major workflow transitions/forbidden edges/reversal-cancellation: `DD-22_MS_WORKFLOW_TRANSITION_MATRICES.md`.
- Behavior-bearing field/catalog and exact context-index rules: `DD-23_BEHAVIORAL_CATALOGS_INDEX_CONTRACTS.md` + `DD-23A_BEHAVIOR_FIELD_REGISTRY.md`.
- Domain-critical product defaults: `DD-24_INDUSTRY_DOMAIN_RULE_DECISIONS.md` → EDU-AC-001…004.
- Mathematical KPIs + KPI acceptance IDs: `DD-25_KPI_CALCULATION_CATALOG.md`.
- Requirement-ID chains: `Registers/DD_REQUIREMENT_TRACEABILITY_F5.md`.
- 41-MS determinism evidence: `DD-27_41_MS_DETERMINISM_AUDIT.md`.

Where an earlier sentence in this file is less specific than a referenced remediation contract, the more specific remediation contract governs. None of these references permits cross-industry inheritance of business semantics.
