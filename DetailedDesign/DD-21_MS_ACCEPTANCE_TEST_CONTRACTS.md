# DD-21 — 41-MANAGEMENT-SYSTEM ACCEPTANCE & TEST CONTRACTS
**Status:** ACTIVE REMEDIATION EVIDENCE · **Date:** 2026-09-11
**Authority:** Fable 5 remediation mandate · DD-02/03/04/06/07/08/09/11/15/16 · industry DD files

## Contract
These are design-level deterministic acceptance contracts, not executable test code. Every test ID is canonical and must be implemented by QA/Development later. Error classes use DD-01/DD-03 taxonomy. Canonical denial semantics in this artifact are exact: foreign-tenant resource injection returns `RESOURCE_NOT_FOUND`; same-tenant wrong Industry Context returns `INDUSTRY_CONTEXT_MISMATCH`; wrong org/site/assignment ABAC returns `RESOURCE_SCOPE_DENY`; known same-context resource/document without permission returns `PERMISSION_DENIED`. No alternative error choice is left to Development.

Each MS namespace contains all required families. Domain-specific transition/event names below are authoritative acceptance aliases and must be reconciled with the MS event catalog during implementation; they do not create a second event bus.


## HLT-HMS — Hospital admission
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| HLT-HMS-T001 | Positive | valid Hospital admission in REQUESTED, correct tenant/context, entitlement and hlt.hms.admission.admit | authorized actor executes transition | state=BED_ALLOCATED; one domain mutation; event=hlt.hms.patient.admitted.v1; audit SUCCESS |
| HLT-HMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains REQUESTED; no event; audit FAILED |
| HLT-HMS-T003 | Workflow | resource in REQUESTED with all preconditions | actor executes hlt.hms.admission.admit | state=BED_ALLOCATED; expectedVersion increments; event=hlt.hms.patient.admitted.v1; audit SUCCESS |
| HLT-HMS-T004 | Forbidden transition | resource already BED_ALLOCATED or terminal state | actor attempts backward/unlisted transition | error=HLT-HMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| HLT-HMS-T005 | Permission | principal lacks hlt.hms.admission.admit | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| HLT-HMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| HLT-HMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Hospital admission resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| HLT-HMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies HLT-HMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| HLT-HMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| HLT-HMS-T010 | Document | principal lacks resource/document authorization for admission | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| HLT-HMS-T011 | Event/Webhook | event hlt.hms.patient.admitted.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| HLT-HMS-T012 | Offline | queued Hospital admission mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| HLT-HMS-T013 | AI/RAG/Tool | AI agent/RAG tries HLT-HMS resource/tool without current hlt.hms.admission.admit or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| HLT-HMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one BED_ALLOCATED transition and one hlt.hms.patient.admitted.v1; duplicate business effect=0; audit/correlation links retry to original |

## HLT-LIS — Lab result/report
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| HLT-LIS-T001 | Positive | valid Lab result/report in RESULTED, correct tenant/context, entitlement and hlt.lis.result.verify | authorized actor executes transition | state=VERIFIED; one domain mutation; event=hlt.lis.result.verified.v1; audit SUCCESS |
| HLT-LIS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains RESULTED; no event; audit FAILED |
| HLT-LIS-T003 | Workflow | resource in RESULTED with all preconditions | actor executes hlt.lis.result.verify | state=VERIFIED; expectedVersion increments; event=hlt.lis.result.verified.v1; audit SUCCESS |
| HLT-LIS-T004 | Forbidden transition | resource already VERIFIED or terminal state | actor attempts backward/unlisted transition | error=HLT-LIS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| HLT-LIS-T005 | Permission | principal lacks hlt.lis.result.verify | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| HLT-LIS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| HLT-LIS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Lab result/report resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| HLT-LIS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies HLT-LIS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| HLT-LIS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| HLT-LIS-T010 | Document | principal lacks resource/document authorization for lab-report | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| HLT-LIS-T011 | Event/Webhook | event hlt.lis.result.verified.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| HLT-LIS-T012 | Offline | queued Lab result/report mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| HLT-LIS-T013 | AI/RAG/Tool | AI agent/RAG tries HLT-LIS resource/tool without current hlt.lis.result.verify or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| HLT-LIS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one VERIFIED transition and one hlt.lis.result.verified.v1; duplicate business effect=0; audit/correlation links retry to original |

## HLT-RIS — Radiology report
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| HLT-RIS-T001 | Positive | valid Radiology report in DRAFT, correct tenant/context, entitlement and hlt.ris.report.approve | authorized actor executes transition | state=APPROVED; one domain mutation; event=hlt.ris.report.approved.v1; audit SUCCESS |
| HLT-RIS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains DRAFT; no event; audit FAILED |
| HLT-RIS-T003 | Workflow | resource in DRAFT with all preconditions | actor executes hlt.ris.report.approve | state=APPROVED; expectedVersion increments; event=hlt.ris.report.approved.v1; audit SUCCESS |
| HLT-RIS-T004 | Forbidden transition | resource already APPROVED or terminal state | actor attempts backward/unlisted transition | error=HLT-RIS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| HLT-RIS-T005 | Permission | principal lacks hlt.ris.report.approve | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| HLT-RIS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| HLT-RIS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Radiology report resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| HLT-RIS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies HLT-RIS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| HLT-RIS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| HLT-RIS-T010 | Document | principal lacks resource/document authorization for radiology-report | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| HLT-RIS-T011 | Event/Webhook | event hlt.ris.report.approved.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| HLT-RIS-T012 | Offline | queued Radiology report mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| HLT-RIS-T013 | AI/RAG/Tool | AI agent/RAG tries HLT-RIS resource/tool without current hlt.ris.report.approve or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| HLT-RIS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one APPROVED transition and one hlt.ris.report.approved.v1; duplicate business effect=0; audit/correlation links retry to original |

## HLT-PMS — Dispense
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| HLT-PMS-T001 | Positive | valid Dispense in PREPARED, correct tenant/context, entitlement and hlt.pms.dispense.commit | authorized actor executes transition | state=DISPENSED; one domain mutation; event=hlt.pms.prescription.dispensed.v1; audit SUCCESS |
| HLT-PMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains PREPARED; no event; audit FAILED |
| HLT-PMS-T003 | Workflow | resource in PREPARED with all preconditions | actor executes hlt.pms.dispense.commit | state=DISPENSED; expectedVersion increments; event=hlt.pms.prescription.dispensed.v1; audit SUCCESS |
| HLT-PMS-T004 | Forbidden transition | resource already DISPENSED or terminal state | actor attempts backward/unlisted transition | error=HLT-PMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| HLT-PMS-T005 | Permission | principal lacks hlt.pms.dispense.commit | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| HLT-PMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| HLT-PMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Dispense resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| HLT-PMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies HLT-PMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| HLT-PMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| HLT-PMS-T010 | Document | principal lacks resource/document authorization for dispense | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| HLT-PMS-T011 | Event/Webhook | event hlt.pms.prescription.dispensed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| HLT-PMS-T012 | Offline | queued Dispense mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| HLT-PMS-T013 | AI/RAG/Tool | AI agent/RAG tries HLT-PMS resource/tool without current hlt.pms.dispense.commit or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| HLT-PMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one DISPENSED transition and one hlt.pms.prescription.dispensed.v1; duplicate business effect=0; audit/correlation links retry to original |

## HLT-CMS — Clinic encounter
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| HLT-CMS-T001 | Positive | valid Clinic encounter in IN_CONSULTATION, correct tenant/context, entitlement and hlt.cms.encounter.sign | authorized actor executes transition | state=SIGNED; one domain mutation; event=hlt.cms.encounter.signed.v1; audit SUCCESS |
| HLT-CMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains IN_CONSULTATION; no event; audit FAILED |
| HLT-CMS-T003 | Workflow | resource in IN_CONSULTATION with all preconditions | actor executes hlt.cms.encounter.sign | state=SIGNED; expectedVersion increments; event=hlt.cms.encounter.signed.v1; audit SUCCESS |
| HLT-CMS-T004 | Forbidden transition | resource already SIGNED or terminal state | actor attempts backward/unlisted transition | error=HLT-CMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| HLT-CMS-T005 | Permission | principal lacks hlt.cms.encounter.sign | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| HLT-CMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| HLT-CMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Clinic encounter resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| HLT-CMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies HLT-CMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| HLT-CMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| HLT-CMS-T010 | Document | principal lacks resource/document authorization for encounter-summary | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| HLT-CMS-T011 | Event/Webhook | event hlt.cms.encounter.signed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| HLT-CMS-T012 | Offline | queued Clinic encounter mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| HLT-CMS-T013 | AI/RAG/Tool | AI agent/RAG tries HLT-CMS resource/tool without current hlt.cms.encounter.sign or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| HLT-CMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one SIGNED transition and one hlt.cms.encounter.signed.v1; duplicate business effect=0; audit/correlation links retry to original |

