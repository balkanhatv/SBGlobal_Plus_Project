import { createHash } from "node:crypto";
import type { AuthorizationCompilerFingerprintPort } from "../../core/authorization/source-compiler.js";

export class Sha256AuthorizationCompilerFingerprint implements AuthorizationCompilerFingerprintPort {
  sha256(canonicalSource: string): string {
    return createHash("sha256").update(canonicalSource,"utf8").digest("hex");
  }
}
