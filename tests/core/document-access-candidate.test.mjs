import test from "node:test";
import assert from "node:assert/strict";

import {
  DocumentAccessCandidateError,
  DocumentAccessCandidateService,
} from "../../dist/core/index.js";

const ids={
  tenant:"11111111-1111-4111-8111-111111111111",
  industry:"22222222-2222-4222-8222-222222222222",
  otherIndustry:"33333333-3333-4333-8333-333333333333",
  principal:"44444444-4444-4444-8444-444444444444",
  document:"55555555-5555-4555-8555-555555555555",
  object:"66666666-6666-4666-8666-666666666666",
  owner:"77777777-7777-4777-8777-777777777777",
  correlation:"88888888-8888-4888-8888-888888888888",
};

function context(overrides={}){
  return Object.freeze({
    requestId:"99999999-9999-4999-8999-999999999999",
    correlationId:ids.correlation,
    tenantId:ids.tenant,
    industryContextId:ids.industry,
    principalId:ids.principal,
    principalType:"HUMAN",
    orgUnitPath:Object.freeze([]),
    roleIds:Object.freeze([]),
    scopeClass:"TENANT_INDUSTRY",
    ...overrides,
  });
}

function metadata(overrides={}){
  return Object.freeze({
    id:ids.document,
    tenantId:ids.tenant,
    industryContextId:ids.industry,
    scopeClass:"TENANT_INDUSTRY",
    sourceModule:"Documents",
    sourceResourceType:"CaseFile",
    sourceResourceId:"case-42",
    filenameDisplay:"evidence.pdf",
    mediaType:"application/pdf",
    storageObjectId:ids.object,
    ownerPrincipalId:ids.owner,
    sensitivityClass:"CONFIDENTIAL",
    residencyRegion:"IN-CENTRAL",
    status:"ACTIVE",
    virusScanStatus:"CLEAN",
    versionNo:3,
    ...overrides,
  });
}

function port(trace,record=metadata()){
  return {
    async loadForContext(input){
      trace.push(input);
      return record;
    },
  };
}

test("DOC-PRE-001 exact Industry document produces immutable internal access candidate",async()=>{
  const trace=[];
  const service=new DocumentAccessCandidateService(port(trace));
  const result=await service.prepare({requestContext:context(),documentId:ids.document});

  assert.equal(trace.length,1);
  assert.equal(trace[0].requestContext.tenantId,ids.tenant);
  assert.equal(trace[0].requestContext.industryContextId,ids.industry);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(result.documentId,ids.document);
  assert.equal(result.storageObjectId,ids.object);
  assert.equal(result.correlationId,ids.correlation);
  assert.equal("url" in result,false);
  assert.equal("token" in result,false);
  assert.equal("objectKey" in result,false);
  assert.equal("providerRef" in result,false);
  assert.equal("credential" in result,false);
});

test("DOC-PRE-002 Tenant Core metadata remains a Tenant resource inside an Industry workspace",async()=>{
  const trace=[];
  const service=new DocumentAccessCandidateService(port(trace,metadata({
    scopeClass:"TENANT_CORE",
    industryContextId:undefined,
  })));
  const result=await service.prepare({requestContext:context(),documentId:ids.document});
  assert.equal(result.scopeClass,"TENANT_CORE");
  assert.equal(result.industryContextId,undefined);
});

test("DOC-PRE-003 sibling Industry and foreign Tenant metadata normalize to not found",async()=>{
  for(const record of [
    metadata({industryContextId:ids.otherIndustry}),
    metadata({tenantId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}),
  ]){
    const service=new DocumentAccessCandidateService(port([],record));
    await assert.rejects(
      service.prepare({requestContext:context(),documentId:ids.document}),
      error=>error instanceof DocumentAccessCandidateError
        && error.code==="RESOURCE_NOT_FOUND"
        && error.retryable===false,
    );
  }
});

test("DOC-PRE-004 non-ACTIVE or non-CLEAN metadata cannot progress toward signing",async()=>{
  for(const record of [
    metadata({status:"QUARANTINED",virusScanStatus:"INFECTED"}),
    metadata({status:"DELETED"}),
    metadata({virusScanStatus:"PENDING"}),
  ]){
    const service=new DocumentAccessCandidateService(port([],record));
    await assert.rejects(
      service.prepare({requestContext:context(),documentId:ids.document}),
      error=>error instanceof DocumentAccessCandidateError
        && error.code==="RESOURCE_STATE_INVALID",
    );
  }
});

test("DOC-PRE-005 missing metadata and unresolved or malformed context fail without existence disclosure",async()=>{
  const missing=new DocumentAccessCandidateService(port([],null));
  await assert.rejects(
    missing.prepare({requestContext:context(),documentId:ids.document}),
    error=>error instanceof DocumentAccessCandidateError
      && error.code==="RESOURCE_NOT_FOUND",
  );

  const service=new DocumentAccessCandidateService(port([]));
  for(const requestContext of [
    context({tenantId:undefined}),
    context({industryContextId:undefined}),
    context({principalId:undefined}),
    context({scopeClass:"PLATFORM_GLOBAL",tenantId:undefined,industryContextId:undefined}),
  ]){
    await assert.rejects(
      service.prepare({requestContext,documentId:ids.document}),
      error=>error instanceof DocumentAccessCandidateError
        && error.code==="RESOURCE_NOT_FOUND",
    );
  }
});

test("DOC-PRE-006 metadata dependency failures and malformed authoritative rows fail closed",async()=>{
  const outage=new DocumentAccessCandidateService({
    async loadForContext(){throw new Error("postgres private detail");},
  });
  await assert.rejects(
    outage.prepare({requestContext:context(),documentId:ids.document}),
    error=>error instanceof DocumentAccessCandidateError
      && error.code==="DEPENDENCY_UNAVAILABLE"
      && error.retryable===true
      && !error.message.includes("postgres"),
  );

  const malformed=new DocumentAccessCandidateService(port([],metadata({
    scopeClass:"TENANT_CORE",
    industryContextId:ids.industry,
  })));
  await assert.rejects(
    malformed.prepare({requestContext:context(),documentId:ids.document}),
    error=>error instanceof DocumentAccessCandidateError
      && error.code==="DEPENDENCY_UNAVAILABLE",
  );
});

test("malformed document id fails before metadata dependency use",async()=>{
  const trace=[];
  const service=new DocumentAccessCandidateService(port(trace));
  await assert.rejects(
    service.prepare({requestContext:context(),documentId:"not-a-uuid"}),
    error=>error instanceof DocumentAccessCandidateError
      && error.code==="RESOURCE_NOT_FOUND",
  );
  assert.deepEqual(trace,[]);
});
