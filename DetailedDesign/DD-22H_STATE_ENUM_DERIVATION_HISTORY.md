# DD-22 — MANAGEMENT-SYSTEM WORKFLOW TRANSITION MATRICES
**Status:** ACTIVE REMEDIATION EVIDENCE · **Date:** 2026-09-11
**Authority:** Fable 5 remediation mandate · industry DD state contracts · DD-03/06/07/15 · DD-21

## Governing transition rules
1. Only transitions explicitly listed in this artifact or a more-specific MS rule are allowed. Unlisted transitions return `<MS>_STATE_INVALID`.
2. Every transition requires immutable Tenant + Industry Context match, current `expectedVersion`, active entitlement and the listed workflow permission.
3. Any transition whose target is APPROVED, PUBLISHED, PAID, SETTLED, CLOSED, DISPOSED, ISSUED, FINALIZED, VERIFIED, RECONCILED, RELEASED or COMPLETED requires the configured domain approver when the underlying MS declares an approval role; otherwise the actor permission is sufficient. Approval evidence is explicit, never inferred from UI.
4. Cancellation is a named command, never direct status editing. If a workflow contains CANCELLED, cancellation is allowed only before a financially/legally/operationally irreversible terminal state and requires `<ms>.workflow.cancel`, reason code, expectedVersion and audit.
5. REVERSED is a compensating transaction/state. Original approved/posted/paid evidence is not deleted. Reversal requires `<ms>.workflow.reverse`, reason, linkage to original, compensating event and audit.
6. After APPROVED/PUBLISHED/SIGNED/FINAL/POSTED states, correction is version/addendum/reversal according to domain contract; backward mutation to DRAFT is forbidden unless an explicit REOPENED state/command exists.
7. Notifications use the MS notification policy; sensitive notifications contain safe preview only. If no recipient/notification is defined for a transition, value is `NONE`, not developer choice.


