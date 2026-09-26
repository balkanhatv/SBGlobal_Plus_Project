# F-09 — INDUSTRY SUITES 7–9: GOVERNMENT & PUBLIC SECTOR · NGO / TEMPLE / TRUST · SECURITY & FACILITY MANAGEMENT
**Document ID:** F-09 · **Version:** 0.2 · **Status:** SPECIFIED — MS EVIDENCE REVALIDATED (CERTIFICATION PENDING) · Cross-refs: F-01, F-03, F-04, F-05, F-06. Same structure and equality rules as F-07/F-08. Non-source elements labelled `[AC]`; none copies Healthcare business requirements. Remaining §9 dimensions are consolidated in F-12 §2.7–2.9; MS-specific evidence owners are F-13 §4.6–§4.8 (plus NGO-DMS §2.5).

---

# 1. GOVERNMENT & PUBLIC SECTOR SUITE (GOV)

## 1.1 Vision & Scope `[AC — logged D-DECISIONS AC-12]`
Operational platform for government departments, municipal bodies, public agencies and PSUs: citizen service delivery, case/file administration, permits & licenses, and revenue/tax operations — with the audit, transparency and data-sovereignty posture governed tenants require (residency & compliance via F-03 §5–§6).

**Organization types:** departments/ministries, municipal corporations/councils, panchayats/local bodies, public agencies/boards, PSUs. **Personas/roles:** Department Admin, Section Officer, Dealing Clerk/Assistant, Inspector/Field Officer, Approving Authority, Cashier/Revenue Officer, Grievance Officer, Citizen, Enterprise/Business Applicant.

## 1.2 Foundational Management Systems (4, within 2–8) `[SD: S1 §7]`
GOV-CSM Citizen Service Management System · GOV-CFM Case & File Management System · GOV-PLM Permit & License Management System · GOV-RTM Revenue & Tax Management System.

## 1.3 Core Workflows (states) `[AC]`
- **Citizen service request (GOV-CSM):** Submitted (portal/mobile/counter) → Acknowledged (ticket + SLA clock) → Triaged → Assigned → Processing → (Info Requested → Citizen Response) → Resolved → Closed → (Reopened/Escalated per SLA breach); grievance appeals tracked.
- **File movement (GOV-CFM):** File Created (numbering scheme) → Noting/Drafting → Forwarded (desk-to-desk movement log) → Approvals (level-wise) → Disposed → Archived; every movement timestamped and audited.
- **Permit/License (GOV-PLM):** Application → Fee Payment → Document Scrutiny → (Deficiency Notice → Resubmission) → Inspection (field report) → Approval/Rejection → Issuance (QR-verifiable certificate via Core document/trust services) → Renewal / Amendment / Suspension / Revocation.
- **Revenue/Tax (GOV-RTM):** Assessment → Demand Notice → Payment → Receipt → Reconciliation → (Arrears → Recovery workflow); refunds via approval chain.

## 1.4 Business Rules `[AC]`
- **BR-GOV-01 SLA escalation:** service request exceeding its category SLA auto-escalates one authority level and notifies the Grievance Officer; escalation chain configurable.
- **BR-GOV-02 File integrity:** file notings are append-only; supersession by new noting, never edit/delete; movement history immutable.
- **BR-GOV-03 Issuance gate:** permit/license issuance requires completed scrutiny + inspection report + designated authority approval + fee realization; QR verification record created at issuance.
- **BR-GOV-04 Receipt immutability:** revenue receipts are immutable once issued; corrections only via reversal + reissue (aligns with F-04 §5 financial rule).

## 1.5 Masters, Data, AI, Experiences
Masters: service categories, SLA matrices, fee schedules, document checklists, permit/license types, jurisdictions/wards/zones, designations/approval chains, tax heads. Transactions: service requests, files/notings, applications, inspections, certificates, demands, payments, receipts. AI `[SD: S2.6 — Government & NGO AI Assistant]`: citizen-assistance chatbot, application-scrutiny document intelligence (F-05 §4) `[AC]`. Experiences: Public Department Website/Citizen portal, Staff Mobile (field inspections), Citizen Mobile, optional counter Desktop. Demo data: synthetic citizens/applications, DEMO-flagged, never real PII. Acceptance: request→resolution within SLA tracking, application→issuance with QR verification, assessment→receipt cycle — each fully audited; BR-GOV-01…04 scenarios; tenant + industry-context isolation.

---

# 2. NGO / TEMPLE / TRUST SUITE (NGO)

## 2.1 Vision & Scope `[AC — logged D-DECISIONS AC-13]`
Operational platform for NGOs, temples, trusts, charitable and faith institutions: donor and donation lifecycle, fund/grant governance, membership & volunteers, and temple/institution administration (sevas, events, facilities).

**Organization types:** NGOs, charitable trusts, temples & religious institutions, foundations, community organizations. **Personas/roles:** Trust Admin, Trustee/Board Member, Fund Manager, Donation Counter Operator, Membership Coordinator, Volunteer Coordinator, Event/Seva Coordinator, Accountant, Donor, Member, Volunteer, Devotee.

## 2.2 Foundational Management Systems (4, within 2–8) `[SD: S1 §7]`
NGO-DMS Donor Management System · NGO-DFM Donation & Fund Management System · NGO-TAM Temple Administration Management System · NGO-MVM Membership & Volunteer Management System.