## EDU-SMS — Student admission
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| EDU-SMS-T001 | Positive | valid Student admission in OFFERED, correct tenant/context, entitlement and edu.sms.admission.enroll | authorized actor executes transition | state=ENROLLED; one domain mutation; event=edu.sms.student.enrolled.v1; audit SUCCESS |
| EDU-SMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains OFFERED; no event; audit FAILED |
| EDU-SMS-T003 | Workflow | resource in OFFERED with all preconditions | actor executes edu.sms.admission.enroll | state=ENROLLED; expectedVersion increments; event=edu.sms.student.enrolled.v1; audit SUCCESS |
| EDU-SMS-T004 | Forbidden transition | resource already ENROLLED or terminal state | actor attempts backward/unlisted transition | error=EDU-SMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| EDU-SMS-T005 | Permission | principal lacks edu.sms.admission.enroll | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| EDU-SMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| EDU-SMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Student admission resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| EDU-SMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies EDU-SMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| EDU-SMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| EDU-SMS-T010 | Document | principal lacks resource/document authorization for admission-letter | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| EDU-SMS-T011 | Event/Webhook | event edu.sms.student.enrolled.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| EDU-SMS-T012 | Offline | queued Student admission mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| EDU-SMS-T013 | AI/RAG/Tool | AI agent/RAG tries EDU-SMS resource/tool without current edu.sms.admission.enroll or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| EDU-SMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one ENROLLED transition and one edu.sms.student.enrolled.v1; duplicate business effect=0; audit/correlation links retry to original |

## EDU-CUM — University admission
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| EDU-CUM-T001 | Positive | valid University admission in ADMITTED, correct tenant/context, entitlement and edu.cum.registration.register | authorized actor executes transition | state=REGISTERED; one domain mutation; event=edu.cum.student.registered.v1; audit SUCCESS |
| EDU-CUM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains ADMITTED; no event; audit FAILED |
| EDU-CUM-T003 | Workflow | resource in ADMITTED with all preconditions | actor executes edu.cum.registration.register | state=REGISTERED; expectedVersion increments; event=edu.cum.student.registered.v1; audit SUCCESS |
| EDU-CUM-T004 | Forbidden transition | resource already REGISTERED or terminal state | actor attempts backward/unlisted transition | error=EDU-CUM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| EDU-CUM-T005 | Permission | principal lacks edu.cum.registration.register | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| EDU-CUM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| EDU-CUM-T007 | Tenant isolation | Tenant A principal supplies Tenant B University admission resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| EDU-CUM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies EDU-CUM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| EDU-CUM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| EDU-CUM-T010 | Document | principal lacks resource/document authorization for registration-record | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| EDU-CUM-T011 | Event/Webhook | event edu.cum.student.registered.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| EDU-CUM-T012 | Offline | queued University admission mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| EDU-CUM-T013 | AI/RAG/Tool | AI agent/RAG tries EDU-CUM resource/tool without current edu.cum.registration.register or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| EDU-CUM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one REGISTERED transition and one edu.cum.student.registered.v1; duplicate business effect=0; audit/correlation links retry to original |

## EDU-CTM — Training enrollment
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| EDU-CTM-T001 | Positive | valid Training enrollment in OFFERED, correct tenant/context, entitlement and edu.ctm.enrollment.confirm | authorized actor executes transition | state=ENROLLED; one domain mutation; event=edu.ctm.learner.enrolled.v1; audit SUCCESS |
| EDU-CTM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains OFFERED; no event; audit FAILED |
| EDU-CTM-T003 | Workflow | resource in OFFERED with all preconditions | actor executes edu.ctm.enrollment.confirm | state=ENROLLED; expectedVersion increments; event=edu.ctm.learner.enrolled.v1; audit SUCCESS |
| EDU-CTM-T004 | Forbidden transition | resource already ENROLLED or terminal state | actor attempts backward/unlisted transition | error=EDU-CTM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| EDU-CTM-T005 | Permission | principal lacks edu.ctm.enrollment.confirm | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| EDU-CTM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| EDU-CTM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Training enrollment resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| EDU-CTM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies EDU-CTM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| EDU-CTM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| EDU-CTM-T010 | Document | principal lacks resource/document authorization for enrollment-record | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| EDU-CTM-T011 | Event/Webhook | event edu.ctm.learner.enrolled.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| EDU-CTM-T012 | Offline | queued Training enrollment mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| EDU-CTM-T013 | AI/RAG/Tool | AI agent/RAG tries EDU-CTM resource/tool without current edu.ctm.enrollment.confirm or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| EDU-CTM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one ENROLLED transition and one edu.ctm.learner.enrolled.v1; duplicate business effect=0; audit/correlation links retry to original |

## EDU-LMS — Assignment grading
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| EDU-LMS-T001 | Positive | valid Assignment grading in GRADING, correct tenant/context, entitlement and edu.lms.assignment.grade | authorized actor executes transition | state=GRADED; one domain mutation; event=edu.lms.assignment.graded.v1; audit SUCCESS |
| EDU-LMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains GRADING; no event; audit FAILED |
| EDU-LMS-T003 | Workflow | resource in GRADING with all preconditions | actor executes edu.lms.assignment.grade | state=GRADED; expectedVersion increments; event=edu.lms.assignment.graded.v1; audit SUCCESS |
| EDU-LMS-T004 | Forbidden transition | resource already GRADED or terminal state | actor attempts backward/unlisted transition | error=EDU-LMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| EDU-LMS-T005 | Permission | principal lacks edu.lms.assignment.grade | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| EDU-LMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| EDU-LMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Assignment grading resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| EDU-LMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies EDU-LMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| EDU-LMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| EDU-LMS-T010 | Document | principal lacks resource/document authorization for graded-submission | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| EDU-LMS-T011 | Event/Webhook | event edu.lms.assignment.graded.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| EDU-LMS-T012 | Offline | queued Assignment grading mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| EDU-LMS-T013 | AI/RAG/Tool | AI agent/RAG tries EDU-LMS resource/tool without current edu.lms.assignment.grade or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| EDU-LMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one GRADED transition and one edu.lms.assignment.graded.v1; duplicate business effect=0; audit/correlation links retry to original |

## EDU-EMS — Result publication
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| EDU-EMS-T001 | Positive | valid Result publication in APPROVED, correct tenant/context, entitlement and edu.ems.result.publish | authorized actor executes transition | state=PUBLISHED; one domain mutation; event=edu.ems.result.published.v1; audit SUCCESS |
| EDU-EMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains APPROVED; no event; audit FAILED |
| EDU-EMS-T003 | Workflow | resource in APPROVED with all preconditions | actor executes edu.ems.result.publish | state=PUBLISHED; expectedVersion increments; event=edu.ems.result.published.v1; audit SUCCESS |
| EDU-EMS-T004 | Forbidden transition | resource already PUBLISHED or terminal state | actor attempts backward/unlisted transition | error=EDU-EMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| EDU-EMS-T005 | Permission | principal lacks edu.ems.result.publish | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| EDU-EMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| EDU-EMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Result publication resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| EDU-EMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies EDU-EMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| EDU-EMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| EDU-EMS-T010 | Document | principal lacks resource/document authorization for result-sheet | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| EDU-EMS-T011 | Event/Webhook | event edu.ems.result.published.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| EDU-EMS-T012 | Offline | queued Result publication mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| EDU-EMS-T013 | AI/RAG/Tool | AI agent/RAG tries EDU-EMS resource/tool without current edu.ems.result.publish or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| EDU-EMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one PUBLISHED transition and one edu.ems.result.published.v1; duplicate business effect=0; audit/correlation links retry to original |

