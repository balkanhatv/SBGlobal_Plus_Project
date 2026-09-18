import type { ContextResolutionInput, RequestContext } from "../context/contracts.js";
import { ContextResolutionError } from "../context/errors.js";
import type { GuardResult } from "../authorization/guard-pipeline.js";
import { GuardPipelineError } from "../authorization/guard-pipeline.js";
import type { OperationContract } from "./operation-contract.js";
import type {
  IdempotencyBeginResult,
  IdempotencyStarted,
} from "./idempotency.js";
import { IdempotencyRuntimeError } from "./idempotency.js";
import type { RateLimitAcquisition, RateLimitSubject } from "./rate-limit.js";
import { RateLimitRuntimeError } from "./rate-limit.js";
import {
  OperationSchemaError,
  type JsonValue,
  type ValidatedOperationInput,
} from "./schema-registry.js";
import {
  DomainOperationError,
  DomainOperationRegistryError,
  type DomainOperationResult,
  type DomainOperationDispatcherPort,
} from "./domain-operation-registry.js";

export type OperationExecutionErrorCode =
  | "OPERATION_NOT_FOUND"
  | "OPERATION_CONTRACT_INVALID"
  | "INPUT_INVALID"
  | "OUTPUT_INVALID"
  | "DEPENDENCY_UNAVAILABLE"
  | string;

export class OperationExecutionError extends Error {
  readonly code: OperationExecutionErrorCode;
  readonly retryable: boolean;
  readonly decisionId?: string;
  readonly retryAfterSeconds?: number;
  readonly responseReference?: string;
  readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;

  constructor(input: {
    readonly code: OperationExecutionErrorCode;
    readonly messageSafe: string;
    readonly retryable: boolean;
    readonly decisionId?: string;
    readonly retryAfterSeconds?: number;
    readonly responseReference?: string;
    readonly fieldErrors?: Readonly<Record<string, readonly string[]>>;
  }) {
    super(input.messageSafe);
    this.name = "OperationExecutionError";
    this.code = input.code;
    this.retryable = input.retryable;
    this.decisionId = input.decisionId;
    this.retryAfterSeconds = input.retryAfterSeconds;
    this.responseReference = input.responseReference;
    this.fieldErrors = input.fieldErrors;
  }
}

export interface OperationLookupPort {
  get(operationId: string): OperationContract;
}

export interface RequestContextResolverPort {
  resolve(input: ContextResolutionInput): Promise<RequestContext>;
}

export interface OperationSchemaPort {
  validateInput(operation: OperationContract, rawInput: unknown): ValidatedOperationInput;
  validateOutput(operation: OperationContract, rawOutput: unknown): JsonValue;
}

export interface OperationGuardPort {
  authorize(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
    readonly resourceReference?: Readonly<Record<string, unknown>>;
  }): Promise<GuardResult>;
}

export interface OperationIdempotencyPort {
  begin(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
    readonly idempotencyKey?: string;
    readonly canonicalValidatedInput: string;
  }): Promise<IdempotencyBeginResult>;
  completeSuccess(input: {
    readonly requestContext: RequestContext;
    readonly started: IdempotencyStarted;
    readonly responseStatus?: string;
    readonly responseReference?: string;
  }): Promise<void>;
  completeFailure(input: {
    readonly requestContext: RequestContext;
    readonly started: IdempotencyStarted;
    readonly retryable: boolean;
    readonly responseStatus?: string;
    readonly responseReference?: string;
  }): Promise<void>;
}

export interface OperationRateLimitPort {
  acquire(input: {
    readonly requestContext: RequestContext;
    readonly operation: OperationContract;
    readonly subject?: RateLimitSubject;
  }): Promise<RateLimitAcquisition>;
  release(acquisition: RateLimitAcquisition): Promise<void>;
}

