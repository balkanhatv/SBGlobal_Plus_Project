# REVIEW_REQUIRED — Historical Gates / Current Dependency Ownership
**Updated:** 2026-09-24 · **Current checkpoint:** `DEV-AUTOMATION-DEFINITION-WORKFLOW-CONTAINMENT-FLOORS-001`

No general approval request is pending. Missing contracts are dependency blocks, not implied approvals.

DD-176 covers only AutomationDefinition→WorkflowDefinition containment. WorkflowDefinition status/version/effective-date selection and Automation/Workflow execution remain separately governed.

OperationContract identifiers on AutomationDefinition remain raw text evidence; no execution/validation authority may be inferred without a source-owned contract.

Previously locked machine verifier, Webhook execution, SyncCursor runtime, Integration runtime, Outbox dispatch/retry and Notification recipient/execution boundaries remain locked.
