import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIRAGChunkSourceResourceDescriptorEvidence,
} from "../../dist/core/index.js";

const ids=Object.freeze({
  tenant:"11111111-1111-4111-8111-111111111111",
  industry:"22222222-2222-4222-8222-222222222222",
  chunk:"33333333-3333-4333-8333-333333333333",
  source:"44444444-4444-4444-8444-444444444444",
  document:"55555555-5555-4555-8555-555555555555",
  model:"66666666-6666-4666-8666-666666666666",
  provider:"77777777-7777-4777-8777-777777777777",
  principal:"88888888-8888-4888-8888-888888888888",
  membership:"99999999-9999-4999-8999-999999999999",
  correlation:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  storage:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  acl1:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  acl2:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
});

function requestContext(overrides={}) {
  return Object.freeze({
    requestId:"request-1",correlationId:ids.correlation,tenantId:ids.tenant,
    industryContextId:ids.industry,dataHomeId:"data-home",regionCode:"IN-CENTRAL",
    principalId:ids.principal,principalType:"HUMAN",membershipId:ids.membership,
    orgUnitPath:Object.freeze([]),roleIds:Object.freeze([]),permissionVersion:7,
    entitlementSnapshotVersion:11,scopeClass:"TENANT_INDUSTRY",...overrides,
  });
}
function chunk(overrides={}) {
  return Object.freeze({
    id:ids.chunk,sourceId:ids.source,tenantId:ids.tenant,industryContextId:ids.industry,
    scopeClass:"TENANT_INDUSTRY",chunkOrdinal:1,textRefOrEncryptedText:"opaque-text",
    contentHash:"hash-1",tokenCount:100,aclProjection:Object.freeze({raw:true}),
    sensitivityClass:"CONFIDENTIAL",residencyRegion:"IN-CENTRAL",retentionClass:"RET-A",
    embeddingModelId:ids.model,embeddingVersion:"embed-v1",metadata:Object.freeze({raw:true}),
    createdAt:"2026-10-07T00:00:00.000Z",...overrides,
  });
}
function model(overrides={}) {
  return Object.freeze({
    id:ids.model,providerId:ids.provider,modelCode:"embed-model",displayName:"Embedding Model",
    capabilities:Object.freeze(["EMBEDDING"]),contextWindowClass:"raw-context",
    inputModalities:Object.freeze(["TEXT"]),outputModalities:Object.freeze(["VECTOR"]),
    residencyRegions:Object.freeze(["IN-CENTRAL"]),sensitivityCeiling:"REGULATED",
    costClass:"raw-cost",latencyClass:"raw-latency",status:"ACTIVE",version:1,
    metadata:Object.freeze({raw:true}),...overrides,
  });
}
function provider(overrides={}) {
  return Object.freeze({
    id:ids.provider,code:"provider.raw",status:"DEGRADED",adapterType:"raw-adapter",
    supportedRegions:Object.freeze(["IN-CENTRAL"]),supportedCapabilities:Object.freeze(["EMBEDDING"]),
    securityClass:"raw-security",residencyMetadata:Object.freeze({raw:true}),
    healthState:"UNKNOWN",version:1,createdAt:"2026-10-07T00:00:00.000Z",
    updatedAt:"2026-10-07T00:00:00.000Z",...overrides,
  });
}
function source(overrides={}) {
  return Object.freeze({
    id:ids.source,tenantId:ids.tenant,industryContextId:ids.industry,
    scopeClass:"TENANT_INDUSTRY",sourceModule:"DMS",managementSystemId:undefined,
    resourceType:"DOCUMENT",resourceId:"resource-1",documentId:ids.document,documentVersion:2,
    sensitivityClass:"INTERNAL",residencyRegion:"IN-CENTRAL",retentionClass:"RET-A",
    aclPolicyRef:"acl-policy-raw",status:"SUPERSEDED",sourceVersion:"source-v1",
    chunkingPolicyVersion:"chunk-v1",createdAt:"2026-10-07T00:00:00.000Z",
    updatedAt:"2026-10-07T00:00:00.000Z",...overrides,
  });
}
function document(overrides={}) {
  return Object.freeze({
    id:ids.document,tenantId:ids.tenant,industryContextId:ids.industry,
    scopeClass:"TENANT_INDUSTRY",sourceModule:"DMS",sourceResourceType:"DOCUMENT",
    sourceResourceId:"resource-1",filenameDisplay:"safe.pdf",mediaType:"application/pdf",
    storageObjectId:ids.storage,ownerPrincipalId:ids.principal,sensitivityClass:"PUBLIC",
    residencyRegion:"IN-CENTRAL",status:"ACTIVE",virusScanStatus:"CLEAN",versionNo:2,
    ...overrides,
  });
}
function acl(overrides={}) {
  return Object.freeze({
    id:ids.acl1,documentId:ids.document,subjectType:"PRINCIPAL",subjectId:ids.principal,
    permission:"VIEW",effect:"ALLOW",createdAt:"2026-10-07T00:00:00.000Z",...overrides,
  });
}
function fixture(overrides={}) {
  const order=[];
  const calls={chunk:[],model:[],provider:[],source:[],document:[],acl:[]};
  const lineageDocument=Object.hasOwn(overrides,"lineageDocument")?overrides.lineageDocument:document();
  const aclDocument=Object.hasOwn(overrides,"aclDocument")?overrides.aclDocument:lineageDocument;
  const values={
    chunk:Object.hasOwn(overrides,"chunk")?overrides.chunk:chunk(),
    model:Object.hasOwn(overrides,"model")?overrides.model:model(),
    provider:Object.hasOwn(overrides,"provider")?overrides.provider:provider(),
    source:Object.hasOwn(overrides,"source")?overrides.source:source(),
    lineageDocument,aclDocument,
    aclEntries:Object.hasOwn(overrides,"aclEntries")?overrides.aclEntries:Object.freeze([]),
  };
  const readers={
    chunkReader:{async loadForContext(input){order.push("chunk");calls.chunk.push(input);if(overrides.chunkError)throw overrides.chunkError;return values.chunk;}},
    modelReader:{async loadById(id){order.push("model");calls.model.push(id);if(overrides.modelError)throw overrides.modelError;return values.model;}},
    providerReader:{async loadById(id){order.push("provider");calls.provider.push(id);if(overrides.providerError)throw overrides.providerError;return values.provider;}},
    sourceReader:{async loadForContext(input){order.push("source");calls.source.push(input);if(overrides.sourceError)throw overrides.sourceError;return values.source;}},
    documentReader:{async loadForContext(input){order.push("document");calls.document.push(input);if(overrides.documentErrorAt===calls.document.length)throw overrides.documentError??new Error("document-failed");return calls.document.length===1?values.lineageDocument:values.aclDocument;}},
    aclReader:{async loadForDocument(input){order.push("acl");calls.acl.push(input);if(overrides.aclError)throw overrides.aclError;return values.aclEntries;}},
  };
  return {order,calls,values,readers};
}
async function load(f,inputOverrides={}) {
  return loadAIRAGChunkSourceResourceDescriptorEvidence(
    {requestContext:requestContext(),ragChunkId:ids.chunk,documentAclPermission:"VIEW",currentTimeIso:"2026-10-07T12:00:00.000Z",...inputOverrides},
    f.readers.chunkReader,f.readers.modelReader,f.readers.providerReader,
    f.readers.sourceReader,f.readers.documentReader,f.readers.aclReader,
  );
}

