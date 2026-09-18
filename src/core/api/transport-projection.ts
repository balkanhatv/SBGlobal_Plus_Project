import type {
  OperationExecutionError,
  OperationExecutionResult,
} from "./operation-executor.js";
import type { JsonValue, OperationFieldErrors } from "./schema-registry.js";

export type ApiErrorClass =
  | "USER_ERROR"
  | "POLICY_DENIAL"
  | "ENTITLEMENT_DENIAL"
  | "SYSTEM_FAULT";

export interface ApiResponseMeta {
  readonly requestId: string;
  readonly correlationId: string;
  readonly operationId: string;
  readonly version: number;
}

export interface ApiSuccessEnvelope {
  readonly data: JsonValue;
  readonly meta: ApiResponseMeta;
}

export interface ApiErrorEnvelope {
  readonly error: {
    readonly code: string;
    readonly class: ApiErrorClass;
    readonly messageSafe: string;
    readonly retryable: boolean;
    readonly fieldErrors?: OperationFieldErrors;
    readonly decisionId?: string;
  };
  readonly meta: {
    readonly requestId: string;
    readonly correlationId: string;
  };
}

export interface TransportErrorProjection {
  readonly envelope: ApiErrorEnvelope;
  readonly retryAfterSeconds?: number;
}

export type TransportExecutionProjection =
  | {
      readonly kind: "SUCCESS";
      readonly envelope: ApiSuccessEnvelope;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    }
  | {
      readonly kind: "IDEMPOTENT_REPLAY";
      readonly meta: ApiResponseMeta;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    }
  | {
      readonly kind: "IDEMPOTENCY_IN_PROGRESS";
      readonly meta: ApiResponseMeta;
      readonly recordId: string;
    }
  | {
      readonly kind: "IDEMPOTENCY_FINAL_FAILURE";
      readonly meta: ApiResponseMeta;
      readonly recordId: string;
      readonly responseStatus?: string;
      readonly responseReference?: string;
    };

function responseMeta(
  meta: OperationExecutionResult["meta"],
): ApiResponseMeta {
  return Object.freeze({
    requestId: meta.requestId,
    correlationId: meta.correlationId,
    operationId: meta.operationId,
    version: meta.outputSchemaVersion,
  });
}

function errorClass(code: string): ApiErrorClass {
  if (code.includes("ENTITLEMENT")
    || code.startsWith("LICENSE_")
    || code.startsWith("SUBSCRIPTION_")) {
    return "ENTITLEMENT_DENIAL";
  }

  if (code.includes("PERMISSION")
    || code.includes("POLICY")
    || code.startsWith("AUTH_")
    || code.startsWith("AUTHENTICATION_")
    || code.startsWith("TENANT_")
    || code.startsWith("MEMBERSHIP_")
    || code.startsWith("INDUSTRY_")
    || code.startsWith("CREDENTIAL_")
    || code.startsWith("DEVICE_")
    || code.startsWith("STEP_UP_")
    || code.startsWith("RESOURCE_SCOPE_")
    || code === "RATE_LIMITED") {
    return "POLICY_DENIAL";
  }

  if (code.includes("DEPENDENCY")
    || code === "OUTPUT_INVALID"
    || code === "SCHEMA_UNAVAILABLE"
    || code === "SCHEMA_CONTRACT_INVALID"
    || code === "DOMAIN_SERVICE_UNAVAILABLE"
    || code.startsWith("DATABASE_")) {
    return "SYSTEM_FAULT";
  }

  return "USER_ERROR";
}

export class TransportEnvelopeProjector {
  projectResult(result: OperationExecutionResult): TransportExecutionProjection {
    const meta = responseMeta(result.meta);
    if (result.kind === "EXECUTED") {
      return Object.freeze({
        kind: "SUCCESS",
        envelope: Object.freeze({
          data: result.data,
          meta,
        }),
        ...(result.responseStatus ? {responseStatus: result.responseStatus} : {}),
        ...(result.responseReference ? {responseReference: result.responseReference} : {}),
      });
    }

    if (result.kind === "IDEMPOTENT_REPLAY") {
      return Object.freeze({
        kind: result.kind,
        meta,
        ...(result.responseStatus ? {responseStatus: result.responseStatus} : {}),
        ...(result.responseReference ? {responseReference: result.responseReference} : {}),
      });
    }

    if (result.kind === "IDEMPOTENCY_IN_PROGRESS") {
      return Object.freeze({
        kind: result.kind,
        meta,
        recordId: result.recordId,
      });
    }

    return Object.freeze({
      kind: result.kind,
      meta,
      recordId: result.recordId,
      ...(result.responseStatus ? {responseStatus: result.responseStatus} : {}),
      ...(result.responseReference ? {responseReference: result.responseReference} : {}),
    });
  }

  projectError(input: {
    readonly error: OperationExecutionError;
    readonly requestId: string;
    readonly correlationId: string;
  }): TransportErrorProjection {
    const envelope: ApiErrorEnvelope = Object.freeze({
      error: Object.freeze({
        code: input.error.code,
        class: errorClass(input.error.code),
        messageSafe: input.error.message,
        retryable: input.error.retryable,
        ...(input.error.fieldErrors
          ? {fieldErrors: input.error.fieldErrors}
          : {}),
        ...(input.error.decisionId ? {decisionId: input.error.decisionId} : {}),
      }),
      meta: Object.freeze({
        requestId: input.requestId,
        correlationId: input.correlationId,
      }),
    });

    return Object.freeze({
      envelope,
      ...(input.error.retryAfterSeconds !== undefined
        ? {retryAfterSeconds: input.error.retryAfterSeconds}
        : {}),
    });
  }
}
