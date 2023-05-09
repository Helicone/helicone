import { buildFilterWithAuth } from "../../../services/lib/filters/filters";
import { Result } from "../../result";
import { dbExecute } from "../db/dbExecute";

export interface Property {
  property: string;
}

export async function getProperties(
  org_id: string
): Promise<Result<Property[], string>> {
  const builtFilter = await buildFilterWithAuth({
    org_id,
    argsAcc: [],
    filter: "all",
  });
  const query = `
  SELECT distinct key as property
  from properties
  left join request on request.id = properties.request_id
  where (
    ${builtFilter.filter}
  )
`;
  console.log(query);

  const { data, error } = await dbExecute<Property>(query, builtFilter.argsAcc);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}
