import type { CurrentIndustryPresentationRecord } from "../../core/context/contracts.js";
import type { IndustryPresentationCatalogPort } from "../../core/context/ports.js";
import type { SqlDatabase } from "../database/contracts.js";

interface IndustryPresentationRow {
  readonly industry_code: string;
  readonly display_key: string;
  readonly display_name: string;
  readonly route_slug: string;
  readonly sort_order: number;
  readonly icon_key: string;
  readonly experience_package_key: string;
  readonly version: string | number;
}

export class PostgresIndustryPresentationCatalogAdapter
implements IndustryPresentationCatalogPort {
  constructor(private readonly database: SqlDatabase) {}

  async getCurrentByCode(industryCode: string): Promise<CurrentIndustryPresentationRecord | null> {
    if (!/^[A-Z]{3}$/.test(industryCode)) return null;

    return this.database.transaction(async (transaction) => {
      const result = await transaction.query<IndustryPresentationRow>(
        `SELECT industry_code,display_key,display_name,route_slug,sort_order,
                icon_key,experience_package_key,version
           FROM core_master.current_supported_industry
          WHERE industry_code=$1 AND status='ACTIVE'`,
        [industryCode],
      );
      if (result.rowCount !== 1) return null;
      const row = result.rows[0];
      if (!row) return null;
      const version = Number(row.version);
      if (!Number.isSafeInteger(version) || version <= 0) return null;
      return Object.freeze({
        industryCode: row.industry_code,
        displayKey: row.display_key,
        displayName: row.display_name,
        routeSlug: row.route_slug,
        sortOrder: row.sort_order,
        iconKey: row.icon_key,
        experiencePackageKey: row.experience_package_key,
        version,
      });
    });
  }
}
