import type { CommercialSubscriptionState } from "./current-state.js";

export type CommercialLifecyclePostureV1 =
  | "ACTIVATION_PENDING"
  | "FULL_ACCESS"
  | "RESTRICTED"
  | "PRESERVATION_ONLY";

export interface CommercialLifecycleOverlayV1 {
  readonly subscriptionState:CommercialSubscriptionState;
  readonly posture:CommercialLifecyclePostureV1;
  readonly genericProtectedOperationsAllowed:boolean;
  readonly ordinaryBusinessWritesAllowed:boolean;
  readonly requiresDedicatedNonGenericPath:boolean;
  readonly dataPreservationRequired:true;
}

export type CommercialLifecycleOverlayErrorCode =
  | "COMMERCIAL_LIFECYCLE_OVERLAY_STATE_INVALID";

export class CommercialLifecycleOverlayError extends Error {
  constructor(
    readonly code:CommercialLifecycleOverlayErrorCode,
    message:string,
  ){
    super(message);
    this.name="CommercialLifecycleOverlayError";
  }
}

function invalid(message:string):never{
  throw new CommercialLifecycleOverlayError(
    "COMMERCIAL_LIFECYCLE_OVERLAY_STATE_INVALID",
    message,
  );
}

function state(value:unknown):CommercialSubscriptionState{
  if(value!=="PENDING" && value!=="TRIAL" && value!=="ACTIVE"
    && value!=="GRACE" && value!=="SUSPENDED"
    && value!=="EXPIRED" && value!=="CANCELLED"){
    invalid("Unknown Commercial subscription lifecycle state.");
  }
  return value;
}

export function applyCommercialLifecycleOverlayV1(
  subscriptionState:unknown,
):CommercialLifecycleOverlayV1{
  const current=state(subscriptionState);

  if(current==="TRIAL" || current==="ACTIVE" || current==="GRACE"){
    return Object.freeze({
      subscriptionState:current,
      posture:"FULL_ACCESS",
      genericProtectedOperationsAllowed:true,
      ordinaryBusinessWritesAllowed:true,
      requiresDedicatedNonGenericPath:false,
      dataPreservationRequired:true,
    });
  }

  if(current==="SUSPENDED"){
    return Object.freeze({
      subscriptionState:current,
      posture:"RESTRICTED",
      genericProtectedOperationsAllowed:false,
      ordinaryBusinessWritesAllowed:false,
      requiresDedicatedNonGenericPath:true,
      dataPreservationRequired:true,
    });
  }

  if(current==="EXPIRED" || current==="CANCELLED"){
    return Object.freeze({
      subscriptionState:current,
      posture:"PRESERVATION_ONLY",
      genericProtectedOperationsAllowed:false,
      ordinaryBusinessWritesAllowed:false,
      requiresDedicatedNonGenericPath:true,
      dataPreservationRequired:true,
    });
  }

  return Object.freeze({
    subscriptionState:current,
    posture:"ACTIVATION_PENDING",
    genericProtectedOperationsAllowed:false,
    ordinaryBusinessWritesAllowed:false,
    requiresDedicatedNonGenericPath:true,
    dataPreservationRequired:true,
  });
}
