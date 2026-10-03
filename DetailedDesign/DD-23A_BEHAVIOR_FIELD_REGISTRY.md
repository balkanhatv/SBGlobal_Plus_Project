# DD-23A — BEHAVIOR-BEARING FIELD REGISTRY
**Date:** 2026-09-11 · **Status:** FABLE 5 REMEDIATION EVIDENCE

This registry classifies every detected code/type/class-like text field in the canonical 41-MS entity tables. A field in this registry MUST validate against the listed contract; arbitrary text is not allowed to drive branching.

| MS | Table | Field | Contract | Catalog/master owner |
|---|---|---|---|---|
| HLT-HMS | `hlt_hms_bed` | `ward_code` | MASTER_IDENTIFIER | HLT-HMS owning master/entity |
| HLT-HMS | `hlt_hms_bed` | `bed_code` | MASTER_IDENTIFIER | HLT-HMS owning master/entity |
| HLT-HMS | `hlt_hms_bed` | `bed_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-HMS owning catalog/master under DD-23 |
| HLT-HMS | `hlt_hms_bed_transfer` | `reason_code` | VERSIONED_REASON_CATALOG + optional narrative note | HLT-HMS reason catalog / CORE-REASON seed |
| HLT-HMS | `hlt_hms_order` | `priority_code` | STATIC_ENUM PriorityClass | DD-23 platform enum |
| HLT-HMS | `hlt_hms_nursing_observation` | `observation_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-HMS owning catalog/master under DD-23 |
| HLT-HMS | `hlt_hms_ot_case` | `procedure_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-HMS owning catalog/master under DD-23 |
| HLT-LIS | `hlt_lis_order` | `priority_code` | STATIC_ENUM PriorityClass | DD-23 platform enum |
| HLT-LIS | `hlt_lis_order_test` | `specimen_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-LIS owning catalog/master under DD-23 |
| HLT-LIS | `hlt_lis_order_test` | `department_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-LIS owning catalog/master under DD-23 |
| HLT-LIS | `hlt_lis_specimen` | `specimen_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-LIS owning catalog/master under DD-23 |
| HLT-LIS | `hlt_lis_specimen` | `container_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-LIS owning catalog/master under DD-23 |
| HLT-LIS | `hlt_lis_rejection` | `reason_code` | VERSIONED_REASON_CATALOG + optional narrative note | HLT-LIS reason catalog / CORE-REASON seed |
| HLT-LIS | `hlt_lis_result` | `parameter_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-LIS owning catalog/master under DD-23 |
| HLT-LIS | `hlt_lis_result` | `unit_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-LIS owning catalog/master under DD-23 |
| HLT-LIS | `hlt_lis_result` | `flag_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-LIS owning catalog/master under DD-23 |
| HLT-LIS | `hlt_lis_test_catalog` | `tat_class` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-LIS owning catalog/master under DD-23 |
| HLT-RIS | `hlt_ris_order` | `exam_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-RIS owning catalog/master under DD-23 |
| HLT-RIS | `hlt_ris_order` | `modality_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-RIS owning catalog/master under DD-23 |
| HLT-RIS | `hlt_ris_order` | `priority_code` | STATIC_ENUM PriorityClass | DD-23 platform enum |
| HLT-RIS | `hlt_ris_appointment` | `prep_status` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-RIS owning catalog/master under DD-23 |
| HLT-RIS | `hlt_ris_contrast_screen` | `override_reason_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-RIS owning catalog/master under DD-23 |
| HLT-RIS | `hlt_ris_exam` | `repeat_reason_code` | VERSIONED_REASON_CATALOG + optional narrative note | HLT-RIS reason catalog / CORE-REASON seed |
| HLT-RIS | `hlt_ris_report` | `template_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-RIS owning catalog/master under DD-23 |
| HLT-RIS | `hlt_ris_critical_finding` | `finding_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-RIS owning catalog/master under DD-23 |
| HLT-RIS | `hlt_ris_critical_finding` | `severity_code` | STATIC_ENUM SeverityClass | DD-23 platform enum |
| HLT-PMS | `hlt_pms_prescription_line` | `substitution_policy` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-PMS owning catalog/master under DD-23 |
| HLT-PMS | `hlt_pms_dispense_line` | `override_reason_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-PMS owning catalog/master under DD-23 |
| HLT-CMS | `hlt_cms_appointment` | `visit_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-CMS owning catalog/master under DD-23 |
| HLT-CMS | `hlt_cms_procedure` | `procedure_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-CMS owning catalog/master under DD-23 |
| HLT-CMS | `hlt_cms_referral` | `target_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-CMS owning catalog/master under DD-23 |
| HLT-CMS | `hlt_cms_followup` | `protocol_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HLT-CMS owning catalog/master under DD-23 |
| EDU-SMS | `edu_sms_class_section` | `class_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | EDU-SMS owning catalog/master under DD-23 |
| EDU-SMS | `edu_sms_class_section` | `section_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | EDU-SMS owning catalog/master under DD-23 |
| EDU-SMS | `edu_sms_attendance` | `period_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | EDU-SMS owning catalog/master under DD-23 |
| EDU-CUM | `edu_cum_course_offering` | `course_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | EDU-CUM owning catalog/master under DD-23 |
| EDU-CTM | `edu_ctm_batch` | `course_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | EDU-CTM owning catalog/master under DD-23 |
| EDU-CTM | `edu_ctm_completion` | `assessment_status` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | EDU-CTM owning catalog/master under DD-23 |
| EDU-EMS | `edu_ems_candidate` | `hold_reason_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | EDU-EMS owning catalog/master under DD-23 |
| EDU-EMS | `edu_ems_evaluation` | `subject_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | EDU-EMS owning catalog/master under DD-23 |
| RTL-RSM | `rtl_rsm_cash_movement` | `reason_code` | VERSIONED_REASON_CATALOG + optional narrative note | RTL-RSM reason catalog / CORE-REASON seed |
| RTL-RSM | `rtl_rsm_counter_shift` | `counter_code` | MASTER_IDENTIFIER | RTL-RSM owning master/entity |
| RTL-RSM | `rtl_rsm_checklist` | `checklist_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | RTL-RSM owning catalog/master under DD-23 |
| RTL-RSM | `rtl_rsm_checklist` | `item_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | RTL-RSM owning catalog/master under DD-23 |
| RTL-POS | `rtl_pos_session` | `counter_code` | MASTER_IDENTIFIER | RTL-POS owning master/entity |
| RTL-POS | `rtl_pos_tender` | `tender_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | RTL-POS owning catalog/master under DD-23 |
| RTL-OMS | `rtl_oms_return_case` | `reason_code` | VERSIONED_REASON_CATALOG + optional narrative note | RTL-OMS reason catalog / CORE-REASON seed |
| RTL-MKT | `rtl_mkt_seller` | `seller_code` | MASTER_IDENTIFIER | RTL-MKT owning master/entity |
| HSP-HMS | `hsp_hms_housekeeping` | `priority_code` | STATIC_ENUM PriorityClass | DD-23 platform enum |
| HSP-HMS | `hsp_hms_folio_entry` | `entry_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HSP-HMS owning catalog/master under DD-23 |
| HSP-RMS | `hsp_rms_kot` | `station_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HSP-RMS owning catalog/master under DD-23 |
| HSP-RMS | `hsp_rms_reversal` | `reason_code` | VERSIONED_REASON_CATALOG + optional narrative note | HSP-RMS reason catalog / CORE-REASON seed |
| HSP-BEM | `hsp_bem_enquiry` | `event_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HSP-BEM owning catalog/master under DD-23 |
| HSP-BEM | `hsp_bem_booking` | `package_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HSP-BEM owning catalog/master under DD-23 |
| HSP-BEM | `hsp_bem_charge` | `charge_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | HSP-BEM owning catalog/master under DD-23 |
| MFG-QMS | `mfg_qms_inspection` | `source_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | MFG-QMS owning catalog/master under DD-23 |
| MFG-QMS | `mfg_qms_ncr` | `defect_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | MFG-QMS owning catalog/master under DD-23 |
| MFG-QMS | `mfg_qms_ncr` | `severity_code` | STATIC_ENUM SeverityClass | DD-23 platform enum |
| MFG-MMS | `mfg_mms_asset` | `asset_code` | MASTER_IDENTIFIER | MFG-MMS owning master/entity |
| MFG-MMS | `mfg_mms_schedule` | `maintenance_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | MFG-MMS owning catalog/master under DD-23 |
| MFG-MMS | `mfg_mms_work_order` | `priority_code` | STATIC_ENUM PriorityClass | DD-23 platform enum |
| MFG-MMS | `mfg_mms_downtime` | `cause_code` | VERSIONED_REASON_CATALOG + optional narrative note | MFG-MMS reason catalog / CORE-REASON seed |
| PSV-CRM | `psv_crm_activity` | `activity_type_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | PSV-CRM owning catalog/master under DD-23 |
| PSV-SDM | `psv_sdm_contract_ref` | `service_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | PSV-SDM owning catalog/master under DD-23 |
| PSV-SDM | `psv_sdm_ticket` | `priority_code` | STATIC_ENUM PriorityClass | DD-23 platform enum |
| PSV-SDM | `psv_sdm_sla_clock` | `metric_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | PSV-SDM owning catalog/master under DD-23 |
| PSV-SGM | `psv_sgm_booking` | `package_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | PSV-SGM owning catalog/master under DD-23 |
| GOV-CSM | `gov_csm_request` | `service_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | GOV-CSM owning catalog/master under DD-23 |
| GOV-CSM | `gov_csm_sla` | `category_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | GOV-CSM owning catalog/master under DD-23 |
| GOV-CSM | `gov_csm_action` | `action_type_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | GOV-CSM owning catalog/master under DD-23 |
| GOV-CFM | `gov_cfm_decision` | `level_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | GOV-CFM owning catalog/master under DD-23 |
| GOV-PLM | `gov_plm_application` | `permit_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | GOV-PLM owning catalog/master under DD-23 |
| GOV-RTM | `gov_rtm_assessment` | `tax_head_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | GOV-RTM owning catalog/master under DD-23 |
| NGO-DMS | `ngo_dms_segment` | `segment_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | NGO-DMS owning catalog/master under DD-23 |
| NGO-DMS | `ngo_dms_segment` | `reason_code` | VERSIONED_REASON_CATALOG + optional narrative note | NGO-DMS reason catalog / CORE-REASON seed |
| NGO-DFM | `ngo_dfm_fund` | `fund_code` | MASTER_IDENTIFIER | NGO-DFM owning master/entity |
| NGO-DFM | `ngo_dfm_fund` | `purpose_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | NGO-DFM owning catalog/master under DD-23 |
| NGO-DFM | `ngo_dfm_utilization` | `purpose_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | NGO-DFM owning catalog/master under DD-23 |
| NGO-TAM | `ngo_tam_event` | `event_code` | MASTER_IDENTIFIER | NGO-TAM owning master/entity |
| NGO-TAM | `ngo_tam_dispatch` | `dispatch_type` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | NGO-TAM owning catalog/master under DD-23 |
| NGO-MVM | `ngo_mvm_membership` | `type_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | NGO-MVM owning catalog/master under DD-23 |
| NGO-MVM | `ngo_mvm_assignment` | `role_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | NGO-MVM owning catalog/master under DD-23 |
| SFM-SGM | `sfm_sgm_post` | `post_code` | MASTER_IDENTIFIER | SFM-SGM owning master/entity |
| SFM-PMS | `sfm_pms_route` | `route_code` | MASTER_IDENTIFIER | SFM-PMS owning master/entity |
| SFM-PMS | `sfm_pms_scan` | `checkpoint_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | SFM-PMS owning catalog/master under DD-23 |
| SFM-PMS | `sfm_pms_incident` | `category_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | SFM-PMS owning catalog/master under DD-23 |
| SFM-PMS | `sfm_pms_incident` | `severity_code` | STATIC_ENUM SeverityClass | DD-23 platform enum |
| SFM-VMS | `sfm_vms_visitor` | `privacy_class` | STATIC_ENUM PrivacyClass | DD-23 platform enum |
| SFM-VMS | `sfm_vms_badge` | `badge_code` | MASTER_IDENTIFIER | SFM-VMS owning master/entity |
| SFM-FMM | `sfm_fmm_asset` | `asset_code` | MASTER_IDENTIFIER | SFM-FMM owning master/entity |
| SFM-FMM | `sfm_fmm_ticket` | `category_code` | VERSIONED_CATALOG_OR_OWNING_MASTER_REF | SFM-FMM owning catalog/master under DD-23 |
| SFM-FMM | `sfm_fmm_ticket` | `priority_code` | STATIC_ENUM PriorityClass | DD-23 platform enum |

## Validation
- MASTER_IDENTIFIER: must resolve to an ACTIVE same-Tenant+Industry master/entity; unknown code → `VALIDATION_FAILED`.
- STATIC_ENUM: exact product-defined values only.
- VERSIONED_CATALOG_OR_OWNING_MASTER_REF: code + catalog/version snapshot; inactive/unknown → `VALIDATION_FAILED`.
- VERSIONED_REASON_CATALOG: reason code drives behavior/reporting; free-form note is descriptive only and may never branch logic.
- Sibling-industry catalog/master → `INDUSTRY_CONTEXT_MISMATCH`.
- Catalog semantic mutation-in-place is forbidden; publish a new version/migration mapping.
