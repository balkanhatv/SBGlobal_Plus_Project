import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  ContextResolutionError,
  WorkspaceService,
} from "../../dist/core/index.js";

function context(){
  return Object.freeze({
    requestId:randomUUID(),
    correlationId:randomUUID(),
    tenantId:randomUUID(),
    principalId:randomUUID(),
    principalType:"HUMAN",
    membershipId:randomUUID(),
    orgUnitId:randomUUID(),
    orgUnitPath:Object.freeze([]),
    roleIds:Object.freeze([]),
    permissionVersion:1,
    entitlementSnapshotId:randomUUID(),
    entitlementSnapshotVersion:7,
    sessionVersion:4,
    scopeClass:"TENANT_CORE",
  });
}

function tenancyFixture(ctx,{membershipStatus="ACTIVE",tenantStatus="ACTIVE",industryTenantId=ctx.tenantId}={}){
  return {
    async findMembership({tenantId,principalId}){
      return {
        id:ctx.membershipId,
        tenantId,
        principalId,
        status:membershipStatus,
        membershipVersion:2,
      };
    },
    async getTenantById(id){
      return {
        id,
        displayKey:"tenant-a",
        displayName:"Tenant A",
        status:tenantStatus,
      };
    },
    async resolveIndustryContext({tenantId}){
      return {
        id:randomUUID(),
        tenantId:industryTenantId ?? tenantId,
        industryCode:"RTL",
        displayKey:"retail",
        displayName:"Retail",
        status:"ACTIVE",
      };
    },
  };
}

test("workspace projection returns sanitized Tenant Core context without internal IDs",async()=>{
  const ctx=context();
  const result=await new WorkspaceService(tenancyFixture(ctx)).resolve({requestContext:ctx});
  assert.deepEqual(result,{
    tenant:{displayKey:"tenant-a",displayName:"Tenant A"},
    selectedIndustry:undefined,
    orgUnitId:ctx.orgUnitId,
    entitlementSnapshotVersion:7,
    sessionVersion:4,
  });
  assert.equal(JSON.stringify(result).includes(ctx.tenantId),false);
  assert.equal(JSON.stringify(result).includes(ctx.principalId),false);
  assert.equal(JSON.stringify(result).includes(ctx.membershipId),false);
});

test("workspace optional Industry selector is resolved only inside the current Tenant",async()=>{
  const ctx=context();
  const result=await new WorkspaceService(tenancyFixture(ctx)).resolve({
    requestContext:ctx,
    industrySelector:"retail",
  });
  assert.deepEqual(result.selectedIndustry,{displayKey:"retail",displayName:"Retail"});
});

test("workspace fails closed when membership is no longer active",async()=>{
  const ctx=context();
  await assert.rejects(
    new WorkspaceService(tenancyFixture(ctx,{membershipStatus:"SUSPENDED"})).resolve({
      requestContext:ctx,
    }),
    error=>error instanceof ContextResolutionError && error.code==="MEMBERSHIP_INVALID",
  );
});

test("workspace rejects a sibling-Tenant Industry Context",async()=>{
  const ctx=context();
  await assert.rejects(
    new WorkspaceService(tenancyFixture(ctx,{industryTenantId:randomUUID()})).resolve({
      requestContext:ctx,
      industrySelector:"retail",
    }),
    error=>error instanceof ContextResolutionError
      && error.code==="INDUSTRY_CONTEXT_MISMATCH",
  );
});
