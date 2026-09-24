# REVIEW_REQUIRED — Historical Gates / Current Dependency Ownership
**Updated:** 2026-09-24 · **Current checkpoint:** `DEV-AI-CONVERSATION-ASSISTANT-CURRENT-BINDING-FLOORS-001`

No general approval request is pending. Missing contracts are dependency blocks, not implied approvals.

DD-185 covers only AIConversation→optional AssistantDefinition currentness. Conversation owner-principal currentness, effective Assistant selection, nested prompt/tool currentness and AI execution remain separately governed.

Previously locked machine verifier, Webhook execution, SyncCursor runtime, Integration runtime, Outbox dispatch/retry, Notification execution, Workflow/Automation execution and Agent/tool execution boundaries remain locked.
