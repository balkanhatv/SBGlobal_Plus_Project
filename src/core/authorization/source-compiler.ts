import type { RequestContext } from "../context/contracts.js";
import {
  AuthorizationCompilerWriteError,
  type AuthorizationCompilerPublicationResult,
  type PlatformAuthorizationCompilerTarget,
  type TenantAuthorizationCompilerTarget,
  type AuthorizationCompilerService,
} from "./compiler-write.js";
import {
  AuthorizationPolicyGrammarError,
  parsePermissionSetV1,
  type PermissionSetV1,
} from "./policy-grammar.js";

export interface AuthorizationCompilerSourceRoleV1 {
  readonly id: string;
  readonly version: number;
}

export interface AuthorizationCompilerSourcePermissionV1 {
  readonly roleId: string;
  readonly roleVersion: number;
  readonly permissionId: string;
  readonly rolePermissionVersion: number;
  readonly permissionDefinitionVersion: number;
  readonly code: string;
  readonly scopeClass: "PLATFORM_GLOBAL" | "TENANT_CORE" | "TENANT_INDUSTRY";
  readonly effect: "ALLOW" | "DENY";
  readonly constraints: unknown;
}

export interface AuthorizationCompilerSourceV1 {
  readonly assignmentIds: readonly string[];
  readonly roles: readonly AuthorizationCompilerSourceRoleV1[];
  readonly permissions: readonly AuthorizationCompilerSourcePermissionV1[];
}

export interface AuthorizationCompilerSourceStorePort {
  loadTenant(input: {
    readonly requestContext: RequestContext;
    readonly target: TenantAuthorizationCompilerTarget;
  }): Promise<AuthorizationCompilerSourceV1>;
  loadPlatform(input: {
    readonly requestContext: RequestContext;
    readonly target: PlatformAuthorizationCompilerTarget;
  }): Promise<AuthorizationCompilerSourceV1>;
}

export interface AuthorizationCompilerFingerprintPort {
  sha256(canonicalSource: string): string;
}

export type AuthorizationSourceCompilerErrorCode =
  | "AUTHORIZATION_COMPILER_SOURCE_INVALID"
  | "AUTHORIZATION_COMPILER_SOURCE_UNAVAILABLE";

export class AuthorizationSourceCompilerError extends Error {
  readonly code: AuthorizationSourceCompilerErrorCode;
  constructor(code: AuthorizationSourceCompilerErrorCode, message: string) {
    super(message);
    this.name = "AuthorizationSourceCompilerError";
    this.code = code;
  }
}

export interface AuthorizationSourceCompilerServicePorts {
  readonly sourceStore: AuthorizationCompilerSourceStorePort;
  readonly publisher: AuthorizationCompilerService;
  readonly fingerprint: AuthorizationCompilerFingerprintPort;
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalid(message: string): never {
  throw new AuthorizationSourceCompilerError("AUTHORIZATION_COMPILER_SOURCE_INVALID",message);
}

function id(value: unknown, field: string): string {
  if (typeof value!=="string" || !UUID.test(value)) invalid(`Invalid Authorization source ${field}.`);
  return value;
}

function version(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || Number(value)<=0) invalid(`Invalid Authorization source ${field}.`);
  return Number(value);
}

function normalizedConstraints(value: unknown): Readonly<Record<string, unknown>> {
  if (typeof value!=="object" || value===null || Array.isArray(value)) {
    invalid("Role permission constraints must be a JSON object.");
  }
  return value as Readonly<Record<string, unknown>>;
}