## 2.3 Core Workflows (states) `[AC]`
- **Donation (NGO-DFM):** Pledge (optional) → Donation Received (cash/online/in-kind) → Receipt Issued (sequential, immutable numbering) → Acknowledgment → Tax-exemption certificate where applicable (jurisdiction-configurable) → Fund Allocation → Utilization → Utilization Reporting to donor (restricted funds).
- **Grant/fund (NGO-DFM):** Grant Award → Budget Lines → Expense Requests → Approval → Disbursement → Utilization Certificate → Audit Closure.
- **Seva/event (NGO-TAM):** Seva Catalog → Booking (slot/date) → Payment/Receipt → Performance/Participation → Prasad/Certificate dispatch (configurable); festivals/events: Plan → Budget → Volunteers Assigned → Execution → Expense Settlement → Report.
- **Membership/volunteer (NGO-MVM):** Application → Approval → Active (dues schedule/renewals) → Lapsed/Renewed; volunteers: Registration → Skill Tagging → Assignment → Hours Logging → Recognition.

## 2.4 Business Rules `[AC]`
- **BR-NGO-01 Restricted funds:** expenses against a restricted fund/grant post only to its designated purpose/budget lines; cross-fund transfers require Trustee approval and are audited.
- **BR-NGO-02 Receipt integrity:** donation receipt numbering is sequential and immutable; cancellation only by reversal entry with reason (never deletion).
- **BR-NGO-03 Anonymous donor:** donor identity may be marked confidential — masked in reports/analytics per role, retained in the audit fabric per compliance policy.
- **BR-NGO-04 Utilization transparency:** restricted-fund utilization reports generated per configured cadence for donors/board.

## 2.5 Masters, Data, AI, Experiences
Masters: donation categories, funds/grants, seva/puja catalog, membership types, dues plans, volunteer skills, event types, donor segments. Transactions: donations, receipts, pledges, expenses, disbursements, seva bookings, memberships, volunteer hours. AI `[SD: S2.6 — Government & NGO AI Assistant]`: donor-engagement and report-drafting assistance `[AC]`. Experiences: Institution Website (donations, seva booking, events), Staff Mobile, Donor/Devotee Mobile, optional counter Desktop. Demo data: synthetic donors/donations, DEMO-flagged. Acceptance: donation→receipt→allocation→utilization cycle with restricted-fund enforcement and audit; BR-NGO-01…04 scenarios; isolation tests.

---

# 3. SECURITY & FACILITY MANAGEMENT SUITE (SFM)

## 3.1 Vision & Scope `[AC — logged D-DECISIONS AC-14]`
Operational platform for security agencies and facility-management companies: guard workforce deployment, patrol operations, visitor management, and facility maintenance — across client sites with mobile-first field operations.

**Organization types:** security agencies, facility-management companies, integrated FM providers, in-house corporate security/FM departments. **Personas/roles:** Agency Admin, Operations Manager, Site Supervisor, Security Guard, Patrol Officer, Front-desk/Visitor Operator, Maintenance Technician, Client Site Manager, Visitor.

## 3.2 Foundational Management Systems (4, within 2–8) `[SD: S1 §7]`
SFM-SGM Security Guard Management System · SFM-PMS Patrol Management System · SFM-VMS Visitor Management System · SFM-FMM Facility Maintenance Management System.

## 3.3 Core Workflows (states) `[AC]`
- **Deployment/roster (SFM-SGM):** Client Site Contract → Post Definitions (shifts/skills) → Roster Published → Guard Check-in (geo/QR-validated) → Shift Active → Relief/Handover → Attendance → Payroll-input export; absence triggers replacement workflow.
- **Patrol (SFM-PMS):** Patrol Route (checkpoints, QR/NFC tags `[SD: QR capability, S2.5]`) → Scheduled Round → Checkpoint Scans → (Missed Checkpoint → Alert) → Incident Report (photo/notes) → Round Complete → Supervisor Review.
- **Visitor (SFM-VMS):** Pre-registration (optional) → Arrival → Identity Capture → Host Approval → Badge Issue (QR) → On-premises → Check-out → (Overstay → Alert); blacklist screening at entry.
- **Facility ticket (SFM-FMM):** Raised (tenant/occupant/inspection) → Categorized (SLA) → Assigned → In Progress → Resolved → Requester Verification → Closed; preventive maintenance schedules generate work orders automatically.

## 3.4 Business Rules `[AC]`
- **BR-SFM-01 Geo-validated attendance:** guard check-in valid only within configured geofence of the post (F-03 location attributes); out-of-fence attempts flagged.
- **BR-SFM-02 Missed checkpoint:** a checkpoint not scanned within its window raises an immediate supervisor alert and logs the exception in the round record.
- **BR-SFM-03 Visitor overstay:** visitor past expected duration triggers host + security alert; badge auto-expires.
- **BR-SFM-04 SLA-driven maintenance:** ticket SLA breach escalates per category matrix; critical-safety categories page the Operations Manager immediately.

## 3.5 Masters, Data, AI, Experiences
Masters: client sites, posts, shifts, patrol routes/checkpoints, incident categories, visitor types, badge templates, asset registry, maintenance categories/SLA matrices. Transactions: rosters, attendance, patrol rounds, incidents, visitor logs, tickets, work orders. AI `[SD: S2.6 — Security & Facility AI Assistant]`: incident summarization, anomaly flagging on patrol/attendance data `[AC]`. Experiences: Agency Website, Guard/Field Staff Mobile (offline-first rounds, F-01 §6 sync policy), Client portal/Mobile, optional control-room Desktop. Demo data: synthetic sites/rounds/visitors, DEMO-flagged. Acceptance: roster→attendance→patrol→incident cycle and visitor in/out cycle with audit; BR-SFM-01…04 scenarios; tenant + industry-context isolation.
