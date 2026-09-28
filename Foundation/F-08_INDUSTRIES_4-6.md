# F-08 — INDUSTRY SUITES 4–6: HOSPITALITY · MANUFACTURING · PROFESSIONAL SERVICES
**Document ID:** F-08 · **Version:** 0.2 · **Status:** SPECIFIED — MS EVIDENCE REVALIDATED (CERTIFICATION PENDING) · Cross-refs: F-01, F-03, F-04, F-05, F-06. Same structure and equality rules as F-07. Non-source elements labelled `[AC]`; none copies Healthcare business requirements. Remaining §9 dimensions are consolidated in F-12 §2.4–2.6; MS-specific evidence owners are F-13 §4.3–§4.5.

---

# 1. HOSPITALITY SUITE (HSP)

## 1.1 Vision & Scope `[AC — logged D-DECISIONS AC-09]`
Operational platform for hotels, resorts, restaurants, banquet/event venues and booking-driven hospitality businesses: reservation-to-settlement guest lifecycle, F&B operations, event management, housekeeping and front-office operations.

**Organization types:** hotels/resorts, hotel chains/franchises, restaurants/cafés/cloud kitchens, banquet halls/event venues, serviced apartments. **Personas/roles:** Hospitality Admin, General Manager, Front Office Executive, Reservation Agent, Housekeeping Supervisor, Restaurant Manager, Waiter/Steward, Chef/Kitchen (KOT) user, Banquet Coordinator, Accountant, Guest.

## 1.2 Foundational Management Systems (4, within 2–8) `[SD: S1 §7]`
HSP-HMS Hotel Management System · HSP-RMS Restaurant Management System · HSP-BEM Banquet & Event Management System · HSP-RBM Reservation & Booking Management System.

## 1.3 Core Workflows (states) `[AC]`
- **Room reservation (HSP-RBM/HMS):** Enquiry → Quote → Reservation (tentative) → Confirmed (advance/guarantee) → Check-in → In-house (folio accumulation) → Check-out → Folio Settlement → Closed; branches: Cancelled (policy-based fee), No-show.
- **Restaurant order (HSP-RMS):** Table/Takeaway/Delivery Order → KOT to Kitchen → Preparing → Served/Dispatched → Bill → Settled; KOT modifications audited.
- **Banquet/event (HSP-BEM):** Enquiry → Site Visit/Proposal → Booking (advance) → Function Sheet Approved → Event Execution → Billing → Settlement → Feedback.
- **Housekeeping:** Room states Dirty → Cleaning → Inspected → Clean/Ready; Out-of-Order/Out-of-Service maintenance loop into facility tickets.

## 1.4 Business Rules `[AC]`
- **BR-HSP-01 Overbooking guard:** confirmation blocked when room-type availability (net of allocations/blocks) is exhausted; waitlist offered; overbooking only via configured tolerance with manager approval.
- **BR-HSP-02 No-show/cancellation:** past cut-off time → automatic no-show/cancellation charge per rate-plan policy; charge posted to folio and audited.
- **BR-HSP-03 Checkout gate:** check-out completes only when folio balance is settled or transferred to approved city ledger/corporate account.
- **BR-HSP-04 KOT integrity:** served KOT lines cannot be deleted — only reversed with reason (void audit).

## 1.5 Masters, Data, AI, Experiences
Masters: room types, rooms/floors, rate plans, seasons, meal plans, taxes, menu categories/items/modifiers, tables, halls/venues, event types, packages, cancellation policies. Transactions: reservations, folios, POS bills, KOTs, event bookings, housekeeping tasks. AI `[SD: S2.6]`: Hospitality AI Assistant; suite-scoped agents (reservation/guest-service) `[AC]`. Experiences: Hotel/Restaurant Website with booking engine, Staff Mobile, Guest Mobile, optional front-desk/POS Desktop. Demo data: synthetic properties/reservations, DEMO-flagged. Acceptance: reservation→check-out→settlement cycle with audit; BR-HSP-01…04 scenarios; tenant + industry-context isolation.

---

# 2. MANUFACTURING SUITE (MFG)

## 2.1 Vision & Scope `[AC — logged D-DECISIONS AC-10]`
Operational platform for discrete/process manufacturers: plan-to-produce, procure-to-pay, quality management, plant maintenance, and inventory & warehouse operations. (Suite name per catalog: Manufacturing; S1 variant "Manufacturing & Inventory" preserved in traceability.)

**Organization types:** factories/plants, multi-plant enterprises, job-work/contract manufacturers, assemblers. **Personas/roles:** Plant Admin, Production Planner, Production Supervisor, Machine Operator, QC Inspector, Store/Warehouse Keeper, Procurement Officer, Maintenance Engineer, Accountant.

## 2.2 Foundational Management Systems (5) `[SD: S1 §7]`
MFG-PMS Production Management System · MFG-IWM Inventory & Warehouse Management System · MFG-QMS Quality Management System · MFG-PRO Procurement Management System · MFG-MMS Maintenance Management System.

