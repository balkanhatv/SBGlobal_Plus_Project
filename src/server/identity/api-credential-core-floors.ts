import type {
  ApiCredentialVerificationMaterial,
} from "./api-credential-verification-material.js";
import type {
  MachinePrincipalMetadata,
} from "./machine-principal-metadata.js";
import {
  matchesApiCredentialCurrentLifecycleFloor,
} from "./api-credential-current-lifecycle.js";
import {
  matchesCurrentMachinePrincipalFloor,
} from "./machine-principal-currentness.js";
import {
  matchesApiCredentialRequestedScopeFloor,
  type ApiCredentialRequestedScopeTarget,
} from "./api-credential-requested-scope.js";

export interface ApiCredentialCoreNecessaryFloorsInput {
  readonly target: ApiCredentialRequestedScopeTarget;
  readonly evaluatedAt: string;
}

/**
 * Composes the DD-158, DD-160 and DD-161 necessary machine-credential floors.
 *
 * True is not machine authentication. Presented-token parsing, verifier/hash
 * comparison, CIDR/profile policy, usage mutation/audit and final
 * VerifiedMachineEvidence remain separately governed.
 */
export function matchesApiCredentialCoreNecessaryFloors(
  material: ApiCredentialVerificationMaterial,
  principal: MachinePrincipalMetadata,
  input: ApiCredentialCoreNecessaryFloorsInput,
): boolean {
  return matchesApiCredentialCurrentLifecycleFloor(
    material,
    input.evaluatedAt,
  )
    && matchesCurrentMachinePrincipalFloor(principal)
    && matchesApiCredentialRequestedScopeFloor(
      material,
      principal,
      input.target,
    );
}
