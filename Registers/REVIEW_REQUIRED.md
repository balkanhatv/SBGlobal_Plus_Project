# REVIEW_REQUIRED — Historical Gates / Current Dependency Ownership
**Updated:** 2026-09-24 · **Current checkpoint:** `DEV-AUTOMATION-RUN-DEFINITION-CURRENT-BINDING-FLOORS-001`

No general approval request is pending. Missing contracts are dependency blocks, not implied approvals.

DD-175 covers only AutomationRun→AutomationDefinition currentness. Version/effective-date selection, trigger interpretation, condition evaluation, run-state mutation, retry/finality and OperationContract/Workflow dispatch remain separately governed.

Previously locked machine verifier, Webhook execution, SyncCursor runtime, Integration runtime, Outbox dispatch/retry, Notification recipient/execution and Workflow execution boundaries remain locked.
