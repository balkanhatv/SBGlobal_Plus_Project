import test from "node:test";
import assert from "node:assert/strict";
import {
  EventEnvelopeCatalogValidator,
  EventEnvelopeValidationError,
} from "../../dist/core/index.js";

const ids={
  event:"11111111-1111-4111-8111-111111111111",
  tenant:"22222222-2222-4222-8222-222222222222",
  industry:"33333333-3333-4333-8333-333333333333",
  sourceIndustry:"44444444-4444-4444-8444-444444444444",
  targetIndustry:"55555555-5555-4555-8555-555555555555",
  actor:"66666666-6666-4666-8666-666666666666",
  correlation:"77777777-7777-4777-8777-777777777777",
};

const schema=Object.freeze({
  type:"object",
  required:Object.freeze(["subscriptionId"]),
  properties:Object.freeze({
    subscriptionId:Object.freeze({type:"string",format:"uuid"}),
  }),
});

function catalog(scopeClass="TENANT_CORE"){
  return Object.freeze({
    eventType:"subscription.transitioned",
    eventVersion:1,
    producerModule:"Commercial",
    scopeClass,
    sensitivityClass:"INTERNAL",
    payloadSchema:schema,
  });
}

function binding(scopeClass="TENANT_CORE"){
  if(scopeClass==="PLATFORM_GLOBAL"){
    return Object.freeze({
      eventId:ids.event,eventType:"subscription.transitioned",eventVersion:1,scopeClass,
    });
  }
  if(scopeClass==="TENANT_INDUSTRY"){
    return Object.freeze({
      eventId:ids.event,eventType:"subscription.transitioned",eventVersion:1,scopeClass,
      tenantId:ids.tenant,industryContextId:ids.industry,tenantResidencyRegion:"IN-CENTRAL",
    });
  }
  return Object.freeze({
    eventId:ids.event,eventType:"subscription.transitioned",eventVersion:1,scopeClass,
    tenantId:ids.tenant,tenantResidencyRegion:"IN-CENTRAL",
  });
}

function envelope(overrides={}){
  return {
    eventId:ids.event,
    eventType:"subscription.transitioned",
    eventVersion:1,
    scopeClass:"TENANT_CORE",
    tenantId:ids.tenant,
    actorPrincipalId:ids.actor,
    actorType:"SERVICE",
    sourceModule:"Commercial",
    sourceResourceType:"Subscription",
    sourceResourceId:"sub-1",
    aggregateVersion:5,
    correlationId:ids.correlation,
    occurredAt:"2026-09-21T15:00:00.000Z",
    dataSensitivity:"INTERNAL",
    residencyRegion:"IN-CENTRAL",
    payloadSchema:"subscription.transitioned.v1",
    payload:{subscriptionId:ids.tenant},
    ...overrides,
  };
}

function payloadValidator(trace,impl){
  return {
    validatePayload(input){
      trace.push(["payload",input.eventType,input.payloadSchemaId]);
      if(impl) return impl(input);
    },
  };
}

test("EVT-CAT-001 validates catalog-bound Tenant Core envelope before payload",async()=>{
  const trace=[];
  const validator=new EventEnvelopeCatalogValidator(payloadValidator(trace));
  const result=await validator.validate({
    envelope:envelope(),
    catalog:catalog(),
    binding:binding(),
  });

  assert.equal(Object.isFrozen(result),true);
  assert.equal(Object.isFrozen(result.payload),true);
  assert.deepEqual(trace,[["payload","subscription.transitioned","subscription.transitioned.v1"]]);
  assert.equal(result.tenantId,ids.tenant);
  assert.equal(result.industryContextId,undefined);
});

test("EVT-CAT-002 identity/catalog mismatch fails before payload interpretation",async()=>{
  const trace=[];
  const validator=new EventEnvelopeCatalogValidator(payloadValidator(trace));
  await assert.rejects(
    validator.validate({
      envelope:envelope({eventType:"entitlement.recompiled"}),
      catalog:catalog(),
      binding:binding(),
    }),
    error=>error instanceof EventEnvelopeValidationError,
  );
  assert.deepEqual(trace,[]);
});

test("EVT-CAT-003 Tenant Industry scope requires the exact Industry Context",async()=>{
  const trace=[];
  const validator=new EventEnvelopeCatalogValidator(payloadValidator(trace));
  await assert.rejects(
    validator.validate({
      envelope:envelope({
        scopeClass:"TENANT_INDUSTRY",
        industryContextId:undefined,
      }),
      catalog:catalog("TENANT_INDUSTRY"),
      binding:binding("TENANT_INDUSTRY"),
    }),
    error=>error instanceof EventEnvelopeValidationError,
  );
  assert.deepEqual(trace,[]);
});

