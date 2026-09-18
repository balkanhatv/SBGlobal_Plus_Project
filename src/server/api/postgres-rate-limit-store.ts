import type {
  RateLimitStoreAcquireResult,
  RateLimitStorePort,
  RateLimitStoreRule,
} from "../../core/api/rate-limit.js";
import { RateLimitRuntimeError } from "../../core/api/rate-limit.js";
import type { SqlDatabase, SqlTransaction } from "../database/contracts.js";

interface BucketRow {
  readonly bucket_key_hash:string;
  readonly policy_version:number;
  readonly rate_class:RateLimitStoreRule["rateClass"];
  readonly dimension:RateLimitStoreRule["dimension"];
  readonly capacity:string|number;
  readonly refill_per_second:string|number;
  readonly tokens:string|number;
  readonly last_refill_at:Date|string;
}

function unavailable():never{
  throw new RateLimitRuntimeError({code:"DEPENDENCY_UNAVAILABLE",message:"Rate-limit persistence is unavailable."});
}

function numeric(value:string|number):number{
  const parsed=Number(value);
  if(!Number.isFinite(parsed) || parsed<0) unavailable();
  return parsed;
}

function refill(row:BucketRow,rule:RateLimitStoreRule,now:Date):number{
  const last=new Date(row.last_refill_at);
  if(Number.isNaN(last.getTime())) unavailable();
  const elapsed=Math.max(0,(now.getTime()-last.getTime())/1000);
  const oldTokens=numeric(row.tokens);
  const oldRate=numeric(row.refill_per_second);
  const oldCapacity=numeric(row.capacity);
  const replenished=Math.min(oldCapacity,oldTokens+(elapsed*oldRate));
  return Math.min(rule.capacity,replenished);
}

export class PostgresRateLimitStore implements RateLimitStorePort {
  constructor(private readonly database:SqlDatabase) {}

