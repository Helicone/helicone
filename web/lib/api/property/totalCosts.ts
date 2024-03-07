import { clickhousePriceCalc } from "../../../packages/cost";
import {
  FilterNode,
  filterListToTree,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import { buildFilterWithAuthClickHousePropResponse } from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { dbQueryClickhouse } from "../db/dbExecute";
import { convertTextOperators } from "../graphql/query/helper";
import { PropertyFilter } from "../graphql/schema/types/graphql";

export interface TotalCost {
  cost: number;
  count?: number;
}

function toSQLArray(
  arr: string[],
  argsAcc: any[]
): {
  sql: string;
  argsAcc: any[];
} {
  arr = arr.sort();
  const args = [];
  for (let i = 0; i < arr.length; i++) {
    args.push(`{val_${argsAcc.length} : String}`);
    argsAcc.push(arr[i]);
  }

  return {
    sql: `[${args.join(", ")}]`,
    argsAcc,
  };
}

export async function getTotalCostProperties(
  properties: PropertyFilter[],
  org_id: string
): Promise<
  Result<
    {
      cost: number;
      count?: number;
    },
    string
  >
> {
  // Validation to ensure all properties have 'equals' defined
  if (properties.some((p) => p.value.equals === undefined)) {
    return {
      data: null,
      error:
        "Invalid filter, only support equals for multiple properties cost fetching",
    };
  }

  // Constructing the filter array
  const filter: FilterNode[] = properties.map((p) => ({
    left: {
      property_with_response_v1: {
        property_key: {
          equals: p.name,
        },
      },
    },
    right: {
      property_with_response_v1: {
        property_value: convertTextOperators(p.value),
      },
    },
    operator: "and",
  }));

  const { filter: filterString, argsAcc: filterArgs } =
    await buildFilterWithAuthClickHousePropResponse({
      org_id,
      filter: filterListToTree(filter, "or"),
      argsAcc: [],
    });

  // Aggregating the arguments for the query
  // ...

  // Aggregating the arguments for the query
  const argsAcc = [org_id]; // Start with org_id

  properties.forEach((p) => {
    argsAcc.push(p.name, p.value.equals as string); // Append property key and value
  });

  const propertyFilterConditions = properties
    .map(
      (_, index) =>
        `(property_with_response_v1.property_key = {val_${
          index * 2 + 1
        } : String} and property_with_response_v1.property_value = {val_${
          index * 2 + 2
        } : String})`
    )
    .join(" or ");

  const groupArrayKeyConditions = properties
    .map(
      (_, index) => `{val_${index * 2 + properties.length * 2 - 1} : String}`
    )
    .join(", ");
  const groupArrayValueConditions = properties
    .map((_, index) => `{val_${index * 2 + properties.length * 2} : String}`)
    .join(", ");

  const query = `
    SELECT 
    ${clickhousePriceCalc("property_with_response_x")} as cost,
    count(*) as count
     FROM (
      SELECT response_id,
        first_value(prompt_tokens) as prompt_tokens,
        first_value(completion_tokens) as completion_tokens,
        first_value(model) as model,
        arraySort(groupArray(30)(property_key)),
        arraySort(groupArray(30)(property_value)),
       FROM property_with_response_v1
          WHERE (
            ((property_with_response_v1.organization_id = {val_0 : String}) and (${filterString}) and (${propertyFilterConditions}))
          )
          group by response_id
          HAVING (
              arraySort(groupArray(${
                properties.length
              })(property_key)) = [${groupArrayKeyConditions}]
              and arraySort(groupArray(${
                properties.length
              })(property_value)) = [${groupArrayValueConditions}]
          )
          ORDER BY response_id
      ) as property_with_response_x
  `;

  const res = await dbQueryClickhouse<TotalCost>(
    query,
    argsAcc.concat(filterArgs)
  );

  return resultMap(res, (d) => ({
    cost: d[0].cost,
    count: d[0].count,
  }));
}

export async function getTotalCostRaw(
  filter: FilterNode,
  org_id: string
): Promise<Result<number, string>> {
  const { filter: filterString, argsAcc } =
    await buildFilterWithAuthClickHousePropResponse({
      org_id,
      filter: filter,
      argsAcc: [],
    });
  const query = `
  WITH total_cost AS (
    SELECT ${clickhousePriceCalc("property_with_response_v1")} as cost
    FROM property_with_response_v1
    WHERE (
      (${filterString})
    )
  )
  SELECT coalesce(sum(cost), 0) as cost
  FROM total_cost
`;

  const res = await dbQueryClickhouse<TotalCost>(query, argsAcc);

  return resultMap(res, (d) => d[0].cost);
}

export async function getTotalCost(
  filter: FilterNode,
  timeFilter: {
    start: Date;
    end: Date;
  },
  org_id: string
): Promise<Result<number, string>> {
  return getTotalCostRaw(
    {
      left: timeFilterToFilterNode(timeFilter, "property_with_response_v1"),
      right: filter,
      operator: "and",
    },
    org_id
  );
}
