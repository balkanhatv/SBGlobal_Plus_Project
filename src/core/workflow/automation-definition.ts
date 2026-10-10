import type { JsonValue } from "../api/schema-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type {
  WorkflowDefinitionOwnerScope,
  WorkflowDefinitionStatus,
} from "./definition.js";

export type AutomationTriggerType = "EVENT" | "SCHEDULE" | "MANUAL";

export interface PersistedAutomationDefinition {
  readonly id: string;
  readonly ownerScope: WorkflowDefinitionOwnerScope;
  readonly tenantId?: string;
  readonly industryContextId?: string;
  readonly code: string;
  readonly version: number;
  readonly status: WorkflowDefinitionStatus;
  readonly schemaVersion: number;
  readonly triggerType: AutomationTriggerType;
  readonly triggerConfig: JsonValue;
  readonly conditionRuleRef?: string;
  readonly operationContractId?: string;
  readonly workflowDefinitionId?: string;
  readonly config: JsonValue;
  readonly createdBy: string;
  readonly approvedBy?: string;
  readonly effectiveFrom?: string;
  readonly effectiveTo?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AutomationDefinitionReadPort {
  loadForContext(input: {
    readonly requestContext: RequestContext;
    readonly automationDefinitionId: string;
  }): Promise<PersistedAutomationDefinition | null>;
}
