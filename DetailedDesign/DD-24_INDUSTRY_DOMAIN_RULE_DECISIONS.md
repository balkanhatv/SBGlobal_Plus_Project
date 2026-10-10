# DD-24 — INDUSTRY DOMAIN-RULE DECISIONS
**Status:** ACTIVE REMEDIATION EVIDENCE · **Date:** 2026-09-11
**Provenance:** **[DD-AC — user-authorized vision-centric Detailed Design completion]**

These are SBGlobal Plus product-design defaults where upstream requirements require deterministic behavior but do not prescribe exact values. They are **not statutory/legal facts**. Jurisdiction/contract/tenant variants are versioned policy overrides and may tighten/alter behavior where allowed, without weakening security/isolation/audit floors.

## Common override hierarchy
Platform safety floor → jurisdiction/contract policy → tenant policy → Industry Context policy → operation-specific exception approved by named permission. Every override is versioned, effective-dated and audited. Historical transactions retain the policy/version snapshot used.

---

## Education policies

### EDU-AC-001 — AttendancePolicy
- Period model: configurable DAILY or PERIOD; default PERIOD for timetable-based institutions, DAILY for non-timetable cohorts.
- Values: PRESENT, ABSENT, LATE, EXCUSED.
- Default late threshold: 10 minutes after scheduled start; tenant may configure 0–60 minutes.
- Correction window: 48 hours after session close by Teacher; after 48h only `edu.attendance.correct_late` approver; after term lock only Registrar/Admin with reason.
- Lock: attendance locks at term result publication; correction creates append-only adjustment, never silent rewrite.
- Tests: EDU-SMS-T015 late threshold; T016 correction within window; T017 late correction denied without permission; T018 post-lock adjustment produces audit/event.

### EDU-AC-002 — PromotionPolicy
- Inputs: required-subject pass set, minimum aggregate, attendance minimum, unresolved disciplinary/fee hold flags where tenant elects them.
- Safe default: all mandatory subjects passed + overall aggregate ≥40% + attendance ≥75%.
- Manual override requires `edu.promotion.override`, reason and second approver; cannot erase failed marks.
- Grace marks disabled by default; if enabled, max 5 aggregate marks and never more than 2 subjects; policy version captured.
- Tests: EDU-SMS-T019 default promote; T020 attendance failure holds promotion; T021 override needs approval.

### EDU-AC-003 — GradingPolicy
- Default numeric scale: A+ ≥90, A ≥80, B ≥70, C ≥60, D ≥50, E ≥40, F <40.
- Rounding: half-up to 2 decimals at component aggregation; final displayed whole-number rounding only after aggregate calculation.
- Moderation: disabled by default; if enabled, change requires moderator permission and reason, with pre/post marks retained.
- Re-evaluation creates a new result version; published result is superseded, not mutated.
- Tests: EDU-EMS-T015 boundary grades; T016 rounding; T017 moderation audit; T018 republish version.

### EDU-AC-004 — ExamPublicationPolicy
- Marks: DRAFT→SUBMITTED→MODERATED/FINAL; Exam cannot move APPROVED→PUBLISHED until all required candidates are FINAL or explicitly held.
- Publication lock: PUBLISHED results immutable; correction uses WITHDRAW_PUBLICATION command → corrected version → re-approval → re-publication.
- Withdrawal requires `edu.ems.result.withdraw` + reason + Controller/authorized approver.
- Tests: EDU-EMS-T019 incomplete candidate blocks publish; T020 unauthorized withdrawal denied; T021 corrected version event.

---

## Retail policies

### RTL-AC-001 — CashControlPolicy
- Opening float is declared before POS session opens.
- Blind count default: cashier submits counted total without system expected cash; manager sees variance after submission.
- Variance tolerance default: ±INR 100 or ±0.25% of expected cash, whichever is greater; currency/tenant policy configurable.
- Above tolerance: session remains CLOSING/RECONCILIATION, requires `rtl.cash.variance.approve` manager approval.
- Pickup required when drawer cash exceeds configurable threshold; default INR 25,000.
- Banking movement requires dual evidence: amount + deposit/reference document.
- Tests: RTL-RSM-T015 blind count; T016 within tolerance auto-reconcile; T017 above tolerance requires approval; T018 duplicate banking ref rejected.