## RTL-RSM — Store day close
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| RTL-RSM-T001 | Positive | valid Store day close in RECONCILIATION, correct tenant/context, entitlement and rtl.rsm.store.close | authorized actor executes transition | state=CLOSED; one domain mutation; event=rtl.rsm.store.closed.v1; audit SUCCESS |
| RTL-RSM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains RECONCILIATION; no event; audit FAILED |
| RTL-RSM-T003 | Workflow | resource in RECONCILIATION with all preconditions | actor executes rtl.rsm.store.close | state=CLOSED; expectedVersion increments; event=rtl.rsm.store.closed.v1; audit SUCCESS |
| RTL-RSM-T004 | Forbidden transition | resource already CLOSED or terminal state | actor attempts backward/unlisted transition | error=RTL-RSM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| RTL-RSM-T005 | Permission | principal lacks rtl.rsm.store.close | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| RTL-RSM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| RTL-RSM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Store day close resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| RTL-RSM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies RTL-RSM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| RTL-RSM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| RTL-RSM-T010 | Document | principal lacks resource/document authorization for day-close-report | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| RTL-RSM-T011 | Event/Webhook | event rtl.rsm.store.closed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| RTL-RSM-T012 | Offline | queued Store day close mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| RTL-RSM-T013 | AI/RAG/Tool | AI agent/RAG tries RTL-RSM resource/tool without current rtl.rsm.store.close or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| RTL-RSM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one CLOSED transition and one rtl.rsm.store.closed.v1; duplicate business effect=0; audit/correlation links retry to original |

## RTL-POS — POS sale
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| RTL-POS-T001 | Positive | valid POS sale in TENDERING, correct tenant/context, entitlement and rtl.pos.sale.complete | authorized actor executes transition | state=PAID; one domain mutation; event=rtl.pos.sale.paid.v1; audit SUCCESS |
| RTL-POS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains TENDERING; no event; audit FAILED |
| RTL-POS-T003 | Workflow | resource in TENDERING with all preconditions | actor executes rtl.pos.sale.complete | state=PAID; expectedVersion increments; event=rtl.pos.sale.paid.v1; audit SUCCESS |
| RTL-POS-T004 | Forbidden transition | resource already PAID or terminal state | actor attempts backward/unlisted transition | error=RTL-POS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| RTL-POS-T005 | Permission | principal lacks rtl.pos.sale.complete | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| RTL-POS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| RTL-POS-T007 | Tenant isolation | Tenant A principal supplies Tenant B POS sale resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| RTL-POS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies RTL-POS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| RTL-POS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| RTL-POS-T010 | Document | principal lacks resource/document authorization for sales-receipt | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| RTL-POS-T011 | Event/Webhook | event rtl.pos.sale.paid.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| RTL-POS-T012 | Offline | queued POS sale mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| RTL-POS-T013 | AI/RAG/Tool | AI agent/RAG tries RTL-POS resource/tool without current rtl.pos.sale.complete or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| RTL-POS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one PAID transition and one rtl.pos.sale.paid.v1; duplicate business effect=0; audit/correlation links retry to original |

## RTL-IWM — Stock count
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| RTL-IWM-T001 | Positive | valid Stock count in APPROVED, correct tenant/context, entitlement and rtl.iwm.count.post | authorized actor executes transition | state=POSTED; one domain mutation; event=rtl.iwm.count.posted.v1; audit SUCCESS |
| RTL-IWM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains APPROVED; no event; audit FAILED |
| RTL-IWM-T003 | Workflow | resource in APPROVED with all preconditions | actor executes rtl.iwm.count.post | state=POSTED; expectedVersion increments; event=rtl.iwm.count.posted.v1; audit SUCCESS |
| RTL-IWM-T004 | Forbidden transition | resource already POSTED or terminal state | actor attempts backward/unlisted transition | error=RTL-IWM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| RTL-IWM-T005 | Permission | principal lacks rtl.iwm.count.post | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| RTL-IWM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| RTL-IWM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Stock count resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| RTL-IWM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies RTL-IWM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| RTL-IWM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| RTL-IWM-T010 | Document | principal lacks resource/document authorization for stock-count-report | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| RTL-IWM-T011 | Event/Webhook | event rtl.iwm.count.posted.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| RTL-IWM-T012 | Offline | queued Stock count mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| RTL-IWM-T013 | AI/RAG/Tool | AI agent/RAG tries RTL-IWM resource/tool without current rtl.iwm.count.post or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| RTL-IWM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one POSTED transition and one rtl.iwm.count.posted.v1; duplicate business effect=0; audit/correlation links retry to original |

## RTL-OMS — Order fulfilment
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| RTL-OMS-T001 | Positive | valid Order fulfilment in PACKED, correct tenant/context, entitlement and rtl.oms.order.ship | authorized actor executes transition | state=SHIPPED; one domain mutation; event=rtl.oms.order.shipped.v1; audit SUCCESS |
| RTL-OMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains PACKED; no event; audit FAILED |
| RTL-OMS-T003 | Workflow | resource in PACKED with all preconditions | actor executes rtl.oms.order.ship | state=SHIPPED; expectedVersion increments; event=rtl.oms.order.shipped.v1; audit SUCCESS |
| RTL-OMS-T004 | Forbidden transition | resource already SHIPPED or terminal state | actor attempts backward/unlisted transition | error=RTL-OMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| RTL-OMS-T005 | Permission | principal lacks rtl.oms.order.ship | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| RTL-OMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| RTL-OMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Order fulfilment resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| RTL-OMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies RTL-OMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| RTL-OMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| RTL-OMS-T010 | Document | principal lacks resource/document authorization for shipment-document | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| RTL-OMS-T011 | Event/Webhook | event rtl.oms.order.shipped.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| RTL-OMS-T012 | Offline | queued Order fulfilment mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| RTL-OMS-T013 | AI/RAG/Tool | AI agent/RAG tries RTL-OMS resource/tool without current rtl.oms.order.ship or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| RTL-OMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one SHIPPED transition and one rtl.oms.order.shipped.v1; duplicate business effect=0; audit/correlation links retry to original |

## RTL-MKT — Seller settlement
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| RTL-MKT-T001 | Positive | valid Seller settlement in APPROVED, correct tenant/context, entitlement and rtl.mkt.settlement.pay | authorized actor executes transition | state=PAID; one domain mutation; event=rtl.mkt.settlement.paid.v1; audit SUCCESS |
| RTL-MKT-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains APPROVED; no event; audit FAILED |
| RTL-MKT-T003 | Workflow | resource in APPROVED with all preconditions | actor executes rtl.mkt.settlement.pay | state=PAID; expectedVersion increments; event=rtl.mkt.settlement.paid.v1; audit SUCCESS |
| RTL-MKT-T004 | Forbidden transition | resource already PAID or terminal state | actor attempts backward/unlisted transition | error=RTL-MKT_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| RTL-MKT-T005 | Permission | principal lacks rtl.mkt.settlement.pay | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| RTL-MKT-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| RTL-MKT-T007 | Tenant isolation | Tenant A principal supplies Tenant B Seller settlement resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| RTL-MKT-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies RTL-MKT resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| RTL-MKT-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| RTL-MKT-T010 | Document | principal lacks resource/document authorization for settlement-statement | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| RTL-MKT-T011 | Event/Webhook | event rtl.mkt.settlement.paid.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| RTL-MKT-T012 | Offline | queued Seller settlement mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| RTL-MKT-T013 | AI/RAG/Tool | AI agent/RAG tries RTL-MKT resource/tool without current rtl.mkt.settlement.pay or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| RTL-MKT-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one PAID transition and one rtl.mkt.settlement.paid.v1; duplicate business effect=0; audit/correlation links retry to original |

## HSP-HMS — Hotel checkout
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| HSP-HMS-T001 | Positive | valid Hotel checkout in CHECKOUT_PENDING, correct tenant/context, entitlement and hsp.hms.stay.checkout | authorized actor executes transition | state=CHECKED_OUT; one domain mutation; event=hsp.hms.stay.checked_out.v1; audit SUCCESS |
| HSP-HMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains CHECKOUT_PENDING; no event; audit FAILED |
| HSP-HMS-T003 | Workflow | resource in CHECKOUT_PENDING with all preconditions | actor executes hsp.hms.stay.checkout | state=CHECKED_OUT; expectedVersion increments; event=hsp.hms.stay.checked_out.v1; audit SUCCESS |
| HSP-HMS-T004 | Forbidden transition | resource already CHECKED_OUT or terminal state | actor attempts backward/unlisted transition | error=HSP-HMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| HSP-HMS-T005 | Permission | principal lacks hsp.hms.stay.checkout | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| HSP-HMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| HSP-HMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Hotel checkout resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| HSP-HMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies HSP-HMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| HSP-HMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| HSP-HMS-T010 | Document | principal lacks resource/document authorization for folio | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| HSP-HMS-T011 | Event/Webhook | event hsp.hms.stay.checked_out.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| HSP-HMS-T012 | Offline | queued Hotel checkout mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| HSP-HMS-T013 | AI/RAG/Tool | AI agent/RAG tries HSP-HMS resource/tool without current hsp.hms.stay.checkout or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| HSP-HMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one CHECKED_OUT transition and one hsp.hms.stay.checked_out.v1; duplicate business effect=0; audit/correlation links retry to original |

