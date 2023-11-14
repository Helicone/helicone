import {
  FilterNode,
  filterListToTree,
  timeFilterToFilterNode,
} from "../../../services/lib/filters/filterDefs";
import {
  buildFilterWithAuthClickHouse,
  buildFilterWithAuthClickHousePropResponse,
} from "../../../services/lib/filters/filters";
import { Result, resultMap } from "../../result";
import { CLICKHOUSE_PRICE_CALC } from "../../sql/constants";
import {
  dbExecute,
  dbQueryClickhouse,
  printRunnableQuery,
} from "../db/dbExecute";
import { convertTextOperators } from "../graphql/query/helper";
import { PropertyFilter } from "../graphql/schema/types/graphql";

export interface TotalCost {
  cost: number;
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
): Promise<Result<number, string>> {
  if (
    properties
      .map((p) => p.value.equals === undefined)
      .reduce((a, b) => a || b, false)
  ) {
    return {
      data: null,
      error:
        "Invalid filter, only support equals for multiple properties cost fetching",
    };
  }

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

  const propertyKeys = properties.map((p) => p.name);
  const propertyValues = properties.map((p) => p.value.equals as string);

  const propertyKeyFilter = toSQLArray(propertyKeys, filterArgs);
  const propertyValueFilter = toSQLArray(
    propertyValues,
    propertyKeyFilter.argsAcc
  );

  const argsAcc = propertyValueFilter.argsAcc;

  const query = `
  SELECT ${CLICKHOUSE_PRICE_CALC("property_with_response_x")} as cost FROM (
    SELECT response_id,
      first_value(prompt_tokens) as prompt_tokens,
      first_value(completion_tokens) as completion_tokens,
      first_value(model) as model,
      arraySort(groupArray(30)(property_key)),
      arraySort(groupArray(30)(property_value))
     FROM property_with_response_v1
        WHERE (
          ((property_with_response_v1.organization_id = {val_0 : String} and ((property_with_response_v1.property_key = {val_1 : String} and property_with_response_v1.property_value = {val_2 : String}) or ((property_with_response_v1.property_key = {val_3 : String} and property_with_response_v1.property_value = {val_4 : String}) or (property_with_response_v1.property_key = {val_5 : String} and property_with_response_v1.property_value = {val_6 : String})))))
        )
        group by response_id
        HAVING (
            arraySort(groupArray(3)(property_key)) = [{val_7 : String}, {val_8 : String}, {val_9 : String}]
            and arraySort(groupArray(3)(property_value)) = [{val_10 : String}, {val_11 : String}, {val_12 : String}]
        )
        ORDER BY response_id
    ) as property_with_response_x
    `;

  const res = await dbQueryClickhouse<TotalCost>(query, argsAcc);

  return resultMap(res, (d) => d[0].cost);
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
    SELECT ${CLICKHOUSE_PRICE_CALC("property_with_response_v1")} as cost
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