function calculate(
  source: AuthorizationCompilerSourceV1,
  scopeClass: "PLATFORM_GLOBAL" | "TENANT_CORE" | "TENANT_INDUSTRY",
): { readonly roleIds: readonly string[]; readonly permissionSet: PermissionSetV1; readonly canonicalSource: string } {
  if (!source || typeof source!=="object"
    || !Array.isArray(source.assignmentIds)
    || !Array.isArray(source.roles)
    || !Array.isArray(source.permissions)) {
    invalid("Authorization compiler source payload is invalid.");
  }

  const assignmentIds=[...source.assignmentIds].map((value,index)=>id(value,`assignmentIds[${index}]`)).sort();
  if (new Set(assignmentIds).size!==assignmentIds.length) invalid("Authorization source contains duplicate assignments.");

  const roles=source.roles.map((role,index)=>Object.freeze({
    id:id(role.id,`roles[${index}].id`),
    version:version(role.version,`roles[${index}].version`),
  })).sort((a,b)=>a.id.localeCompare(b.id));
  if (new Set(roles.map(role=>role.id)).size!==roles.length) invalid("Authorization source contains duplicate roles.");

  const roleVersions=new Map(roles.map(role=>[role.id,role.version] as const));
  const byCode=new Map<string,"ALLOW"|"DENY">();
  const canonicalPermissions=[] as Array<Record<string,unknown>>;

  for (let index=0;index<source.permissions.length;index+=1) {
    const row=source.permissions[index]!;
    const roleId=id(row.roleId,`permissions[${index}].roleId`);
    const roleVersion=version(row.roleVersion,`permissions[${index}].roleVersion`);
    const permissionId=id(row.permissionId,`permissions[${index}].permissionId`);
    const rolePermissionVersion=version(row.rolePermissionVersion,`permissions[${index}].rolePermissionVersion`);
    const permissionDefinitionVersion=version(row.permissionDefinitionVersion,`permissions[${index}].permissionDefinitionVersion`);
    const expectedRoleVersion=roleVersions.get(roleId);
    if (expectedRoleVersion===undefined || expectedRoleVersion!==roleVersion
      || rolePermissionVersion!==roleVersion) {
      invalid("Role permission version does not match the active role template version.");
    }
    if (row.scopeClass!==scopeClass) {
      invalid("Assigned permission scope does not match the compiled snapshot scope.");
    }
    if (row.effect!=="ALLOW" && row.effect!=="DENY") invalid("Authorization source permission effect is invalid.");

    let parsedCode:string;
    try {
      parsedCode=parsePermissionSetV1({permissions:[{code:row.code,effect:"DENY"}]}).permissions[0]!.code;
    } catch (error) {
      if (error instanceof AuthorizationPolicyGrammarError) invalid("Authorization source permission code is invalid.");
      throw error;
    }

    const constraints=normalizedConstraints(row.constraints);
    const effectiveEffect = row.effect==="DENY" || Object.keys(constraints).length>0 ? "DENY" : "ALLOW";
    const previous=byCode.get(parsedCode);
    byCode.set(parsedCode, previous==="DENY" || effectiveEffect==="DENY" ? "DENY" : "ALLOW");

    canonicalPermissions.push({
      roleId,roleVersion,permissionId,rolePermissionVersion,permissionDefinitionVersion,
      code:parsedCode,scopeClass:row.scopeClass,effect:row.effect,constraints,
    });
  }

  canonicalPermissions.sort((a,b)=>
    String(a.code).localeCompare(String(b.code))
      || String(a.roleId).localeCompare(String(b.roleId))
      || String(a.permissionId).localeCompare(String(b.permissionId))
  );
  const permissions=[...byCode.entries()]
    .sort(([a],[b])=>a.localeCompare(b))
    .map(([code,effect])=>Object.freeze({code,effect}));

  let permissionSet:PermissionSetV1;
  try { permissionSet=parsePermissionSetV1({permissions}); }
  catch { invalid("Calculated Permission Set v1 is invalid."); }

  return Object.freeze({
    roleIds:Object.freeze(roles.map(role=>role.id)),
    permissionSet,
    canonicalSource:JSON.stringify({
      schemaVersion:1,
      scopeClass,
      assignmentIds,
      roles,
      permissions:canonicalPermissions,
    }),
  });
}

export class AuthorizationSourceCompilerService {
  constructor(private readonly ports: AuthorizationSourceCompilerServicePorts) {}

  async compileTenant(input: {
    readonly requestContext: RequestContext;
    readonly target: TenantAuthorizationCompilerTarget;
  }): Promise<AuthorizationCompilerPublicationResult> {
    try {
      const source=await this.ports.sourceStore.loadTenant(input);
      const calculated=calculate(source,input.target.scopeClass);
      const fingerprint=this.ports.fingerprint.sha256(calculated.canonicalSource);
      if (!/^[0-9a-f]{64}$/i.test(fingerprint)) invalid("Authorization source fingerprint is invalid.");
      return await this.ports.publisher.publishTenant({
        ...input,
        roleIds:calculated.roleIds,
        permissionSet:calculated.permissionSet,
        sourceFingerprint:fingerprint.toLowerCase(),
      });
    } catch (error) {
      if (error instanceof AuthorizationSourceCompilerError) {
        try { await this.ports.publisher.invalidateTenant(input); } catch {}
        throw error;
      }
      if (error instanceof AuthorizationCompilerWriteError) throw error;
      throw new AuthorizationSourceCompilerError(
        "AUTHORIZATION_COMPILER_SOURCE_UNAVAILABLE",
        "Authorization compiler source state is unavailable.",
      );
    }
  }

  async compilePlatform(input: {
    readonly requestContext: RequestContext;
    readonly target: PlatformAuthorizationCompilerTarget;
  }): Promise<AuthorizationCompilerPublicationResult> {
    try {
      const source=await this.ports.sourceStore.loadPlatform(input);
      const calculated=calculate(source,"PLATFORM_GLOBAL");
      const fingerprint=this.ports.fingerprint.sha256(calculated.canonicalSource);
      if (!/^[0-9a-f]{64}$/i.test(fingerprint)) invalid("Authorization source fingerprint is invalid.");
      return await this.ports.publisher.publishPlatform({
        ...input,
        roleIds:calculated.roleIds,
        permissionSet:calculated.permissionSet,
        sourceFingerprint:fingerprint.toLowerCase(),
      });
    } catch (error) {
      if (error instanceof AuthorizationSourceCompilerError) {
        try { await this.ports.publisher.invalidatePlatform(input); } catch {}
        throw error;
      }
      if (error instanceof AuthorizationCompilerWriteError) throw error;
      throw new AuthorizationSourceCompilerError(
        "AUTHORIZATION_COMPILER_SOURCE_UNAVAILABLE",
        "Authorization compiler source state is unavailable.",
      );
    }
  }
}
