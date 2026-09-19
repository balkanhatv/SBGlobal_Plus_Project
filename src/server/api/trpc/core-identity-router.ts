import { z } from "zod";

import {
  CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT,
  CORE_IDENTITY_ROLES_LIST_EFFECTIVE,
  CORE_TENANCY_WORKSPACE_RESOLVE,
} from "../../../core/api/core-operation-contracts.js";
import type { DomainOperationRegistry } from "../../../core/api/domain-operation-registry.js";
import { DomainOperationError } from "../../../core/api/domain-operation-registry.js";
import type { OperationRegistry } from "../../../core/api/operation-registry.js";
import type { OperationSchemaRegistry } from "../../../core/api/schema-registry.js";
import type { ZodOperationDtoRegistry } from "../../../core/api/zod-operation-dto.js";
import type { IdentityRoleQueryService } from "../../../core/identity/roles-query-service.js";
import {
  CommercialStateError,
  type CommercialCurrentStateService,
} from "../../../core/commercial/current-state.js";
import type { WorkspaceService } from "../../../core/tenancy/workspace-service.js";
import { ContextResolutionError } from "../../../core/context/errors.js";
import {
  createFirstPartyQueryProcedure,
  firstPartyTrpc,
  type FirstPartyTrpcAdapterPorts,
} from "./first-party-trpc.js";


export const CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT_INPUT_V1=z.object({}).strict();

const COMMERCIAL_ENTITLEMENT_CODE_V1=z.string().min(1).max(256);

export const CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT_OUTPUT_V1=z.object({
  snapshotVersion:z.number().int().positive(),
  subscriptionState:z.enum([
    "PENDING","TRIAL","ACTIVE","GRACE","SUSPENDED","EXPIRED","CANCELLED",
  ]),
  entitlements:z.array(z.discriminatedUnion("valueType",[
    z.object({
      code:COMMERCIAL_ENTITLEMENT_CODE_V1,
      valueType:z.literal("BOOLEAN"),
      value:z.literal(true),
    }).strict(),
    z.object({
      code:COMMERCIAL_ENTITLEMENT_CODE_V1,
      valueType:z.literal("INTEGER"),
      value:z.number().int().positive(),
    }).strict(),
    z.object({
      code:COMMERCIAL_ENTITLEMENT_CODE_V1,
      valueType:z.literal("DECIMAL"),
      value:z.number().positive().finite(),
    }).strict(),
    z.object({
      code:COMMERCIAL_ENTITLEMENT_CODE_V1,
      valueType:z.literal("TEXT"),
      value:z.string().min(1).max(256),
    }).strict(),
    z.object({
      code:COMMERCIAL_ENTITLEMENT_CODE_V1,
      valueType:z.literal("SET"),
      value:z.array(z.string().min(1).max(256)).min(1).max(64),
    }).strict(),
  ])).max(64),
}).strict();

export function registerCoreCommercialEntitlementsGetCurrent(input:{
  readonly operations:OperationRegistry;
  readonly dtos:ZodOperationDtoRegistry;
  readonly schemas:OperationSchemaRegistry;
  readonly domains:DomainOperationRegistry;
  readonly service:CommercialCurrentStateService;
}):void{
  input.operations.register(CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT);
  input.dtos.register({
    operationId:CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT.operationId,
    inputSchemaVersion:CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT.inputSchemaVersion,
    outputSchemaVersion:CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT.outputSchemaVersion,
    inputSchema:CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT_INPUT_V1,
    outputSchema:CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT_OUTPUT_V1,
  });
  input.dtos.install(CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT,input.schemas);
  input.domains.register(CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT.domainService,{
    async execute(invocation){
      CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT_INPUT_V1.parse(invocation.input);
      try{
        return {
          output:await input.service.getClientCurrentProjection({
            requestContext:invocation.requestContext,
          }),
        };
      }catch(error){
        if(error instanceof CommercialStateError){
          throw new DomainOperationError({
            code:"DEPENDENCY_UNAVAILABLE",
            messageSafe:"Current entitlement state is temporarily unavailable.",
            retryable:true,
          });
        }
        throw error;
      }
    },
  });
}