### RTL-AC-002 — PriceOverridePolicy
- Cashier self-override default maximum: 5% discount from current authorized price.
- Supervisor: up to 15%.
- Above 15% requires Store Manager `rtl.pos.price_override.approve`.
- Below configured cost floor is denied unless explicit loss-leader campaign entitlement/policy exists.
- Reason catalog mandatory; original price and policy version retained.
- Tests: RTL-POS-T015 5% allow; T016 10% cashier deny; T017 >15% approval; T018 below-floor deny.

### RTL-AC-003 — RefundVoidPolicy
- Void allowed before CAPTURED/PAID completion; after payment use refund/reversal, never void.
- Cashier refund self-authority default ≤INR 2,000 and same business day; supervisor ≤INR 10,000/7 days; above requires manager.
- Original tender is default refund destination; alternative tender requires approval/reason.
- Stock return occurs only after physical/return disposition ACCEPTED; damaged/non-resalable goes hold/scrap path.
- Tests: RTL-POS-T019 post-payment void denied; T020 same-day small refund; T021 large refund approval; RTL-OMS-T015 refund before receipt denied.

### RTL-AC-004 — InventoryControlPolicy
- Negative stock default: prohibited.
- Reservation expiry default: 30 minutes for checkout/cart; order allocation reservations follow order SLA policy.
- Blind stock count default; variance tolerance: max(1 unit, 0.5% expected qty) per SKU/location; above requires approver.
- Adjustment posts append-only StockMovement with reason; no direct balance edit.
- Tests: RTL-IWM-T015 negative stock deny; T016 reservation expiry; T017 variance approval; T018 direct balance edit prohibited.

---

## Hospitality policies

### HSP-AC-001 — ReservationPolicy
- TENTATIVE hold default 30 minutes for unpaid direct booking; tenant configurable 10–120 minutes.
- CONFIRMED requires guarantee method/deposit rule when rate plan requires it.
- Default cancellation: free until 24h before property-local check-in; after that one-night charge; configurable by rate plan/contract.
- NO_SHOW default after local night-audit cut-off with no check-in; one-night charge where guarantee permits.
- Modification recalculates availability/rate under current policy but preserves prior version/audit.
- Tests: HSP-RBM-T015 tentative expiry; T016 late cancel charge; T017 no-show; T018 modification reprice.

### HSP-AC-002 — OverbookingPolicy
- Disabled by default.
- If enabled, max sellable inventory = physical sellable rooms + policy tolerance; default tolerance min(2 rooms, 2% room-type inventory).
- Above physical inventory requires Revenue/Property Manager approval and `hsp.rbm.overbook`.
- Walk/relocation requires equivalent-or-better accommodation cost evidence and guest-notification audit.
- Tests: HSP-RBM-T019 disabled overbook deny; T020 within approved tolerance; T021 above tolerance deny.

### HSP-AC-003 — NightAuditPolicy
- Property business-date cut-off default 03:00 local time.
- Preconditions: all open cashier sessions reconciled or exception-approved; folio posting queue clear; unresolved room/folio exceptions either resolved or explicitly carried.
- Execution posts scheduled charges/taxes, marks eligible no-shows, rolls business date, emits `hsp.hms.night_audit.completed.v1`.
- Re-open prior business date prohibited by default; correction uses back-dated adjustment with manager permission.
- Tests: HSP-HMS-T015 unreconciled cashier blocks audit; T016 clean close; T017 prior-day reopen deny.

### HSP-AC-004 — FolioAdjustmentPolicy
- Transfer allowed only between folios in same tenant/property and authorized guest/group relationship.
- Adjustment ≤INR 2,000 by Front Office Supervisor; above requires Finance/Manager approval; configurable currency policy.
- SETTLED folio correction is reversal/adjustment entry, never deletion.
- Tests: HSP-HMS-T018 settled mutation denied; T019 cross-property transfer denied; T020 adjustment approval.

---

## Manufacturing policies

### MFG-AC-001 — QCSamplingPolicy
- Default sampling: 100% for CRITICAL characteristics; otherwise sqrt(N)+1 samples rounded up, minimum 3, maximum 50 per lot.
- Tenant may configure AQL/sampling tables by item/process/version.
- Any critical defect → lot HOLD regardless of sample pass rate.
- Tests: MFG-QMS-T015 critical 100%; T016 sample formula; T017 critical defect hold.

