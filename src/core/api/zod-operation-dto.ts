import { type ZodType } from "zod";
import type { OperationContract } from "./operation-contract.js";
import {
  OperationSchemaError,
  OperationSchemaRegistry,
  type JsonValue,
  type OperationFieldErrors,
  type OperationSchemaAdapter,
} from "./schema-registry.js";

export interface ZodOperationDtoDefinition {
  readonly operationId: string;
  readonly inputSchemaVersion: number;
  readonly outputSchemaVersion: number;
  readonly inputSchema: ZodType;
  readonly outputSchema: ZodType;
  readonly extractResourceReference?: (
    validatedInput: JsonValue,
  ) => Readonly<Record<string, unknown>> | undefined;
}

export interface ZodOperationDtoSchemas {
  readonly inputSchema: ZodType;
  readonly outputSchema: ZodType;
}

function key(input: {
  readonly operationId: string;
  readonly inputSchemaVersion: number;
  readonly outputSchemaVersion: number;
}): string {
  return `${input.operationId}:in:${input.inputSchemaVersion}:out:${input.outputSchemaVersion}`;
}

function pointer(path: readonly PropertyKey[]): string {
  if (path.length === 0) return "/";
  return `/${path.map((segment) =>
    String(segment).replace(/~/g, "~0").replace(/\//g, "~1")
  ).join("/")}`;
}

function safeFieldErrors(
  issues: readonly { readonly code: string; readonly path: readonly PropertyKey[] }[],
): OperationFieldErrors {
  const fields = new Map<string, Set<string>>();
  for (const issue of issues) {
    const path = pointer(issue.path);
    const codes = fields.get(path) ?? new Set<string>();
    codes.add(issue.code);
    fields.set(path, codes);
  }
  const output: Record<string, readonly string[]> = {};
  for (const path of [...fields.keys()].sort()) {
    output[path] = Object.freeze([...(fields.get(path) ?? [])].sort());
  }
  return Object.freeze(output);
}

function adapter(definition: ZodOperationDtoDefinition): OperationSchemaAdapter {
  return Object.freeze({
    operationId: definition.operationId,
    inputSchemaVersion: definition.inputSchemaVersion,
    outputSchemaVersion: definition.outputSchemaVersion,
    parseInput(rawInput: unknown): unknown {
      const result = definition.inputSchema.safeParse(rawInput);
      if (!result.success) {
        throw new OperationSchemaError(
          "INPUT_INVALID",
          "The request input is invalid.",
          safeFieldErrors(result.error.issues),
        );
      }
      return result.data;
    },
    parseOutput(rawOutput: unknown): unknown {
      const result = definition.outputSchema.safeParse(rawOutput);
      if (!result.success) {
        throw new OperationSchemaError(
          "OUTPUT_INVALID",
          "The operation output did not satisfy its schema.",
        );
      }
      return result.data;
    },
    ...(definition.extractResourceReference
      ? {extractResourceReference: definition.extractResourceReference}
      : {}),
  });
}

export class ZodOperationDtoRegistry {
  private readonly definitions = new Map<string, ZodOperationDtoDefinition>();

  register(definition: ZodOperationDtoDefinition): void {
    if (!definition.operationId
      || !Number.isSafeInteger(definition.inputSchemaVersion)
      || definition.inputSchemaVersion <= 0
      || !Number.isSafeInteger(definition.outputSchemaVersion)
      || definition.outputSchemaVersion <= 0
      || typeof definition.inputSchema?.safeParse !== "function"
      || typeof definition.outputSchema?.safeParse !== "function") {
      throw new OperationSchemaError(
        "SCHEMA_CONTRACT_INVALID",
        "Zod operation DTO registration is invalid.",
      );
    }
    const id = key(definition);
    if (this.definitions.has(id)) {
      throw new OperationSchemaError(
        "SCHEMA_CONTRACT_INVALID",
        "Duplicate Zod operation DTO registration.",
      );
    }
    this.definitions.set(id, Object.freeze({...definition}));
  }

  get(operation: OperationContract): ZodOperationDtoSchemas {
    const definition = this.definitions.get(key(operation));
    if (!definition) {
      throw new OperationSchemaError(
        "SCHEMA_UNAVAILABLE",
        "The operation DTO schema is unavailable.",
      );
    }
    return Object.freeze({
      inputSchema: definition.inputSchema,
      outputSchema: definition.outputSchema,
    });
  }

  install(operation: OperationContract, target: OperationSchemaRegistry): void {
    const definition = this.definitions.get(key(operation));
    if (!definition) {
      throw new OperationSchemaError(
        "SCHEMA_UNAVAILABLE",
        "The operation DTO schema is unavailable.",
      );
    }
    target.register(adapter(definition));
  }
}
