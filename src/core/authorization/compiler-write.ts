import type { RequestContext } from "../context/contracts.js";
import {
  AuthorizationPolicyGrammarError,
  parsePermissionSetV1,
  type PermissionSetV1,
} from "./policy-grammar.js";

export type TenantCompilerScopeClass = "TENANT_CORE" | "TENANT_INDUSTRY";

export interface TenantAuthorizationCompilerTarget {
  readonly tenantId: string;
  readonly industryContextId?: string;
  readonly principalId: string;
  readonly membershipId?: string;
  readonly orgUnitId?: string;
  readonly scopeClass: TenantCompilerScopeClass;
}

export interface PlatformAuthorizationCompilerTarget {
  readonly principalId: string;
}

export interface AuthorizationCompilerPublicationResult {
  readonly subjectId: string;
  readonly snapshotId: string;
  readonly permissionVersion: number;
}

export interface AuthorizationCompilerInvalidationResult {
  readonly subjectId: string;
  readonly permissionVersion: number;
  readonly invalidated: boolean;
}

export type AuthorizationCompilerWriteErrorCode =
  | "AUTHORIZATION_COMPILER_SCOPE_INVALID"
  | "AUTHORIZATION_COMPILER_PAYLOAD_INVALID"
  | "AUTHORIZATION_COMPILER_STATE_UNAVAILABLE";

export class AuthorizationCompilerWriteError extends Error {
  readonly code: AuthorizationCompilerWriteErrorCode;

  constructor(code: AuthorizationCompilerWriteErrorCode, message: string) {
    super(message);
    this.name = "AuthorizationCompilerWriteError";
    this.code = code;
  }
}

interface CompilerPublicationPayload {
  readonly roleIds: readonly string[];
  readonly permissionSet: PermissionSetV1;
  readonly sourceFingerprint: string;
}

export interface AuthorizationCompilerWriteStorePort {
  publishTenant(input: {
    readonly requestContext: RequestContext;
    readonly target: TenantAuthorizationCompilerTarget;
    readonly subjectCreateId: string;
    readonly snapshotId: string;
    readonly publication: CompilerPublicationPayload;
  }): Promise<AuthorizationCompilerPublicationResult>;

  invalidateTenant(input: {
    readonly requestContext: RequestContext;
    readonly target: TenantAuthorizationCompilerTarget;
  }): Promise<AuthorizationCompilerInvalidationResult>;

  publishPlatform(input: {
    readonly requestContext: RequestContext;
    readonly target: PlatformAuthorizationCompilerTarget;
    readonly subjectCreateId: string;
    readonly snapshotId: string;
    readonly publication: CompilerPublicationPayload;
  }): Promise<AuthorizationCompilerPublicationResult>;

  invalidatePlatform(input: {
    readonly requestContext: RequestContext;
    readonly target: PlatformAuthorizationCompilerTarget;
  }): Promise<AuthorizationCompilerInvalidationResult>;
}

export interface AuthorizationCompilerIdPort {
  nextId(): string;
}

export interface AuthorizationCompilerServicePorts {
  readonly store: AuthorizationCompilerWriteStorePort;
  readonly ids: AuthorizationCompilerIdPort;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ROLE_IDS = 4096;

function compilerError(
  code: AuthorizationCompilerWriteErrorCode,
  message: string,
): never {
  throw new AuthorizationCompilerWriteError(code, message);
}

function uuid(value: unknown, field: string): string {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    compilerError("AUTHORIZATION_COMPILER_PAYLOAD_INVALID", `Invalid compiler ${field}.`);
  }
  return value;
}

function optionalUuid(value: unknown, field: string): string | undefined {
  return value === undefined ? undefined : uuid(value, field);
}

function normalizeRoleIds(input: readonly string[]): readonly string[] {
  if (!Array.isArray(input) || input.length > MAX_ROLE_IDS) {
    compilerError("AUTHORIZATION_COMPILER_PAYLOAD_INVALID", "Compiled role set is invalid.");
  }
  const normalized = input.map((value, index) => uuid(value, `roleIds[${index}]`));
  if (new Set(normalized).size !== normalized.length) {
    compilerError("AUTHORIZATION_COMPILER_PAYLOAD_INVALID", "Compiled role set contains duplicates.");
  }
  normalized.sort();
  return Object.freeze(normalized);
}

function normalizeFingerprint(input: unknown): string {
  if (typeof input !== "string" || input.length < 16 || input.length > 512) {
    compilerError("AUTHORIZATION_COMPILER_PAYLOAD_INVALID", "Authorization source fingerprint is invalid.");
  }
  return input;
}

function normalizePermissionSet(input: unknown): PermissionSetV1 {
  try {
    return parsePermissionSetV1(input);
  } catch (error) {
    if (error instanceof AuthorizationPolicyGrammarError) {
      compilerError("AUTHORIZATION_COMPILER_PAYLOAD_INVALID", "Compiled Permission Set v1 payload is invalid.");
    }
    throw error;
  }
}