### MFG-AC-002 — ScrapReworkPolicy
- Operator may mark suspected scrap/rework only; final disposition requires Quality permission.
- Scrap affecting value > configurable threshold (default INR 10,000) requires Production + Quality approval; >INR 100,000 also Finance.
- Rework creates linked rework route/order; consumed/recovered material movements are append-only.
- Cost impact posts to cost projection; no silent quantity correction.
- Tests: MFG-QMS-T018 operator cannot final-scrap; MFG-PMS-T015 rework creates linked route; T016 high-value approval.

### MFG-AC-003 — BackflushPolicy
- Disabled by default.
- Allowed only for BOM components flagged backflush=true and operation completion with measured good/scrap qty.
- Quantity = completed_good_qty × BOM qty + configured scrap factor; lot/serial-controlled material cannot backflush without trace identifier.
- Correction uses reversing movement then corrected movement.
- Tests: MFG-PMS-T017 non-enabled deny; T018 lot-tracked missing lot deny; T019 correction reversal.

### MFG-AC-004 — GenealogyPolicy
- Lot/batch genealogy mandatory for raw→WIP→finished goods when any involved item has traceability_class LOT or SERIAL.
- Minimum lineage: source lot/serial, quantity, movement, production order, operation, resulting lot/serial, timestamp.
- Cannot close production order while required genealogy link missing.
- Tests: MFG-PMS-T020 missing genealogy blocks close; MFG-IWM-T015 sibling lot trace denied.

### MFG-AC-005 — ProductionOrderPolicy
- PLANNED→RELEASED only with active BOM/routing and material feasibility check.
- HOLD may be entered from RELEASED/MATERIAL_ISSUED/IN_PROGRESS/QC by authorized role; resume returns to prior_state recorded in hold history.
- SCRAPPED is terminal and requires DD-AC-002 disposition.
- CLOSED requires COMPLETED + QC disposition + all material/output postings reconciled.
- Tests: MFG-PMS-T021 stale BOM blocks release; T022 hold/resume; T023 unreconciled close deny.

---

## Professional Services policies

### PSV-AC-001 — TimesheetPolicy
- Default increment: 0.25 hour; entries round to nearest 0.25 using half-up, but raw start/end evidence may be retained.
- Daily max without overtime approval: 10h; weekly 45h; configurable by jurisdiction/contract.
- Period locks 5 calendar days after period end or immediately on billing, whichever first.
- Approved correction creates revision and re-approval; BILLED correction requires billing adjustment, never silent edit.
- Tests: PSV-RTM-T015 rounding; T016 overtime approval; T017 locked edit deny; T018 billed correction creates adjustment.

### PSV-AC-002 — AllocationPolicy
- Capacity baseline = ResourceProfile.capacity_hours_week.
- Allocation >100% is blocked by default; manager override up to 120%; above 120% prohibited by platform default.
- Overlap is computed across all ACTIVE/APPROVED allocations in same date window.
- Tests: PSV-RTM-T019 100% allow; T020 110% manager approval; T021 >120% deny.

### PSV-AC-003 — BillingPolicy
- T&M billable time requires APPROVED timesheet and unbilled state.
- Fixed-fee billing uses accepted milestone or scheduled contract milestone.
- Invoice correction uses credit/debit adjustment reference; billed timesheet remains immutable.
- Revenue recognition is **not owned by SBGlobal operational DD**; system exports billing/milestone evidence to accounting/ERP integration unless a future separately governed accounting module is added.
- Tests: PSV-RTM-T022 unapproved time cannot bill; PSV-PJM-T015 unaccepted milestone cannot invoice; T016 correction uses adjustment.

### PSV-AC-004 — UtilizationPolicy
- Utilization denominator uses available capacity after approved leave/non-working calendar.
- Billable% and utilization formulas are defined in DD-25.
- Tests: PSV-RTM-T023 unavailable hours excluded; T024 internal nonbillable time affects utilization but not billable%.

---

## Government policies

