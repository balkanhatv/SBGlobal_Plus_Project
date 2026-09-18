import { createHash } from "node:crypto";
import type { IdempotencyDigestPort } from "../../core/api/idempotency.js";

export class Sha256IdempotencyDigest implements IdempotencyDigestPort {
  sha256(value: string): string {
    return createHash("sha256").update(value,"utf8").digest("hex");
  }
}