export interface OperationExecutorPorts {
  readonly operations: OperationLookupPort;
  readonly contexts: RequestContextResolverPort;
  readonly schemas: OperationSchemaPort;
  readonly rateLimits: OperationRateLimitPort;
  readonly guards: OperationGuardPort;
  readonly idempotency: OperationIdempotencyPort;
  readonly domains: DomainOperationDispatcherPort;
}

export interface OperationExecutionMeta {
  readonly requestId: string;
  readonly correlationId: string;
  readonly operationId: string;
  readonly outputSchemaVersion: number;
}

export type OperationExecutionResult =
  | {
      readonly kind: "EXECUTED";
      readonly data: JsonValue;
      readonly meta: OperationExecutionMeta;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    }
  | {
      readonly kind: "IDEMPOTENT_REPLAY";
      readonly meta: OperationExecutionMeta;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    }
  | {
      readonly kind: "IDEMPOTENCY_IN_PROGRESS";
      readonly meta: OperationExecutionMeta;
      readonly recordId: string;
    }
  | {
      readonly kind: "IDEMPOTENCY_FINAL_FAILURE";
      readonly meta: OperationExecutionMeta;
      readonly recordId: string;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    };

function validateOperation(operation: OperationContract): void {
  if (!operation.operationId
    || !operation.domainService
    || !Number.isSafeInteger(operation.inputSchemaVersion)
    || operation.inputSchemaVersion <= 0
    || !Number.isSafeInteger(operation.outputSchemaVersion)
    || operation.outputSchemaVersion <= 0
    || (operation.kind === "QUERY" && operation.idempotencyPolicy !== "NONE")) {
    throw new OperationExecutionError({
      code: "OPERATION_CONTRACT_INVALID",
      messageSafe: "The operation contract is invalid.",
      retryable: false,
    });
  }
}

function validateDomainResult(result: DomainOperationResult): void {
  if (!result || typeof result !== "object" || !Object.hasOwn(result, "output")) {
    throw new OperationExecutionError({
      code: "OUTPUT_INVALID",
      messageSafe: "The domain operation returned an invalid output contract.",
      retryable: false,
    });
  }
  if (result.responseStatus !== undefined
    && (typeof result.responseStatus !== "string"
      || result.responseStatus.length < 1
      || result.responseStatus.length > 64)) {
    throw new OperationExecutionError({
      code: "OUTPUT_INVALID",
      messageSafe: "The domain operation returned invalid response metadata.",
      retryable: false,
    });
  }
  if (result.responseReference !== undefined
    && (typeof result.responseReference !== "string"
      || result.responseReference.length < 1
      || result.responseReference.length > 512)) {
    throw new OperationExecutionError({
      code: "OUTPUT_INVALID",
      messageSafe: "The domain operation returned invalid response metadata.",
      retryable: false,
    });
  }
}

function meta(context: RequestContext, operation: OperationContract): OperationExecutionMeta {
  return Object.freeze({
    requestId: context.requestId,
    correlationId: context.correlationId,
    operationId: operation.operationId,
    outputSchemaVersion: operation.outputSchemaVersion,
  });
}