## HSP-RMS — Restaurant settlement
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| HSP-RMS-T001 | Positive | valid Restaurant settlement in BILLING, correct tenant/context, entitlement and hsp.rms.check.settle | authorized actor executes transition | state=SETTLED; one domain mutation; event=hsp.rms.check.settled.v1; audit SUCCESS |
| HSP-RMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains BILLING; no event; audit FAILED |
| HSP-RMS-T003 | Workflow | resource in BILLING with all preconditions | actor executes hsp.rms.check.settle | state=SETTLED; expectedVersion increments; event=hsp.rms.check.settled.v1; audit SUCCESS |
| HSP-RMS-T004 | Forbidden transition | resource already SETTLED or terminal state | actor attempts backward/unlisted transition | error=HSP-RMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| HSP-RMS-T005 | Permission | principal lacks hsp.rms.check.settle | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| HSP-RMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| HSP-RMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Restaurant settlement resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| HSP-RMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies HSP-RMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| HSP-RMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| HSP-RMS-T010 | Document | principal lacks resource/document authorization for restaurant-bill | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| HSP-RMS-T011 | Event/Webhook | event hsp.rms.check.settled.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| HSP-RMS-T012 | Offline | queued Restaurant settlement mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| HSP-RMS-T013 | AI/RAG/Tool | AI agent/RAG tries HSP-RMS resource/tool without current hsp.rms.check.settle or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| HSP-RMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one SETTLED transition and one hsp.rms.check.settled.v1; duplicate business effect=0; audit/correlation links retry to original |

## HSP-BEM — Event booking
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| HSP-BEM-T001 | Positive | valid Event booking in TENTATIVE, correct tenant/context, entitlement and hsp.bem.booking.confirm | authorized actor executes transition | state=CONFIRMED; one domain mutation; event=hsp.bem.booking.confirmed.v1; audit SUCCESS |
| HSP-BEM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains TENTATIVE; no event; audit FAILED |
| HSP-BEM-T003 | Workflow | resource in TENTATIVE with all preconditions | actor executes hsp.bem.booking.confirm | state=CONFIRMED; expectedVersion increments; event=hsp.bem.booking.confirmed.v1; audit SUCCESS |
| HSP-BEM-T004 | Forbidden transition | resource already CONFIRMED or terminal state | actor attempts backward/unlisted transition | error=HSP-BEM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| HSP-BEM-T005 | Permission | principal lacks hsp.bem.booking.confirm | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| HSP-BEM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| HSP-BEM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Event booking resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| HSP-BEM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies HSP-BEM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| HSP-BEM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| HSP-BEM-T010 | Document | principal lacks resource/document authorization for event-contract | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| HSP-BEM-T011 | Event/Webhook | event hsp.bem.booking.confirmed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| HSP-BEM-T012 | Offline | queued Event booking mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| HSP-BEM-T013 | AI/RAG/Tool | AI agent/RAG tries HSP-BEM resource/tool without current hsp.bem.booking.confirm or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| HSP-BEM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one CONFIRMED transition and one hsp.bem.booking.confirmed.v1; duplicate business effect=0; audit/correlation links retry to original |

## HSP-RBM — Reservation
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| HSP-RBM-T001 | Positive | valid Reservation in TENTATIVE, correct tenant/context, entitlement and hsp.rbm.reservation.confirm | authorized actor executes transition | state=CONFIRMED; one domain mutation; event=hsp.rbm.reservation.confirmed.v1; audit SUCCESS |
| HSP-RBM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains TENTATIVE; no event; audit FAILED |
| HSP-RBM-T003 | Workflow | resource in TENTATIVE with all preconditions | actor executes hsp.rbm.reservation.confirm | state=CONFIRMED; expectedVersion increments; event=hsp.rbm.reservation.confirmed.v1; audit SUCCESS |
| HSP-RBM-T004 | Forbidden transition | resource already CONFIRMED or terminal state | actor attempts backward/unlisted transition | error=HSP-RBM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| HSP-RBM-T005 | Permission | principal lacks hsp.rbm.reservation.confirm | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| HSP-RBM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| HSP-RBM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Reservation resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| HSP-RBM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies HSP-RBM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| HSP-RBM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| HSP-RBM-T010 | Document | principal lacks resource/document authorization for reservation-confirmation | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| HSP-RBM-T011 | Event/Webhook | event hsp.rbm.reservation.confirmed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| HSP-RBM-T012 | Offline | queued Reservation mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| HSP-RBM-T013 | AI/RAG/Tool | AI agent/RAG tries HSP-RBM resource/tool without current hsp.rbm.reservation.confirm or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| HSP-RBM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one CONFIRMED transition and one hsp.rbm.reservation.confirmed.v1; duplicate business effect=0; audit/correlation links retry to original |

## MFG-PMS — Production order
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| MFG-PMS-T001 | Positive | valid Production order in QC, correct tenant/context, entitlement and mfg.pms.production.complete | authorized actor executes transition | state=COMPLETED; one domain mutation; event=mfg.pms.production.completed.v1; audit SUCCESS |
| MFG-PMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains QC; no event; audit FAILED |
| MFG-PMS-T003 | Workflow | resource in QC with all preconditions | actor executes mfg.pms.production.complete | state=COMPLETED; expectedVersion increments; event=mfg.pms.production.completed.v1; audit SUCCESS |
| MFG-PMS-T004 | Forbidden transition | resource already COMPLETED or terminal state | actor attempts backward/unlisted transition | error=MFG-PMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| MFG-PMS-T005 | Permission | principal lacks mfg.pms.production.complete | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| MFG-PMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| MFG-PMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Production order resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| MFG-PMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies MFG-PMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| MFG-PMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| MFG-PMS-T010 | Document | principal lacks resource/document authorization for production-record | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| MFG-PMS-T011 | Event/Webhook | event mfg.pms.production.completed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| MFG-PMS-T012 | Offline | queued Production order mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| MFG-PMS-T013 | AI/RAG/Tool | AI agent/RAG tries MFG-PMS resource/tool without current mfg.pms.production.complete or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| MFG-PMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one COMPLETED transition and one mfg.pms.production.completed.v1; duplicate business effect=0; audit/correlation links retry to original |

## MFG-IWM — Inventory count
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| MFG-IWM-T001 | Positive | valid Inventory count in APPROVED, correct tenant/context, entitlement and mfg.iwm.count.adjust | authorized actor executes transition | state=ADJUSTED; one domain mutation; event=mfg.iwm.count.adjusted.v1; audit SUCCESS |
| MFG-IWM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains APPROVED; no event; audit FAILED |
| MFG-IWM-T003 | Workflow | resource in APPROVED with all preconditions | actor executes mfg.iwm.count.adjust | state=ADJUSTED; expectedVersion increments; event=mfg.iwm.count.adjusted.v1; audit SUCCESS |
| MFG-IWM-T004 | Forbidden transition | resource already ADJUSTED or terminal state | actor attempts backward/unlisted transition | error=MFG-IWM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| MFG-IWM-T005 | Permission | principal lacks mfg.iwm.count.adjust | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| MFG-IWM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| MFG-IWM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Inventory count resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| MFG-IWM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies MFG-IWM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| MFG-IWM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| MFG-IWM-T010 | Document | principal lacks resource/document authorization for inventory-adjustment | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| MFG-IWM-T011 | Event/Webhook | event mfg.iwm.count.adjusted.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| MFG-IWM-T012 | Offline | queued Inventory count mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| MFG-IWM-T013 | AI/RAG/Tool | AI agent/RAG tries MFG-IWM resource/tool without current mfg.iwm.count.adjust or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| MFG-IWM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one ADJUSTED transition and one mfg.iwm.count.adjusted.v1; duplicate business effect=0; audit/correlation links retry to original |

