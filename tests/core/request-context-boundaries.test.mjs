import test from "node:test";
import assert from "node:assert/strict";
import { RequestContextService } from "../../dist/core/context/request-context-service.js";
import { ContextResolutionError } from "../../dist/core/context/errors.js";

function fixture({scopes=["TENANT_CORE"],principalType="API_CLIENT",sessionVersion=9}={}){
  const calls=[];
  const service=new RequestContextService({
    identity:{
      async verifyMachineCredential(){
        calls.push("identity");
        return {principalId:"principal",principalType,credentialId:"credential",credentialVersion:1,
          boundTenantId:"tenant",allowedIndustryContextIds:["industry"],allowedScopeClasses:scopes};
      },
      async verifyHumanSession(){
        return {principalId:"principal",principalType:"HUMAN",authStrength:"MFA",sessionVersion:2};
      },
    },
    tenancy:{
      async resolveTenant(){calls.push("tenant");return {id:"tenant",status:"ACTIVE"};},
      async findMembership(){return {id:"membership",tenantId:"tenant",principalId:"principal",status:"ACTIVE"};},
      async resolveIndustryContext(){return {id:"industry",tenantId:"tenant",status:"ACTIVE"};},
      async resolveOrgUnit(){return null;},
      async resolveDataHome(){return {id:"home",regionCode:"IN"};},
    },
    authorization:{async loadRoleContext(){return {roleIds:[],permissionVersion:1};}},
    commercial:{async validateAndLoad(){return {entitlementSnapshotId:"snapshot",entitlementSnapshotVersion:1};}},
    security:{async validateAndResolve(){return {riskLevel:"LOW",sessionVersion,attributes:{}};}},
    ids:{nextId:()=>"generated"},
  });
  return {service,calls};
}
const input=scopeClass=>({requestId:"request",scopeClass,industrySelector:"industry",
  authentication:{kind:"MACHINE",credential:"test-only"}});

test("machine credentials cannot enter an unlisted Tenant Core or Industry scope",async()=>{
  for(const principalType of ["API_CLIENT","SERVICE"]){
    for(const [scope,scopes] of [
      ["TENANT_CORE",["TENANT_INDUSTRY"]],
      ["TENANT_INDUSTRY",["TENANT_CORE"]],
      ["TENANT_CORE",[]],
      ["TENANT_INDUSTRY",null],
      ["EXPLICIT_CROSS_CONTEXT",["TENANT_CORE","TENANT_INDUSTRY"]],
    ]){
      const {service,calls}=fixture({scopes,principalType});
      await assert.rejects(service.resolve(input(scope)),error=>
        error instanceof ContextResolutionError && error.code==="CREDENTIAL_INVALID");
      assert.deepEqual(calls,["identity"],"Scope denial must precede Tenant lookup");
    }
  }
});

test("explicitly allowed machine scopes retain existing Tenant and Industry bindings",async()=>{
  for(const principalType of ["API_CLIENT","SERVICE"]){
    for(const scope of ["TENANT_CORE","TENANT_INDUSTRY"]){
      const {service}=fixture({scopes:[scope],principalType});
      const result=await service.resolve(input(scope));
      assert.equal(result.scopeClass,scope);
      assert.equal(result.tenantId,"tenant");
      assert.equal(result.industryContextId,scope==="TENANT_INDUSTRY"?"industry":undefined);
    }
  }
});

test("Tenant human RequestContext carries the validated server session version",async()=>{
  const {service}=fixture();
  const result=await service.resolve({...input("TENANT_CORE"),authentication:{kind:"HUMAN",credential:"session"}});
  assert.equal(result.securityContext.sessionVersion,9);
  assert.equal(result.sessionVersion,9,"Provider evidence must not replace current Core session truth");
});
