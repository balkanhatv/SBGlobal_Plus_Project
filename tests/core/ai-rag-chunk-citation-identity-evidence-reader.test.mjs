import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIRAGChunkCitationIdentityEvidence,
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


test("RAGCHUNK-CITID-BASE-001 exact DD-662 parent first and zero added reads",async()=>{
  const f=fixture();const ctx=requestContext();
  const result=await load(f,{requestContext:ctx});
  assert.ok(result);
  assert.deepEqual(f.order,["chunk","model","provider","source","document","document","acl"]);
  assert.equal(f.calls.chunk[0].requestContext,ctx);
  assert.equal(f.calls.source[0].requestContext,ctx);
  assert.equal(f.calls.acl.length,1);
  assert.equal(result.parent.parent.parent.parent.source,f.values.source);
});
test("RAGCHUNK-CITID-BASE-002 parent null and dependency error precede identity projection",async()=>{
  const hidden=fixture({chunk:null});
  assert.equal(await load(hidden),null);
  assert.deepEqual(hidden.order,["chunk"]);
  const expected=new Error("provider-unavailable");
  const broken=fixture({providerError:expected});
  await assert.rejects(load(broken),error=>error===expected);
  assert.deepEqual(broken.order,["chunk","model","provider"]);
});
test("RAGCHUNK-CITID-BRANCH-001 unbound DENY ALLOW return parent-only",async()=>{
  const unbound=fixture({
    source:source({documentId:undefined,documentVersion:undefined}),
    lineageDocument:null,aclDocument:null,
  });
  const none=await load(unbound);
  assert.ok(none);
  assert.equal("citationIdentity" in none,false);
  assert.equal(Object.isFrozen(none),true);
  for(const effect of ["DENY","ALLOW"]){
    const f=fixture({aclEntries:Object.freeze([acl({effect})])});
    const result=await load(f);
    assert.ok(result);
    assert.equal(result.parent.parent.accessPathEvidence,effect==="DENY"?"EXPLICIT_ACL_DENY":"EXPLICIT_ACL_ALLOW");
    assert.equal("citationIdentity" in result,false);
    assert.equal(Object.isFrozen(result),true);
  }
});
test("RAGCHUNK-CITID-ID-001 descriptor branch projects only exact persisted identity",async()=>{
  const f=fixture({aclEntries:Object.freeze([])});
  const result=await load(f);
  assert.ok(result);
  assert.deepEqual(result.citationIdentity,{
    sourceResourceType:"DOCUMENT",
    sourceResourceId:"resource-1",
    documentId:ids.document,
    chunkId:ids.chunk,
    sourceVersion:"source-v1",
  });
  assert.equal(Object.isFrozen(result.citationIdentity),true);
  assert.equal(result.parent.parent.accessPathEvidence,"SOURCE_RESOURCE_AUTHORIZATION_REQUIRED");
  assert.equal(result.parent.resourceDescriptor.resourceId,"resource-1");

  const coreSource=source({industryContextId:undefined,scopeClass:"TENANT_CORE",
    documentId:undefined,documentVersion:undefined,resourceType:"RAW",resourceId:""});
  const coreChunk=chunk({industryContextId:undefined,scopeClass:"TENANT_CORE"});
  const core=fixture({source:coreSource,chunk:coreChunk,lineageDocument:null,aclDocument:null});
  const coreResult=await load(core,{requestContext:requestContext({industryContextId:undefined,scopeClass:"TENANT_CORE"})});
  assert.ok(coreResult);
  assert.equal("documentId" in coreResult.citationIdentity,false);
});
test("RAGCHUNK-CITID-ID-002 no labels relevance residency or synthesized fields",async()=>{
  const f=fixture({source:source({resourceType:"",resourceId:"",sourceVersion:"raw-SRC-v1",residencyRegion:"IN-CENTRAL"})});
  const result=await load(f);
  assert.ok(result);
  assert.deepEqual(Object.keys(result.citationIdentity),[
    "sourceResourceType","sourceResourceId","documentId","chunkId","sourceVersion",
  ]);
  assert.equal(result.citationIdentity.sourceResourceType,"");
  assert.equal(result.citationIdentity.sourceResourceId,"");
  assert.equal(result.citationIdentity.sourceVersion,"raw-SRC-v1");
  for(const name of ["safeLabel","relevanceClass","residencyClass","embeddingVersion",
    "citationAuthorized","sourceCurrent","contentRef"]){
    assert.equal(name in result.citationIdentity,false);
  }
});
test("RAGCHUNK-CITID-EVID-001 exact DD-662 parent and source/chunk/Document/ACL remain intact",async()=>{
  const f=fixture();
  const before=JSON.stringify(f.values);
  const result=await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(Object.isFrozen(result.parent),true);
  assert.equal(result.parent.parent.parent.parent.source,f.values.source);
  assert.equal(result.parent.parent.parent.parent.parent.parent.chunk,f.values.chunk);
  assert.equal(result.parent.parent.parent.parent.document,f.values.lineageDocument);
  assert.equal(JSON.stringify(f.values),before);
});
test("RAGCHUNK-CITID-BOUND-001 internal identity is never full authorized citation/execution",async()=>{
  const result=await load(fixture());
  assert.ok(result);
  for(const forbidden of ["GroundingCitation","safeLabel","relevanceClass",
    "clientCitation","citationAuthorized","retrievalAuthorized","authorizationDecision",
    "guardResult","sourceResource","resolvedResource","entitlementAllowed",
    "residencyAllowed","rankedChunks","groundingSatisfied","routeDecision",
    "inferenceAuthorized","executionAuthorized","mutation","eventEmitted"]){
    assert.equal(forbidden in result,false);
    assert.equal(forbidden in result.citationIdentity,false);
  }
});
test("RAGCHUNK-CITID-BOUND-002 explicit DENY never bypassed ALLOW never final and pending authorization remains pending",async()=>{
  for(const effect of ["DENY","ALLOW"]){
    const result=await load(fixture({aclEntries:Object.freeze([acl({effect})])}));
    assert.ok(result);
    assert.equal("citationIdentity" in result,false);
    assert.equal("resourceDescriptor" in result.parent,false);
  }
  const pending=await load(fixture({aclEntries:Object.freeze([])}));
  assert.ok(pending);
  assert.equal(pending.parent.parent.accessPathEvidence,"SOURCE_RESOURCE_AUTHORIZATION_REQUIRED");
  assert.ok(pending.citationIdentity);
  assert.equal("citationAuthorized" in pending,false);
  assert.equal("authorizationDecision" in pending,false);
});
