import test from "node:test";
import assert from "node:assert/strict";

import {
  CommercialLifecycleOverlayError,
  applyCommercialLifecycleOverlayV1,
} from "../../dist/core/index.js";

test("TRIAL and ACTIVE remain full-access lifecycle postures",()=>{
  for(const state of ["TRIAL","ACTIVE"]){
    assert.deepEqual(applyCommercialLifecycleOverlayV1(state),{
      subscriptionState:state,
      posture:"FULL_ACCESS",
      genericProtectedOperationsAllowed:true,
      ordinaryBusinessWritesAllowed:true,
      requiresDedicatedNonGenericPath:false,
      dataPreservationRequired:true,
    });
  }
});

test("GRACE explicitly retains full access and ordinary writes",()=>{
  const overlay=applyCommercialLifecycleOverlayV1("GRACE");
  assert.equal(overlay.posture,"FULL_ACCESS");
  assert.equal(overlay.genericProtectedOperationsAllowed,true);
  assert.equal(overlay.ordinaryBusinessWritesAllowed,true);
});

test("SUSPENDED is restricted and cannot widen generic protected operations",()=>{
  assert.deepEqual(applyCommercialLifecycleOverlayV1("SUSPENDED"),{
    subscriptionState:"SUSPENDED",
    posture:"RESTRICTED",
    genericProtectedOperationsAllowed:false,
    ordinaryBusinessWritesAllowed:false,
    requiresDedicatedNonGenericPath:true,
    dataPreservationRequired:true,
  });
});

test("EXPIRED and CANCELLED preserve data but require dedicated non-generic paths",()=>{
  for(const state of ["EXPIRED","CANCELLED"]){
    const overlay=applyCommercialLifecycleOverlayV1(state);
    assert.equal(overlay.posture,"PRESERVATION_ONLY");
    assert.equal(overlay.genericProtectedOperationsAllowed,false);
    assert.equal(overlay.ordinaryBusinessWritesAllowed,false);
    assert.equal(overlay.requiresDedicatedNonGenericPath,true);
    assert.equal(overlay.dataPreservationRequired,true);
  }
});

test("PENDING does not activate generic application access",()=>{
  assert.deepEqual(applyCommercialLifecycleOverlayV1("PENDING"),{
    subscriptionState:"PENDING",
    posture:"ACTIVATION_PENDING",
    genericProtectedOperationsAllowed:false,
    ordinaryBusinessWritesAllowed:false,
    requiresDedicatedNonGenericPath:true,
    dataPreservationRequired:true,
  });
});

test("PAST_DUE and Renewed are not accepted as resting subscription states",()=>{
  for(const state of ["PAST_DUE","RENEWED","Renewed"]){
    assert.throws(
      ()=>applyCommercialLifecycleOverlayV1(state),
      error=>error instanceof CommercialLifecycleOverlayError
        && error.code==="COMMERCIAL_LIFECYCLE_OVERLAY_STATE_INVALID",
    );
  }
});

test("unknown, missing and malformed lifecycle states fail closed",()=>{
  for(const state of [undefined,null,"",0,{},[],"ACTIVE "]){
    assert.throws(
      ()=>applyCommercialLifecycleOverlayV1(state),
      error=>error instanceof CommercialLifecycleOverlayError
        && error.code==="COMMERCIAL_LIFECYCLE_OVERLAY_STATE_INVALID",
    );
  }
});

test("lifecycle overlay is deterministic and immutable",()=>{
  const a=applyCommercialLifecycleOverlayV1("SUSPENDED");
  const b=applyCommercialLifecycleOverlayV1("SUSPENDED");
  assert.deepEqual(a,b);
  assert.ok(Object.isFrozen(a));
  assert.throws(()=>{ a.posture="FULL_ACCESS"; },TypeError);
});
