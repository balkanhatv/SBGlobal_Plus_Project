import type { WorkerContextInput } from "./contracts.js";
import { ContextResolutionError } from "./errors.js";

export type WorkerContext = Readonly<WorkerContextInput>;

export function createWorkerContext(input: WorkerContextInput): WorkerContext {
  if (!input.tenantId || !input.servicePrincipalId || !input.dataHomeId) {
    throw new ContextResolutionError(
      "TENANT_INVALID",
      "Worker execution requires persisted tenant and service context.",
    );
  }

  if (input.scopeClass === "EXPLICIT_CROSS_CONTEXT") {
    throw new ContextResolutionError(
      "RESOURCE_SCOPE_DENY",
      "Cross-context worker execution requires a dedicated governed transfer context.",
    );
  }

  if (input.scopeClass === "TENANT_INDUSTRY" && !input.industryContextId) {
    throw new ContextResolutionError(
      "INDUSTRY_CONTEXT_REQUIRED",
      "Industry-scoped worker execution requires persisted Industry Context.",
    );
  }

  return Object.freeze({ ...input });
}
