import type { OperationContract } from "./operation-contract.js";
import type { JsonValue } from "./schema-registry.js";
import type { RequestContext } from "../context/contracts.js";
import type { GuardResult } from "../authorization/guard-pipeline.js";

export class DomainOperationError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly responseReference?: string;

  constructor(input: {
    readonly code: string;
    readonly messageSafe: string;
    readonly retryable: boolean;
    readonly responseReference?: string;
  }) {
    super(input.messageSafe);
    this.name = "DomainOperationError";
    this.code = input.code;
    this.retryable = input.retryable;
    this.responseReference = input.responseReference;
  }
}

export class DomainOperationRegistryError extends Error {
  readonly code = "DOMAIN_SERVICE_UNAVAILABLE" as const;

  constructor(messageSafe = "The declared domain service is unavailable.") {
    super(messageSafe);
    this.name = "DomainOperationRegistryError";
  }
}

export interface DomainOperationInvocation {
  readonly requestContext: RequestContext;
  readonly operation: OperationContract;
  readonly input: JsonValue;
  readonly guard: GuardResult;
}

export interface DomainOperationResult {
  readonly output: unknown;
  readonly responseStatus?: string;
  readonly responseReference?: string;
}

export interface DomainOperationHandler {
  execute(input: DomainOperationInvocation): Promise<DomainOperationResult>;
}

export interface DomainOperationDispatcherPort {
  execute(
    serviceId: string,
    input: DomainOperationInvocation,
  ): Promise<DomainOperationResult>;
}

export class DomainOperationRegistry implements DomainOperationDispatcherPort {
  private readonly handlers = new Map<string, DomainOperationHandler>();

  register(serviceId: string, handler: DomainOperationHandler): void {
    if (!serviceId || !handler || typeof handler.execute !== "function") {
      throw new DomainOperationRegistryError("Domain service registration is invalid.");
    }
    if (this.handlers.has(serviceId)) {
      throw new DomainOperationRegistryError("Duplicate domain service registration.");
    }
    this.handlers.set(serviceId, handler);
  }

  async execute(
    serviceId: string,
    input: DomainOperationInvocation,
  ): Promise<DomainOperationResult> {
    const handler = this.handlers.get(serviceId);
    if (!handler) throw new DomainOperationRegistryError();
    return handler.execute(input);
  }
}
