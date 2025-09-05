import { buildFilterWithAuthClickHouseProperties } from "@helicone-package/filters/filters";
import { Result } from "@/packages/common/result";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface Property {
  property: string;
}

export async function getProperties(
  org_id: string,
): Promise<Result<Property[], string>> {
  const builtFilter = await buildFilterWithAuthClickHouseProperties({
    org_id,
    argsAcc: [],
    filter: {},
  });
  const query = `
  select distinct key as property
  from properties_v3
  where (
    ${builtFilter.filter}
  )
`;

  return await dbQueryClickhouse<Property>(query, builtFilter.argsAcc);
}