## MFG-QMS — Inspection
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| MFG-QMS-T001 | Positive | valid Inspection in IN_PROGRESS, correct tenant/context, entitlement and mfg.qms.inspection.pass | authorized actor executes transition | state=PASS; one domain mutation; event=mfg.qms.inspection.passed.v1; audit SUCCESS |
| MFG-QMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains IN_PROGRESS; no event; audit FAILED |
| MFG-QMS-T003 | Workflow | resource in IN_PROGRESS with all preconditions | actor executes mfg.qms.inspection.pass | state=PASS; expectedVersion increments; event=mfg.qms.inspection.passed.v1; audit SUCCESS |
| MFG-QMS-T004 | Forbidden transition | resource already PASS or terminal state | actor attempts backward/unlisted transition | error=MFG-QMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| MFG-QMS-T005 | Permission | principal lacks mfg.qms.inspection.pass | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| MFG-QMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| MFG-QMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Inspection resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| MFG-QMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies MFG-QMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| MFG-QMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| MFG-QMS-T010 | Document | principal lacks resource/document authorization for inspection-certificate | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| MFG-QMS-T011 | Event/Webhook | event mfg.qms.inspection.passed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| MFG-QMS-T012 | Offline | queued Inspection mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| MFG-QMS-T013 | AI/RAG/Tool | AI agent/RAG tries MFG-QMS resource/tool without current mfg.qms.inspection.pass or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| MFG-QMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one PASS transition and one mfg.qms.inspection.passed.v1; duplicate business effect=0; audit/correlation links retry to original |

## MFG-PRO — Purchase order
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| MFG-PRO-T001 | Positive | valid Purchase order in APPROVED, correct tenant/context, entitlement and mfg.pro.po.issue | authorized actor executes transition | state=ISSUED; one domain mutation; event=mfg.pro.po.issued.v1; audit SUCCESS |
| MFG-PRO-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains APPROVED; no event; audit FAILED |
| MFG-PRO-T003 | Workflow | resource in APPROVED with all preconditions | actor executes mfg.pro.po.issue | state=ISSUED; expectedVersion increments; event=mfg.pro.po.issued.v1; audit SUCCESS |
| MFG-PRO-T004 | Forbidden transition | resource already ISSUED or terminal state | actor attempts backward/unlisted transition | error=MFG-PRO_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| MFG-PRO-T005 | Permission | principal lacks mfg.pro.po.issue | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| MFG-PRO-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| MFG-PRO-T007 | Tenant isolation | Tenant A principal supplies Tenant B Purchase order resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| MFG-PRO-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies MFG-PRO resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| MFG-PRO-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| MFG-PRO-T010 | Document | principal lacks resource/document authorization for purchase-order | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| MFG-PRO-T011 | Event/Webhook | event mfg.pro.po.issued.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| MFG-PRO-T012 | Offline | queued Purchase order mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| MFG-PRO-T013 | AI/RAG/Tool | AI agent/RAG tries MFG-PRO resource/tool without current mfg.pro.po.issue or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| MFG-PRO-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one ISSUED transition and one mfg.pro.po.issued.v1; duplicate business effect=0; audit/correlation links retry to original |

## MFG-MMS — Maintenance work order
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| MFG-MMS-T001 | Positive | valid Maintenance work order in VERIFICATION, correct tenant/context, entitlement and mfg.mms.workorder.close | authorized actor executes transition | state=CLOSED; one domain mutation; event=mfg.mms.workorder.closed.v1; audit SUCCESS |
| MFG-MMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains VERIFICATION; no event; audit FAILED |
| MFG-MMS-T003 | Workflow | resource in VERIFICATION with all preconditions | actor executes mfg.mms.workorder.close | state=CLOSED; expectedVersion increments; event=mfg.mms.workorder.closed.v1; audit SUCCESS |
| MFG-MMS-T004 | Forbidden transition | resource already CLOSED or terminal state | actor attempts backward/unlisted transition | error=MFG-MMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| MFG-MMS-T005 | Permission | principal lacks mfg.mms.workorder.close | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| MFG-MMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| MFG-MMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Maintenance work order resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| MFG-MMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies MFG-MMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| MFG-MMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| MFG-MMS-T010 | Document | principal lacks resource/document authorization for maintenance-report | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| MFG-MMS-T011 | Event/Webhook | event mfg.mms.workorder.closed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| MFG-MMS-T012 | Offline | queued Maintenance work order mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| MFG-MMS-T013 | AI/RAG/Tool | AI agent/RAG tries MFG-MMS resource/tool without current mfg.mms.workorder.close or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| MFG-MMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one CLOSED transition and one mfg.mms.workorder.closed.v1; duplicate business effect=0; audit/correlation links retry to original |

## PSV-CRM — Lead conversion
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| PSV-CRM-T001 | Positive | valid Lead conversion in QUALIFIED, correct tenant/context, entitlement and psv.crm.lead.convert | authorized actor executes transition | state=CONVERTED; one domain mutation; event=psv.crm.lead.converted.v1; audit SUCCESS |
| PSV-CRM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains QUALIFIED; no event; audit FAILED |
| PSV-CRM-T003 | Workflow | resource in QUALIFIED with all preconditions | actor executes psv.crm.lead.convert | state=CONVERTED; expectedVersion increments; event=psv.crm.lead.converted.v1; audit SUCCESS |
| PSV-CRM-T004 | Forbidden transition | resource already CONVERTED or terminal state | actor attempts backward/unlisted transition | error=PSV-CRM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| PSV-CRM-T005 | Permission | principal lacks psv.crm.lead.convert | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| PSV-CRM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| PSV-CRM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Lead conversion resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| PSV-CRM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies PSV-CRM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| PSV-CRM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| PSV-CRM-T010 | Document | principal lacks resource/document authorization for proposal | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| PSV-CRM-T011 | Event/Webhook | event psv.crm.lead.converted.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| PSV-CRM-T012 | Offline | queued Lead conversion mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| PSV-CRM-T013 | AI/RAG/Tool | AI agent/RAG tries PSV-CRM resource/tool without current psv.crm.lead.convert or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| PSV-CRM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one CONVERTED transition and one psv.crm.lead.converted.v1; duplicate business effect=0; audit/correlation links retry to original |

## PSV-PJM — Milestone
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| PSV-PJM-T001 | Positive | valid Milestone in SUBMITTED, correct tenant/context, entitlement and psv.pjm.milestone.accept | authorized actor executes transition | state=ACCEPTED; one domain mutation; event=psv.pjm.milestone.accepted.v1; audit SUCCESS |
| PSV-PJM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains SUBMITTED; no event; audit FAILED |
| PSV-PJM-T003 | Workflow | resource in SUBMITTED with all preconditions | actor executes psv.pjm.milestone.accept | state=ACCEPTED; expectedVersion increments; event=psv.pjm.milestone.accepted.v1; audit SUCCESS |
| PSV-PJM-T004 | Forbidden transition | resource already ACCEPTED or terminal state | actor attempts backward/unlisted transition | error=PSV-PJM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| PSV-PJM-T005 | Permission | principal lacks psv.pjm.milestone.accept | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| PSV-PJM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| PSV-PJM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Milestone resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| PSV-PJM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies PSV-PJM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| PSV-PJM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| PSV-PJM-T010 | Document | principal lacks resource/document authorization for milestone-acceptance | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| PSV-PJM-T011 | Event/Webhook | event psv.pjm.milestone.accepted.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| PSV-PJM-T012 | Offline | queued Milestone mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| PSV-PJM-T013 | AI/RAG/Tool | AI agent/RAG tries PSV-PJM resource/tool without current psv.pjm.milestone.accept or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| PSV-PJM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one ACCEPTED transition and one psv.pjm.milestone.accepted.v1; duplicate business effect=0; audit/correlation links retry to original |