## HLT-HMS — Encounter
States: `REGISTERED → CHECKED_IN → IN_CARE → DISCHARGE_INITIATED → DISCHARGED → CLOSED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REGISTERED | `encounter.checked.in` | current=REGISTERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | CHECKED_IN | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.encounter.checked.in.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| CHECKED_IN | `encounter.in.care` | current=CHECKED_IN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | IN_CARE | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.encounter.in.care.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| IN_CARE | `encounter.discharge.initiated` | current=IN_CARE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | DISCHARGE_INITIATED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.encounter.discharge.initiated.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| DISCHARGE_INITIATED | `encounter.discharged` | current=DISCHARGE_INITIATED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | DISCHARGED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.encounter.discharged.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| DISCHARGED | `encounter.closed` | current=DISCHARGED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.encounter.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `encounter.cancelled` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.encounter.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-HMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → REGISTERED`, `CANCELLED → REGISTERED`, `CANCELLED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-HMS — Admission
States: `REQUESTED → BED_ALLOCATED → IN_CARE → TRANSFER_PENDING → DISCHARGE_INITIATED → DISCHARGED → LAMA → REFERRED_OUT`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REQUESTED | `admission.bed.allocated` | current=REQUESTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | BED_ALLOCATED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.admission.bed.allocated.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| BED_ALLOCATED | `admission.in.care` | current=BED_ALLOCATED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | IN_CARE | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.admission.in.care.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_CARE | `admission.transfer.pending` | current=IN_CARE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | TRANSFER_PENDING | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.admission.transfer.pending.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| TRANSFER_PENDING | `admission.discharge.initiated` | current=TRANSFER_PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | DISCHARGE_INITIATED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.admission.discharge.initiated.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DISCHARGE_INITIATED | `admission.discharged` | current=DISCHARGE_INITIATED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | DISCHARGED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.admission.discharged.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DISCHARGED | `admission.lama` | current=DISCHARGED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | LAMA | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.admission.lama.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| LAMA | `admission.referred.out` | current=LAMA; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | REFERRED_OUT | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.admission.referred.out.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-HMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REFERRED_OUT → LAMA`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-HMS — Bed
States: `AVAILABLE → RESERVED → OCCUPIED → CLEANING → MAINTENANCE`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AVAILABLE | `bed.reserved` | current=AVAILABLE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | RESERVED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.bed.reserved.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RESERVED | `bed.occupied` | current=RESERVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | OCCUPIED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.bed.occupied.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| OCCUPIED | `bed.cleaning` | current=OCCUPIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | CLEANING | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.bed.cleaning.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CLEANING | `bed.maintenance` | current=CLEANING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | MAINTENANCE | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.bed.maintenance.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-HMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `MAINTENANCE → CLEANING`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-HMS — ClinicalOrder
States: `ORDERED → ACCEPTED → IN_PROGRESS → COMPLETED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ORDERED | `clinicalorder.accepted` | current=ORDERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | ACCEPTED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.clinicalorder.accepted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| ACCEPTED | `clinicalorder.in.progress` | current=ACCEPTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.clinicalorder.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| IN_PROGRESS | `clinicalorder.completed` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.clinicalorder.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| COMPLETED | `clinicalorder.cancelled` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.clinicalorder.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-HMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → ORDERED`, `CANCELLED → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-HMS — OTCase
States: `REQUESTED → SCHEDULED → PREOP_READY → IN_SURGERY → RECOVERY → NOTES_APPROVED → CLOSED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REQUESTED | `otcase.scheduled` | current=REQUESTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | SCHEDULED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.otcase.scheduled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| SCHEDULED | `otcase.preop.ready` | current=SCHEDULED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | PREOP_READY | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.otcase.preop.ready.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PREOP_READY | `otcase.in.surgery` | current=PREOP_READY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | IN_SURGERY | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.otcase.in.surgery.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| IN_SURGERY | `otcase.recovery` | current=IN_SURGERY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | RECOVERY | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.otcase.recovery.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| RECOVERY | `otcase.notes.approved` | current=RECOVERY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | NOTES_APPROVED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.otcase.notes.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| NOTES_APPROVED | `otcase.closed` | current=NOTES_APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.otcase.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `otcase.cancelled` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.otcase.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-HMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → REQUESTED`, `CANCELLED → REQUESTED`, `CANCELLED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-HMS — DischargeSummary
States: `DRAFT → APPROVED → ADDENDUM`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `dischargesummary.approved` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.dischargesummary.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `dischargesummary.addendum` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.hms.workflow.transition` | NONE unless MS rule explicitly requires | ADDENDUM | increment row_version; persist transition history; apply domain side effects defined by HLT-HMS | `hlt.hms.dischargesummary.addendum.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-HMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ADDENDUM → APPROVED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-LIS — LabOrder
States: `REGISTERED → BILLED → COLLECTION_PENDING → IN_PROCESS → COMPLETED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REGISTERED | `laborder.billed` | current=REGISTERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | BILLED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.laborder.billed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| BILLED | `laborder.collection.pending` | current=BILLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | COLLECTION_PENDING | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.laborder.collection.pending.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| COLLECTION_PENDING | `laborder.in.process` | current=COLLECTION_PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROCESS | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.laborder.in.process.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| IN_PROCESS | `laborder.completed` | current=IN_PROCESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.laborder.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| COMPLETED | `laborder.cancelled` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.laborder.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-LIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → REGISTERED`, `CANCELLED → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-LIS — OrderedTest
States: `ORDERED → COLLECTED → RECEIVED → TESTING → RESULTED → VERIFIED → APPROVED → PUBLISHED → REJECTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ORDERED | `orderedtest.collected` | current=ORDERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | COLLECTED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.orderedtest.collected.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COLLECTED | `orderedtest.received` | current=COLLECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | RECEIVED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.orderedtest.received.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RECEIVED | `orderedtest.testing` | current=RECEIVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | TESTING | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.orderedtest.testing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| TESTING | `orderedtest.resulted` | current=TESTING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | RESULTED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.orderedtest.resulted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RESULTED | `orderedtest.verified` | current=RESULTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | VERIFIED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.orderedtest.verified.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| VERIFIED | `orderedtest.approved` | current=VERIFIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.orderedtest.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `orderedtest.published` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PUBLISHED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.orderedtest.published.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PUBLISHED | `orderedtest.rejected` | current=PUBLISHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.orderedtest.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-LIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → ORDERED`, `REJECTED → PUBLISHED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-LIS — Specimen
States: `EXPECTED → COLLECTED → IN_TRANSIT → RECEIVED → REJECTED → RECOLLECTION_REQUIRED → ALLOCATED → TESTING → ARCHIVED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| EXPECTED | `specimen.collected` | current=EXPECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | COLLECTED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.specimen.collected.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COLLECTED | `specimen.in.transit` | current=COLLECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | IN_TRANSIT | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.specimen.in.transit.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_TRANSIT | `specimen.received` | current=IN_TRANSIT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | RECEIVED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.specimen.received.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RECEIVED | `specimen.rejected` | current=RECEIVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.specimen.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| REJECTED | `specimen.recollection.required` | current=REJECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | RECOLLECTION_REQUIRED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.specimen.recollection.required.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RECOLLECTION_REQUIRED | `specimen.allocated` | current=RECOLLECTION_REQUIRED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | ALLOCATED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.specimen.allocated.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ALLOCATED | `specimen.testing` | current=ALLOCATED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | TESTING | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.specimen.testing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| TESTING | `specimen.archived` | current=TESTING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | ARCHIVED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.specimen.archived.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-LIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → EXPECTED`, `ARCHIVED → EXPECTED`, `ARCHIVED → TESTING`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-LIS — ResultValue
States: `DRAFT → HELD → VERIFIED → INVALIDATED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `resultvalue.held` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | HELD | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.resultvalue.held.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| HELD | `resultvalue.verified` | current=HELD; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | VERIFIED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.resultvalue.verified.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| VERIFIED | `resultvalue.invalidated` | current=VERIFIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | INVALIDATED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.resultvalue.invalidated.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-LIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `INVALIDATED → VERIFIED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-LIS — CriticalAlert
States: `PENDING → SENT → ACKNOWLEDGED → ESCALATED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PENDING | `criticalalert.sent` | current=PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | SENT | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.criticalalert.sent.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SENT | `criticalalert.acknowledged` | current=SENT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | ACKNOWLEDGED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.criticalalert.acknowledged.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACKNOWLEDGED | `criticalalert.escalated` | current=ACKNOWLEDGED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | ESCALATED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.criticalalert.escalated.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-LIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ESCALATED → ACKNOWLEDGED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-LIS — LabReport
States: `DRAFT → APPROVED → PUBLISHED → ADDENDUM`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `labreport.approved` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.labreport.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `labreport.published` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PUBLISHED | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.labreport.published.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PUBLISHED | `labreport.addendum` | current=PUBLISHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.lis.workflow.transition` | NONE unless MS rule explicitly requires | ADDENDUM | increment row_version; persist transition history; apply domain side effects defined by HLT-LIS | `hlt.lis.labreport.addendum.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-LIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ADDENDUM → PUBLISHED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-RIS — ImagingOrder
States: `ORDERED → SCHEDULED → PREPARED → PERFORMED → IMAGES_AVAILABLE → READING → REPORTED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ORDERED | `imagingorder.scheduled` | current=ORDERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | SCHEDULED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingorder.scheduled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| SCHEDULED | `imagingorder.prepared` | current=SCHEDULED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | PREPARED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingorder.prepared.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PREPARED | `imagingorder.performed` | current=PREPARED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | PERFORMED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingorder.performed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PERFORMED | `imagingorder.images.available` | current=PERFORMED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | IMAGES_AVAILABLE | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingorder.images.available.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| IMAGES_AVAILABLE | `imagingorder.reading` | current=IMAGES_AVAILABLE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | READING | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingorder.reading.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| READING | `imagingorder.reported` | current=READING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | REPORTED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingorder.reported.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| REPORTED | `imagingorder.cancelled` | current=REPORTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingorder.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-RIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → ORDERED`, `CANCELLED → REPORTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-RIS — ImagingAppointment
States: `BOOKED → CHECKED_IN → READY → COMPLETED → NO_SHOW → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BOOKED | `imagingappointment.checked.in` | current=BOOKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | CHECKED_IN | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingappointment.checked.in.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| CHECKED_IN | `imagingappointment.ready` | current=CHECKED_IN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | READY | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingappointment.ready.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| READY | `imagingappointment.completed` | current=READY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingappointment.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| COMPLETED | `imagingappointment.no.show` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | NO_SHOW | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingappointment.no.show.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| NO_SHOW | `imagingappointment.cancelled` | current=NO_SHOW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingappointment.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-RIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → BOOKED`, `CANCELLED → NO_SHOW`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-RIS — ImagingExam
States: `PERFORMED → REPEAT_REQUIRED → AVAILABLE`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PERFORMED | `imagingexam.repeat.required` | current=PERFORMED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | REPEAT_REQUIRED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingexam.repeat.required.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REPEAT_REQUIRED | `imagingexam.available` | current=REPEAT_REQUIRED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | AVAILABLE | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.imagingexam.available.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-RIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `AVAILABLE → REPEAT_REQUIRED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-RIS — RadiologyReport
States: `DRAFT → SECOND_READ → APPROVED → PUBLISHED → ADDENDUM`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `radiologyreport.second.read` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | SECOND_READ | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.radiologyreport.second.read.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SECOND_READ | `radiologyreport.approved` | current=SECOND_READ; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.radiologyreport.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `radiologyreport.published` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PUBLISHED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.radiologyreport.published.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PUBLISHED | `radiologyreport.addendum` | current=PUBLISHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | ADDENDUM | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.radiologyreport.addendum.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-RIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ADDENDUM → PUBLISHED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-RIS — CriticalFinding
States: `PENDING → SENT → ACKNOWLEDGED → ESCALATED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PENDING | `criticalfinding.sent` | current=PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | SENT | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.criticalfinding.sent.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SENT | `criticalfinding.acknowledged` | current=SENT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | ACKNOWLEDGED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.criticalfinding.acknowledged.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACKNOWLEDGED | `criticalfinding.escalated` | current=ACKNOWLEDGED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.ris.workflow.transition` | NONE unless MS rule explicitly requires | ESCALATED | increment row_version; persist transition history; apply domain side effects defined by HLT-RIS | `hlt.ris.criticalfinding.escalated.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-RIS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ESCALATED → ACKNOWLEDGED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-PMS — Prescription
States: `RECEIVED → VALIDATED → PARTIAL → DISPENSED → CANCELLED → EXPIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RECEIVED | `prescription.validated` | current=RECEIVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | VALIDATED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.prescription.validated.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| VALIDATED | `prescription.partial` | current=VALIDATED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | PARTIAL | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.prescription.partial.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PARTIAL | `prescription.dispensed` | current=PARTIAL; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | DISPENSED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.prescription.dispensed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| DISPENSED | `prescription.cancelled` | current=DISPENSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.prescription.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CANCELLED | `prescription.expired` | current=CANCELLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | EXPIRED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.prescription.expired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → RECEIVED`, `EXPIRED → RECEIVED`, `EXPIRED → CANCELLED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-PMS — DrugBatch
States: `AVAILABLE → QUARANTINED → RECALLED → EXPIRED → DEPLETED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AVAILABLE | `drugbatch.quarantined` | current=AVAILABLE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | QUARANTINED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.drugbatch.quarantined.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| QUARANTINED | `drugbatch.recalled` | current=QUARANTINED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | RECALLED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.drugbatch.recalled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RECALLED | `drugbatch.expired` | current=RECALLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | EXPIRED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.drugbatch.expired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| EXPIRED | `drugbatch.depleted` | current=EXPIRED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | DEPLETED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.drugbatch.depleted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `EXPIRED → AVAILABLE`, `DEPLETED → AVAILABLE`, `DEPLETED → EXPIRED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-PMS — Dispense
States: `PREPARED → BILLED → DISPENSED → REVERSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PREPARED | `dispense.billed` | current=PREPARED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | BILLED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.dispense.billed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| BILLED | `dispense.dispensed` | current=BILLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | DISPENSED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.dispense.dispensed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DISPENSED | `dispense.reversed` | current=DISPENSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | REVERSED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.dispense.reversed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | compensating reversal already represented; second reversal requires explicit correction policy |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVERSED → DISPENSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-PMS — RecallCase
States: `NOTICE → QUARANTINE → TRACE → RETURN_DISPOSE → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NOTICE | `recallcase.quarantine` | current=NOTICE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | QUARANTINE | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.recallcase.quarantine.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| QUARANTINE | `recallcase.trace` | current=QUARANTINE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | TRACE | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.recallcase.trace.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| TRACE | `recallcase.return.dispose` | current=TRACE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | RETURN_DISPOSE | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.recallcase.return.dispose.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RETURN_DISPOSE | `recallcase.closed` | current=RETURN_DISPOSE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.recallcase.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → NOTICE`, `CLOSED → RETURN_DISPOSE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-PMS — WardIndent
States: `DRAFT → SUBMITTED → APPROVED → ISSUED → CLOSED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `wardindent.submitted` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | SUBMITTED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.wardindent.submitted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| SUBMITTED | `wardindent.approved` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.wardindent.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| APPROVED | `wardindent.issued` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | ISSUED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.wardindent.issued.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| ISSUED | `wardindent.closed` | current=ISSUED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.wardindent.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `wardindent.cancelled` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.pms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-PMS | `hlt.pms.wardindent.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → DRAFT`, `CANCELLED → DRAFT`, `CANCELLED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-CMS — ClinicAppointment
States: `BOOKED → CHECKED_IN → NO_SHOW → CANCELLED → COMPLETED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| BOOKED | `clinicappointment.checked.in` | current=BOOKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | CHECKED_IN | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicappointment.checked.in.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| CHECKED_IN | `clinicappointment.no.show` | current=CHECKED_IN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | NO_SHOW | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicappointment.no.show.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| NO_SHOW | `clinicappointment.cancelled` | current=NO_SHOW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicappointment.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CANCELLED | `clinicappointment.completed` | current=CANCELLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicappointment.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-CMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → BOOKED`, `COMPLETED → CANCELLED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-CMS — ClinicEncounter
States: `OPEN → IN_CONSULTATION → SIGNED → CLOSED → ADDENDUM`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPEN | `clinicencounter.in.consultation` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | IN_CONSULTATION | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicencounter.in.consultation.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_CONSULTATION | `clinicencounter.signed` | current=IN_CONSULTATION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | SIGNED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicencounter.signed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SIGNED | `clinicencounter.closed` | current=SIGNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicencounter.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `clinicencounter.addendum` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | ADDENDUM | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicencounter.addendum.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-CMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → OPEN`, `ADDENDUM → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-CMS — ClinicProcedure
States: `ORDERED → CONSENTED → PERFORMED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ORDERED | `clinicprocedure.consented` | current=ORDERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | CONSENTED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicprocedure.consented.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| CONSENTED | `clinicprocedure.performed` | current=CONSENTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | PERFORMED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicprocedure.performed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PERFORMED | `clinicprocedure.cancelled` | current=PERFORMED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.clinicprocedure.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-CMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → ORDERED`, `CANCELLED → PERFORMED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-CMS — Referral
States: `DRAFT → CONSENTED → SENT → ACKNOWLEDGED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `referral.consented` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | CONSENTED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.referral.consented.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CONSENTED | `referral.sent` | current=CONSENTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | SENT | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.referral.sent.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SENT | `referral.acknowledged` | current=SENT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | ACKNOWLEDGED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.referral.acknowledged.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACKNOWLEDGED | `referral.closed` | current=ACKNOWLEDGED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.referral.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-CMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → DRAFT`, `CLOSED → ACKNOWLEDGED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-CMS — FollowUp
States: `PLANNED → BOOKED → COMPLETED → MISSED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `followup.booked` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | BOOKED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.followup.booked.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| BOOKED | `followup.completed` | current=BOOKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.followup.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| COMPLETED | `followup.missed` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | MISSED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.followup.missed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| MISSED | `followup.cancelled` | current=MISSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.followup.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-CMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → PLANNED`, `CANCELLED → MISSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HLT-CMS — TeleConsultSession
States: `SCHEDULED → READY → ACTIVE → COMPLETED → FAILED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SCHEDULED | `teleconsultsession.ready` | current=SCHEDULED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | READY | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.teleconsultsession.ready.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| READY | `teleconsultsession.active` | current=READY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.teleconsultsession.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| ACTIVE | `teleconsultsession.completed` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.teleconsultsession.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| COMPLETED | `teleconsultsession.failed` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | FAILED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.teleconsultsession.failed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| FAILED | `teleconsultsession.cancelled` | current=FAILED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hlt.cms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HLT-CMS | `hlt.cms.teleconsultsession.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HLT-CMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `FAILED → SCHEDULED`, `CANCELLED → SCHEDULED`, `CANCELLED → FAILED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-SMS — AdmissionApplication
States: `ENQUIRY → APPLICATION → VERIFICATION → ASSESSMENT → OFFERED → WAITLISTED → ENROLLED → REJECTED → WITHDRAWN`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ENQUIRY | `admissionapplication.application` | current=ENQUIRY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | APPLICATION | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.admissionapplication.application.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPLICATION | `admissionapplication.verification` | current=APPLICATION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | VERIFICATION | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.admissionapplication.verification.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| VERIFICATION | `admissionapplication.assessment` | current=VERIFICATION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | ASSESSMENT | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.admissionapplication.assessment.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ASSESSMENT | `admissionapplication.offered` | current=ASSESSMENT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | OFFERED | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.admissionapplication.offered.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| OFFERED | `admissionapplication.waitlisted` | current=OFFERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | WAITLISTED | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.admissionapplication.waitlisted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| WAITLISTED | `admissionapplication.enrolled` | current=WAITLISTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | ENROLLED | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.admissionapplication.enrolled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ENROLLED | `admissionapplication.rejected` | current=ENROLLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.admissionapplication.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| REJECTED | `admissionapplication.withdrawn` | current=REJECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | WITHDRAWN | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.admissionapplication.withdrawn.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-SMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → ENQUIRY`, `WITHDRAWN → REJECTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-SMS — AttendanceEntry
States: `PRESENT → ABSENT → LATE → EXCUSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PRESENT | `attendanceentry.absent` | current=PRESENT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | ABSENT | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.attendanceentry.absent.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ABSENT | `attendanceentry.late` | current=ABSENT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | LATE | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.attendanceentry.late.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| LATE | `attendanceentry.excused` | current=LATE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.sms.workflow.transition` | NONE unless MS rule explicitly requires | EXCUSED | increment row_version; persist transition history; apply domain side effects defined by EDU-SMS | `edu.sms.attendanceentry.excused.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-SMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `EXCUSED → LATE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-CUM — Enrollment
States: `APPLIED → VERIFIED → ADMITTED → REGISTERED → ACTIVE → COMPLETED → WITHDRAWN`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| APPLIED | `enrollment.verified` | current=APPLIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.cum.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | VERIFIED | increment row_version; persist transition history; apply domain side effects defined by EDU-CUM | `edu.cum.enrollment.verified.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| VERIFIED | `enrollment.admitted` | current=VERIFIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.cum.workflow.transition` | NONE unless MS rule explicitly requires | ADMITTED | increment row_version; persist transition history; apply domain side effects defined by EDU-CUM | `edu.cum.enrollment.admitted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ADMITTED | `enrollment.registered` | current=ADMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.cum.workflow.transition` | NONE unless MS rule explicitly requires | REGISTERED | increment row_version; persist transition history; apply domain side effects defined by EDU-CUM | `edu.cum.enrollment.registered.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REGISTERED | `enrollment.active` | current=REGISTERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.cum.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by EDU-CUM | `edu.cum.enrollment.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `enrollment.completed` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.cum.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by EDU-CUM | `edu.cum.enrollment.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `enrollment.withdrawn` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.cum.workflow.transition` | NONE unless MS rule explicitly requires | WITHDRAWN | increment row_version; persist transition history; apply domain side effects defined by EDU-CUM | `edu.cum.enrollment.withdrawn.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-CUM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `WITHDRAWN → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-CTM — Enquiry
States: `NEW → CONTACTED → COUNSELING → DEMO → OFFERED → CONVERTED → LOST`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NEW | `enquiry.contacted` | current=NEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | CONTACTED | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.enquiry.contacted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CONTACTED | `enquiry.counseling` | current=CONTACTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | COUNSELING | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.enquiry.counseling.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COUNSELING | `enquiry.demo` | current=COUNSELING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | DEMO | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.enquiry.demo.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DEMO | `enquiry.offered` | current=DEMO; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | OFFERED | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.enquiry.offered.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| OFFERED | `enquiry.converted` | current=OFFERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | CONVERTED | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.enquiry.converted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CONVERTED | `enquiry.lost` | current=CONVERTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | LOST | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.enquiry.lost.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-CTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `LOST → NEW`, `LOST → CONVERTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-CTM — BatchEnrollment
States: `OFFERED → ENROLLED → ATTENDING → COMPLETED → DROPPED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OFFERED | `batchenrollment.enrolled` | current=OFFERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | ENROLLED | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.batchenrollment.enrolled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ENROLLED | `batchenrollment.attending` | current=ENROLLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | ATTENDING | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.batchenrollment.attending.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ATTENDING | `batchenrollment.completed` | current=ATTENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.batchenrollment.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `batchenrollment.dropped` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | DROPPED | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.batchenrollment.dropped.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-CTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `DROPPED → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-CTM — TrainingBatch
States: `PLANNED → OPEN → RUNNING → COMPLETED → MERGED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `trainingbatch.open` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | OPEN | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.trainingbatch.open.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| OPEN | `trainingbatch.running` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | RUNNING | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.trainingbatch.running.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RUNNING | `trainingbatch.completed` | current=RUNNING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.trainingbatch.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `trainingbatch.merged` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ctm.workflow.transition` | NONE unless MS rule explicitly requires | MERGED | increment row_version; persist transition history; apply domain side effects defined by EDU-CTM | `edu.ctm.trainingbatch.merged.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-CTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `MERGED → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-LMS — Course
States: `DRAFT → REVIEW → PUBLISHED → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `course.review` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.lms.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by EDU-LMS | `edu.lms.course.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `course.published` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.lms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PUBLISHED | increment row_version; persist transition history; apply domain side effects defined by EDU-LMS | `edu.lms.course.published.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PUBLISHED | `course.retired` | current=PUBLISHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.lms.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by EDU-LMS | `edu.lms.course.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-LMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → DRAFT`, `RETIRED → PUBLISHED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-LMS — CourseEnrollment
States: `ENROLLED → IN_PROGRESS → COMPLETED → DROPPED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ENROLLED | `courseenrollment.in.progress` | current=ENROLLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.lms.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by EDU-LMS | `edu.lms.courseenrollment.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROGRESS | `courseenrollment.completed` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.lms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by EDU-LMS | `edu.lms.courseenrollment.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `courseenrollment.dropped` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.lms.workflow.transition` | NONE unless MS rule explicitly requires | DROPPED | increment row_version; persist transition history; apply domain side effects defined by EDU-LMS | `edu.lms.courseenrollment.dropped.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-LMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `DROPPED → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-LMS — SubmissionGrade
States: `SUBMITTED → GRADING → GRADED → RETURNED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SUBMITTED | `submissiongrade.grading` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.lms.workflow.transition` | NONE unless MS rule explicitly requires | GRADING | increment row_version; persist transition history; apply domain side effects defined by EDU-LMS | `edu.lms.submissiongrade.grading.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| GRADING | `submissiongrade.graded` | current=GRADING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.lms.workflow.transition` | NONE unless MS rule explicitly requires | GRADED | increment row_version; persist transition history; apply domain side effects defined by EDU-LMS | `edu.lms.submissiongrade.graded.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| GRADED | `submissiongrade.returned` | current=GRADED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.lms.workflow.transition` | NONE unless MS rule explicitly requires | RETURNED | increment row_version; persist transition history; apply domain side effects defined by EDU-LMS | `edu.lms.submissiongrade.returned.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-LMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETURNED → GRADED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-EMS — Exam
States: `DRAFT → SCHEDULED → CONDUCTED → EVALUATING → MODERATION → APPROVED → PUBLISHED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `exam.scheduled` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | NONE unless MS rule explicitly requires | SCHEDULED | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.exam.scheduled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SCHEDULED | `exam.conducted` | current=SCHEDULED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | NONE unless MS rule explicitly requires | CONDUCTED | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.exam.conducted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CONDUCTED | `exam.evaluating` | current=CONDUCTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | NONE unless MS rule explicitly requires | EVALUATING | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.exam.evaluating.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| EVALUATING | `exam.moderation` | current=EVALUATING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | NONE unless MS rule explicitly requires | MODERATION | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.exam.moderation.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| MODERATION | `exam.approved` | current=MODERATION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.exam.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `exam.published` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PUBLISHED | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.exam.published.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PUBLISHED | `exam.closed` | current=PUBLISHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.exam.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-EMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → DRAFT`, `CLOSED → PUBLISHED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-EMS — Evaluation
States: `DRAFT → SUBMITTED → MODERATED → FINAL`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `evaluation.submitted` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | NONE unless MS rule explicitly requires | SUBMITTED | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.evaluation.submitted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUBMITTED | `evaluation.moderated` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | NONE unless MS rule explicitly requires | MODERATED | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.evaluation.moderated.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| MODERATED | `evaluation.final` | current=MODERATED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | NONE unless MS rule explicitly requires | FINAL | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.evaluation.final.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-EMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `FINAL → MODERATED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## EDU-EMS — ResultPublication
States: `PREPARED → APPROVED → PUBLISHED → SUPERSEDED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PREPARED | `resultpublication.approved` | current=PREPARED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.resultpublication.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `resultpublication.published` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PUBLISHED | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.resultpublication.published.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PUBLISHED | `resultpublication.superseded` | current=PUBLISHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `edu.ems.workflow.transition` | NONE unless MS rule explicitly requires | SUPERSEDED | increment row_version; persist transition history; apply domain side effects defined by EDU-EMS | `edu.ems.resultpublication.superseded.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `EDU-EMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `SUPERSEDED → PUBLISHED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-RSM — StoreDay
States: `PLANNED → OPENING → TRADING → CLOSING → RECONCILIATION → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `storeday.opening` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.rsm.workflow.transition` | NONE unless MS rule explicitly requires | OPENING | increment row_version; persist transition history; apply domain side effects defined by RTL-RSM | `rtl.rsm.storeday.opening.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| OPENING | `storeday.trading` | current=OPENING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.rsm.workflow.transition` | NONE unless MS rule explicitly requires | TRADING | increment row_version; persist transition history; apply domain side effects defined by RTL-RSM | `rtl.rsm.storeday.trading.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| TRADING | `storeday.closing` | current=TRADING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.rsm.workflow.transition` | NONE unless MS rule explicitly requires | CLOSING | increment row_version; persist transition history; apply domain side effects defined by RTL-RSM | `rtl.rsm.storeday.closing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CLOSING | `storeday.reconciliation` | current=CLOSING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.rsm.workflow.transition` | NONE unless MS rule explicitly requires | RECONCILIATION | increment row_version; persist transition history; apply domain side effects defined by RTL-RSM | `rtl.rsm.storeday.reconciliation.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RECONCILIATION | `storeday.closed` | current=RECONCILIATION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.rsm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by RTL-RSM | `rtl.rsm.storeday.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-RSM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → PLANNED`, `CLOSED → RECONCILIATION`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-RSM — CounterShift
States: `PLANNED → OPEN → CLOSED → RECONCILED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `countershift.open` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.rsm.workflow.transition` | NONE unless MS rule explicitly requires | OPEN | increment row_version; persist transition history; apply domain side effects defined by RTL-RSM | `rtl.rsm.countershift.open.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| OPEN | `countershift.closed` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.rsm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by RTL-RSM | `rtl.rsm.countershift.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `countershift.reconciled` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.rsm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | RECONCILED | increment row_version; persist transition history; apply domain side effects defined by RTL-RSM | `rtl.rsm.countershift.reconciled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-RSM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → PLANNED`, `RECONCILED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-RSM — StoreChecklistEntry
States: `PENDING → DONE → EXCEPTION`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PENDING | `storechecklistentry.done` | current=PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.rsm.workflow.transition` | NONE unless MS rule explicitly requires | DONE | increment row_version; persist transition history; apply domain side effects defined by RTL-RSM | `rtl.rsm.storechecklistentry.done.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DONE | `storechecklistentry.exception` | current=DONE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.rsm.workflow.transition` | NONE unless MS rule explicitly requires | EXCEPTION | increment row_version; persist transition history; apply domain side effects defined by RTL-RSM | `rtl.rsm.storechecklistentry.exception.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-RSM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `EXCEPTION → DONE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-POS — PosSession
States: `OPEN → LOCKED → CLOSING → CLOSED → RECONCILED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPEN | `possession.locked` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | NONE unless MS rule explicitly requires | LOCKED | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.possession.locked.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| LOCKED | `possession.closing` | current=LOCKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | NONE unless MS rule explicitly requires | CLOSING | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.possession.closing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CLOSING | `possession.closed` | current=CLOSING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.possession.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `possession.reconciled` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | RECONCILED | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.possession.reconciled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-POS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → OPEN`, `RECONCILED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-POS — Sale
States: `DRAFT → TENDERING → PAID → VOIDED → REFUNDED_PARTIAL → REFUNDED_FULL`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `sale.tendering` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | NONE unless MS rule explicitly requires | TENDERING | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.sale.tendering.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| TENDERING | `sale.paid` | current=TENDERING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PAID | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.sale.paid.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PAID | `sale.voided` | current=PAID; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | NONE unless MS rule explicitly requires | VOIDED | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.sale.voided.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| VOIDED | `sale.refunded.partial` | current=VOIDED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | NONE unless MS rule explicitly requires | REFUNDED_PARTIAL | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.sale.refunded.partial.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REFUNDED_PARTIAL | `sale.refunded.full` | current=REFUNDED_PARTIAL; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | NONE unless MS rule explicitly requires | REFUNDED_FULL | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.sale.refunded.full.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-POS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REFUNDED_FULL → REFUNDED_PARTIAL`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-POS — Tender
States: `PENDING → AUTHORIZED → CAPTURED → FAILED → REVERSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PENDING | `tender.authorized` | current=PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | NONE unless MS rule explicitly requires | AUTHORIZED | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.tender.authorized.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| AUTHORIZED | `tender.captured` | current=AUTHORIZED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | NONE unless MS rule explicitly requires | CAPTURED | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.tender.captured.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CAPTURED | `tender.failed` | current=CAPTURED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | NONE unless MS rule explicitly requires | FAILED | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.tender.failed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| FAILED | `tender.reversed` | current=FAILED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.pos.workflow.transition` | NONE unless MS rule explicitly requires | REVERSED | increment row_version; persist transition history; apply domain side effects defined by RTL-POS | `rtl.pos.tender.reversed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | compensating reversal already represented; second reversal requires explicit correction policy |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-POS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `FAILED → PENDING`, `REVERSED → FAILED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-IWM — Reservation
States: `HELD → COMMITTED → RELEASED → EXPIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| HELD | `reservation.committed` | current=HELD; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.iwm.workflow.transition` | NONE unless MS rule explicitly requires | COMMITTED | increment row_version; persist transition history; apply domain side effects defined by RTL-IWM | `rtl.iwm.reservation.committed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMMITTED | `reservation.released` | current=COMMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.iwm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | RELEASED | increment row_version; persist transition history; apply domain side effects defined by RTL-IWM | `rtl.iwm.reservation.released.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RELEASED | `reservation.expired` | current=RELEASED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.iwm.workflow.transition` | NONE unless MS rule explicitly requires | EXPIRED | increment row_version; persist transition history; apply domain side effects defined by RTL-IWM | `rtl.iwm.reservation.expired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-IWM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `EXPIRED → HELD`, `EXPIRED → RELEASED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-IWM — CycleCount
States: `PLANNED → COUNTING → REVIEW → APPROVED → POSTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `cyclecount.counting` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.iwm.workflow.transition` | NONE unless MS rule explicitly requires | COUNTING | increment row_version; persist transition history; apply domain side effects defined by RTL-IWM | `rtl.iwm.cyclecount.counting.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COUNTING | `cyclecount.review` | current=COUNTING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.iwm.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by RTL-IWM | `rtl.iwm.cyclecount.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `cyclecount.approved` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.iwm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by RTL-IWM | `rtl.iwm.cyclecount.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `cyclecount.posted` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.iwm.workflow.transition` | NONE unless MS rule explicitly requires | POSTED | increment row_version; persist transition history; apply domain side effects defined by RTL-IWM | `rtl.iwm.cyclecount.posted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-IWM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `POSTED → APPROVED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-OMS — Order
States: `PLACED → PAYMENT_PENDING → PAID → ALLOCATED → PICKED → PACKED → SHIPPED → DELIVERED → CLOSED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLACED | `order.payment.pending` | current=PLACED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | PAYMENT_PENDING | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.order.payment.pending.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PAYMENT_PENDING | `order.paid` | current=PAYMENT_PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PAID | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.order.paid.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PAID | `order.allocated` | current=PAID; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | ALLOCATED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.order.allocated.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| ALLOCATED | `order.picked` | current=ALLOCATED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | PICKED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.order.picked.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PICKED | `order.packed` | current=PICKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | PACKED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.order.packed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PACKED | `order.shipped` | current=PACKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | SHIPPED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.order.shipped.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| SHIPPED | `order.delivered` | current=SHIPPED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | DELIVERED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.order.delivered.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| DELIVERED | `order.closed` | current=DELIVERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.order.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `order.cancelled` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.order.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-OMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → PLACED`, `CANCELLED → PLACED`, `CANCELLED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-OMS — Shipment
States: `PLANNED → DISPATCHED → IN_TRANSIT → DELIVERED → FAILED → RETURNED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `shipment.dispatched` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | DISPATCHED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.shipment.dispatched.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DISPATCHED | `shipment.in.transit` | current=DISPATCHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | IN_TRANSIT | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.shipment.in.transit.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_TRANSIT | `shipment.delivered` | current=IN_TRANSIT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | DELIVERED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.shipment.delivered.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DELIVERED | `shipment.failed` | current=DELIVERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | FAILED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.shipment.failed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| FAILED | `shipment.returned` | current=FAILED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | RETURNED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.shipment.returned.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-OMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `FAILED → PLANNED`, `RETURNED → FAILED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-OMS — ReturnCase
States: `REQUESTED → APPROVED → RECEIVED → INSPECTED → REFUND_APPROVED → REFUNDED → REJECTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REQUESTED | `returncase.approved` | current=REQUESTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.returncase.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `returncase.received` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | RECEIVED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.returncase.received.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RECEIVED | `returncase.inspected` | current=RECEIVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | INSPECTED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.returncase.inspected.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| INSPECTED | `returncase.refund.approved` | current=INSPECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | REFUND_APPROVED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.returncase.refund.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REFUND_APPROVED | `returncase.refunded` | current=REFUND_APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | REFUNDED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.returncase.refunded.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REFUNDED | `returncase.rejected` | current=REFUNDED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.oms.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by RTL-OMS | `rtl.oms.returncase.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-OMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → REQUESTED`, `REJECTED → REFUNDED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-MKT — Seller
States: `APPLIED → REVIEW → APPROVED → SUSPENDED → REVOKED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| APPLIED | `seller.review` | current=APPLIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.seller.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `seller.approved` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.seller.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `seller.suspended` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | SUSPENDED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.seller.suspended.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUSPENDED | `seller.revoked` | current=SUSPENDED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | REVOKED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.seller.revoked.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-MKT_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVOKED → APPLIED`, `REVOKED → SUSPENDED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-MKT — Listing
States: `DRAFT → REVIEW → ACTIVE → PAUSED → REJECTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `listing.review` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.listing.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `listing.active` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.listing.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `listing.paused` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | PAUSED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.listing.paused.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PAUSED | `listing.rejected` | current=PAUSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.listing.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-MKT_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → DRAFT`, `REJECTED → PAUSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-MKT — SellerOrder
States: `ROUTED → ACCEPTED → FULFILLED → RETURNED → SETTLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ROUTED | `sellerorder.accepted` | current=ROUTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | ACCEPTED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.sellerorder.accepted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACCEPTED | `sellerorder.fulfilled` | current=ACCEPTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | FULFILLED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.sellerorder.fulfilled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| FULFILLED | `sellerorder.returned` | current=FULFILLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | RETURNED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.sellerorder.returned.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RETURNED | `sellerorder.settled` | current=RETURNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | SETTLED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.sellerorder.settled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-MKT_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `SETTLED → RETURNED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## RTL-MKT — Settlement
States: `DRAFT → APPROVED → PAID → REVERSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `settlement.approved` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.settlement.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `settlement.paid` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PAID | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.settlement.paid.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PAID | `settlement.reversed` | current=PAID; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `rtl.mkt.workflow.transition` | NONE unless MS rule explicitly requires | REVERSED | increment row_version; persist transition history; apply domain side effects defined by RTL-MKT | `rtl.mkt.settlement.reversed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | compensating reversal already represented; second reversal requires explicit correction policy |

### Forbidden transition rules
- All unlisted edges are forbidden and return `RTL-MKT_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVERSED → PAID`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-HMS — Stay
States: `RESERVED → CHECKED_IN → IN_HOUSE → CHECKOUT_PENDING → CHECKED_OUT → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RESERVED | `stay.checked.in` | current=RESERVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | NONE unless MS rule explicitly requires | CHECKED_IN | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.stay.checked.in.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CHECKED_IN | `stay.in.house` | current=CHECKED_IN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | NONE unless MS rule explicitly requires | IN_HOUSE | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.stay.in.house.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_HOUSE | `stay.checkout.pending` | current=IN_HOUSE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | NONE unless MS rule explicitly requires | CHECKOUT_PENDING | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.stay.checkout.pending.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CHECKOUT_PENDING | `stay.checked.out` | current=CHECKOUT_PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | NONE unless MS rule explicitly requires | CHECKED_OUT | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.stay.checked.out.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CHECKED_OUT | `stay.closed` | current=CHECKED_OUT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.stay.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-HMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → RESERVED`, `CLOSED → CHECKED_OUT`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-HMS — Folio
States: `OPEN → SETTLEMENT_PENDING → SETTLED → TRANSFERRED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPEN | `folio.settlement.pending` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | NONE unless MS rule explicitly requires | SETTLEMENT_PENDING | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.folio.settlement.pending.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SETTLEMENT_PENDING | `folio.settled` | current=SETTLEMENT_PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | SETTLED | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.folio.settled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SETTLED | `folio.transferred` | current=SETTLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | NONE unless MS rule explicitly requires | TRANSFERRED | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.folio.transferred.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| TRANSFERRED | `folio.closed` | current=TRANSFERRED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.folio.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-HMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → OPEN`, `CLOSED → TRANSFERRED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-HMS — HousekeepingTask
States: `DIRTY → CLEANING → INSPECTED → READY → OUT_OF_ORDER`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DIRTY | `housekeepingtask.cleaning` | current=DIRTY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | NONE unless MS rule explicitly requires | CLEANING | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.housekeepingtask.cleaning.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CLEANING | `housekeepingtask.inspected` | current=CLEANING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | NONE unless MS rule explicitly requires | INSPECTED | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.housekeepingtask.inspected.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| INSPECTED | `housekeepingtask.ready` | current=INSPECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | NONE unless MS rule explicitly requires | READY | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.housekeepingtask.ready.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| READY | `housekeepingtask.out.of.order` | current=READY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.hms.workflow.transition` | NONE unless MS rule explicitly requires | OUT_OF_ORDER | increment row_version; persist transition history; apply domain side effects defined by HSP-HMS | `hsp.hms.housekeepingtask.out.of.order.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-HMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `OUT_OF_ORDER → READY`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-RMS — RestaurantOrder
States: `OPEN → KOT_SENT → PREPARING → SERVED → BILLING → SETTLED → VOIDED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPEN | `restaurantorder.kot.sent` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | KOT_SENT | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.restaurantorder.kot.sent.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| KOT_SENT | `restaurantorder.preparing` | current=KOT_SENT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | PREPARING | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.restaurantorder.preparing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PREPARING | `restaurantorder.served` | current=PREPARING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | SERVED | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.restaurantorder.served.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SERVED | `restaurantorder.billing` | current=SERVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | BILLING | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.restaurantorder.billing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| BILLING | `restaurantorder.settled` | current=BILLING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | SETTLED | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.restaurantorder.settled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SETTLED | `restaurantorder.voided` | current=SETTLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | VOIDED | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.restaurantorder.voided.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-RMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `VOIDED → SETTLED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-RMS — OrderLine
States: `NEW → KOT_SENT → PREPARING → SERVED → REVERSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NEW | `orderline.kot.sent` | current=NEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | KOT_SENT | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.orderline.kot.sent.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| KOT_SENT | `orderline.preparing` | current=KOT_SENT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | PREPARING | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.orderline.preparing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PREPARING | `orderline.served` | current=PREPARING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | SERVED | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.orderline.served.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SERVED | `orderline.reversed` | current=SERVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | REVERSED | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.orderline.reversed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | compensating reversal already represented; second reversal requires explicit correction policy |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-RMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVERSED → SERVED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-RMS — KotTicket
States: `QUEUED → PREPARING → READY → SERVED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| QUEUED | `kotticket.preparing` | current=QUEUED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | PREPARING | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.kotticket.preparing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PREPARING | `kotticket.ready` | current=PREPARING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | READY | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.kotticket.ready.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| READY | `kotticket.served` | current=READY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rms.workflow.transition` | NONE unless MS rule explicitly requires | SERVED | increment row_version; persist transition history; apply domain side effects defined by HSP-RMS | `hsp.rms.kotticket.served.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-RMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `SERVED → READY`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-BEM — EventEnquiry
States: `NEW → QUALIFIED → PROPOSAL → SITE_VISIT → BOOKING_PENDING → LOST`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NEW | `eventenquiry.qualified` | current=NEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | QUALIFIED | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventenquiry.qualified.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| QUALIFIED | `eventenquiry.proposal` | current=QUALIFIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | PROPOSAL | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventenquiry.proposal.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PROPOSAL | `eventenquiry.site.visit` | current=PROPOSAL; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | SITE_VISIT | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventenquiry.site.visit.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SITE_VISIT | `eventenquiry.booking.pending` | current=SITE_VISIT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | BOOKING_PENDING | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventenquiry.booking.pending.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| BOOKING_PENDING | `eventenquiry.lost` | current=BOOKING_PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | LOST | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventenquiry.lost.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-BEM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `LOST → NEW`, `LOST → BOOKING_PENDING`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-BEM — EventBooking
States: `TENTATIVE → CONFIRMED → EXECUTING → COMPLETED → SETTLED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TENTATIVE | `eventbooking.confirmed` | current=TENTATIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | CONFIRMED | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventbooking.confirmed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| CONFIRMED | `eventbooking.executing` | current=CONFIRMED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | EXECUTING | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventbooking.executing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| EXECUTING | `eventbooking.completed` | current=EXECUTING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventbooking.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| COMPLETED | `eventbooking.settled` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | SETTLED | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventbooking.settled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| SETTLED | `eventbooking.cancelled` | current=SETTLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventbooking.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-BEM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → TENTATIVE`, `CANCELLED → SETTLED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-BEM — FunctionSheet
States: `DRAFT → REVIEW → APPROVED → SUPERSEDED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `functionsheet.review` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.functionsheet.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `functionsheet.approved` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.functionsheet.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `functionsheet.superseded` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | SUPERSEDED | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.functionsheet.superseded.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-BEM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `SUPERSEDED → APPROVED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-BEM — EventCharge
States: `PLANNED → POSTED → REVERSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `eventcharge.posted` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | POSTED | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventcharge.posted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| POSTED | `eventcharge.reversed` | current=POSTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.bem.workflow.transition` | NONE unless MS rule explicitly requires | REVERSED | increment row_version; persist transition history; apply domain side effects defined by HSP-BEM | `hsp.bem.eventcharge.reversed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | compensating reversal already represented; second reversal requires explicit correction policy |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-BEM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVERSED → POSTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-RBM — Reservation
States: `TENTATIVE → CONFIRMED → CANCELLED → NO_SHOW → CHECKED_IN → COMPLETED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TENTATIVE | `reservation.confirmed` | current=TENTATIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rbm.workflow.transition` | NONE unless MS rule explicitly requires | CONFIRMED | increment row_version; persist transition history; apply domain side effects defined by HSP-RBM | `hsp.rbm.reservation.confirmed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| CONFIRMED | `reservation.cancelled` | current=CONFIRMED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rbm.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by HSP-RBM | `hsp.rbm.reservation.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CANCELLED | `reservation.no.show` | current=CANCELLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rbm.workflow.transition` | NONE unless MS rule explicitly requires | NO_SHOW | increment row_version; persist transition history; apply domain side effects defined by HSP-RBM | `hsp.rbm.reservation.no.show.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| NO_SHOW | `reservation.checked.in` | current=NO_SHOW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rbm.workflow.transition` | NONE unless MS rule explicitly requires | CHECKED_IN | increment row_version; persist transition history; apply domain side effects defined by HSP-RBM | `hsp.rbm.reservation.checked.in.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| CHECKED_IN | `reservation.completed` | current=CHECKED_IN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rbm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by HSP-RBM | `hsp.rbm.reservation.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-RBM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → TENTATIVE`, `COMPLETED → CHECKED_IN`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## HSP-RBM — RatePlan
States: `DRAFT → ACTIVE → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `rateplan.active` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rbm.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by HSP-RBM | `hsp.rbm.rateplan.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `rateplan.retired` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `hsp.rbm.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by HSP-RBM | `hsp.rbm.rateplan.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `HSP-RBM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → DRAFT`, `RETIRED → ACTIVE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-PMS — BomVersion
States: `DRAFT → APPROVED → ACTIVE → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `bomversion.approved` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.bomversion.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `bomversion.active` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.bomversion.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `bomversion.retired` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.bomversion.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → DRAFT`, `RETIRED → ACTIVE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-PMS — RoutingVersion
States: `DRAFT → APPROVED → ACTIVE → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `routingversion.approved` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.routingversion.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `routingversion.active` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.routingversion.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `routingversion.retired` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.routingversion.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → DRAFT`, `RETIRED → ACTIVE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-PMS — ProductionOrder
States: `PLANNED → RELEASED → MATERIAL_ISSUED → IN_PROGRESS → QC → HOLD → COMPLETED → CLOSED → SCRAPPED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `productionorder.released` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | RELEASED | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.productionorder.released.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RELEASED | `productionorder.material.issued` | current=RELEASED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | MATERIAL_ISSUED | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.productionorder.material.issued.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| MATERIAL_ISSUED | `productionorder.in.progress` | current=MATERIAL_ISSUED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.productionorder.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROGRESS | `productionorder.qc` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | QC | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.productionorder.qc.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| QC | `productionorder.hold` | current=QC; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | HOLD | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.productionorder.hold.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| HOLD | `productionorder.completed` | current=HOLD; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.productionorder.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `productionorder.closed` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.productionorder.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `productionorder.scrapped` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | SCRAPPED | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.productionorder.scrapped.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → PLANNED`, `SCRAPPED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-PMS — OperationExecution
States: `PENDING → RUNNING → COMPLETED → HOLD`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PENDING | `operationexecution.running` | current=PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | RUNNING | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.operationexecution.running.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RUNNING | `operationexecution.completed` | current=RUNNING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.operationexecution.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `operationexecution.hold` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pms.workflow.transition` | NONE unless MS rule explicitly requires | HOLD | increment row_version; persist transition history; apply domain side effects defined by MFG-PMS | `mfg.pms.operationexecution.hold.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `HOLD → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-IWM — MaterialBalance
States: `AVAILABLE → HOLD → REJECTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| AVAILABLE | `materialbalance.hold` | current=AVAILABLE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.iwm.workflow.transition` | NONE unless MS rule explicitly requires | HOLD | increment row_version; persist transition history; apply domain side effects defined by MFG-IWM | `mfg.iwm.materialbalance.hold.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| HOLD | `materialbalance.rejected` | current=HOLD; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.iwm.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by MFG-IWM | `mfg.iwm.materialbalance.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-IWM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → AVAILABLE`, `REJECTED → HOLD`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-IWM — ProductionReservation
States: `HELD → ISSUED → RELEASED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| HELD | `productionreservation.issued` | current=HELD; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.iwm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | ISSUED | increment row_version; persist transition history; apply domain side effects defined by MFG-IWM | `mfg.iwm.productionreservation.issued.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ISSUED | `productionreservation.released` | current=ISSUED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.iwm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | RELEASED | increment row_version; persist transition history; apply domain side effects defined by MFG-IWM | `mfg.iwm.productionreservation.released.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-IWM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RELEASED → ISSUED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-IWM — CycleCount
States: `PLANNED → COUNTED → REVIEW → APPROVED → ADJUSTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `cyclecount.counted` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.iwm.workflow.transition` | NONE unless MS rule explicitly requires | COUNTED | increment row_version; persist transition history; apply domain side effects defined by MFG-IWM | `mfg.iwm.cyclecount.counted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COUNTED | `cyclecount.review` | current=COUNTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.iwm.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by MFG-IWM | `mfg.iwm.cyclecount.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `cyclecount.approved` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.iwm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by MFG-IWM | `mfg.iwm.cyclecount.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `cyclecount.adjusted` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.iwm.workflow.transition` | NONE unless MS rule explicitly requires | ADJUSTED | increment row_version; persist transition history; apply domain side effects defined by MFG-IWM | `mfg.iwm.cyclecount.adjusted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-IWM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ADJUSTED → APPROVED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-QMS — InspectionPlan
States: `DRAFT → APPROVED → ACTIVE → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `inspectionplan.approved` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.inspectionplan.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `inspectionplan.active` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.inspectionplan.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `inspectionplan.retired` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.inspectionplan.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-QMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → DRAFT`, `RETIRED → ACTIVE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-QMS — Inspection
States: `PLANNED → IN_PROGRESS → PASS → FAIL → DEVIATION → HOLD → DISPOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `inspection.in.progress` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.inspection.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROGRESS | `inspection.pass` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | NONE unless MS rule explicitly requires | PASS | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.inspection.pass.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PASS | `inspection.fail` | current=PASS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | NONE unless MS rule explicitly requires | FAIL | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.inspection.fail.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| FAIL | `inspection.deviation` | current=FAIL; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | NONE unless MS rule explicitly requires | DEVIATION | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.inspection.deviation.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DEVIATION | `inspection.hold` | current=DEVIATION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | NONE unless MS rule explicitly requires | HOLD | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.inspection.hold.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| HOLD | `inspection.disposed` | current=HOLD; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | DISPOSED | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.inspection.disposed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-QMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `DISPOSED → PLANNED`, `DISPOSED → HOLD`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-QMS — NonConformance
States: `OPEN → REVIEW → APPROVED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPEN | `nonconformance.review` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.nonconformance.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `nonconformance.approved` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.nonconformance.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `nonconformance.closed` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.nonconformance.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-QMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → OPEN`, `CLOSED → APPROVED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-QMS — Capa
States: `OPEN → IMPLEMENTED → VERIFIED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPEN | `capa.implemented` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | NONE unless MS rule explicitly requires | IMPLEMENTED | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.capa.implemented.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IMPLEMENTED | `capa.verified` | current=IMPLEMENTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | VERIFIED | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.capa.verified.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| VERIFIED | `capa.closed` | current=VERIFIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.qms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by MFG-QMS | `mfg.qms.capa.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-QMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → OPEN`, `CLOSED → VERIFIED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-PRO — PurchaseRequisition
States: `DRAFT → SUBMITTED → APPROVED → REJECTED → SOURCING → PO_CREATED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `purchaserequisition.submitted` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | SUBMITTED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaserequisition.submitted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUBMITTED | `purchaserequisition.approved` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaserequisition.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `purchaserequisition.rejected` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaserequisition.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| REJECTED | `purchaserequisition.sourcing` | current=REJECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | SOURCING | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaserequisition.sourcing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SOURCING | `purchaserequisition.po.created` | current=SOURCING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | PO_CREATED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaserequisition.po.created.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PO_CREATED | `purchaserequisition.closed` | current=PO_CREATED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaserequisition.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-PRO_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → DRAFT`, `CLOSED → DRAFT`, `CLOSED → PO_CREATED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-PRO — PurchaseOrder
States: `DRAFT → APPROVED → ISSUED → PART_RECEIVED → RECEIVED → CLOSED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `purchaseorder.approved` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaseorder.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| APPROVED | `purchaseorder.issued` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | ISSUED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaseorder.issued.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| ISSUED | `purchaseorder.part.received` | current=ISSUED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | PART_RECEIVED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaseorder.part.received.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PART_RECEIVED | `purchaseorder.received` | current=PART_RECEIVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | RECEIVED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaseorder.received.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| RECEIVED | `purchaseorder.closed` | current=RECEIVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaseorder.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `purchaseorder.cancelled` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.purchaseorder.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-PRO_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → DRAFT`, `CANCELLED → DRAFT`, `CANCELLED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-PRO — GoodsReceipt
States: `PENDING → PASS → FAIL → HOLD`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PENDING | `goodsreceipt.pass` | current=PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | PASS | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.goodsreceipt.pass.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PASS | `goodsreceipt.fail` | current=PASS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | FAIL | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.goodsreceipt.fail.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| FAIL | `goodsreceipt.hold` | current=FAIL; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | HOLD | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.goodsreceipt.hold.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-PRO_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `HOLD → FAIL`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-PRO — InvoiceMatch
States: `PENDING → MATCHED → EXCEPTION → APPROVED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PENDING | `invoicematch.matched` | current=PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | MATCHED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.invoicematch.matched.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| MATCHED | `invoicematch.exception` | current=MATCHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | NONE unless MS rule explicitly requires | EXCEPTION | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.invoicematch.exception.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| EXCEPTION | `invoicematch.approved` | current=EXCEPTION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.pro.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by MFG-PRO | `mfg.pro.invoicematch.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-PRO_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `APPROVED → EXCEPTION`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-MMS — Asset
States: `ACTIVE → DOWN → MAINTENANCE → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `asset.down` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | NONE unless MS rule explicitly requires | DOWN | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.asset.down.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DOWN | `asset.maintenance` | current=DOWN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | NONE unless MS rule explicitly requires | MAINTENANCE | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.asset.maintenance.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| MAINTENANCE | `asset.retired` | current=MAINTENANCE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.asset.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-MMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → ACTIVE`, `RETIRED → MAINTENANCE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-MMS — MaintenanceSchedule
States: `ACTIVE → PAUSED → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `maintenanceschedule.paused` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | NONE unless MS rule explicitly requires | PAUSED | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.maintenanceschedule.paused.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PAUSED | `maintenanceschedule.retired` | current=PAUSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.maintenanceschedule.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-MMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → ACTIVE`, `RETIRED → PAUSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## MFG-MMS — WorkOrder
States: `OPEN → ASSIGNED → IN_PROGRESS → WAITING_PARTS → VERIFICATION → CLOSED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPEN | `workorder.assigned` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | NONE unless MS rule explicitly requires | ASSIGNED | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.workorder.assigned.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| ASSIGNED | `workorder.in.progress` | current=ASSIGNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.workorder.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| IN_PROGRESS | `workorder.waiting.parts` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | NONE unless MS rule explicitly requires | WAITING_PARTS | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.workorder.waiting.parts.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| WAITING_PARTS | `workorder.verification` | current=WAITING_PARTS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | NONE unless MS rule explicitly requires | VERIFICATION | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.workorder.verification.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| VERIFICATION | `workorder.closed` | current=VERIFICATION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.workorder.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `workorder.cancelled` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `mfg.mms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by MFG-MMS | `mfg.mms.workorder.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `MFG-MMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → OPEN`, `CANCELLED → OPEN`, `CANCELLED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-CRM — Lead
States: `NEW → QUALIFIED → DISQUALIFIED → CONVERTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NEW | `lead.qualified` | current=NEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.crm.workflow.transition` | NONE unless MS rule explicitly requires | QUALIFIED | increment row_version; persist transition history; apply domain side effects defined by PSV-CRM | `psv.crm.lead.qualified.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| QUALIFIED | `lead.disqualified` | current=QUALIFIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.crm.workflow.transition` | NONE unless MS rule explicitly requires | DISQUALIFIED | increment row_version; persist transition history; apply domain side effects defined by PSV-CRM | `psv.crm.lead.disqualified.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DISQUALIFIED | `lead.converted` | current=DISQUALIFIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.crm.workflow.transition` | NONE unless MS rule explicitly requires | CONVERTED | increment row_version; persist transition history; apply domain side effects defined by PSV-CRM | `psv.crm.lead.converted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-CRM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CONVERTED → DISQUALIFIED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-CRM — Proposal
States: `DRAFT → REVIEW → ISSUED → ACCEPTED → REJECTED → SUPERSEDED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `proposal.review` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.crm.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by PSV-CRM | `psv.crm.proposal.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `proposal.issued` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.crm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | ISSUED | increment row_version; persist transition history; apply domain side effects defined by PSV-CRM | `psv.crm.proposal.issued.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ISSUED | `proposal.accepted` | current=ISSUED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.crm.workflow.transition` | NONE unless MS rule explicitly requires | ACCEPTED | increment row_version; persist transition history; apply domain side effects defined by PSV-CRM | `psv.crm.proposal.accepted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACCEPTED | `proposal.rejected` | current=ACCEPTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.crm.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by PSV-CRM | `psv.crm.proposal.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| REJECTED | `proposal.superseded` | current=REJECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.crm.workflow.transition` | NONE unless MS rule explicitly requires | SUPERSEDED | increment row_version; persist transition history; apply domain side effects defined by PSV-CRM | `psv.crm.proposal.superseded.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-CRM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → DRAFT`, `SUPERSEDED → REJECTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-PJM — Project
States: `SETUP → ACTIVE → HOLD → COMPLETING → COMPLETED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SETUP | `project.active` | current=SETUP; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.project.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `project.hold` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | HOLD | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.project.hold.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| HOLD | `project.completing` | current=HOLD; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | COMPLETING | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.project.completing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETING | `project.completed` | current=COMPLETING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.project.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `project.closed` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.project.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-PJM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → SETUP`, `CLOSED → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-PJM — WorkItem
States: `TODO → IN_PROGRESS → BLOCKED → DONE → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TODO | `workitem.in.progress` | current=TODO; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.workitem.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| IN_PROGRESS | `workitem.blocked` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | BLOCKED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.workitem.blocked.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| BLOCKED | `workitem.done` | current=BLOCKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | DONE | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.workitem.done.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| DONE | `workitem.cancelled` | current=DONE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.workitem.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-PJM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → TODO`, `CANCELLED → DONE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-PJM — Milestone
States: `PLANNED → IN_PROGRESS → SUBMITTED → ACCEPTED → REJECTED → INVOICED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `milestone.in.progress` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.milestone.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROGRESS | `milestone.submitted` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | SUBMITTED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.milestone.submitted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUBMITTED | `milestone.accepted` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | ACCEPTED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.milestone.accepted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACCEPTED | `milestone.rejected` | current=ACCEPTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.milestone.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| REJECTED | `milestone.invoiced` | current=REJECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | INVOICED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.milestone.invoiced.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-PJM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → PLANNED`, `INVOICED → REJECTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-PJM — ChangeRequest
States: `DRAFT → SUBMITTED → APPROVED → REJECTED → IMPLEMENTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `changerequest.submitted` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | SUBMITTED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.changerequest.submitted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUBMITTED | `changerequest.approved` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.changerequest.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `changerequest.rejected` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.changerequest.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| REJECTED | `changerequest.implemented` | current=REJECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.pjm.workflow.transition` | NONE unless MS rule explicitly requires | IMPLEMENTED | increment row_version; persist transition history; apply domain side effects defined by PSV-PJM | `psv.pjm.changerequest.implemented.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-PJM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → DRAFT`, `IMPLEMENTED → REJECTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-SDM — ServiceContractRef
States: `ACTIVE → SUSPENDED → EXPIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `servicecontractref.suspended` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | SUSPENDED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.servicecontractref.suspended.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUSPENDED | `servicecontractref.expired` | current=SUSPENDED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | EXPIRED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.servicecontractref.expired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-SDM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `EXPIRED → ACTIVE`, `EXPIRED → SUSPENDED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-SDM — ServiceTicket
States: `RECEIVED → TRIAGED → ASSIGNED → IN_PROGRESS → CLIENT_WAIT → RESOLVED → ACCEPTED → CLOSED → ESCALATED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RECEIVED | `serviceticket.triaged` | current=RECEIVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | TRIAGED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.serviceticket.triaged.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| TRIAGED | `serviceticket.assigned` | current=TRIAGED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | ASSIGNED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.serviceticket.assigned.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ASSIGNED | `serviceticket.in.progress` | current=ASSIGNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.serviceticket.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROGRESS | `serviceticket.client.wait` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | CLIENT_WAIT | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.serviceticket.client.wait.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CLIENT_WAIT | `serviceticket.resolved` | current=CLIENT_WAIT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | RESOLVED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.serviceticket.resolved.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RESOLVED | `serviceticket.accepted` | current=RESOLVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | ACCEPTED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.serviceticket.accepted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACCEPTED | `serviceticket.closed` | current=ACCEPTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.serviceticket.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `serviceticket.escalated` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | ESCALATED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.serviceticket.escalated.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-SDM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → RECEIVED`, `ESCALATED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-SDM — SlaClock
States: `RUNNING → PAUSED → MET → BREACHED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RUNNING | `slaclock.paused` | current=RUNNING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | PAUSED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.slaclock.paused.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PAUSED | `slaclock.met` | current=PAUSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | MET | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.slaclock.met.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| MET | `slaclock.breached` | current=MET; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | BREACHED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.slaclock.breached.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-SDM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `BREACHED → MET`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-SDM — Deliverable
States: `PLANNED → IN_PROGRESS → SUBMITTED → REVISION → ACCEPTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `deliverable.in.progress` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.deliverable.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROGRESS | `deliverable.submitted` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | SUBMITTED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.deliverable.submitted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUBMITTED | `deliverable.revision` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | REVISION | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.deliverable.revision.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVISION | `deliverable.accepted` | current=REVISION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sdm.workflow.transition` | NONE unless MS rule explicitly requires | ACCEPTED | increment row_version; persist transition history; apply domain side effects defined by PSV-SDM | `psv.sdm.deliverable.accepted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-SDM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ACCEPTED → REVISION`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-RTM — ResourceProfile
States: `ACTIVE → INACTIVE`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `resourceprofile.inactive` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | NONE unless MS rule explicitly requires | INACTIVE | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.resourceprofile.inactive.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-RTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `backward/skip transitions not listed above`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-RTM — Allocation
States: `PROPOSED → APPROVED → ACTIVE → ENDED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PROPOSED | `allocation.approved` | current=PROPOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.allocation.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `allocation.active` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.allocation.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `allocation.ended` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | NONE unless MS rule explicitly requires | ENDED | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.allocation.ended.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-RTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ENDED → ACTIVE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-RTM — Timesheet
States: `DRAFT → SUBMITTED → REJECTED → APPROVED → LOCKED → BILLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `timesheet.submitted` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | NONE unless MS rule explicitly requires | SUBMITTED | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.timesheet.submitted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUBMITTED | `timesheet.rejected` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.timesheet.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| REJECTED | `timesheet.approved` | current=REJECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.timesheet.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `timesheet.locked` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | NONE unless MS rule explicitly requires | LOCKED | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.timesheet.locked.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| LOCKED | `timesheet.billed` | current=LOCKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | NONE unless MS rule explicitly requires | BILLED | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.timesheet.billed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-RTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → DRAFT`, `BILLED → LOCKED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-RTM — TimeEntry
States: `DRAFT → APPROVED → REJECTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `timeentry.approved` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.timeentry.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `timeentry.rejected` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.rtm.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by PSV-RTM | `psv.rtm.timeentry.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-RTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → DRAFT`, `REJECTED → APPROVED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-SGM — StudioBooking
States: `ENQUIRY → CONFIRMED → SCHEDULED → SHOT → EDITING → CLIENT_REVIEW → DELIVERED → ARCHIVED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ENQUIRY | `studiobooking.confirmed` | current=ENQUIRY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | CONFIRMED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.studiobooking.confirmed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| CONFIRMED | `studiobooking.scheduled` | current=CONFIRMED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | SCHEDULED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.studiobooking.scheduled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| SCHEDULED | `studiobooking.shot` | current=SCHEDULED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | SHOT | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.studiobooking.shot.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| SHOT | `studiobooking.editing` | current=SHOT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | EDITING | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.studiobooking.editing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| EDITING | `studiobooking.client.review` | current=EDITING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | CLIENT_REVIEW | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.studiobooking.client.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| CLIENT_REVIEW | `studiobooking.delivered` | current=CLIENT_REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | DELIVERED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.studiobooking.delivered.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| DELIVERED | `studiobooking.archived` | current=DELIVERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | ARCHIVED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.studiobooking.archived.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| ARCHIVED | `studiobooking.cancelled` | current=ARCHIVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.studiobooking.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-SGM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ARCHIVED → ENQUIRY`, `CANCELLED → ENQUIRY`, `CANCELLED → ARCHIVED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-SGM — ShootAssignment
States: `PLANNED → IN_PROGRESS → COMPLETED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `shootassignment.in.progress` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.shootassignment.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROGRESS | `shootassignment.completed` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.shootassignment.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-SGM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `COMPLETED → IN_PROGRESS`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-SGM — MediaRevision
States: `DRAFT → SUBMITTED → CHANGES_REQUESTED → APPROVED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `mediarevision.submitted` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | SUBMITTED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.mediarevision.submitted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUBMITTED | `mediarevision.changes.requested` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | CHANGES_REQUESTED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.mediarevision.changes.requested.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CHANGES_REQUESTED | `mediarevision.approved` | current=CHANGES_REQUESTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.mediarevision.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-SGM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `APPROVED → CHANGES_REQUESTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## PSV-SGM — DeliveryRecord
States: `PREPARED → SHARED → ACCEPTED → REVOKED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PREPARED | `deliveryrecord.shared` | current=PREPARED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | SHARED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.deliveryrecord.shared.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SHARED | `deliveryrecord.accepted` | current=SHARED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | ACCEPTED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.deliveryrecord.accepted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACCEPTED | `deliveryrecord.revoked` | current=ACCEPTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `psv.sgm.workflow.transition` | NONE unless MS rule explicitly requires | REVOKED | increment row_version; persist transition history; apply domain side effects defined by PSV-SGM | `psv.sgm.deliveryrecord.revoked.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `PSV-SGM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVOKED → PREPARED`, `REVOKED → ACCEPTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-CSM — CitizenRequest
States: `SUBMITTED → ACKNOWLEDGED → TRIAGED → ASSIGNED → PROCESSING → INFO_REQUESTED → RESOLVED → CLOSED → REOPENED → ESCALATED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SUBMITTED | `citizenrequest.acknowledged` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | ACKNOWLEDGED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.citizenrequest.acknowledged.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACKNOWLEDGED | `citizenrequest.triaged` | current=ACKNOWLEDGED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | TRIAGED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.citizenrequest.triaged.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| TRIAGED | `citizenrequest.assigned` | current=TRIAGED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | ASSIGNED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.citizenrequest.assigned.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ASSIGNED | `citizenrequest.processing` | current=ASSIGNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | PROCESSING | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.citizenrequest.processing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PROCESSING | `citizenrequest.info.requested` | current=PROCESSING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | INFO_REQUESTED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.citizenrequest.info.requested.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| INFO_REQUESTED | `citizenrequest.resolved` | current=INFO_REQUESTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | RESOLVED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.citizenrequest.resolved.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RESOLVED | `citizenrequest.closed` | current=RESOLVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.citizenrequest.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `citizenrequest.reopened` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | REOPENED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.citizenrequest.reopened.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REOPENED | `citizenrequest.escalated` | current=REOPENED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | ESCALATED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.citizenrequest.escalated.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-CSM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → SUBMITTED`, `ESCALATED → REOPENED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-CSM — SlaInstance
States: `RUNNING → PAUSED → MET → BREACHED → ESCALATED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RUNNING | `slainstance.paused` | current=RUNNING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | PAUSED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.slainstance.paused.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PAUSED | `slainstance.met` | current=PAUSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | MET | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.slainstance.met.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| MET | `slainstance.breached` | current=MET; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | BREACHED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.slainstance.breached.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| BREACHED | `slainstance.escalated` | current=BREACHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | ESCALATED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.slainstance.escalated.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-CSM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ESCALATED → BREACHED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-CSM — Appeal
States: `SUBMITTED → REVIEW → HEARING → DECIDED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SUBMITTED | `appeal.review` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.appeal.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `appeal.hearing` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | HEARING | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.appeal.hearing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| HEARING | `appeal.decided` | current=HEARING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | NONE unless MS rule explicitly requires | DECIDED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.appeal.decided.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DECIDED | `appeal.closed` | current=DECIDED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.csm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by GOV-CSM | `gov.csm.appeal.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-CSM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → SUBMITTED`, `CLOSED → DECIDED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-CFM — OfficialFile
States: `CREATED → IN_PROCESS → APPROVAL → DISPOSED → ARCHIVED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CREATED | `officialfile.in.process` | current=CREATED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.cfm.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROCESS | increment row_version; persist transition history; apply domain side effects defined by GOV-CFM | `gov.cfm.officialfile.in.process.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROCESS | `officialfile.approval` | current=IN_PROCESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.cfm.workflow.transition` | NONE unless MS rule explicitly requires | APPROVAL | increment row_version; persist transition history; apply domain side effects defined by GOV-CFM | `gov.cfm.officialfile.approval.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVAL | `officialfile.disposed` | current=APPROVAL; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.cfm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | DISPOSED | increment row_version; persist transition history; apply domain side effects defined by GOV-CFM | `gov.cfm.officialfile.disposed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| DISPOSED | `officialfile.archived` | current=DISPOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.cfm.workflow.transition` | NONE unless MS rule explicitly requires | ARCHIVED | increment row_version; persist transition history; apply domain side effects defined by GOV-CFM | `gov.cfm.officialfile.archived.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-CFM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `DISPOSED → CREATED`, `ARCHIVED → CREATED`, `ARCHIVED → DISPOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-PLM — PermitApplication
States: `SUBMITTED → FEE_PENDING → SCRUTINY → DEFICIENCY → INSPECTION → DECISION → APPROVED → REJECTED → ISSUED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SUBMITTED | `permitapplication.fee.pending` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | FEE_PENDING | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitapplication.fee.pending.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| FEE_PENDING | `permitapplication.scrutiny` | current=FEE_PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | SCRUTINY | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitapplication.scrutiny.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SCRUTINY | `permitapplication.deficiency` | current=SCRUTINY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | DEFICIENCY | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitapplication.deficiency.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DEFICIENCY | `permitapplication.inspection` | current=DEFICIENCY; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | INSPECTION | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitapplication.inspection.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| INSPECTION | `permitapplication.decision` | current=INSPECTION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | DECISION | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitapplication.decision.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DECISION | `permitapplication.approved` | current=DECISION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitapplication.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `permitapplication.rejected` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitapplication.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| REJECTED | `permitapplication.issued` | current=REJECTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | ISSUED | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitapplication.issued.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-PLM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → SUBMITTED`, `ISSUED → REJECTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-PLM — Inspection
States: `SCHEDULED → COMPLETED → FAILED → APPROVED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SCHEDULED | `inspection.completed` | current=SCHEDULED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.inspection.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `inspection.failed` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | FAILED | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.inspection.failed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| FAILED | `inspection.approved` | current=FAILED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.inspection.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-PLM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `FAILED → SCHEDULED`, `APPROVED → FAILED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-PLM — PermitLicense
States: `ACTIVE → SUSPENDED → REVOKED → EXPIRED → RENEWED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `permitlicense.suspended` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | SUSPENDED | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitlicense.suspended.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUSPENDED | `permitlicense.revoked` | current=SUSPENDED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | REVOKED | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitlicense.revoked.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| REVOKED | `permitlicense.expired` | current=REVOKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | EXPIRED | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitlicense.expired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| EXPIRED | `permitlicense.renewed` | current=EXPIRED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.plm.workflow.transition` | NONE unless MS rule explicitly requires | RENEWED | increment row_version; persist transition history; apply domain side effects defined by GOV-PLM | `gov.plm.permitlicense.renewed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-PLM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVOKED → ACTIVE`, `EXPIRED → ACTIVE`, `RENEWED → EXPIRED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-RTM — Assessment
States: `DRAFT → ASSESSED → FINALIZED → REVISED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `assessment.assessed` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | NONE unless MS rule explicitly requires | ASSESSED | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.assessment.assessed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ASSESSED | `assessment.finalized` | current=ASSESSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | FINALIZED | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.assessment.finalized.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| FINALIZED | `assessment.revised` | current=FINALIZED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | NONE unless MS rule explicitly requires | REVISED | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.assessment.revised.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-RTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVISED → FINALIZED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-RTM — Demand
States: `ISSUED → PART_PAID → PAID → ARREARS → REVERSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ISSUED | `demand.part.paid` | current=ISSUED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | NONE unless MS rule explicitly requires | PART_PAID | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.demand.part.paid.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PART_PAID | `demand.paid` | current=PART_PAID; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PAID | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.demand.paid.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PAID | `demand.arrears` | current=PAID; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | NONE unless MS rule explicitly requires | ARREARS | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.demand.arrears.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ARREARS | `demand.reversed` | current=ARREARS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | NONE unless MS rule explicitly requires | REVERSED | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.demand.reversed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | compensating reversal already represented; second reversal requires explicit correction policy |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-RTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVERSED → ARREARS`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-RTM — RevenueReceipt
States: `ISSUED → REVERSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ISSUED | `revenuereceipt.reversed` | current=ISSUED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | NONE unless MS rule explicitly requires | REVERSED | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.revenuereceipt.reversed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | compensating reversal already represented; second reversal requires explicit correction policy |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-RTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `backward/skip transitions not listed above`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## GOV-RTM — RecoveryRefundCase
States: `OPEN → REVIEW → APPROVED → EXECUTED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPEN | `recoveryrefundcase.review` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.recoveryrefundcase.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `recoveryrefundcase.approved` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.recoveryrefundcase.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `recoveryrefundcase.executed` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | NONE unless MS rule explicitly requires | EXECUTED | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.recoveryrefundcase.executed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| EXECUTED | `recoveryrefundcase.closed` | current=EXECUTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `gov.rtm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by GOV-RTM | `gov.rtm.recoveryrefundcase.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `GOV-RTM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → OPEN`, `CLOSED → EXECUTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-DMS — Pledge
States: `RECORDED → REMINDER → PARTIAL → FULFILLED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RECORDED | `pledge.reminder` | current=RECORDED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dms.workflow.transition` | NONE unless MS rule explicitly requires | REMINDER | increment row_version; persist transition history; apply domain side effects defined by NGO-DMS | `ngo.dms.pledge.reminder.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| REMINDER | `pledge.partial` | current=REMINDER; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dms.workflow.transition` | NONE unless MS rule explicitly requires | PARTIAL | increment row_version; persist transition history; apply domain side effects defined by NGO-DMS | `ngo.dms.pledge.partial.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PARTIAL | `pledge.fulfilled` | current=PARTIAL; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dms.workflow.transition` | NONE unless MS rule explicitly requires | FULFILLED | increment row_version; persist transition history; apply domain side effects defined by NGO-DMS | `ngo.dms.pledge.fulfilled.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| FULFILLED | `pledge.cancelled` | current=FULFILLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dms.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by NGO-DMS | `ngo.dms.pledge.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-DMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → RECORDED`, `CANCELLED → FULFILLED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-DMS — DonorSegmentMembership
States: `ACTIVE → REMOVED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `donorsegmentmembership.removed` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dms.workflow.transition` | NONE unless MS rule explicitly requires | REMOVED | increment row_version; persist transition history; apply domain side effects defined by NGO-DMS | `ngo.dms.donorsegmentmembership.removed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-DMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `backward/skip transitions not listed above`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-DFM — Donation
States: `RECEIVED → RECEIPTED → ALLOCATED → REVERSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RECEIVED | `donation.receipted` | current=RECEIVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dfm.workflow.transition` | NONE unless MS rule explicitly requires | RECEIPTED | increment row_version; persist transition history; apply domain side effects defined by NGO-DFM | `ngo.dfm.donation.receipted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RECEIPTED | `donation.allocated` | current=RECEIPTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dfm.workflow.transition` | NONE unless MS rule explicitly requires | ALLOCATED | increment row_version; persist transition history; apply domain side effects defined by NGO-DFM | `ngo.dfm.donation.allocated.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ALLOCATED | `donation.reversed` | current=ALLOCATED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dfm.workflow.transition` | NONE unless MS rule explicitly requires | REVERSED | increment row_version; persist transition history; apply domain side effects defined by NGO-DFM | `ngo.dfm.donation.reversed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | compensating reversal already represented; second reversal requires explicit correction policy |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-DFM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVERSED → ALLOCATED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-DFM — DonationReceipt
States: `ISSUED → REVERSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ISSUED | `donationreceipt.reversed` | current=ISSUED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dfm.workflow.transition` | NONE unless MS rule explicitly requires | REVERSED | increment row_version; persist transition history; apply domain side effects defined by NGO-DFM | `ngo.dfm.donationreceipt.reversed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | compensating reversal already represented; second reversal requires explicit correction policy |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-DFM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `backward/skip transitions not listed above`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-DFM — Fund
States: `ACTIVE → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `fund.closed` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dfm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by NGO-DFM | `ngo.dfm.fund.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-DFM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → ACTIVE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-DFM — FundUtilization
States: `REQUESTED → APPROVED → POSTED → REVERSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REQUESTED | `fundutilization.approved` | current=REQUESTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dfm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by NGO-DFM | `ngo.dfm.fundutilization.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `fundutilization.posted` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dfm.workflow.transition` | NONE unless MS rule explicitly requires | POSTED | increment row_version; persist transition history; apply domain side effects defined by NGO-DFM | `ngo.dfm.fundutilization.posted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| POSTED | `fundutilization.reversed` | current=POSTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.dfm.workflow.transition` | NONE unless MS rule explicitly requires | REVERSED | increment row_version; persist transition history; apply domain side effects defined by NGO-DFM | `ngo.dfm.fundutilization.reversed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | compensating reversal already represented; second reversal requires explicit correction policy |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-DFM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVERSED → POSTED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-TAM — SevaOffering
States: `ACTIVE → PAUSED → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `sevaoffering.paused` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | PAUSED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.sevaoffering.paused.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PAUSED | `sevaoffering.retired` | current=PAUSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.sevaoffering.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-TAM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → ACTIVE`, `RETIRED → PAUSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-TAM — SevaBooking
States: `HELD → CONFIRMED → PERFORMED → CANCELLED → NO_SHOW`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| HELD | `sevabooking.confirmed` | current=HELD; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | CONFIRMED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.sevabooking.confirmed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| CONFIRMED | `sevabooking.performed` | current=CONFIRMED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | PERFORMED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.sevabooking.performed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| PERFORMED | `sevabooking.cancelled` | current=PERFORMED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.sevabooking.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CANCELLED | `sevabooking.no.show` | current=CANCELLED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | NO_SHOW | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.sevabooking.no.show.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-TAM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → HELD`, `NO_SHOW → CANCELLED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-TAM — TempleEvent
States: `PLANNED → APPROVED → EXECUTING → COMPLETED → SETTLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `templeevent.approved` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.templeevent.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `templeevent.executing` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | EXECUTING | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.templeevent.executing.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| EXECUTING | `templeevent.completed` | current=EXECUTING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.templeevent.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `templeevent.settled` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | SETTLED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.templeevent.settled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-TAM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `SETTLED → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-TAM — Dispatch
States: `PENDING → PACKED → DISPATCHED → DELIVERED → FAILED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PENDING | `dispatch.packed` | current=PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | PACKED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.dispatch.packed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PACKED | `dispatch.dispatched` | current=PACKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | DISPATCHED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.dispatch.dispatched.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DISPATCHED | `dispatch.delivered` | current=DISPATCHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | DELIVERED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.dispatch.delivered.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DELIVERED | `dispatch.failed` | current=DELIVERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.tam.workflow.transition` | NONE unless MS rule explicitly requires | FAILED | increment row_version; persist transition history; apply domain side effects defined by NGO-TAM | `ngo.tam.dispatch.failed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-TAM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `FAILED → PENDING`, `FAILED → DELIVERED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-MVM — Membership
States: `APPLIED → APPROVED → ACTIVE → LAPSED → RENEWED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| APPLIED | `membership.approved` | current=APPLIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.membership.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| APPROVED | `membership.active` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.membership.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| ACTIVE | `membership.lapsed` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | LAPSED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.membership.lapsed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| LAPSED | `membership.renewed` | current=LAPSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | RENEWED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.membership.renewed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| RENEWED | `membership.cancelled` | current=RENEWED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.membership.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-MVM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → APPLIED`, `CANCELLED → RENEWED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-MVM — VolunteerProfile
States: `APPLIED → ACTIVE → SUSPENDED → INACTIVE`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| APPLIED | `volunteerprofile.active` | current=APPLIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.volunteerprofile.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `volunteerprofile.suspended` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | SUSPENDED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.volunteerprofile.suspended.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUSPENDED | `volunteerprofile.inactive` | current=SUSPENDED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | INACTIVE | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.volunteerprofile.inactive.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-MVM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `INACTIVE → SUSPENDED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-MVM — VolunteerAssignment
States: `PLANNED → ACCEPTED → ACTIVE → COMPLETED → CANCELLED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `volunteerassignment.accepted` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | ACCEPTED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.volunteerassignment.accepted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| ACCEPTED | `volunteerassignment.active` | current=ACCEPTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.volunteerassignment.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| ACTIVE | `volunteerassignment.completed` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.volunteerassignment.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | cancel permitted only through named cancel command before irreversible state |
| COMPLETED | `volunteerassignment.cancelled` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | CANCELLED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.volunteerassignment.cancelled.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-MVM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CANCELLED → PLANNED`, `CANCELLED → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## NGO-MVM — VolunteerHours
States: `DRAFT → SUBMITTED → VERIFIED → REJECTED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| DRAFT | `volunteerhours.submitted` | current=DRAFT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | SUBMITTED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.volunteerhours.submitted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| SUBMITTED | `volunteerhours.verified` | current=SUBMITTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | VERIFIED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.volunteerhours.verified.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| VERIFIED | `volunteerhours.rejected` | current=VERIFIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `ngo.mvm.workflow.transition` | NONE unless MS rule explicitly requires | REJECTED | increment row_version; persist transition history; apply domain side effects defined by NGO-MVM | `ngo.mvm.volunteerhours.rejected.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `NGO-MVM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REJECTED → DRAFT`, `REJECTED → VERIFIED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-SGM — SecurityPost
States: `ACTIVE → INACTIVE`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `securitypost.inactive` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.sgm.workflow.transition` | NONE unless MS rule explicitly requires | INACTIVE | increment row_version; persist transition history; apply domain side effects defined by SFM-SGM | `sfm.sgm.securitypost.inactive.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-SGM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `backward/skip transitions not listed above`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-SGM — RosterShift
States: `PLANNED → PUBLISHED → CHECKED_IN → ACTIVE → RELIEVED → COMPLETED → ABSENT`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PLANNED | `rostershift.published` | current=PLANNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.sgm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | PUBLISHED | increment row_version; persist transition history; apply domain side effects defined by SFM-SGM | `sfm.sgm.rostershift.published.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PUBLISHED | `rostershift.checked.in` | current=PUBLISHED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.sgm.workflow.transition` | NONE unless MS rule explicitly requires | CHECKED_IN | increment row_version; persist transition history; apply domain side effects defined by SFM-SGM | `sfm.sgm.rostershift.checked.in.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CHECKED_IN | `rostershift.active` | current=CHECKED_IN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.sgm.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by SFM-SGM | `sfm.sgm.rostershift.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `rostershift.relieved` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.sgm.workflow.transition` | NONE unless MS rule explicitly requires | RELIEVED | increment row_version; persist transition history; apply domain side effects defined by SFM-SGM | `sfm.sgm.rostershift.relieved.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RELIEVED | `rostershift.completed` | current=RELIEVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.sgm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by SFM-SGM | `sfm.sgm.rostershift.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `rostershift.absent` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.sgm.workflow.transition` | NONE unless MS rule explicitly requires | ABSENT | increment row_version; persist transition history; apply domain side effects defined by SFM-SGM | `sfm.sgm.rostershift.absent.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-SGM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `ABSENT → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-SGM — ReliefHandover
States: `REQUESTED → ASSIGNED → HANDOVER → COMPLETED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REQUESTED | `reliefhandover.assigned` | current=REQUESTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.sgm.workflow.transition` | NONE unless MS rule explicitly requires | ASSIGNED | increment row_version; persist transition history; apply domain side effects defined by SFM-SGM | `sfm.sgm.reliefhandover.assigned.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ASSIGNED | `reliefhandover.handover` | current=ASSIGNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.sgm.workflow.transition` | NONE unless MS rule explicitly requires | HANDOVER | increment row_version; persist transition history; apply domain side effects defined by SFM-SGM | `sfm.sgm.reliefhandover.handover.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| HANDOVER | `reliefhandover.completed` | current=HANDOVER; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.sgm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by SFM-SGM | `sfm.sgm.reliefhandover.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-SGM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `COMPLETED → HANDOVER`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-PMS — PatrolRoute
States: `ACTIVE → PAUSED → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `patrolroute.paused` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | NONE unless MS rule explicitly requires | PAUSED | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.patrolroute.paused.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PAUSED | `patrolroute.retired` | current=PAUSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.patrolroute.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → ACTIVE`, `RETIRED → PAUSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-PMS — PatrolRound
States: `SCHEDULED → STARTED → IN_PROGRESS → EXCEPTION → COMPLETED → REVIEWED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SCHEDULED | `patrolround.started` | current=SCHEDULED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | NONE unless MS rule explicitly requires | STARTED | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.patrolround.started.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| STARTED | `patrolround.in.progress` | current=STARTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.patrolround.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROGRESS | `patrolround.exception` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | NONE unless MS rule explicitly requires | EXCEPTION | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.patrolround.exception.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| EXCEPTION | `patrolround.completed` | current=EXCEPTION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | COMPLETED | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.patrolround.completed.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| COMPLETED | `patrolround.reviewed` | current=COMPLETED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | NONE unless MS rule explicitly requires | REVIEWED | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.patrolround.reviewed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `REVIEWED → COMPLETED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-PMS — Incident
States: `REPORTED → ACKNOWLEDGED → INVESTIGATING → RESOLVED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| REPORTED | `incident.acknowledged` | current=REPORTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | NONE unless MS rule explicitly requires | ACKNOWLEDGED | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.incident.acknowledged.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACKNOWLEDGED | `incident.investigating` | current=ACKNOWLEDGED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | NONE unless MS rule explicitly requires | INVESTIGATING | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.incident.investigating.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| INVESTIGATING | `incident.resolved` | current=INVESTIGATING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | NONE unless MS rule explicitly requires | RESOLVED | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.incident.resolved.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RESOLVED | `incident.closed` | current=RESOLVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.pms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by SFM-PMS | `sfm.pms.incident.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-PMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → REPORTED`, `CLOSED → RESOLVED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-VMS — Visitor
States: `NOT_CHECKED → CLEAR → REVIEW → BLOCKED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| NOT_CHECKED | `visitor.clear` | current=NOT_CHECKED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | CLEAR | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.visitor.clear.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CLEAR | `visitor.review` | current=CLEAR; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | REVIEW | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.visitor.review.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| REVIEW | `visitor.blocked` | current=REVIEW; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | BLOCKED | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.visitor.blocked.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-VMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `BLOCKED → REVIEW`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-VMS — Visit
States: `PREREGISTERED → ARRIVED → APPROVAL_PENDING → APPROVED → CHECKED_IN → CHECKED_OUT → DENIED → OVERSTAY`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| PREREGISTERED | `visit.arrived` | current=PREREGISTERED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | ARRIVED | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.visit.arrived.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ARRIVED | `visit.approval.pending` | current=ARRIVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | APPROVAL_PENDING | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.visit.approval.pending.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVAL_PENDING | `visit.approved` | current=APPROVAL_PENDING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | APPROVED | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.visit.approved.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| APPROVED | `visit.checked.in` | current=APPROVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | CHECKED_IN | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.visit.checked.in.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CHECKED_IN | `visit.checked.out` | current=CHECKED_IN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | CHECKED_OUT | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.visit.checked.out.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CHECKED_OUT | `visit.denied` | current=CHECKED_OUT; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | DENIED | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.visit.denied.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DENIED | `visit.overstay` | current=DENIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | OVERSTAY | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.visit.overstay.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-VMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `OVERSTAY → DENIED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-VMS — Badge
States: `ISSUED → ACTIVE → EXPIRED → RETURNED → REVOKED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ISSUED | `badge.active` | current=ISSUED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | ACTIVE | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.badge.active.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACTIVE | `badge.expired` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | EXPIRED | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.badge.expired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| EXPIRED | `badge.returned` | current=EXPIRED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | RETURNED | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.badge.returned.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RETURNED | `badge.revoked` | current=RETURNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.vms.workflow.transition` | NONE unless MS rule explicitly requires | REVOKED | increment row_version; persist transition history; apply domain side effects defined by SFM-VMS | `sfm.vms.badge.revoked.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-VMS_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `EXPIRED → ISSUED`, `REVOKED → ISSUED`, `REVOKED → RETURNED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-FMM — FacilityAsset
States: `ACTIVE → DOWN → MAINTENANCE → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `facilityasset.down` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | DOWN | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityasset.down.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| DOWN | `facilityasset.maintenance` | current=DOWN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | MAINTENANCE | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityasset.maintenance.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| MAINTENANCE | `facilityasset.retired` | current=MAINTENANCE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityasset.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-FMM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → ACTIVE`, `RETIRED → MAINTENANCE`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-FMM — FacilityTicket
States: `RAISED → CATEGORIZED → ASSIGNED → IN_PROGRESS → RESOLVED → VERIFICATION → CLOSED → ESCALATED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| RAISED | `facilityticket.categorized` | current=RAISED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | CATEGORIZED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityticket.categorized.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| CATEGORIZED | `facilityticket.assigned` | current=CATEGORIZED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | ASSIGNED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityticket.assigned.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ASSIGNED | `facilityticket.in.progress` | current=ASSIGNED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityticket.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROGRESS | `facilityticket.resolved` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | RESOLVED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityticket.resolved.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RESOLVED | `facilityticket.verification` | current=RESOLVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | VERIFICATION | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityticket.verification.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| VERIFICATION | `facilityticket.closed` | current=VERIFICATION; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityticket.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |
| CLOSED | `facilityticket.escalated` | current=CLOSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | ESCALATED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityticket.escalated.v1` | configured affected party/owner via NotificationPort | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-FMM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → RAISED`, `ESCALATED → CLOSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-FMM — FacilityWorkOrder
States: `OPEN → ACCEPTED → IN_PROGRESS → WAITING → RESOLVED → VERIFIED → CLOSED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| OPEN | `facilityworkorder.accepted` | current=OPEN; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | ACCEPTED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityworkorder.accepted.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| ACCEPTED | `facilityworkorder.in.progress` | current=ACCEPTED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | IN_PROGRESS | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityworkorder.in.progress.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| IN_PROGRESS | `facilityworkorder.waiting` | current=IN_PROGRESS; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | WAITING | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityworkorder.waiting.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| WAITING | `facilityworkorder.resolved` | current=WAITING; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | RESOLVED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityworkorder.resolved.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| RESOLVED | `facilityworkorder.verified` | current=RESOLVED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | VERIFIED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityworkorder.verified.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| VERIFIED | `facilityworkorder.closed` | current=VERIFIED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | domain approver when configured; actor cannot self-approve where separation-of-duty policy applies | CLOSED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.facilityworkorder.closed.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-FMM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `CLOSED → OPEN`, `CLOSED → VERIFIED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## SFM-FMM — PreventiveSchedule
States: `ACTIVE → PAUSED → RETIRED`