export const CORE_TENANCY_WORKSPACE_RESOLVE_INPUT_V1=z.object({
  industrySelector:z.string().trim().min(1).max(128).optional(),
}).strict();

export const CORE_TENANCY_WORKSPACE_RESOLVE_OUTPUT_V1=z.object({
  tenant:z.object({
    displayKey:z.string().min(1),
    displayName:z.string().min(1),
  }).strict(),
  selectedIndustry:z.object({
    displayKey:z.string().min(1),
    displayName:z.string().min(1),
  }).strict().optional(),
  orgUnitId:z.string().uuid().optional(),
  entitlementSnapshotVersion:z.number().int().positive().optional(),
  sessionVersion:z.number().int().positive().optional(),
}).strict();

export function registerCoreTenancyWorkspaceResolve(input:{
  readonly operations:OperationRegistry;
  readonly dtos:ZodOperationDtoRegistry;
  readonly schemas:OperationSchemaRegistry;
  readonly domains:DomainOperationRegistry;
  readonly service:WorkspaceService;
}):void{
  input.operations.register(CORE_TENANCY_WORKSPACE_RESOLVE);
  input.dtos.register({
    operationId:CORE_TENANCY_WORKSPACE_RESOLVE.operationId,
    inputSchemaVersion:CORE_TENANCY_WORKSPACE_RESOLVE.inputSchemaVersion,
    outputSchemaVersion:CORE_TENANCY_WORKSPACE_RESOLVE.outputSchemaVersion,
    inputSchema:CORE_TENANCY_WORKSPACE_RESOLVE_INPUT_V1,
    outputSchema:CORE_TENANCY_WORKSPACE_RESOLVE_OUTPUT_V1,
  });
  input.dtos.install(CORE_TENANCY_WORKSPACE_RESOLVE,input.schemas);
  input.domains.register(CORE_TENANCY_WORKSPACE_RESOLVE.domainService,{
    async execute(invocation){
      const parsed=CORE_TENANCY_WORKSPACE_RESOLVE_INPUT_V1.parse(invocation.input);
      try{
        const result=await input.service.resolve({
          requestContext:invocation.requestContext,
          industrySelector:parsed.industrySelector,
        });
        return {output:result};
      }catch(error){
        if(error instanceof ContextResolutionError){
          if(error.code==="TENANT_INVALID"){
            throw new DomainOperationError({
              code:"TENANT_INVALID",messageSafe:error.message,retryable:false,
            });
          }
          if(error.code==="INDUSTRY_CONTEXT_MISMATCH"){
            throw new DomainOperationError({
              code:"INDUSTRY_CONTEXT_MISMATCH",
              messageSafe:"The selected Industry Context is not available.",
              retryable:false,
            });
          }
          if(error.code==="MEMBERSHIP_INVALID" || error.code==="RESOURCE_SCOPE_DENY"){
            throw new DomainOperationError({
              code:"RESOURCE_NOT_FOUND",
              messageSafe:"The workspace is not available.",
              retryable:false,
            });
          }
          if(error.code==="DEPENDENCY_UNAVAILABLE"){
            throw new DomainOperationError({
              code:"DEPENDENCY_UNAVAILABLE",
              messageSafe:"Workspace state is temporarily unavailable.",
              retryable:true,
            });
          }
        }
        throw error;
      }
    },
  });
}

export const CORE_IDENTITY_ROLES_LIST_EFFECTIVE_INPUT_V1=z.object({
  principalId:z.string().uuid().optional(),
  membershipId:z.string().uuid().optional(),
}).strict();

export const CORE_IDENTITY_ROLES_LIST_EFFECTIVE_OUTPUT_V1=z.object({
  principalId:z.string().uuid(),
  membershipId:z.string().uuid().optional(),
  roleIds:z.array(z.string().uuid()).max(256),
  permissionVersion:z.number().int().positive(),
}).strict();