function normalizeError(
  error: unknown,
  operation?: OperationContract,
): OperationExecutionError {
  if (error instanceof OperationExecutionError) return error;

  if (error instanceof ContextResolutionError) {
    return new OperationExecutionError({
      code: error.code,
      messageSafe: error.message,
      retryable: error.code === "DEPENDENCY_UNAVAILABLE",
    });
  }
  if (error instanceof GuardPipelineError) {
    return new OperationExecutionError({
      code: error.code,
      messageSafe: error.message,
      retryable: error.code === "DEPENDENCY_UNAVAILABLE",
      decisionId: error.decisionId,
    });
  }
  if (error instanceof RateLimitRuntimeError) {
    return new OperationExecutionError({
      code: error.code,
      messageSafe: error.message,
      retryable: error.code === "RATE_LIMITED" || error.code === "DEPENDENCY_UNAVAILABLE",
      retryAfterSeconds: error.retryAfterSeconds,
    });
  }
  if (error instanceof IdempotencyRuntimeError) {
    return new OperationExecutionError({
      code: error.code,
      messageSafe: error.message,
      retryable: error.code === "IDEMPOTENCY_DEPENDENCY_UNAVAILABLE",
    });
  }
  if (error instanceof OperationSchemaError) {
    const unavailable = error.code === "SCHEMA_UNAVAILABLE"
      || error.code === "SCHEMA_CONTRACT_INVALID";
    return new OperationExecutionError({
      code: error.code === "INPUT_INVALID"
        ? "INPUT_INVALID"
        : error.code === "OUTPUT_INVALID"
          ? "OUTPUT_INVALID"
          : "DEPENDENCY_UNAVAILABLE",
      messageSafe: error.message,
      retryable: unavailable,
      ...(error.fieldErrors ? {fieldErrors: error.fieldErrors} : {}),
    });
  }
  if (error instanceof DomainOperationError) {
    if (!operation || !operation.errorCodes.includes(error.code)) {
      return new OperationExecutionError({
        code: "DEPENDENCY_UNAVAILABLE",
        messageSafe: "The domain operation failed unexpectedly.",
        retryable: true,
      });
    }
    return new OperationExecutionError({
      code: error.code,
      messageSafe: error.message,
      retryable: error.retryable,
      responseReference: error.responseReference,
    });
  }
  if (error instanceof DomainOperationRegistryError) {
    return new OperationExecutionError({
      code: "DEPENDENCY_UNAVAILABLE",
      messageSafe: error.message,
      retryable: true,
    });
  }

  return new OperationExecutionError({
    code: "DEPENDENCY_UNAVAILABLE",
    messageSafe: "Operation execution is unavailable.",
    retryable: true,
  });
}

export class OperationExecutor {
  constructor(private readonly ports: OperationExecutorPorts) {}

