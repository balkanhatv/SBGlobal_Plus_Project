import { createHash } from "node:crypto";
import type { RateLimitDigestPort } from "../../core/api/rate-limit.js";

export class Sha256RateLimitDigest implements RateLimitDigestPort {
  sha256(value:string):string{
    return createHash("sha256").update(value,"utf8").digest("hex");
  }
}