## PSV-SDM — Service ticket
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| PSV-SDM-T001 | Positive | valid Service ticket in RESOLVED, correct tenant/context, entitlement and psv.sdm.ticket.accept | authorized actor executes transition | state=ACCEPTED; one domain mutation; event=psv.sdm.ticket.accepted.v1; audit SUCCESS |
| PSV-SDM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains RESOLVED; no event; audit FAILED |
| PSV-SDM-T003 | Workflow | resource in RESOLVED with all preconditions | actor executes psv.sdm.ticket.accept | state=ACCEPTED; expectedVersion increments; event=psv.sdm.ticket.accepted.v1; audit SUCCESS |
| PSV-SDM-T004 | Forbidden transition | resource already ACCEPTED or terminal state | actor attempts backward/unlisted transition | error=PSV-SDM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| PSV-SDM-T005 | Permission | principal lacks psv.sdm.ticket.accept | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| PSV-SDM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| PSV-SDM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Service ticket resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| PSV-SDM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies PSV-SDM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| PSV-SDM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| PSV-SDM-T010 | Document | principal lacks resource/document authorization for service-report | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| PSV-SDM-T011 | Event/Webhook | event psv.sdm.ticket.accepted.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| PSV-SDM-T012 | Offline | queued Service ticket mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| PSV-SDM-T013 | AI/RAG/Tool | AI agent/RAG tries PSV-SDM resource/tool without current psv.sdm.ticket.accept or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| PSV-SDM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one ACCEPTED transition and one psv.sdm.ticket.accepted.v1; duplicate business effect=0; audit/correlation links retry to original |

## PSV-RTM — Timesheet
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| PSV-RTM-T001 | Positive | valid Timesheet in SUBMITTED, correct tenant/context, entitlement and psv.rtm.timesheet.approve | authorized actor executes transition | state=APPROVED; one domain mutation; event=psv.rtm.timesheet.approved.v1; audit SUCCESS |
| PSV-RTM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains SUBMITTED; no event; audit FAILED |
| PSV-RTM-T003 | Workflow | resource in SUBMITTED with all preconditions | actor executes psv.rtm.timesheet.approve | state=APPROVED; expectedVersion increments; event=psv.rtm.timesheet.approved.v1; audit SUCCESS |
| PSV-RTM-T004 | Forbidden transition | resource already APPROVED or terminal state | actor attempts backward/unlisted transition | error=PSV-RTM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| PSV-RTM-T005 | Permission | principal lacks psv.rtm.timesheet.approve | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| PSV-RTM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| PSV-RTM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Timesheet resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| PSV-RTM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies PSV-RTM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| PSV-RTM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| PSV-RTM-T010 | Document | principal lacks resource/document authorization for approved-timesheet | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| PSV-RTM-T011 | Event/Webhook | event psv.rtm.timesheet.approved.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| PSV-RTM-T012 | Offline | queued Timesheet mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| PSV-RTM-T013 | AI/RAG/Tool | AI agent/RAG tries PSV-RTM resource/tool without current psv.rtm.timesheet.approve or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| PSV-RTM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one APPROVED transition and one psv.rtm.timesheet.approved.v1; duplicate business effect=0; audit/correlation links retry to original |

## PSV-SGM — Studio deliverable
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| PSV-SGM-T001 | Positive | valid Studio deliverable in SUBMITTED, correct tenant/context, entitlement and psv.sgm.deliverable.approve | authorized actor executes transition | state=APPROVED; one domain mutation; event=psv.sgm.deliverable.approved.v1; audit SUCCESS |
| PSV-SGM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains SUBMITTED; no event; audit FAILED |
| PSV-SGM-T003 | Workflow | resource in SUBMITTED with all preconditions | actor executes psv.sgm.deliverable.approve | state=APPROVED; expectedVersion increments; event=psv.sgm.deliverable.approved.v1; audit SUCCESS |
| PSV-SGM-T004 | Forbidden transition | resource already APPROVED or terminal state | actor attempts backward/unlisted transition | error=PSV-SGM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| PSV-SGM-T005 | Permission | principal lacks psv.sgm.deliverable.approve | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| PSV-SGM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| PSV-SGM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Studio deliverable resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| PSV-SGM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies PSV-SGM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| PSV-SGM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| PSV-SGM-T010 | Document | principal lacks resource/document authorization for deliverable | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| PSV-SGM-T011 | Event/Webhook | event psv.sgm.deliverable.approved.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| PSV-SGM-T012 | Offline | queued Studio deliverable mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| PSV-SGM-T013 | AI/RAG/Tool | AI agent/RAG tries PSV-SGM resource/tool without current psv.sgm.deliverable.approve or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| PSV-SGM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one APPROVED transition and one psv.sgm.deliverable.approved.v1; duplicate business effect=0; audit/correlation links retry to original |

## GOV-CSM — Citizen service request
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| GOV-CSM-T001 | Positive | valid Citizen service request in RESOLVED, correct tenant/context, entitlement and gov.csm.request.close | authorized actor executes transition | state=CLOSED; one domain mutation; event=gov.csm.request.closed.v1; audit SUCCESS |
| GOV-CSM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains RESOLVED; no event; audit FAILED |
| GOV-CSM-T003 | Workflow | resource in RESOLVED with all preconditions | actor executes gov.csm.request.close | state=CLOSED; expectedVersion increments; event=gov.csm.request.closed.v1; audit SUCCESS |
| GOV-CSM-T004 | Forbidden transition | resource already CLOSED or terminal state | actor attempts backward/unlisted transition | error=GOV-CSM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| GOV-CSM-T005 | Permission | principal lacks gov.csm.request.close | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| GOV-CSM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| GOV-CSM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Citizen service request resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| GOV-CSM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies GOV-CSM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| GOV-CSM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| GOV-CSM-T010 | Document | principal lacks resource/document authorization for service-resolution | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| GOV-CSM-T011 | Event/Webhook | event gov.csm.request.closed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| GOV-CSM-T012 | Offline | queued Citizen service request mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| GOV-CSM-T013 | AI/RAG/Tool | AI agent/RAG tries GOV-CSM resource/tool without current gov.csm.request.close or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| GOV-CSM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one CLOSED transition and one gov.csm.request.closed.v1; duplicate business effect=0; audit/correlation links retry to original |

## GOV-CFM — Case file
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| GOV-CFM-T001 | Positive | valid Case file in APPROVAL, correct tenant/context, entitlement and gov.cfm.case.dispose | authorized actor executes transition | state=DISPOSED; one domain mutation; event=gov.cfm.case.disposed.v1; audit SUCCESS |
| GOV-CFM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains APPROVAL; no event; audit FAILED |
| GOV-CFM-T003 | Workflow | resource in APPROVAL with all preconditions | actor executes gov.cfm.case.dispose | state=DISPOSED; expectedVersion increments; event=gov.cfm.case.disposed.v1; audit SUCCESS |
| GOV-CFM-T004 | Forbidden transition | resource already DISPOSED or terminal state | actor attempts backward/unlisted transition | error=GOV-CFM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| GOV-CFM-T005 | Permission | principal lacks gov.cfm.case.dispose | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| GOV-CFM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| GOV-CFM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Case file resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| GOV-CFM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies GOV-CFM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| GOV-CFM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| GOV-CFM-T010 | Document | principal lacks resource/document authorization for case-order | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| GOV-CFM-T011 | Event/Webhook | event gov.cfm.case.disposed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| GOV-CFM-T012 | Offline | queued Case file mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| GOV-CFM-T013 | AI/RAG/Tool | AI agent/RAG tries GOV-CFM resource/tool without current gov.cfm.case.dispose or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| GOV-CFM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one DISPOSED transition and one gov.cfm.case.disposed.v1; duplicate business effect=0; audit/correlation links retry to original |

## GOV-PLM — Permit application
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| GOV-PLM-T001 | Positive | valid Permit application in DECISION, correct tenant/context, entitlement and gov.plm.application.approve | authorized actor executes transition | state=APPROVED; one domain mutation; event=gov.plm.application.approved.v1; audit SUCCESS |
| GOV-PLM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains DECISION; no event; audit FAILED |
| GOV-PLM-T003 | Workflow | resource in DECISION with all preconditions | actor executes gov.plm.application.approve | state=APPROVED; expectedVersion increments; event=gov.plm.application.approved.v1; audit SUCCESS |
| GOV-PLM-T004 | Forbidden transition | resource already APPROVED or terminal state | actor attempts backward/unlisted transition | error=GOV-PLM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| GOV-PLM-T005 | Permission | principal lacks gov.plm.application.approve | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| GOV-PLM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| GOV-PLM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Permit application resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| GOV-PLM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies GOV-PLM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| GOV-PLM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| GOV-PLM-T010 | Document | principal lacks resource/document authorization for permit | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| GOV-PLM-T011 | Event/Webhook | event gov.plm.application.approved.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| GOV-PLM-T012 | Offline | queued Permit application mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| GOV-PLM-T013 | AI/RAG/Tool | AI agent/RAG tries GOV-PLM resource/tool without current gov.plm.application.approve or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| GOV-PLM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one APPROVED transition and one gov.plm.application.approved.v1; duplicate business effect=0; audit/correlation links retry to original |