### GOV-AC-001 — ServiceCalendarPolicy
- Versioned by jurisdiction/department/service.
- Fields: timezone, working_weekdays, working_intervals, holiday_calendar_version, emergency_open_dates, effective dates.
- Product default when no jurisdiction policy exists: Monday–Friday 09:00–17:00 local, Saturday/Sunday non-working, no assumed public holidays.
- This default is product behavior, **not legal fact**.
- Tests: GOV-CSM-T015 weekend exclusion; T016 holiday exclusion; T017 timezone DST-safe due computation.

### GOV-AC-002 — SLAClockPolicy
- Start: ACKNOWLEDGED unless service catalog specifies SUBMITTED.
- Pause default triggers: INFO_REQUESTED awaiting applicant, externally-blocked inspection with recorded dependency; internal backlog never pauses.
- Resume on required information/dependency resolution.
- Due time adds only working-calendar duration.
- 80% elapsed → warning; 100% → BREACHED; breach emits escalation event.
- Tests: GOV-CSM-T018 pause excludes applicant-wait; T019 internal backlog continues; T020 breach event.

### GOV-AC-003 — DeficiencyCurePolicy
- DEFICIENCY pauses SLA by default while awaiting applicant cure.
- Cure window default 15 working days; jurisdiction/service policy overrides.
- Cure submission resumes existing clock; it does not reset elapsed service time unless explicit jurisdiction policy says restart.
- Tests: GOV-PLM-T015 deficiency pause; T016 cure resumes; T017 missed cure transitions rejection/closure per service policy.

### GOV-AC-004 — AppealPolicy
- Default appeal window 30 calendar days from communicated decision; jurisdiction overrides.
- Appeal allowed only from RESOLVED/CLOSED/APPROVED/REJECTED/DECIDED states defined by service.
- Appellate authority must differ from original decision-maker where separation policy requires.
- Successful appeal creates REOPENED/new decision version; original decision remains evidence.
- Tests: GOV-CSM-T021 late appeal deny; T022 conflict-of-interest deny; GOV-PLM-T018 successful appeal versions decision.

---

## NGO / Temple / Trust policies

### NGO-AC-001 — ReceiptNumberPolicy
- Receipt sequence scope default: tenant + Industry Context + financial year + receipt series.
- Number allocated only on successful RECEIPTED transaction; duplicate number prohibited.
- Cancellation/reversal never reuses number; reissue creates new receipt referencing reversed original.
- Tests: NGO-DFM-T015 duplicate reject; T016 reversal preserves number; T017 reissue links original.

### NGO-AC-002 — CertificateEligibilityPolicy
- Certificate issuance is policy-driven by jurisdiction, organization registration status, donation type, donor identity completeness and required attributes.
- Default product policy: **certificate disabled unless an active jurisdiction/tenant eligibility policy explicitly enables it**.
- This is not a claim of tax/legal qualification.
- Tests: NGO-DFM-T018 no policy→deny; T019 eligible policy→issue; T020 revoked policy blocks future issue.

### NGO-AC-003 — FundRingFencingPolicy
- Fund type RESTRICTED or UNRESTRICTED.
- Restricted utilization must match allowed purpose catalog and available fund balance.
- Transfer out of restricted fund denied by default; exception requires Board/Trustee-authorized policy and documented compatible purpose.
- Violation attempt returns `POLICY_DENIED` and audit.
- Tests: NGO-DFM-T021 wrong purpose deny; T022 over-balance deny; T023 approved compatible transfer.

### NGO-AC-004 — AnonymousDonationPolicy
- PUBLIC_ANONYMOUS hides donor identity from public/member-facing reports.
- Internal donor identity may be retained if supplied and policy requires audit/KYC; privacy visibility does not erase internal compliance evidence.
- Truly unidentified donation records donor_ref=null with collection evidence; certificate issuance follows eligibility policy.
- Tests: NGO-DMS-T015 public export redacts; T016 authorized internal role can access; NGO-DFM-T024 anonymous certificate policy enforcement.

---

## Security / Facility policies

### SFM-AC-001 — GeofencePolicy
- Default radius 100m around post/checkpoint.
- GPS accuracy tolerance: reading accuracy must be ≤50m; effective acceptance distance = radius + min(accuracy,50m).
- Dwell default 60 seconds for attendance/checkpoint confirmation.
- Offline evidence permitted for 30 minutes with signed device timestamp/location; server revalidates schedule/context on replay.
- Manual override requires supervisor permission, reason and evidence.
- Tests: SFM-SGM-T015 inside fence; T016 poor accuracy deny; T017 offline replay; T018 manual override audit.