test("EVT-CAT-004 Tenant residency mismatch fails before payload interpretation",async()=>{
  const trace=[];
  const validator=new EventEnvelopeCatalogValidator(payloadValidator(trace));
  await assert.rejects(
    validator.validate({
      envelope:envelope({residencyRegion:"US-EAST"}),
      catalog:catalog(),
      binding:binding(),
    }),
    error=>error instanceof EventEnvelopeValidationError,
  );
  assert.deepEqual(trace,[]);
});

test("EVT-CAT-005 explicit cross-context requires distinct same-Tenant endpoints",async()=>{
  const trace=[];
  const ownership=[];
  const validator=new EventEnvelopeCatalogValidator(
    payloadValidator(trace),
    {
      async verifySameTenantEndpoints(input){
        ownership.push(input);
        return input.tenantId===ids.tenant
          && input.sourceIndustryContextId===ids.sourceIndustry
          && input.targetIndustryContextId===ids.targetIndustry;
      },
    },
  );
  const crossBinding=Object.freeze({
    eventId:ids.event,eventType:"subscription.transitioned",eventVersion:1,
    scopeClass:"EXPLICIT_CROSS_CONTEXT",
    tenantId:ids.tenant,tenantResidencyRegion:"IN-CENTRAL",
  });
  const result=await validator.validate({
    envelope:envelope({
      scopeClass:"EXPLICIT_CROSS_CONTEXT",
      sourceIndustryContextId:ids.sourceIndustry,
      targetIndustryContextId:ids.targetIndustry,
    }),
    catalog:catalog("EXPLICIT_CROSS_CONTEXT"),
    binding:crossBinding,
  });
  assert.equal(result.sourceIndustryContextId,ids.sourceIndustry);
  assert.equal(ownership.length,1);
  assert.equal(trace.length,1);

  const deniedTrace=[];
  const denied=new EventEnvelopeCatalogValidator(
    payloadValidator(deniedTrace),
    {async verifySameTenantEndpoints(){return false;}},
  );
  await assert.rejects(
    denied.validate({
      envelope:envelope({
        scopeClass:"EXPLICIT_CROSS_CONTEXT",
        sourceIndustryContextId:ids.sourceIndustry,
        targetIndustryContextId:ids.targetIndustry,
      }),
      catalog:catalog("EXPLICIT_CROSS_CONTEXT"),
      binding:crossBinding,
    }),
    error=>error instanceof EventEnvelopeValidationError,
  );
  assert.deepEqual(deniedTrace,[]);
});

test("EVT-CAT-006 payload schema port runs last and failure is normalized",async()=>{
  const trace=[];
  const validator=new EventEnvelopeCatalogValidator(payloadValidator(trace,()=>{
    throw new Error("provider schema detail");
  }));
  await assert.rejects(
    validator.validate({
      envelope:envelope(),
      catalog:catalog(),
      binding:binding(),
    }),
    error=>error instanceof EventEnvelopeValidationError
      && error.message==="The event payload does not satisfy its catalog schema.",
  );
  assert.deepEqual(trace,[["payload","subscription.transitioned","subscription.transitioned.v1"]]);
});

test("platform-global event cannot carry Tenant or Industry ownership",async()=>{
  const trace=[];
  const validator=new EventEnvelopeCatalogValidator(payloadValidator(trace));
  await assert.rejects(
    validator.validate({
      envelope:envelope({
        scopeClass:"PLATFORM_GLOBAL",
        tenantId:ids.tenant,
        residencyRegion:undefined,
      }),
      catalog:catalog("PLATFORM_GLOBAL"),
      binding:binding("PLATFORM_GLOBAL"),
    }),
    error=>error instanceof EventEnvelopeValidationError,
  );
  assert.deepEqual(trace,[]);
});

test("non-JSON payload is rejected before the payload schema port",async()=>{
  const trace=[];
  const validator=new EventEnvelopeCatalogValidator(payloadValidator(trace));
  await assert.rejects(
    validator.validate({
      envelope:envelope({payload:{bad:undefined}}),
      catalog:catalog(),
      binding:binding(),
    }),
    error=>error instanceof EventEnvelopeValidationError,
  );
  assert.deepEqual(trace,[]);
});