test("RAGCHUNK-SRCDESC-BASE-001 exact DD-657 parent executes first with exact inputs/dependencies and zero post-parent reads",async()=>{
  const f=fixture(); const ctx=requestContext();
  const result=await load(f,{requestContext:ctx});
  assert.ok(result);
  assert.deepEqual(f.order,["chunk","model","provider","source","document","document","acl"]);
  assert.equal(f.calls.chunk[0].requestContext,ctx);
  assert.equal(f.calls.source[0].requestContext,ctx);
  assert.equal(f.calls.acl.length,1);
  assert.equal(result.parent.parent.parent.source,f.values.source);
});

test("RAGCHUNK-SRCDESC-BASE-002 DD-657 null/error short-circuits or propagates unchanged before descriptor projection",async()=>{
  const hidden=fixture({chunk:null});
  assert.equal(await load(hidden),null);
  assert.deepEqual(hidden.order,["chunk"]);
  const expected=new Error("provider-failed");
  const broken=fixture({providerError:expected});
  await assert.rejects(load(broken),error=>error===expected);
  assert.deepEqual(broken.order,["chunk","model","provider"]);
});

test("RAGCHUNK-SRCDESC-BRANCH-001 unbound DENY and ALLOW branches remain frozen exact parent-only evidence",async()=>{
  const unboundSource=source({documentId:undefined,documentVersion:undefined});
  const unbound=fixture({source:unboundSource,lineageDocument:null,aclDocument:null});
  const unboundResult=await load(unbound);
  assert.ok(unboundResult);
  assert.equal("resourceDescriptor" in unboundResult,false);
  assert.equal(Object.isFrozen(unboundResult),true);

  const deny=fixture({aclEntries:Object.freeze([acl({effect:"DENY"})])});
  const denyResult=await load(deny);
  assert.ok(denyResult);
  assert.equal(denyResult.parent.accessPathEvidence,"EXPLICIT_ACL_DENY");
  assert.equal("resourceDescriptor" in denyResult,false);

  const allow=fixture({aclEntries:Object.freeze([acl({effect:"ALLOW"})])});
  const allowResult=await load(allow);
  assert.ok(allowResult);
  assert.equal(allowResult.parent.accessPathEvidence,"EXPLICIT_ACL_ALLOW");
  assert.equal("resourceDescriptor" in allowResult,false);
});