  async execute(input: {
    readonly operationId: string;
    readonly rawInput: unknown;
    readonly context: Omit<ContextResolutionInput, "scopeClass">;
    readonly idempotencyKey?: string;
    readonly verifiedRateSubject?: RateLimitSubject;
  }): Promise<OperationExecutionResult> {
    let operation: OperationContract;
    try {
      operation = this.ports.operations.get(input.operationId);
    } catch {
      throw new OperationExecutionError({
        code: "OPERATION_NOT_FOUND",
        messageSafe: "The requested operation is not available.",
        retryable: false,
      });
    }
    validateOperation(operation);

    let requestContext: RequestContext;
    try {
      requestContext = await this.ports.contexts.resolve({
        ...input.context,
        scopeClass: operation.scopeClass,
      });
    } catch (error) {
      throw normalizeError(error, operation);
    }

    let validated: ValidatedOperationInput;
    try {
      validated = this.ports.schemas.validateInput(operation, input.rawInput);
    } catch (error) {
      throw normalizeError(error, operation);
    }

    let rateAcquisition: RateLimitAcquisition;
    try {
      rateAcquisition = await this.ports.rateLimits.acquire({
        requestContext,
        operation,
        ...(input.verifiedRateSubject ? {subject: input.verifiedRateSubject} : {}),
      });
    } catch (error) {
      throw normalizeError(error, operation);
    }

    try {
      let guard: GuardResult;
      try {
        guard = await this.ports.guards.authorize({
          requestContext,
          operation,
          ...(validated.resourceReference
            ? {resourceReference: validated.resourceReference}
            : {}),
        });
      } catch (error) {
        throw normalizeError(error, operation);
      }

      let idempotency: IdempotencyBeginResult = Object.freeze({kind: "BYPASS"});
      if (operation.kind === "COMMAND") {
        try {
          idempotency = await this.ports.idempotency.begin({
            requestContext,
            operation,
            idempotencyKey: input.idempotencyKey,
            canonicalValidatedInput: validated.canonical,
          });
        } catch (error) {
          throw normalizeError(error, operation);
        }
      }

      const executionMeta = meta(requestContext, operation);
      if (idempotency.kind === "IN_PROGRESS") {
        return Object.freeze({
          kind: "IDEMPOTENCY_IN_PROGRESS",
          meta: executionMeta,
          recordId: idempotency.recordId,
        });
      }
      if (idempotency.kind === "REPLAY") {
        return Object.freeze({
          kind: "IDEMPOTENT_REPLAY",
          meta: executionMeta,
          ...(idempotency.responseStatus ? {responseStatus: idempotency.responseStatus} : {}),
          ...(idempotency.responseReference ? {responseReference: idempotency.responseReference} : {}),
        });
      }
      if (idempotency.kind === "FINAL_FAILURE") {
        return Object.freeze({
          kind: "IDEMPOTENCY_FINAL_FAILURE",
          meta: executionMeta,
          recordId: idempotency.recordId,
          ...(idempotency.responseStatus ? {responseStatus: idempotency.responseStatus} : {}),
          ...(idempotency.responseReference ? {responseReference: idempotency.responseReference} : {}),
        });
      }

      const started = idempotency.kind === "STARTED" ? idempotency : undefined;
      let domainResult: DomainOperationResult;
      try {
        domainResult = await this.ports.domains.execute(operation.domainService, {
          requestContext,
          operation,
          input: validated.value,
          guard,
        });
      } catch (rawError) {
        const normalized = normalizeError(rawError, operation);
        const error = rawError instanceof DomainOperationError
          || rawError instanceof DomainOperationRegistryError
          ? normalized
          : new OperationExecutionError({
              code: "DEPENDENCY_UNAVAILABLE",
              messageSafe: "The domain operation outcome is unavailable.",
              retryable: false,
            });
        if (started) {
          try {
            await this.ports.idempotency.completeFailure({
              requestContext,
              started,
              retryable: error.retryable,
              responseStatus: error.code,
              ...(error.responseReference ? {responseReference: error.responseReference} : {}),
            });
          } catch (idempotencyError) {
            throw normalizeError(idempotencyError, operation);
          }
        }
        throw error;
      }

      let output: JsonValue;
      try {
        validateDomainResult(domainResult);
        output = this.ports.schemas.validateOutput(operation, domainResult.output);
      } catch {
        const error = new OperationExecutionError({
          code: "OUTPUT_INVALID",
          messageSafe: "The domain operation output did not satisfy its contract.",
          retryable: false,
        });
        if (started) {
          try {
            await this.ports.idempotency.completeFailure({
              requestContext,
              started,
              retryable: false,
              responseStatus: "OUTPUT_INVALID",
            });
          } catch (idempotencyError) {
            throw normalizeError(idempotencyError, operation);
          }
        }
        throw error;
      }

      if (started) {
        try {
          await this.ports.idempotency.completeSuccess({
            requestContext,
            started,
            responseStatus: domainResult.responseStatus ?? "SUCCESS",
            ...(domainResult.responseReference
              ? {responseReference: domainResult.responseReference}
              : {}),
          });
        } catch (error) {
          // Do not convert a post-domain success completion failure into a retryable
          // idempotency failure. Leaving IN_PROGRESS prevents duplicate mutation.
          throw normalizeError(error, operation);
        }
      }

      return Object.freeze({
        kind: "EXECUTED",
        data: output,
        meta: executionMeta,
        ...(domainResult.responseStatus ? {responseStatus: domainResult.responseStatus} : {}),
        ...(domainResult.responseReference ? {responseReference: domainResult.responseReference} : {}),
      });
    } finally {
      try {
        await this.ports.rateLimits.release(rateAcquisition);
      } catch {
        // Admission was already governed and concurrency leases expire. Rewriting a
        // completed business result here could trigger an unsafe duplicate command.
      }
    }
  }
}