| Current State | Trigger | Preconditions | Permission | Approval | Next State | Side Effects | Event | Notification | Audit | Reversal/Cancel |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ACTIVE | `preventiveschedule.paused` | current=ACTIVE; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | PAUSED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.preventiveschedule.paused.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no implicit reversal; compensating/correction command only |
| PAUSED | `preventiveschedule.retired` | current=PAUSED; expectedVersion matches; required domain fields valid; Tenant+Industry Context active | `sfm.fmm.workflow.transition` | NONE unless MS rule explicitly requires | RETIRED | increment row_version; persist transition history; apply domain side effects defined by SFM-FMM | `sfm.fmm.preventiveschedule.retired.v1` | NONE | SUCCESS with actor/context/from/to/reason/correlation | no backward transition; correction/reopen only by explicit domain command |

### Forbidden transition rules
- All unlisted edges are forbidden and return `SFM-FMM_STATE_INVALID` with zero domain mutation/event.
- Explicit examples: `RETIRED → ACTIVE`, `RETIRED → PAUSED`.
- Direct database status edits are prohibited; only OperationContracts may transition state.

## Coverage
- Stateful workflows/entities discovered from the nine canonical industry DD artifacts: **141**.
- Explicit allowed transition rows: **574**.
- All 41 MS namespaces are represented through their stateful entities; workflows without a state enum are governed by their operation/state contracts and DD-21 acceptance IDs.