## 2.3 Core Workflows (states) `[AC]`
- **Production order (MFG-PMS):** Planned → Released → Material Issued → In Progress (operation routing) → QC Inspection → Completed → Closed; branches: Hold, Scrapped (with reason).
- **Procurement (MFG-PRO):** Purchase Requisition → Approval → RFQ/Quote Compare (optional) → PO → GRN → Quality Gate → Putaway → 3-way Invoice Match → Payment Due.
- **Quality (MFG-QMS):** Inspection Plan → Sample/Lot Inspection → Pass/Fail/Deviation → NCR (non-conformance) → CAPA → Closure.
- **Maintenance (MFG-MMS):** Preventive Schedule → Work Order → Execution → Verification → Closed; Breakdown Ticket → Prioritized Work Order (asset downtime tracked).

## 2.4 Business Rules `[AC]`
- **BR-MFG-01 BOM gate:** a production order releases only with an active BOM version and routing; BOM changes after release require change-order approval.
- **BR-MFG-02 QC hold:** failed inspection places the lot in QC Hold — blocked from dispatch/consumption until NCR disposition (rework/accept-with-deviation/scrap).
- **BR-MFG-03 Reorder trigger:** stock below reorder point auto-creates a Purchase Requisition (batch- and expiry-aware for applicable materials).
- **BR-MFG-04 Traceability:** batch/lot/serial genealogy maintained from raw-material GRN through finished goods dispatch.

## 2.5 Masters, Data, AI, Experiences
Masters: items (RM/WIP/FG), BOMs, routings, work centers/machines, UoMs, warehouses/bins, vendors, inspection plans, defect codes, maintenance assets, spare parts. Transactions: production orders, material issues, GRNs, POs, inspections, NCRs, work orders, stock movements. AI `[SD: S2.6]`: Manufacturing AI Assistant; Production/Quality-Control/Warehouse agents. Experiences: Company Website, Staff Mobile (shop-floor scanning `[AC]`), Customer/Dealer Mobile (optional), optional plant Desktop. Demo data: synthetic items/orders, DEMO-flagged. Acceptance: plan→produce→QC→stock cycle and PR→PO→GRN→match cycle complete with audit; BR-MFG-01…04 scenarios; isolation tests.

---

# 3. PROFESSIONAL SERVICES SUITE (PSV)

## 3.1 Vision & Scope `[AC — logged D-DECISIONS AC-11]`
Operational platform for services firms — consultancies, agencies, IT services, studios: lead-to-cash across CRM, projects, service delivery, resourcing/timesheets, and studio production (photography/videography per PG/VG Studio MS).

**Organization types:** consulting/advisory firms, agencies, IT/software services, legal/accounting practices, photography-videography studios. **Personas/roles:** Firm Admin, Partner/Practice Head, Sales/BD Executive, Project Manager, Consultant/Team Member, Resource Manager, Studio Manager, Editor, Accountant, Client.

## 3.2 Foundational Management Systems (5) `[SD: S1 §7]`
PSV-CRM CRM Management System · PSV-PJM Project Management System · PSV-SDM Service Delivery Management System · PSV-RTM Resource & Timesheet Management System · PSV-SGM PG/VG Studio Management System (PG=Photography, VG=Videography `[SD]`).

## 3.3 Core Workflows (states) `[AC]`
- **Lead-to-engagement (PSV-CRM):** Lead → Qualified → Opportunity → Proposal/Quote → Negotiation → Won (Engagement/Contract) | Lost (reason).
- **Project delivery (PSV-PJM/SDM):** Project Setup (WBS/milestones) → Active → Milestone Delivery/Acceptance → Invoicing Trigger → Completed → Closed; Change Requests versioned and approved.
- **Timesheet (PSV-RTM):** Draft → Submitted → PM Approval → (Rejected→revise) → Approved → Billed/Cost-posted; weekly locking.
- **Studio job (PSV-SGM):** Booking → Shoot Scheduled → Shoot Done → Editing → Client Review → Revisions (bounded) → Final Delivery → Archive.

## 3.4 Business Rules `[AC]`
- **BR-PSV-01 Billing gate:** time-and-material invoices draw only from Approved timesheet entries.
- **BR-PSV-02 Budget alert:** project cost/effort crossing configured % of budget alerts PM and Practice Head; overrun beyond threshold requires approval to continue logging billable time.
- **BR-PSV-03 Utilization/conflict:** resource allocation blocks double-booking beyond capacity; exceptions need Resource Manager approval.
- **BR-PSV-04 Deliverable acceptance:** milestone invoicing requires recorded client acceptance (digital sign-off supported via Core trust services, F-03 §5).

## 3.5 Masters, Data, AI, Experiences
Masters: service catalog, rate cards, roles/skills, project templates, milestones, expense types, studio packages, equipment. Transactions: leads, opportunities, proposals, projects, tasks, timesheets, expenses, invoices, studio bookings. AI `[SD: S2.6]`: Professional Services AI Assistant; proposal-drafting/knowledge agents `[AC]`. Experiences: Firm/Studio Website with enquiry & booking, Staff Mobile, Client portal/Mobile, optional Desktop. Demo data: synthetic clients/projects, DEMO-flagged. Acceptance: lead→project→timesheet→invoice cycle with audit; BR-PSV-01…04 scenarios; isolation tests.
