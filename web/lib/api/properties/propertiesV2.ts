import { buildFilterWithAuthClickHousePropertiesV2 } from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

export interface Property {
  property: string;
}

export async function getPropertiesV2(
  org_id: string
): Promise<Result<Property[], string>> {
  const builtFilter = await buildFilterWithAuthClickHousePropertiesV2({
    org_id,
    argsAcc: [],
    filter: "all",
  });
  const query = `
  SELECT DISTINCT arrayJoin(mapKeys(properties)) AS property
  FROM request_response_versioned
  WHERE (
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