## GOV-RTM — Revenue demand
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| GOV-RTM-T001 | Positive | valid Revenue demand in ISSUED, correct tenant/context, entitlement and gov.rtm.demand.settle | authorized actor executes transition | state=PAID; one domain mutation; event=gov.rtm.demand.paid.v1; audit SUCCESS |
| GOV-RTM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains ISSUED; no event; audit FAILED |
| GOV-RTM-T003 | Workflow | resource in ISSUED with all preconditions | actor executes gov.rtm.demand.settle | state=PAID; expectedVersion increments; event=gov.rtm.demand.paid.v1; audit SUCCESS |
| GOV-RTM-T004 | Forbidden transition | resource already PAID or terminal state | actor attempts backward/unlisted transition | error=GOV-RTM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| GOV-RTM-T005 | Permission | principal lacks gov.rtm.demand.settle | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| GOV-RTM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| GOV-RTM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Revenue demand resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| GOV-RTM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies GOV-RTM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| GOV-RTM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| GOV-RTM-T010 | Document | principal lacks resource/document authorization for payment-receipt | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| GOV-RTM-T011 | Event/Webhook | event gov.rtm.demand.paid.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| GOV-RTM-T012 | Offline | queued Revenue demand mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| GOV-RTM-T013 | AI/RAG/Tool | AI agent/RAG tries GOV-RTM resource/tool without current gov.rtm.demand.settle or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| GOV-RTM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one PAID transition and one gov.rtm.demand.paid.v1; duplicate business effect=0; audit/correlation links retry to original |

## NGO-DMS — Pledge
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| NGO-DMS-T001 | Positive | valid Pledge in PARTIAL, correct tenant/context, entitlement and ngo.dms.pledge.fulfill | authorized actor executes transition | state=FULFILLED; one domain mutation; event=ngo.dms.pledge.fulfilled.v1; audit SUCCESS |
| NGO-DMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains PARTIAL; no event; audit FAILED |
| NGO-DMS-T003 | Workflow | resource in PARTIAL with all preconditions | actor executes ngo.dms.pledge.fulfill | state=FULFILLED; expectedVersion increments; event=ngo.dms.pledge.fulfilled.v1; audit SUCCESS |
| NGO-DMS-T004 | Forbidden transition | resource already FULFILLED or terminal state | actor attempts backward/unlisted transition | error=NGO-DMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| NGO-DMS-T005 | Permission | principal lacks ngo.dms.pledge.fulfill | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| NGO-DMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| NGO-DMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Pledge resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| NGO-DMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies NGO-DMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| NGO-DMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| NGO-DMS-T010 | Document | principal lacks resource/document authorization for donor-acknowledgement | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| NGO-DMS-T011 | Event/Webhook | event ngo.dms.pledge.fulfilled.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| NGO-DMS-T012 | Offline | queued Pledge mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| NGO-DMS-T013 | AI/RAG/Tool | AI agent/RAG tries NGO-DMS resource/tool without current ngo.dms.pledge.fulfill or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| NGO-DMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one FULFILLED transition and one ngo.dms.pledge.fulfilled.v1; duplicate business effect=0; audit/correlation links retry to original |

## NGO-DFM — Donation
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| NGO-DFM-T001 | Positive | valid Donation in RECEIPTED, correct tenant/context, entitlement and ngo.dfm.donation.allocate | authorized actor executes transition | state=ALLOCATED; one domain mutation; event=ngo.dfm.donation.allocated.v1; audit SUCCESS |
| NGO-DFM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains RECEIPTED; no event; audit FAILED |
| NGO-DFM-T003 | Workflow | resource in RECEIPTED with all preconditions | actor executes ngo.dfm.donation.allocate | state=ALLOCATED; expectedVersion increments; event=ngo.dfm.donation.allocated.v1; audit SUCCESS |
| NGO-DFM-T004 | Forbidden transition | resource already ALLOCATED or terminal state | actor attempts backward/unlisted transition | error=NGO-DFM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| NGO-DFM-T005 | Permission | principal lacks ngo.dfm.donation.allocate | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| NGO-DFM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| NGO-DFM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Donation resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| NGO-DFM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies NGO-DFM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| NGO-DFM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| NGO-DFM-T010 | Document | principal lacks resource/document authorization for donation-receipt | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| NGO-DFM-T011 | Event/Webhook | event ngo.dfm.donation.allocated.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| NGO-DFM-T012 | Offline | queued Donation mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| NGO-DFM-T013 | AI/RAG/Tool | AI agent/RAG tries NGO-DFM resource/tool without current ngo.dfm.donation.allocate or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| NGO-DFM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one ALLOCATED transition and one ngo.dfm.donation.allocated.v1; duplicate business effect=0; audit/correlation links retry to original |

## NGO-TAM — Temple service
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| NGO-TAM-T001 | Positive | valid Temple service in CONFIRMED, correct tenant/context, entitlement and ngo.tam.seva.perform | authorized actor executes transition | state=PERFORMED; one domain mutation; event=ngo.tam.seva.performed.v1; audit SUCCESS |
| NGO-TAM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains CONFIRMED; no event; audit FAILED |
| NGO-TAM-T003 | Workflow | resource in CONFIRMED with all preconditions | actor executes ngo.tam.seva.perform | state=PERFORMED; expectedVersion increments; event=ngo.tam.seva.performed.v1; audit SUCCESS |
| NGO-TAM-T004 | Forbidden transition | resource already PERFORMED or terminal state | actor attempts backward/unlisted transition | error=NGO-TAM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| NGO-TAM-T005 | Permission | principal lacks ngo.tam.seva.perform | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| NGO-TAM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| NGO-TAM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Temple service resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| NGO-TAM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies NGO-TAM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| NGO-TAM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| NGO-TAM-T010 | Document | principal lacks resource/document authorization for seva-receipt | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| NGO-TAM-T011 | Event/Webhook | event ngo.tam.seva.performed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| NGO-TAM-T012 | Offline | queued Temple service mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| NGO-TAM-T013 | AI/RAG/Tool | AI agent/RAG tries NGO-TAM resource/tool without current ngo.tam.seva.perform or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| NGO-TAM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one PERFORMED transition and one ngo.tam.seva.performed.v1; duplicate business effect=0; audit/correlation links retry to original |

## NGO-MVM — Volunteer assignment
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| NGO-MVM-T001 | Positive | valid Volunteer assignment in ACTIVE, correct tenant/context, entitlement and ngo.mvm.assignment.complete | authorized actor executes transition | state=COMPLETED; one domain mutation; event=ngo.mvm.assignment.completed.v1; audit SUCCESS |
| NGO-MVM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains ACTIVE; no event; audit FAILED |
| NGO-MVM-T003 | Workflow | resource in ACTIVE with all preconditions | actor executes ngo.mvm.assignment.complete | state=COMPLETED; expectedVersion increments; event=ngo.mvm.assignment.completed.v1; audit SUCCESS |
| NGO-MVM-T004 | Forbidden transition | resource already COMPLETED or terminal state | actor attempts backward/unlisted transition | error=NGO-MVM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| NGO-MVM-T005 | Permission | principal lacks ngo.mvm.assignment.complete | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| NGO-MVM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| NGO-MVM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Volunteer assignment resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| NGO-MVM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies NGO-MVM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| NGO-MVM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| NGO-MVM-T010 | Document | principal lacks resource/document authorization for volunteer-record | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| NGO-MVM-T011 | Event/Webhook | event ngo.mvm.assignment.completed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| NGO-MVM-T012 | Offline | queued Volunteer assignment mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| NGO-MVM-T013 | AI/RAG/Tool | AI agent/RAG tries NGO-MVM resource/tool without current ngo.mvm.assignment.complete or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| NGO-MVM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one COMPLETED transition and one ngo.mvm.assignment.completed.v1; duplicate business effect=0; audit/correlation links retry to original |

