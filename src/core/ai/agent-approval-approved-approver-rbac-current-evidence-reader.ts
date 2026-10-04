import type { RequestContext } from "../context/contracts.js";
import type {
  AuthorizationReadState,
  AuthorizationReadStorePort,
} from "../authorization/read-store.js";
import type { CompiledPermissionV1 } from "../authorization/policy-grammar.js";
import type { AIAgentApprovalReadPort } from "./agent-approval.js";
import {
  loadAIAgentApprovalApprovedApproverContextCurrentEvidence,
  type AIAgentApprovalApprovedApproverContextCurrentEvidence,
} from "./agent-approval-approved-approver-context-current-evidence-reader.js";
import type { AIAgentRunReadPort } from "./agent-run.js";
import type { AIAgentStepReadPort } from "./agent-step.js";

export interface AIAgentApprovalApprovedApproverRbacCurrentEvidenceReadInput {
  readonly requestContext: RequestContext;
  readonly agentApprovalId: string;
  readonly approverRequestContext?: RequestContext;
}

export interface AIAgentApprovalApprovedApproverRbacCurrentEvidence {
  readonly parent: AIAgentApprovalApprovedApproverContextCurrentEvidence;
  readonly authorizationState: AuthorizationReadState;
  readonly permission: CompiledPermissionV1;
}

function isPositiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0;
}

function equalStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function matchesCurrentAuthorizationSnapshot(
  requestContext: RequestContext,
  authorizationState: AuthorizationReadState,
): boolean {
  const snapshot = authorizationState.permissionSnapshot;
  if (snapshot.scopeClass !== requestContext.scopeClass) return false;

  if (
    requestContext.scopeClass !== "TENANT_CORE"
    && requestContext.scopeClass !== "TENANT_INDUSTRY"
  ) {
    return false;
  }

  return isPositiveSafeInteger(requestContext.permissionVersion)
    && requestContext.permissionVersion === snapshot.permissionVersion
    && equalStrings(requestContext.roleIds, snapshot.roleIds);
}

/**
 * DD-433…DD-437: extend exact DD-432 persisted-APPROVED + trusted
 * approver-context evidence with one current Authorization read for the exact
 * persisted requiredPermission, then require only the current compiled RBAC
 * ALLOW necessary floor.
 *
 * Applicable ABAC policy evidence is preserved but not interpreted. A success
 * is not a full DD-03 AuthorizationDecision, approval satisfaction, commercial
 * admission, AgentRun transition, dispatch or AI/tool execution authority.
 */
export async function loadAIAgentApprovalApprovedApproverRbacCurrentEvidence(
  input: AIAgentApprovalApprovedApproverRbacCurrentEvidenceReadInput,
  approvalReader: AIAgentApprovalReadPort,
  runReader: AIAgentRunReadPort,
  stepReader: AIAgentStepReadPort,
  authorizationReader: AuthorizationReadStorePort,
): Promise<AIAgentApprovalApprovedApproverRbacCurrentEvidence | null> {
  const parent = await loadAIAgentApprovalApprovedApproverContextCurrentEvidence(
    input,
    approvalReader,
    runReader,
    stepReader,
  );
  if (parent === null) return null;

  const requiredPermission = parent.parent.approval.requiredPermission;
  const authorizationState = await authorizationReader.load({
    requestContext: parent.approverRequestContext,
    permissionCode: requiredPermission,
  });

  if (
    !matchesCurrentAuthorizationSnapshot(
      parent.approverRequestContext,
      authorizationState,
    )
  ) {
    return null;
  }

  const matchingPermissions = authorizationState.permissionSnapshot.permissionSet.permissions
    .filter((entry) => entry.code === requiredPermission);
  const permission = matchingPermissions[0];
  if (
    matchingPermissions.length !== 1
    || permission === undefined
    || permission.effect !== "ALLOW"
  ) {
    return null;
  }

  return Object.freeze({
    parent,
    authorizationState,
    permission,
  });
}
