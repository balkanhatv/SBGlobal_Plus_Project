import type {
  DataHomeRecord,
  IndustryContextRecord,
  MembershipRecord,
  OrgUnitRecord,
  TenantRecord,
} from "../../core/context/contracts.js";
import { ContextResolutionError } from "../../core/context/errors.js";
import type { TenantContextPort } from "../../core/context/ports.js";
import type { SqlDatabase,SqlTransaction } from "../database/contracts.js";

interface TenantRow {
  readonly id:string;
  readonly tenant_code:string;
  readonly display_name:string;
  readonly status:TenantRecord["status"];
}

interface MembershipRow {
  readonly id:string;
  readonly tenant_id:string;
  readonly principal_id:string;
  readonly status:MembershipRecord["status"];
  readonly default_org_unit_id:string|null;
  readonly membership_version:string|number;
}

interface IndustryRow {
  readonly id:string;
  readonly tenant_id:string;
  readonly industry_code:string;
  readonly status:IndustryContextRecord["status"];
  readonly display_key:string;
  readonly display_name:string;
}

interface OrgRow {
  readonly id:string;
  readonly tenant_id:string;
  readonly status:OrgUnitRecord["status"];
  readonly path:string[];
}

interface DataHomeRow {
  readonly id:string;
  readonly region_code:string;
  readonly routing_version:string|number;
}

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function bounded(value:string|undefined,label:string):string|undefined{
  if(value===undefined) return undefined;
  const normalized=value.trim();
  if(normalized.length===0 || normalized.length>128){
    throw new ContextResolutionError("TENANT_INVALID",`${label} selector is invalid.`);
  }
  return normalized;
}

function tenant(row:TenantRow):TenantRecord{
  return Object.freeze({
    id:row.id,
    displayKey:row.tenant_code,
    displayName:row.display_name,
    status:row.status,
  });
}

function membership(row:MembershipRow):MembershipRecord{
  const version=Number(row.membership_version);
  if(!Number.isSafeInteger(version) || version<=0){
    throw new ContextResolutionError("DEPENDENCY_UNAVAILABLE","Membership state is unavailable.");
  }
  return Object.freeze({
    id:row.id,
    tenantId:row.tenant_id,
    principalId:row.principal_id,
    status:row.status,
    ...(row.default_org_unit_id?{defaultOrgUnitId:row.default_org_unit_id}:{}),
    membershipVersion:version,
  });
}

function industry(row:IndustryRow):IndustryContextRecord{
  return Object.freeze({
    id:row.id,
    tenantId:row.tenant_id,
    industryCode:row.industry_code,
    displayKey:row.display_key,
    displayName:row.display_name,
    status:row.status,
  });
}

function org(row:OrgRow):OrgUnitRecord{
  return Object.freeze({
    id:row.id,
    tenantId:row.tenant_id,
    path:Object.freeze([...row.path]),
    status:row.status,
  });
}

export class PostgresTenantContextAdapter implements TenantContextPort {
  constructor(private readonly database:SqlDatabase){}

  async getTenantById(tenantId:string):Promise<TenantRecord|null>{
    if(!UUID.test(tenantId)) return null;
    return this.read(async sql=>{
      const result=await sql.query<TenantRow>(
        `SELECT id::text,tenant_code,display_name,status::text
           FROM core_tenancy.tenant
          WHERE id=$1::uuid`,
        [tenantId],
      );
      return result.rowCount===1 && result.rows[0] ? tenant(result.rows[0]) : null;
    });
  }

  async resolveTenant(input:{
    readonly selector?:string;
    readonly principalId:string;
    readonly machineBoundTenantId?:string;
  }):Promise<TenantRecord|null>{
    if(!UUID.test(input.principalId)) return null;
    const selector=bounded(input.selector,"Tenant");

    if(input.machineBoundTenantId){
      if(!UUID.test(input.machineBoundTenantId)) return null;
      return this.read(async sql=>{
        const result=await sql.query<TenantRow>(
          `SELECT id::text,tenant_code,display_name,status::text
             FROM core_tenancy.tenant
            WHERE id=$1::uuid
              AND ($2::text IS NULL OR tenant_code=$2 OR id::text=$2)`,
          [input.machineBoundTenantId,selector??null],
        );
        return result.rowCount===1 && result.rows[0] ? tenant(result.rows[0]) : null;
      });
    }

    return this.read(async sql=>{
      const result=await sql.query<TenantRow>(
        `SELECT tenant.id::text,tenant.tenant_code,tenant.display_name,tenant.status::text
           FROM core_identity.tenant_membership membership
           JOIN core_tenancy.tenant tenant ON tenant.id=membership.tenant_id
          WHERE membership.principal_id=$1::uuid
            AND membership.status='ACTIVE'
            AND (membership.valid_from IS NULL OR membership.valid_from<=now())
            AND (membership.valid_until IS NULL OR membership.valid_until>now())
            AND ($2::text IS NULL OR tenant.tenant_code=$2 OR tenant.id::text=$2)
          ORDER BY tenant.id
          LIMIT 2`,
        [input.principalId,selector??null],
      );
      if(result.rowCount!==1 || !result.rows[0]) return null;
      return tenant(result.rows[0]);
    });
  }