export function registerCoreIdentityRolesListEffective(input:{
  readonly operations:OperationRegistry;
  readonly dtos:ZodOperationDtoRegistry;
  readonly schemas:OperationSchemaRegistry;
  readonly domains:DomainOperationRegistry;
  readonly service:IdentityRoleQueryService;
}):void{
  input.operations.register(CORE_IDENTITY_ROLES_LIST_EFFECTIVE);
  input.dtos.register({
    operationId:CORE_IDENTITY_ROLES_LIST_EFFECTIVE.operationId,
    inputSchemaVersion:CORE_IDENTITY_ROLES_LIST_EFFECTIVE.inputSchemaVersion,
    outputSchemaVersion:CORE_IDENTITY_ROLES_LIST_EFFECTIVE.outputSchemaVersion,
    inputSchema:CORE_IDENTITY_ROLES_LIST_EFFECTIVE_INPUT_V1,
    outputSchema:CORE_IDENTITY_ROLES_LIST_EFFECTIVE_OUTPUT_V1,
  });
  input.dtos.install(CORE_IDENTITY_ROLES_LIST_EFFECTIVE,input.schemas);
  input.domains.register(CORE_IDENTITY_ROLES_LIST_EFFECTIVE.domainService,{
    async execute(invocation){
      const parsed=CORE_IDENTITY_ROLES_LIST_EFFECTIVE_INPUT_V1.parse(invocation.input);
      try{
        const result=await input.service.listEffective({
          requestContext:invocation.requestContext,
          principalId:parsed.principalId,
          membershipId:parsed.membershipId,
        });
        return {output:result};
      }catch(error){
        if(error instanceof ContextResolutionError){
          if(error.code==="TENANT_INVALID"){
            throw new DomainOperationError({
              code:"TENANT_INVALID",messageSafe:error.message,retryable:false,
            });
          }
          if(error.code==="RESOURCE_SCOPE_DENY" || error.code==="MEMBERSHIP_INVALID"){
            throw new DomainOperationError({
              code:"RESOURCE_NOT_FOUND",
              messageSafe:"The role assignment summary is not available.",
              retryable:false,
            });
          }
        }
        throw error;
      }
    },
  });
}

export function createFirstPartyCoreRouter(input:{
  readonly ports:FirstPartyTrpcAdapterPorts;
  readonly includeWorkspaceResolve?:boolean;
  readonly includeCommercialEntitlementsGetCurrent?:boolean;
}){
  const listEffective=createFirstPartyQueryProcedure({
    ports:input.ports,
    operation:CORE_IDENTITY_ROLES_LIST_EFFECTIVE,
    inputSchema:CORE_IDENTITY_ROLES_LIST_EFFECTIVE_INPUT_V1,
    outputSchema:CORE_IDENTITY_ROLES_LIST_EFFECTIVE_OUTPUT_V1,
  });
  const commercial=input.includeCommercialEntitlementsGetCurrent
    ? firstPartyTrpc.router({
        entitlements:firstPartyTrpc.router({
          getCurrent:createFirstPartyQueryProcedure({
            ports:input.ports,
            operation:CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT,
            inputSchema:CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT_INPUT_V1,
            outputSchema:CORE_COMMERCIAL_ENTITLEMENTS_GET_CURRENT_OUTPUT_V1,
          }),
        }),
      })
    : undefined;
  const workspace=input.includeWorkspaceResolve
    ? firstPartyTrpc.router({
        resolve:createFirstPartyQueryProcedure({
          ports:input.ports,
          operation:CORE_TENANCY_WORKSPACE_RESOLVE,
          inputSchema:CORE_TENANCY_WORKSPACE_RESOLVE_INPUT_V1,
          outputSchema:CORE_TENANCY_WORKSPACE_RESOLVE_OUTPUT_V1,
        }),
      })
    : undefined;

  return firstPartyTrpc.router({
    core:firstPartyTrpc.router({
      ...(commercial ? {commercial} : {}),
      ...(workspace
        ? {tenancy:firstPartyTrpc.router({workspace})}
        : {}),
      identity:firstPartyTrpc.router({
        roles:firstPartyTrpc.router({
          listEffective,
        }),
      }),
    }),
  });
}

export type FirstPartyCoreRouter=ReturnType<typeof createFirstPartyCoreRouter>;
