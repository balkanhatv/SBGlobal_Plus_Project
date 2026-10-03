import { parseStrictInstant } from "../../core/time/strict-instant.js";
import type {
  ApiCredentialVerificationMaterial,
} from "./api-credential-verification-material.js";

/**
 * Mirrors only the persisted API Credential current lifecycle prerequisite:
 * ACTIVE and either no expiry or expiry strictly after the supplied instant.
 *
 * This is not secret verification, CIDR enforcement, scope authorization,
 * permission-profile evaluation, usage mutation, audit, or authentication.
 */
export function matchesApiCredentialCurrentLifecycleFloor(
  material: ApiCredentialVerificationMaterial,
  evaluatedAt: string,
): boolean {
  const evaluatedAtMs = parseStrictInstant(evaluatedAt);
  if (evaluatedAtMs === null) return false;
  if (material.status !== "ACTIVE") return false;
  if (material.expiresAt === undefined) return true;

  const expiresAtMs = parseStrictInstant(material.expiresAt);
  if (expiresAtMs === null) return false;
  return expiresAtMs > evaluatedAtMs;
}
