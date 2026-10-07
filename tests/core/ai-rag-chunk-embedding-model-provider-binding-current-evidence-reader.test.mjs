import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAIRAGChunkEmbeddingModelProviderBindingCurrentEvidence,
} from "../../dist/core/index.js";

const ids = Object.freeze({
  chunk:"11111111-1111-4111-8111-111111111111",
  source:"22222222-2222-4222-8222-222222222222",
  tenant:"33333333-3333-4333-8333-333333333333",
  industry:"44444444-4444-4444-8444-444444444444",
  model:"55555555-5555-4555-8555-555555555555",
  provider:"66666666-6666-4666-8666-666666666666",
  otherProvider:"77777777-7777-4777-8777-777777777777",
  principal:"88888888-8888-4888-8888-888888888888",
  membership:"99999999-9999-4999-8999-999999999999",
  correlation:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
});

function context(overrides={}) {
  return Object.freeze({
    requestId:"request-rag-chunk-model-provider",
    correlationId:ids.correlation,
    tenantId:ids.tenant,
    industryContextId:ids.industry,
    dataHomeId:"home-rag-chunk-model-provider",
    regionCode:"IN-CENTRAL",
    principalId:ids.principal,
    principalType:"HUMAN",
    membershipId:ids.membership,
    orgUnitPath:Object.freeze([]),
    roleIds:Object.freeze([]),
    scopeClass:"TENANT_INDUSTRY",
    ...overrides,
  });
}

function chunk(overrides={}) {
  return Object.freeze({
    id:ids.chunk,
    sourceId:ids.source,
    tenantId:ids.tenant,
    industryContextId:ids.industry,
    scopeClass:"TENANT_INDUSTRY",
    chunkOrdinal:7,
    textRefOrEncryptedText:"opaque://chunk",
    contentHash:"raw-hash",
    tokenCount:256,
    aclProjection:Object.freeze({deny:true}),
    sensitivityClass:"CONFIDENTIAL",
    residencyRegion:"IN-CENTRAL",
    retentionClass:"STANDARD",
    embeddingModelId:ids.model,
    embeddingVersion:"embed-v99",
    metadata:Object.freeze({raw:Object.freeze(["x"])}),
    createdAt:"2026-10-07T00:00:00.000Z",
    ...overrides,
  });
}

function model(overrides={}) {
  return Object.freeze({
    id:ids.model,
    providerId:ids.provider,
    modelCode:"embedding.raw",
    displayName:"Raw Embedding Model",
    capabilities:Object.freeze(["EMBEDDING",null]),
    contextWindowClass:"RAW",
    inputModalities:Object.freeze(["TEXT"]),
    outputModalities:Object.freeze(["EMBEDDING"]),
    residencyRegions:Object.freeze(["OTHER"]),
    sensitivityCeiling:"REGULATED",
    costClass:"RAW-COST",
    latencyClass:"RAW-LATENCY",
    status:"ACTIVE",
    version:99,
    metadata:Object.freeze({raw:true}),
    ...overrides,
  });
}

function provider(overrides={}) {
  return Object.freeze({
    id:ids.provider,
    code:"provider.raw",
    status:"RETIRED",
    adapterType:"RAW",
    supportedRegions:Object.freeze([null,"OTHER"]),
    supportedCapabilities:Object.freeze([null,"UNRELATED"]),
    securityClass:"RAW",
    residencyMetadata:Object.freeze({raw:true}),
    healthState:"DOWN",
    version:77,
    createdAt:"raw-created",
    updatedAt:"raw-updated",
    ...overrides,
  });
}

function fixture(overrides={}) {
  const order=[],chunkCalls=[],modelCalls=[],providerCalls=[];
  const values={
    chunk:Object.hasOwn(overrides,"chunk")?overrides.chunk:chunk(),
    model:Object.hasOwn(overrides,"model")?overrides.model:model(),
    provider:Object.hasOwn(overrides,"provider")?overrides.provider:provider(),
  };
  return {
    order,chunkCalls,modelCalls,providerCalls,values,
    chunkReader:{async loadForContext(input){order.push("chunk");chunkCalls.push(input);if(overrides.chunkError)throw overrides.chunkError;return values.chunk;}},
    modelReader:{async loadById(id){order.push("model");modelCalls.push(id);if(overrides.modelError)throw overrides.modelError;return values.model;}},
    providerReader:{async loadById(id){order.push("provider");providerCalls.push(id);if(overrides.providerError)throw overrides.providerError;return values.provider;}},
  };
}

async function load(f,inputOverrides={}) {
  return loadAIRAGChunkEmbeddingModelProviderBindingCurrentEvidence(
    {requestContext:context(),ragChunkId:ids.chunk,...inputOverrides},
    f.chunkReader,
    f.modelReader,
    f.providerReader,
  );
}