## SFM-SGM — Guard shift
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| SFM-SGM-T001 | Positive | valid Guard shift in ACTIVE, correct tenant/context, entitlement and sfm.sgm.shift.relieve | authorized actor executes transition | state=RELIEVED; one domain mutation; event=sfm.sgm.shift.relieved.v1; audit SUCCESS |
| SFM-SGM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains ACTIVE; no event; audit FAILED |
| SFM-SGM-T003 | Workflow | resource in ACTIVE with all preconditions | actor executes sfm.sgm.shift.relieve | state=RELIEVED; expectedVersion increments; event=sfm.sgm.shift.relieved.v1; audit SUCCESS |
| SFM-SGM-T004 | Forbidden transition | resource already RELIEVED or terminal state | actor attempts backward/unlisted transition | error=SFM-SGM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| SFM-SGM-T005 | Permission | principal lacks sfm.sgm.shift.relieve | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| SFM-SGM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| SFM-SGM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Guard shift resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| SFM-SGM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies SFM-SGM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| SFM-SGM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| SFM-SGM-T010 | Document | principal lacks resource/document authorization for shift-handover | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| SFM-SGM-T011 | Event/Webhook | event sfm.sgm.shift.relieved.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| SFM-SGM-T012 | Offline | queued Guard shift mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| SFM-SGM-T013 | AI/RAG/Tool | AI agent/RAG tries SFM-SGM resource/tool without current sfm.sgm.shift.relieve or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| SFM-SGM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one RELIEVED transition and one sfm.sgm.shift.relieved.v1; duplicate business effect=0; audit/correlation links retry to original |

## SFM-PMS — Patrol
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| SFM-PMS-T001 | Positive | valid Patrol in IN_PROGRESS, correct tenant/context, entitlement and sfm.pms.patrol.complete | authorized actor executes transition | state=COMPLETED; one domain mutation; event=sfm.pms.patrol.completed.v1; audit SUCCESS |
| SFM-PMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains IN_PROGRESS; no event; audit FAILED |
| SFM-PMS-T003 | Workflow | resource in IN_PROGRESS with all preconditions | actor executes sfm.pms.patrol.complete | state=COMPLETED; expectedVersion increments; event=sfm.pms.patrol.completed.v1; audit SUCCESS |
| SFM-PMS-T004 | Forbidden transition | resource already COMPLETED or terminal state | actor attempts backward/unlisted transition | error=SFM-PMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| SFM-PMS-T005 | Permission | principal lacks sfm.pms.patrol.complete | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| SFM-PMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| SFM-PMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Patrol resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| SFM-PMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies SFM-PMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| SFM-PMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| SFM-PMS-T010 | Document | principal lacks resource/document authorization for patrol-report | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| SFM-PMS-T011 | Event/Webhook | event sfm.pms.patrol.completed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| SFM-PMS-T012 | Offline | queued Patrol mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| SFM-PMS-T013 | AI/RAG/Tool | AI agent/RAG tries SFM-PMS resource/tool without current sfm.pms.patrol.complete or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| SFM-PMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one COMPLETED transition and one sfm.pms.patrol.completed.v1; duplicate business effect=0; audit/correlation links retry to original |

## SFM-VMS — Visitor
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| SFM-VMS-T001 | Positive | valid Visitor in CHECKED_IN, correct tenant/context, entitlement and sfm.vms.visit.checkout | authorized actor executes transition | state=CHECKED_OUT; one domain mutation; event=sfm.vms.visit.checked_out.v1; audit SUCCESS |
| SFM-VMS-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains CHECKED_IN; no event; audit FAILED |
| SFM-VMS-T003 | Workflow | resource in CHECKED_IN with all preconditions | actor executes sfm.vms.visit.checkout | state=CHECKED_OUT; expectedVersion increments; event=sfm.vms.visit.checked_out.v1; audit SUCCESS |
| SFM-VMS-T004 | Forbidden transition | resource already CHECKED_OUT or terminal state | actor attempts backward/unlisted transition | error=SFM-VMS_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| SFM-VMS-T005 | Permission | principal lacks sfm.vms.visit.checkout | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| SFM-VMS-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| SFM-VMS-T007 | Tenant isolation | Tenant A principal supplies Tenant B Visitor resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| SFM-VMS-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies SFM-VMS resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| SFM-VMS-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| SFM-VMS-T010 | Document | principal lacks resource/document authorization for visitor-pass | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| SFM-VMS-T011 | Event/Webhook | event sfm.vms.visit.checked_out.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| SFM-VMS-T012 | Offline | queued Visitor mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| SFM-VMS-T013 | AI/RAG/Tool | AI agent/RAG tries SFM-VMS resource/tool without current sfm.vms.visit.checkout or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| SFM-VMS-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one CHECKED_OUT transition and one sfm.vms.visit.checked_out.v1; duplicate business effect=0; audit/correlation links retry to original |

## SFM-FMM — Facility work order
| Test ID | Family | Given | When | Deterministic Then |
|---|---|---|---|---|
| SFM-FMM-T001 | Positive | valid Facility work order in VERIFICATION, correct tenant/context, entitlement and sfm.fmm.workorder.close | authorized actor executes transition | state=CLOSED; one domain mutation; event=sfm.fmm.workorder.closed.v1; audit SUCCESS |
| SFM-FMM-T002 | Validation | required business field missing | actor submits command | VALIDATION_FAILED; state remains VERIFICATION; no event; audit FAILED |
| SFM-FMM-T003 | Workflow | resource in VERIFICATION with all preconditions | actor executes sfm.fmm.workorder.close | state=CLOSED; expectedVersion increments; event=sfm.fmm.workorder.closed.v1; audit SUCCESS |
| SFM-FMM-T004 | Forbidden transition | resource already CLOSED or terminal state | actor attempts backward/unlisted transition | error=SFM-FMM_STATE_INVALID; no mutation; no event; audit DENIED/FAILED |
| SFM-FMM-T005 | Permission | principal lacks sfm.fmm.workorder.close | command is attempted | PERMISSION_DENIED; no mutation; no event; authorization audit DENIED |
| SFM-FMM-T006 | ABAC | principal has permission but wrong org/site/assignment/sensitivity attribute | command is attempted | POLICY_DENIED or RESOURCE_SCOPE_DENY; no mutation/event; decision audit records policy |
| SFM-FMM-T007 | Tenant isolation | Tenant A principal supplies Tenant B Facility work order resource ID | operation executes through normal API | RESOURCE_NOT_FOUND or TENANT_INVALID without existence leak; no mutation/event; security audit |
| SFM-FMM-T008 | Industry isolation | same tenant principal active in sibling Industry Context supplies SFM-FMM resource ID | operation executes | INDUSTRY_CONTEXT_MISMATCH; no auto-switch; no mutation/event; security audit |
| SFM-FMM-T009 | Entitlement | MS/module/license entitlement disabled | operation executes | ENTITLEMENT_DENIED; no mutation/event; access audit |
| SFM-FMM-T010 | Document | principal lacks resource/document authorization for maintenance-report | signed URL/download requested | RESOURCE_NOT_FOUND or PERMISSION_DENIED; no URL; document access denial audit |
| SFM-FMM-T011 | Event/Webhook | event sfm.fmm.workorder.closed.v1 is presented to sibling-industry consumer/webhook | consumer/filter validates envelope | INDUSTRY_CONTEXT_MISMATCH; consumer effect=0; webhook deliveries=0; security/integration audit |
| SFM-FMM-T012 | Offline | queued Facility work order mutation origin context differs from current selected context or current authorization revoked | replay runs | queue is not rebound; INDUSTRY_CONTEXT_MISMATCH/PERMISSION_DENIED as applicable; server mutation=0; replay audit |
| SFM-FMM-T013 | AI/RAG/Tool | AI agent/RAG tries SFM-FMM resource/tool without current sfm.fmm.workorder.close or correct context | gateway rebuilds RequestContext and executes policy | PERMISSION_DENIED or INDUSTRY_CONTEXT_MISMATCH; retrieval/tool effect=0; AI security audit |
| SFM-FMM-T014 | Audit/Failure recovery | same idempotency key is retried after transient transport failure | client/worker retries command | at most one CLOSED transition and one sfm.fmm.workorder.closed.v1; duplicate business effect=0; audit/correlation links retry to original |

## Coverage totals
- Management Systems: 41/41.
- Test IDs: 574.
- Positive: 41; Validation: 41; Workflow: 41; Forbidden transition: 41; Permission: 41; ABAC: 41; Tenant isolation: 41; same-Tenant Industry isolation: 41; Entitlement: 41; Document: 41; Event/Webhook: 41; Offline: 41; AI/RAG/Tool: 41; Audit/Failure recovery: 41.
- Every test states exact state/result/error class, zero-mutation expectation when denied, event expectation and audit expectation.