  async acquire(input:{
    readonly now:Date;
    readonly leaseExpiresAt:Date;
    readonly rules:readonly RateLimitStoreRule[];
  }):Promise<RateLimitStoreAcquireResult>{
    try{
      return await this.database.transaction(async(sql)=>{
        const rules=[...input.rules].sort((a,b)=>a.bucketKeyHash.localeCompare(b.bucketKeyHash));
        if(rules.length===0) unavailable();

        const hashes=rules.map(rule=>rule.bucketKeyHash);
        await sql.query(
          `DELETE FROM core_integration.rate_limit_concurrency_lease
            WHERE expires_at<=$1::timestamptz
              AND bucket_key_hash=ANY($2::text[])`,
          [input.now.toISOString(),hashes],
        );

        for(const rule of rules){
          await sql.query(
            `INSERT INTO core_integration.rate_limit_bucket(
               bucket_key_hash,policy_version,rate_class,dimension,capacity,
               refill_per_second,tokens,last_refill_at,created_at,updated_at
             ) VALUES ($1,$2,$3,$4,$5,$6,$5,$7::timestamptz,$7::timestamptz,$7::timestamptz)
             ON CONFLICT (bucket_key_hash) DO NOTHING`,
            [
              rule.bucketKeyHash,rule.policyVersion,rule.rateClass,rule.dimension,
              rule.capacity,rule.refillPerSecond,input.now.toISOString(),
            ],
          );
        }

        const locked=await sql.query<BucketRow>(
          `SELECT bucket_key_hash,policy_version,rate_class,dimension,capacity,
                  refill_per_second,tokens,last_refill_at
             FROM core_integration.rate_limit_bucket
            WHERE bucket_key_hash=ANY($1::text[])
            ORDER BY bucket_key_hash
            FOR UPDATE`,
          [hashes],
        );
        if(locked.rowCount!==rules.length) unavailable();
        const rows=new Map(locked.rows.map(row=>[row.bucket_key_hash,row] as const));

        let denied:{
          retryAfterSeconds:number;
          rateClass:RateLimitStoreRule["rateClass"];
          dimension:RateLimitStoreRule["dimension"];
        }|undefined;
        const availableTokens=new Map<string,number>();

        for(const rule of rules){
          const row=rows.get(rule.bucketKeyHash);
          if(!row) unavailable();
          const tokens=refill(row,rule,input.now);
          availableTokens.set(rule.bucketKeyHash,tokens);

          if(tokens<1){
            const retry=Math.max(1,Math.ceil((1-tokens)/rule.refillPerSecond));
            if(!denied || retry>denied.retryAfterSeconds){
              denied={retryAfterSeconds:retry,rateClass:rule.rateClass,dimension:rule.dimension};
            }
          }

          if(rule.concurrencyLimit!==undefined){
            const leases=await sql.query<{count:number;earliest:Date|string|null}>(
              `SELECT count(*)::int AS count,min(expires_at) AS earliest
                 FROM core_integration.rate_limit_concurrency_lease
                WHERE bucket_key_hash=$1 AND expires_at>$2::timestamptz`,
              [rule.bucketKeyHash,input.now.toISOString()],
            );
            const count=Number(leases.rows[0]?.count??0);
            if(count>=rule.concurrencyLimit){
              const earliest=leases.rows[0]?.earliest ? new Date(leases.rows[0].earliest) : undefined;
              const retry=earliest && !Number.isNaN(earliest.getTime())
                ? Math.max(1,Math.ceil((earliest.getTime()-input.now.getTime())/1000))
                : 1;
              if(!denied || retry>denied.retryAfterSeconds){
                denied={retryAfterSeconds:retry,rateClass:rule.rateClass,dimension:rule.dimension};
              }
            }
          }
        }

        if(denied) return Object.freeze({allowed:false as const,...denied});

        const leases:Array<{leaseId:string;bucketKeyHash:string}>=[];
        for(const rule of rules){
          const tokens=availableTokens.get(rule.bucketKeyHash);
          if(tokens===undefined) unavailable();
          const updated=await sql.query(
            `UPDATE core_integration.rate_limit_bucket
                SET policy_version=$2,rate_class=$3,dimension=$4,capacity=$5,
                    refill_per_second=$6,tokens=$7,last_refill_at=$8::timestamptz,
                    updated_at=$8::timestamptz
              WHERE bucket_key_hash=$1`,
            [
              rule.bucketKeyHash,rule.policyVersion,rule.rateClass,rule.dimension,
              rule.capacity,rule.refillPerSecond,Math.max(0,tokens-1),input.now.toISOString(),
            ],
          );
          if(updated.rowCount!==1) unavailable();

          if(rule.concurrencyLimit!==undefined){
            if(!rule.leaseId) unavailable();
            const inserted=await sql.query(
              `INSERT INTO core_integration.rate_limit_concurrency_lease(
                 lease_id,bucket_key_hash,expires_at,created_at
               ) VALUES ($1::uuid,$2,$3::timestamptz,$4::timestamptz)`,
              [rule.leaseId,rule.bucketKeyHash,input.leaseExpiresAt.toISOString(),input.now.toISOString()],
            );
            if(inserted.rowCount!==1) unavailable();
            leases.push(Object.freeze({leaseId:rule.leaseId,bucketKeyHash:rule.bucketKeyHash}));
          }
        }

        return Object.freeze({allowed:true as const,leases:Object.freeze(leases)});
      });
    }catch(error){
      if(error instanceof RateLimitRuntimeError) throw error;
      unavailable();
    }
  }

  async release(input:{readonly leaseIds:readonly string[]}):Promise<void>{
    if(input.leaseIds.length===0) return;
    try{
      await this.database.transaction(async(sql)=>{
        await sql.query(
          `DELETE FROM core_integration.rate_limit_concurrency_lease
            WHERE lease_id=ANY($1::uuid[])`,
          [[...new Set(input.leaseIds)]],
        );
      });
    }catch(error){
      if(error instanceof RateLimitRuntimeError) throw error;
      unavailable();
    }
  }
}