test("RAGCHUNK-MODELPROV-BASE-001 exact DD-637 parent evidence is established first with unchanged inputs/dependencies",async()=>{
  const f=fixture(); const current=context();
  const result=await load(f,{requestContext:current});
  assert.ok(result);
  assert.deepEqual(f.order,["chunk","model","provider"]);
  assert.equal(f.chunkCalls[0].requestContext,current);
  assert.equal(f.chunkCalls[0].ragChunkId,ids.chunk);
  assert.equal(result.parent.chunk,f.values.chunk);
  assert.equal(result.parent.model,f.values.model);
});

test("RAGCHUNK-MODELPROV-BASE-002 DD-637 null/error short-circuits or propagates before Provider access",async()=>{
  const missing=fixture({chunk:null});
  assert.equal(await load(missing),null);
  assert.deepEqual(missing.order,["chunk"]);
  assert.equal(missing.providerCalls.length,0);

  const expected=new Error("model-catalog-unavailable");
  const broken=fixture({modelError:expected});
  await assert.rejects(load(broken),error=>error===expected);
  assert.deepEqual(broken.order,["chunk","model"]);
  assert.equal(broken.providerCalls.length,0);
});

test("RAGCHUNK-MODELPROV-READ-001 exactly one Provider read uses exact preserved parent.model.providerId",async()=>{
  const f=fixture(); const result=await load(f);
  assert.ok(result);
  assert.deepEqual(f.providerCalls,[ids.provider]);
  assert.equal(result.provider,f.values.provider);
});

test("RAGCHUNK-MODELPROV-READ-002 missing Provider returns null and Provider errors propagate unchanged without fallback",async()=>{
  const missing=fixture({provider:null});
  assert.equal(await load(missing),null);
  assert.deepEqual(missing.order,["chunk","model","provider"]);
  assert.deepEqual(missing.providerCalls,[ids.provider]);

  const expected=new Error("provider-catalog-unavailable");
  const broken=fixture({providerError:expected});
  await assert.rejects(load(broken),error=>error===expected);
  assert.deepEqual(broken.order,["chunk","model","provider"]);
  assert.deepEqual(broken.providerCalls,[ids.provider]);
});

test("RAGCHUNK-MODELPROV-BIND-001 exact DD-200 Model to Provider id binding passes",async()=>{
  const result=await load(fixture());
  assert.ok(result);
  assert.equal(result.parent.model.providerId,ids.provider);
  assert.equal(result.provider.id,ids.provider);
});

test("RAGCHUNK-MODELPROV-BIND-002 wrong or malformed relevant Model/Provider identity evidence fails closed",async()=>{
  for(const candidate of [
    {provider:provider({id:ids.otherProvider})},
    {provider:provider({id:"bad"})},
    {model:model({providerId:"bad"})},
  ]){
    const f=fixture(candidate);
    assert.equal(await load(f),null);
    assert.equal(f.providerCalls.length,1);
  }

  const parentRejected=fixture({model:model({id:"bad"})});
  assert.equal(await load(parentRejected),null);
  assert.equal(parentRejected.providerCalls.length,0);
});

test("RAGCHUNK-MODELPROV-EVID-001 success is frozen and preserves exact parent/provider raw references unchanged",async()=>{
  const f=fixture();
  const before=JSON.stringify([f.values.chunk,f.values.model,f.values.provider]);
  const result=await load(f);
  assert.ok(result);
  assert.equal(Object.isFrozen(result),true);
  assert.equal(result.parent.chunk,f.values.chunk);
  assert.equal(result.parent.model,f.values.model);
  assert.equal(result.provider,f.values.provider);
  assert.equal(result.provider.status,"RETIRED");
  assert.equal(result.provider.healthState,"DOWN");
  assert.equal(result.provider.supportedRegions[1],"OTHER");
  assert.equal(JSON.stringify([f.values.chunk,f.values.model,f.values.provider]),before);
});

test("RAGCHUNK-MODELPROV-BOUND-001 output exposes no Provider current health credential compatibility routing retrieval grounding or execution authority",async()=>{
  const result=await load(fixture());
  assert.ok(result);
  for(const forbidden of [
    "providerCurrent","providerActive","providerHealthy","credentialRef","credential",
    "providerCompatible","capabilityCompatible","residencyCompatible","route",
    "selectedProvider","source","document","aclEntries","authorized","vector",
    "search","retrievalAuthorized","ranked","grounded","executionAuthorized",
    "mutation","eventEmitted",
  ]) assert.equal(forbidden in result,false);
});