function assertCompilerActor(context: RequestContext): void {
  if (!context.principalId || context.principalType !== "SERVICE") {
    compilerError(
      "AUTHORIZATION_COMPILER_SCOPE_INVALID",
      "Authorization compilation requires a trusted service context.",
    );
  }
}

function assertTenantTarget(
  context: RequestContext,
  target: TenantAuthorizationCompilerTarget,
): TenantAuthorizationCompilerTarget {
  assertCompilerActor(context);
  const tenantId = uuid(target.tenantId, "target tenantId");
  const principalId = uuid(target.principalId, "target principalId");
  const industryContextId = optionalUuid(target.industryContextId, "target industryContextId");
  const membershipId = optionalUuid(target.membershipId, "target membershipId");
  const orgUnitId = optionalUuid(target.orgUnitId, "target orgUnitId");

  if (context.scopeClass !== target.scopeClass
    || context.tenantId !== tenantId
    || !context.dataHomeId
    || !context.regionCode) {
    compilerError("AUTHORIZATION_COMPILER_SCOPE_INVALID", "Compiler Tenant scope does not match target.");
  }

  if (target.scopeClass === "TENANT_CORE") {
    if (context.industryContextId || industryContextId) {
      compilerError("AUTHORIZATION_COMPILER_SCOPE_INVALID", "Tenant Core compiler target cannot carry Industry Context.");
    }
  } else if (!industryContextId || context.industryContextId !== industryContextId) {
    compilerError("AUTHORIZATION_COMPILER_SCOPE_INVALID", "Compiler Industry Context does not match target.");
  }

  return Object.freeze({
    tenantId,
    ...(industryContextId ? { industryContextId } : {}),
    principalId,
    ...(membershipId ? { membershipId } : {}),
    ...(orgUnitId ? { orgUnitId } : {}),
    scopeClass: target.scopeClass,
  });
}

function assertPlatformTarget(
  context: RequestContext,
  target: PlatformAuthorizationCompilerTarget,
): PlatformAuthorizationCompilerTarget {
  assertCompilerActor(context);
  if (context.scopeClass !== "PLATFORM_GLOBAL"
    || context.tenantId
    || context.industryContextId) {
    compilerError("AUTHORIZATION_COMPILER_SCOPE_INVALID", "Compiler platform scope is invalid.");
  }
  return Object.freeze({ principalId: uuid(target.principalId, "target principalId") });
}

function nextCompilerId(ids: AuthorizationCompilerIdPort): string {
  return uuid(ids.nextId(), "generated id");
}

export class AuthorizationCompilerService {
  constructor(private readonly ports: AuthorizationCompilerServicePorts) {}

  async publishTenant(input: {
    readonly requestContext: RequestContext;
    readonly target: TenantAuthorizationCompilerTarget;
    readonly roleIds: readonly string[];
    readonly permissionSet: unknown;
    readonly sourceFingerprint: string;
  }): Promise<AuthorizationCompilerPublicationResult> {
    const target = assertTenantTarget(input.requestContext, input.target);
    const publication = Object.freeze({
      roleIds: normalizeRoleIds(input.roleIds),
      permissionSet: normalizePermissionSet(input.permissionSet),
      sourceFingerprint: normalizeFingerprint(input.sourceFingerprint),
    });
    return this.ports.store.publishTenant({
      requestContext: input.requestContext,
      target,
      subjectCreateId: nextCompilerId(this.ports.ids),
      snapshotId: nextCompilerId(this.ports.ids),
      publication,
    });
  }

  async invalidateTenant(input: {
    readonly requestContext: RequestContext;
    readonly target: TenantAuthorizationCompilerTarget;
  }): Promise<AuthorizationCompilerInvalidationResult> {
    return this.ports.store.invalidateTenant({
      requestContext: input.requestContext,
      target: assertTenantTarget(input.requestContext, input.target),
    });
  }

  async publishPlatform(input: {
    readonly requestContext: RequestContext;
    readonly target: PlatformAuthorizationCompilerTarget;
    readonly roleIds: readonly string[];
    readonly permissionSet: unknown;
    readonly sourceFingerprint: string;
  }): Promise<AuthorizationCompilerPublicationResult> {
    const target = assertPlatformTarget(input.requestContext, input.target);
    const publication = Object.freeze({
      roleIds: normalizeRoleIds(input.roleIds),
      permissionSet: normalizePermissionSet(input.permissionSet),
      sourceFingerprint: normalizeFingerprint(input.sourceFingerprint),
    });
    return this.ports.store.publishPlatform({
      requestContext: input.requestContext,
      target,
      subjectCreateId: nextCompilerId(this.ports.ids),
      snapshotId: nextCompilerId(this.ports.ids),
      publication,
    });
  }

  async invalidatePlatform(input: {
    readonly requestContext: RequestContext;
    readonly target: PlatformAuthorizationCompilerTarget;
  }): Promise<AuthorizationCompilerInvalidationResult> {
    return this.ports.store.invalidatePlatform({
      requestContext: input.requestContext,
      target: assertPlatformTarget(input.requestContext, input.target),
    });
  }
}
