import { buildFilterWithAuthClickHouseProperties } from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface Property {
  property: string;
}

export async function getProperties(
  org_id: string
): Promise<Result<Property[], string>> {
  const builtFilter = await buildFilterWithAuthClickHouseProperties({
    org_id,
    argsAcc: [],
    filter: "all",
  });
  const query = `
  select distinct key as property
  from properties_v3
  where (
    ${builtFilter.filter}
  )
`;

  const { data, error } = await dbQueryClickhouse<Property>(
    query,
    builtFilter.argsAcc
  );
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
