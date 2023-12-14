import { buildFilterWithAuthClickHouseProperties } from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";

/**
 * Represents a property.
 */
export interface Property {
  property: string;
}

/**
 * Retrieves properties based on the provided organization ID.
 * @param org_id The organization ID.
 * @returns A promise that resolves to a Result object containing an array of Property objects on success, or an error message on failure.
 */
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
  from properties_copy_v2
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
