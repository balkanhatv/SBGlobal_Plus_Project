import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import {
  AuthorizationSourceCompilerError,
  AuthorizationSourceCompilerService,
} from "../../dist/core/index.js";

function fixture(source) {
  const calls=[];
  const publisher={
    async publishTenant(input){ calls.push(["publishTenant",input]); return {subjectId:randomUUID(),snapshotId:randomUUID(),permissionVersion:1}; },
    async publishPlatform(input){ calls.push(["publishPlatform",input]); return {subjectId:randomUUID(),snapshotId:randomUUID(),permissionVersion:1}; },
    async invalidateTenant(input){ calls.push(["invalidateTenant",input]); return {subjectId:randomUUID(),permissionVersion:1,invalidated:true}; },
    async invalidatePlatform(input){ calls.push(["invalidatePlatform",input]); return {subjectId:randomUUID(),permissionVersion:1,invalidated:true}; },
  };
  const service=new AuthorizationSourceCompilerService({
    sourceStore:{
      async loadTenant(){ return source; },
      async loadPlatform(){ return source; },
    },
    publisher,
    fingerprint:{sha256(value){return createHash("sha256").update(value).digest("hex");}},
  });
  return {service,calls};
}
const roleA=randomUUID(), roleB=randomUUID(), permissionA=randomUUID(), permissionB=randomUUID();
const target={tenantId:randomUUID(),industryContextId:randomUUID(),principalId:randomUUID(),scopeClass:"TENANT_INDUSTRY"};
const context={requestId:randomUUID(),correlationId:randomUUID(),tenantId:target.tenantId,industryContextId:target.industryContextId,
  dataHomeId:randomUUID(),regionCode:"IN",principalId:randomUUID(),principalType:"SERVICE",orgUnitPath:[],roleIds:[],scopeClass:"TENANT_INDUSTRY"};

test("source compiler is deterministic, sorted, and DENY wins across roles", async()=>{
  const {service,calls}=fixture({
    assignmentIds:[randomUUID(),randomUUID()],
    roles:[{id:roleB,version:2},{id:roleA,version:2}],
    permissions:[
      {roleId:roleB,roleVersion:2,permissionId:permissionB,rolePermissionVersion:2,permissionDefinitionVersion:1,
       code:"rtl.pos.sale.view",scopeClass:"TENANT_INDUSTRY",effect:"ALLOW",constraints:{}},
      {roleId:roleA,roleVersion:2,permissionId:permissionA,rolePermissionVersion:2,permissionDefinitionVersion:1,
       code:"rtl.pos.sale.view",scopeClass:"TENANT_INDUSTRY",effect:"DENY",constraints:{}},
    ],
  });
  await service.compileTenant({requestContext:context,target});
  const publication=calls.find(([name])=>name==="publishTenant")[1];
  assert.deepEqual(publication.roleIds,[roleA,roleB].sort());
  assert.deepEqual(publication.permissionSet,{permissions:[{code:"rtl.pos.sale.view",effect:"DENY"}]});
  assert.match(publication.sourceFingerprint,/^[0-9a-f]{64}$/);
});

test("non-empty role constraints conservatively compile as DENY", async()=>{
  const {service,calls}=fixture({
    assignmentIds:[randomUUID()],
    roles:[{id:roleA,version:1}],
    permissions:[{roleId:roleA,roleVersion:1,permissionId:permissionA,rolePermissionVersion:1,permissionDefinitionVersion:1,
      code:"rtl.pos.sale.refund",scopeClass:"TENANT_INDUSTRY",effect:"ALLOW",constraints:{limit:"own"}}],
  });
  await service.compileTenant({requestContext:context,target});
  assert.deepEqual(calls.find(([name])=>name==="publishTenant")[1].permissionSet,
    {permissions:[{code:"rtl.pos.sale.refund",effect:"DENY"}]});
});

test("source scope/version ambiguity invalidates existing snapshot and fails closed", async()=>{
  for(const permission of [
    {roleId:roleA,roleVersion:1,permissionId:permissionA,rolePermissionVersion:2,permissionDefinitionVersion:1,
      code:"rtl.pos.sale.view",scopeClass:"TENANT_INDUSTRY",effect:"ALLOW",constraints:{}},
    {roleId:roleA,roleVersion:1,permissionId:permissionA,rolePermissionVersion:1,permissionDefinitionVersion:1,
      code:"rtl.pos.sale.view",scopeClass:"TENANT_CORE",effect:"ALLOW",constraints:{}},
  ]){
    const {service,calls}=fixture({assignmentIds:[randomUUID()],roles:[{id:roleA,version:1}],permissions:[permission]});
    await assert.rejects(service.compileTenant({requestContext:context,target}),
      error=>error instanceof AuthorizationSourceCompilerError && error.code==="AUTHORIZATION_COMPILER_SOURCE_INVALID");
    assert.equal(calls.some(([name])=>name==="invalidateTenant"),true);
    assert.equal(calls.some(([name])=>name==="publishTenant"),false);
  }
});