test("RAGCHUNK-SRCDESC-DESC-001 SOURCE_RESOURCE_AUTHORIZATION_REQUIRED projects exact Tenant/Industry/source identity and sensitivity",async()=>{
  const f=fixture({aclEntries:Object.freeze([])});
  const result=await load(f);
  assert.ok(result);
  assert.equal(result.parent.accessPathEvidence,"SOURCE_RESOURCE_AUTHORIZATION_REQUIRED");
  assert.deepEqual(result.resourceDescriptor,{
    resourceType:"DOCUMENT",
    resourceId:"resource-1",
    tenantId:ids.tenant,
    industryContextId:ids.industry,
    sensitivityClass:"INTERNAL",
  });
  assert.equal(Object.isFrozen(result.resourceDescriptor),true);

  const coreSource=source({industryContextId:undefined,scopeClass:"TENANT_CORE"});
  const coreChunk=chunk({industryContextId:undefined,scopeClass:"TENANT_CORE"});
  const coreDocument=document({industryContextId:undefined,scopeClass:"TENANT_CORE"});
  const core=fixture({source:coreSource,chunk:coreChunk,lineageDocument:coreDocument,aclDocument:coreDocument,aclEntries:Object.freeze([])});
  const coreResult=await load(core,{requestContext:requestContext({industryContextId:undefined,scopeClass:"TENANT_CORE"})});
  assert.ok(coreResult);
  assert.equal("industryContextId" in coreResult.resourceDescriptor,false);
  assert.equal(coreResult.resourceDescriptor.tenantId,ids.tenant);
});

test("RAGCHUNK-SRCDESC-DESC-002 raw resource strings stay exact and unsupported descriptor fields are not synthesized",async()=>{
  const rawSource=source({resourceType:"",resourceId:"",residencyRegion:"IN-CENTRAL"});
  const f=fixture({source:rawSource,aclEntries:Object.freeze([])});
  const result=await load(f);
  assert.ok(result);
  assert.equal(result.resourceDescriptor.resourceType,"");
  assert.equal(result.resourceDescriptor.resourceId,"");
  for(const field of ["residencyClass","orgUnitId","ownerPrincipalId","state"]){
    assert.equal(field in result.resourceDescriptor,false);
  }
  assert.equal(result.parent.parent.parent.source.residencyRegion,"IN-CENTRAL");
});

test("RAGCHUNK-SRCDESC-EVID-001 success preserves exact DD-657 parent and nested raw references unchanged",async()=>{
  const entries=Object.freeze([]);
  const f=fixture({aclEntries:entries});
  const before=JSON.stringify([f.values.chunk,f.values.model,f.values.provider,f.values.source,f.values.lineageDocument,entries]);
  const result=await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(Object.isFrozen(result.parent),true);
  assert.equal(result.parent.parent.parent.source,f.values.source);
  assert.equal(result.parent.parent.parent.document,f.values.lineageDocument);
  assert.equal(JSON.stringify([f.values.chunk,f.values.model,f.values.provider,f.values.source,f.values.lineageDocument,entries]),before);
});

test("RAGCHUNK-SRCDESC-BOUND-001 descriptor evidence exposes no source resolver operation authorization retrieval routing inference mutation or event authority",async()=>{
  const result=await load(fixture({aclEntries:Object.freeze([])}));
  assert.ok(result);
  for(const forbidden of [
    "sourceResource","resolvedResource","operation","operationContract","permissionCode",
    "authorizationDecision","guardResult","authorized","accessAllowed","entitlementAllowed",
    "rbacAllowed","abacSatisfied","residencyAllowed","retrievalAuthorized","rankedChunks",
    "groundingSatisfied","citationAuthorized","promptInjectionSafe","routeDecision",
    "inferenceAuthorized","executionAuthorized","mutation","eventEmitted",
  ]) assert.equal(forbidden in result,false);
});

test("RAGCHUNK-SRCDESC-BOUND-002 descriptor projection never bypasses DENY upgrades ALLOW or infers unbound access",async()=>{
  const deny=await load(fixture({aclEntries:Object.freeze([acl({effect:"DENY"})])}));
  assert.ok(deny); assert.equal(deny.parent.accessPathEvidence,"EXPLICIT_ACL_DENY");
  assert.equal("resourceDescriptor" in deny,false);

  const allow=await load(fixture({aclEntries:Object.freeze([acl({effect:"ALLOW"})])}));
  assert.ok(allow); assert.equal(allow.parent.accessPathEvidence,"EXPLICIT_ACL_ALLOW");
  assert.equal("resourceDescriptor" in allow,false);

  const unboundSource=source({documentId:undefined,documentVersion:undefined});
  const unbound=await load(fixture({source:unboundSource,lineageDocument:null,aclDocument:null}));
  assert.ok(unbound); assert.equal("accessPathEvidence" in unbound.parent,false);
  assert.equal("resourceDescriptor" in unbound,false);
});
