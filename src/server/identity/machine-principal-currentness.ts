import type {
  MachinePrincipalMetadata,
} from "./machine-principal-metadata.js";

function nonEmpty(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Determines only whether raw DD-159 principal metadata is currently admissible
 * as a machine-evidence principal type.
 *
 * This is not requested-scope authorization, credential lifecycle composition,
 * verifier execution, CIDR/profile evaluation, audit, or authentication.
 */
export function matchesCurrentMachinePrincipalFloor(
  metadata: MachinePrincipalMetadata,
): boolean {
  if (metadata.status !== "ACTIVE") return false;

  if (metadata.principalType === "API_CLIENT") {
    return true;
  }

  if (metadata.principalType === "SERVICE") {
    return nonEmpty(metadata.serviceCode) && nonEmpty(metadata.owningModule);
  }

  return false;
}
