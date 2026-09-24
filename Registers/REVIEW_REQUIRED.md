# REVIEW_REQUIRED — Historical Gates / Current Dependency Ownership
**Updated:** 2026-09-24 · **Current checkpoint:** `DEV-WORKFLOW-INSTANCE-DEFINITION-CURRENT-BINDING-FLOORS-001`

No general approval request is pending. Missing contracts are dependency blocks, not implied approvals.

DD-173 covers only WorkflowInstance→WorkflowDefinition currentness. Creator-principal currentness, state-machine interpretation, transition authorization and broader Workflow execution remain separately governed.

Previously locked machine verifier, Webhook execution, SyncCursor runtime, Integration runtime, Outbox dispatch/retry and Notification recipient/execution boundaries remain locked.