  async findMembership(input:{
    readonly tenantId:string;
    readonly principalId:string;
  }):Promise<MembershipRecord|null>{
    if(!UUID.test(input.tenantId) || !UUID.test(input.principalId)) return null;
    return this.read(async sql=>{
      const result=await sql.query<MembershipRow>(
        `SELECT id::text,tenant_id::text,principal_id::text,status::text,
                default_org_unit_id::text,membership_version
           FROM core_identity.tenant_membership
          WHERE tenant_id=$1::uuid
            AND principal_id=$2::uuid
            AND status='ACTIVE'
            AND (valid_from IS NULL OR valid_from<=now())
            AND (valid_until IS NULL OR valid_until>now())
          ORDER BY membership_version DESC
          LIMIT 2`,
        [input.tenantId,input.principalId],
      );
      if(result.rowCount!==1 || !result.rows[0]) return null;
      return membership(result.rows[0]);
    });
  }

  async resolveIndustryContext(input:{
    readonly tenantId:string;
    readonly selector:string;
  }):Promise<IndustryContextRecord|null>{
    if(!UUID.test(input.tenantId)) return null;
    const selector=bounded(input.selector,"Industry");
    if(!selector) return null;
    return this.read(async sql=>{
      const result=await sql.query<IndustryRow>(
        `SELECT context.id::text,context.tenant_id::text,context.industry_code,
                context.status::text,presentation.display_key,presentation.display_name
           FROM core_tenancy.industry_context context
           JOIN core_master.current_supported_industry presentation
             ON presentation.industry_code=context.industry_code
            AND presentation.status='ACTIVE'
          WHERE context.tenant_id=$1::uuid
            AND (
              context.id::text=$2
              OR context.industry_code=$2
              OR presentation.display_key=$2
              OR presentation.route_slug=$2
            )
          ORDER BY context.id
          LIMIT 2`,
        [input.tenantId,selector],
      );
      if(result.rowCount!==1 || !result.rows[0]) return null;
      return industry(result.rows[0]);
    });
  }

  async resolveOrgUnit(input:{
    readonly tenantId:string;
    readonly selector?:string;
    readonly membership?:MembershipRecord;
  }):Promise<OrgUnitRecord|null>{
    if(!UUID.test(input.tenantId)) return null;
    const selector=bounded(input.selector,"Organization unit");
    const defaultId=!selector ? input.membership?.defaultOrgUnitId : undefined;
    if(!selector && !defaultId) return null;
    if(defaultId && !UUID.test(defaultId)) return null;

    return this.read(async sql=>{
      const result=await sql.query<OrgRow>(
        `WITH RECURSIVE target AS (
           SELECT id,tenant_id,parent_id,status
             FROM core_tenancy.org_unit
            WHERE tenant_id=$1::uuid
              AND (
                ($2::text IS NOT NULL AND (id::text=$2 OR code=$2))
                OR ($2::text IS NULL AND id=$3::uuid)
              )
            ORDER BY id
            LIMIT 2
         ), chain AS (
           SELECT id,tenant_id,parent_id,1 AS depth,
                  ARRAY[id] AS visited,false AS cycle
             FROM target
           UNION ALL
           SELECT parent.id,parent.tenant_id,parent.parent_id,chain.depth+1,
                  chain.visited || parent.id,parent.id=ANY(chain.visited)
             FROM core_tenancy.org_unit parent
             JOIN chain ON parent.id=chain.parent_id
                       AND parent.tenant_id=chain.tenant_id
            WHERE NOT chain.cycle
         )
         SELECT target.id::text,target.tenant_id::text,target.status::text,
                array_agg(chain.id::text ORDER BY chain.depth DESC)::text[] AS path
           FROM target
           JOIN chain ON true
          WHERE NOT EXISTS (SELECT 1 FROM chain WHERE cycle)
          GROUP BY target.id,target.tenant_id,target.status`,
        [input.tenantId,selector??null,defaultId??null],
      );
      if(result.rowCount!==1 || !result.rows[0]) return null;
      return org(result.rows[0]);
    });
  }

  async resolveDataHome(tenantId:string):Promise<DataHomeRecord>{
    if(!UUID.test(tenantId)){
      throw new ContextResolutionError("TENANT_INVALID","The tenant route is invalid.");
    }
    return this.read(async sql=>{
      const result=await sql.query<DataHomeRow>(
        `SELECT home.id::text,home.region_code,home.routing_version
           FROM core_tenancy.tenant tenant
           JOIN platform_directory.data_home home ON home.id=tenant.data_home_id
          WHERE tenant.id=$1::uuid
            AND home.status='ACTIVE'`,
        [tenantId],
      );
      const row=result.rowCount===1 ? result.rows[0] : undefined;
      if(!row){
        throw new ContextResolutionError(
          "DEPENDENCY_UNAVAILABLE",
          "The tenant data route is unavailable.",
        );
      }
      const version=Number(row.routing_version);
      if(!Number.isSafeInteger(version) || version<=0){
        throw new ContextResolutionError(
          "DEPENDENCY_UNAVAILABLE",
          "The tenant data route is unavailable.",
        );
      }
      return Object.freeze({
        id:row.id,
        regionCode:row.region_code,
        routingVersion:version,
      });
    });
  }

  private async read<T>(work:(sql:SqlTransaction)=>Promise<T>):Promise<T>{
    try{
      return await this.database.transaction(work);
    }catch(error){
      if(error instanceof ContextResolutionError) throw error;
      throw new ContextResolutionError(
        "DEPENDENCY_UNAVAILABLE",
        "The Tenant directory is temporarily unavailable.",
      );
    }
  }
}
