import type { OperationContract } from "./operation-contract.js";

export type JsonPrimitive = null | boolean | number | string;
export interface JsonObject {
  readonly [key: string]: JsonValue;
}
export interface JsonArray extends ReadonlyArray<JsonValue> {}
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export type OperationSchemaErrorCode =
  | "SCHEMA_UNAVAILABLE"
  | "SCHEMA_CONTRACT_INVALID"
  | "INPUT_INVALID"
  | "OUTPUT_INVALID";

export class OperationSchemaError extends Error {
  readonly code: OperationSchemaErrorCode;

  constructor(code: OperationSchemaErrorCode, messageSafe: string) {
    super(messageSafe);
    this.name = "OperationSchemaError";
    this.code = code;
  }
}

export interface OperationSchemaAdapter {
  readonly operationId: string;
  readonly inputSchemaVersion: number;
  readonly outputSchemaVersion: number;
  parseInput(rawInput: unknown): unknown;
  parseOutput(rawOutput: unknown): unknown;
  extractResourceReference?(
    validatedInput: JsonValue,
  ): Readonly<Record<string, unknown>> | undefined;
}

export interface ValidatedOperationInput {
  readonly value: JsonValue;
  readonly canonical: string;
  readonly resourceReference?: Readonly<Record<string, unknown>>;
}

function schemaKey(input: {
  readonly operationId: string;
  readonly inputSchemaVersion: number;
  readonly outputSchemaVersion: number;
}): string {
  return `${input.operationId}:in:${input.inputSchemaVersion}:out:${input.outputSchemaVersion}`;
}

function normalizeJson(value: unknown, path = "$"): JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new OperationSchemaError("SCHEMA_CONTRACT_INVALID", "Schema output contains a non-finite number.");
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return Object.freeze(value.map((entry, index) => normalizeJson(entry, `${path}[${index}]`)));
  }
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new OperationSchemaError("SCHEMA_CONTRACT_INVALID", "Schema output must be JSON-compatible.");
    }
    const source = value as Record<string, unknown>;
    const normalized: Record<string, JsonValue> = {};
    for (const key of Object.keys(source).sort()) {
      const entry = source[key];
      if (entry === undefined) {
        throw new OperationSchemaError(
          "SCHEMA_CONTRACT_INVALID",
          `Schema output contains undefined at ${path}.${key}.`,
        );
      }
      Object.defineProperty(normalized, key, {
        value: normalizeJson(entry, `${path}.${key}`),
        enumerable: true,
        configurable: false,
        writable: false,
      });
    }
    return Object.freeze(normalized);
  }
  throw new OperationSchemaError("SCHEMA_CONTRACT_INVALID", "Schema output must be JSON-compatible.");
}

function asResourceReference(value: unknown): Readonly<Record<string, unknown>> {
  const normalized = normalizeJson(value);
  if (normalized === null || Array.isArray(normalized) || typeof normalized !== "object") {
    throw new OperationSchemaError(
      "SCHEMA_CONTRACT_INVALID",
      "Resource reference must be a JSON object derived from validated input.",
    );
  }
  return normalized as JsonObject;
}

export class OperationSchemaRegistry {
  private readonly adapters = new Map<string, OperationSchemaAdapter>();

  register(adapter: OperationSchemaAdapter): void {
    if (!adapter.operationId
      || !Number.isSafeInteger(adapter.inputSchemaVersion)
      || adapter.inputSchemaVersion <= 0
      || !Number.isSafeInteger(adapter.outputSchemaVersion)
      || adapter.outputSchemaVersion <= 0) {
      throw new OperationSchemaError("SCHEMA_CONTRACT_INVALID", "Operation schema registration is invalid.");
    }
    const key = schemaKey(adapter);
    if (this.adapters.has(key)) {
      throw new OperationSchemaError("SCHEMA_CONTRACT_INVALID", "Duplicate operation schema registration.");
    }
    this.adapters.set(key, Object.freeze({...adapter}));
  }

  validateInput(operation: OperationContract, rawInput: unknown): ValidatedOperationInput {
    const adapter = this.adapters.get(schemaKey(operation));
    if (!adapter) {
      throw new OperationSchemaError("SCHEMA_UNAVAILABLE", "The operation input schema is unavailable.");
    }

    let parsed: unknown;
    try {
      parsed = adapter.parseInput(rawInput);
    } catch {
      throw new OperationSchemaError("INPUT_INVALID", "The request input is invalid.");
    }

    let value: JsonValue;
    try {
      value = normalizeJson(parsed);
    } catch (error) {
      if (error instanceof OperationSchemaError) {
        throw new OperationSchemaError("INPUT_INVALID", "The request input is invalid.");
      }
      throw error;
    }

    let resourceReference: Readonly<Record<string, unknown>> | undefined;
    if (operation.resourceResolver) {
      if (!adapter.extractResourceReference) {
        throw new OperationSchemaError(
          "SCHEMA_CONTRACT_INVALID",
          "The resource-bound operation has no validated resource-reference extractor.",
        );
      }
      let extracted: Readonly<Record<string, unknown>> | undefined;
      try {
        extracted = adapter.extractResourceReference(value);
      } catch {
        throw new OperationSchemaError(
          "SCHEMA_CONTRACT_INVALID",
          "The validated resource-reference extractor failed.",
        );
      }
      if (!extracted) {
        throw new OperationSchemaError(
          "INPUT_INVALID",
          "The request does not contain the required resource reference.",
        );
      }
      resourceReference = asResourceReference(extracted);
    }

    return Object.freeze({
      value,
      canonical: JSON.stringify(value),
      ...(resourceReference ? {resourceReference} : {}),
    });
  }

  validateOutput(operation: OperationContract, rawOutput: unknown): JsonValue {
    const adapter = this.adapters.get(schemaKey(operation));
    if (!adapter) {
      throw new OperationSchemaError("SCHEMA_UNAVAILABLE", "The operation output schema is unavailable.");
    }
    let parsed: unknown;
    try {
      parsed = adapter.parseOutput(rawOutput);
    } catch {
      throw new OperationSchemaError("OUTPUT_INVALID", "The operation output did not satisfy its schema.");
    }
    try {
      return normalizeJson(parsed);
    } catch {
      throw new OperationSchemaError("OUTPUT_INVALID", "The operation output did not satisfy its schema.");
    }
  }
}
