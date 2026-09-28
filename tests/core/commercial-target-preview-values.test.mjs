import test from "node:test";
import assert from "node:assert/strict";
import {
  CommercialTargetPreviewError,
  materializeCommercialFinalTargetPreviewV1,
} from "../../dist/core/commercial/target-preview.js";
import { applyCommercialLifecycleOverlayV1 } from "../../dist/core/commercial/lifecycle-overlay.js";

const target="00000000-0000-4000-8000-000000000001";
function preview(valueType,value){
  return materializeCommercialFinalTargetPreviewV1({
    targetPlanVersionId:target,
    precedence:{
      entitlements:[{code:"capability",valueType,state:"VALUE",value}],
      limits:[],tenantDenySet:[],
    },
    restrictions:{targetPlanVersionId:target,policyVersion:"v1",evidenceReference:"security:1",restrictions:[]},
    usageImpact:{targetPlanVersionId:target,selectionPolicyVersion:"v1",evidenceReference:"usage:1",impacts:[],hasBlockingUsage:false},
    lifecycle:applyCommercialLifecycleOverlayV1("ACTIVE"),
  });
}

test("final preview rejects values inconsistent with every declared entitlement type",()=>{
  const invalid=[
    ["BOOLEAN","enabled"],["BOOLEAN",1],["BOOLEAN",null],
    ["INTEGER",-1],["INTEGER",1.5],["INTEGER",Number.MAX_SAFE_INTEGER+1],["INTEGER","2"],
    ["DECIMAL",NaN],["DECIMAL",Infinity],["DECIMAL",-0.1],["DECIMAL","2.5"],
    ["TEXT",{allowed:true}],["TEXT",["text"]],
    ["SET",[true]],["SET",["valid",{}]],["SET","one"],["SET",new Array(1)],
  ];
  for(const [type,value] of invalid){
    assert.throws(()=>preview(type,value),error=>
      error instanceof CommercialTargetPreviewError
      && error.code==="COMMERCIAL_TARGET_PREVIEW_INPUT_INVALID",type);
  }
});

test("final preview preserves all existing valid typed values including disabled values",()=>{
  for(const [type,value] of [
    ["BOOLEAN",false],["BOOLEAN",true],
    ["INTEGER",0],["INTEGER",Number.MAX_SAFE_INTEGER],
    ["DECIMAL",0],["DECIMAL",1.25],
    ["TEXT",""],["TEXT","configured"],["SET",[]],["SET",["b","a"]],
  ]){
    assert.deepEqual(preview(type,value).entitlements[0].value,value,type);
  }
});

test("final preview copies and freezes SET values without changing configured order",()=>{
  const values=["b","a"];
  const output=preview("SET",values).entitlements[0].value;
  values[0]="changed";
  assert.deepEqual(output,["b","a"]);
  assert.ok(Object.isFrozen(output));
});