### SFM-AC-002 — PatrolTimingPolicy
- Checkpoint order required when route policy ordered=true; otherwise any order.
- Default checkpoint window ±10 minutes from scheduled checkpoint time.
- Missed checkpoint grace 5 minutes after window; then EXCEPTION + escalation.
- One revisit allowed within 15 minutes when route remains active; original miss remains audit evidence.
- Tests: SFM-PMS-T015 ordered-route out-of-order deny; T016 late grace; T017 escalation; T018 revisit keeps original miss.

### SFM-AC-003 — AttendanceOverridePolicy
- Guard cannot self-override.
- Site Supervisor may correct same-day attendance with reason + geo/device/evidence reference.
- After 24h requires Operations Manager.
- After payroll lock requires HR/Payroll adjustment workflow; original evidence immutable.
- Tests: SFM-SGM-T019 self override deny; T020 supervisor same-day; T021 late approval.

### SFM-AC-004 — ReliefPolicy
- Relief request opens 30 minutes before shift end by default.
- Primary replacement response SLA 10 minutes; escalation to supervisor at 10m, operations manager at 20m.
- Guard remains ACTIVE until HANDOVER accepted or emergency supervisor release occurs.
- Tests: SFM-SGM-T022 cannot complete before relief/handover; T023 escalation timing.

### SFM-AC-005 — FacilitySlaPolicy
- Reuses ServiceCalendarPolicy pattern with site timezone/working calendar.
- Priority defaults: CRITICAL response 15m/restore target 4h; HIGH 30m/8h; NORMAL 4 working hours/2 working days; LOW 1 working day/5 working days.
- These are product defaults, not contractual SLAs; client contract may tighten/replace.
- Tests: SFM-FMM-T015 SLA due calculation; T016 pause only approved external waiting; T017 breach escalation.

---

## Healthcare bounded closures

### HLT-AC-001 — RISSecondReadPolicy
- Mandatory second read by default for configured HIGH_RISK exam catalog entries, pediatric/oncology/critical findings when tenant policy flags them, and any report manually escalated by first radiologist.
- First radiologist cannot be second reader.
- Second-read SLA default 60 minutes for urgent/high-risk, 24h routine.
- If SLA breaches, escalate to Radiology Lead; first report remains DRAFT/SECOND_READ and cannot PUBLISH.
- Final report owner is the approving radiologist after second-read reconciliation; discrepancy and both opinions retained.
- Tests: HLT-RIS-T015 mandatory second read; T016 same reader denied; T017 breach escalation; T018 publish before second read denied.

### HLT-AC-002 — PharmacyRecallDisposalPolicy
- Recall initiation requires pharmacist/manager permission + source notice reference.
- On NOTICE, affected batch moves QUARANTINED immediately; dispensing reservation/commit denied.
- TRACE identifies current stock + prior dispenses; patient/ward notification follows sensitivity policy.
- Disposal requires Pharmacy Manager + second approver for controlled/high-value stock, disposal document/evidence and append-only stock movement.
- Closed recall cannot be silently reopened; new linked case required.
- Tests: HLT-PMS-T015 recall quarantine blocks dispense; T016 trace prior dispense; T017 disposal dual approval; T018 missing evidence deny.

### HLT-AC-003 — ControlledDispensePolicy
- Controlled-drug dispense requires active prescription, verified patient/resource context, pharmacist permission, controlled-register append and configured second verification when controlled class requires it.
- Substitution/quantity override requires reason and authorized prescriber/pharmacist policy.
- Tests: HLT-PMS-T019 no prescription deny; T020 register append mandatory; T021 second verification enforced.

---

## Rate-limit security dependency closure
DD-028 makes `SecurityRatePolicy v1` authoritative. Current numeric values are resolved DD defaults; there is no hidden unresolved human approval dependency. Overrides may tighten within published bounds; weakening beyond platform ceilings requires a new versioned security decision.

## Reversibility
All DD-AC values above are policy-versioned. Changing a future default does not rewrite historical transaction meaning; records retain the policy/version used and migrations are explicit.
