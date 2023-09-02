import { ApolloError } from "apollo-server-errors";
import { Context } from "../../../../pages/api/graphql";
import {
  FilterLeaf,
  filterListToTree,
  FilterNode,
} from "../../../../services/lib/filters/filterDefs";
import { resultMap } from "../../../result";
import { getCacheCount, getModelMetrics } from "../../cache/stats";
import { modelCost } from "../../metrics/costCalc";
import { getTotalCostProperties } from "../../property/totalCosts";
import { getRequestCount, getRequestsDateRange } from "../../request/request";
import {
  QueryHeliconeTaskArgs,
  HeliconeTask,
  HeliconeTaskFilter,
} from "../schema/types/graphql";
import { convertTextOperators, convertTimeOperators } from "./helper";
import { getTasks } from "../../tasks/tasks";

const filterInputToFilterLeaf: {
  [key in keyof HeliconeTaskFilter]: (
    filter: HeliconeTaskFilter[key]
  ) => FilterLeaf | undefined;
} = {
  id: (id) => {
    if (id === undefined || id === null) {
      return undefined;
    }
    return {
      task: {
        id: convertTextOperators(id),
      },
    };
  },
  property: (property) => {
    if (property === undefined || property === null) {
      return undefined;
    }
    return {
      task: {
        custom_properties: {
          [property.name]: convertTextOperators(property.value),
        },
      },
    };
  },
  name: (name) => {
    if (name === undefined || name === null) {
      return undefined;
    }
    return {
      task: {
        name: convertTextOperators(name),
      },
    };
  },
  description: (description) => {
    if (description === undefined || description === null) {
      return undefined;
    }
    return {
      task: {
        description: convertTextOperators(description),
      },
    };
  },
  updated_at: (updatedAt) => {
    if (updatedAt === undefined || updatedAt === null) {
      return undefined;
    }
    return {
      task: {
        updated_at: convertTimeOperators(updatedAt),
      },
    };
  },
  created_at: (createdAt) => {
    if (createdAt === undefined || createdAt === null) {
      return undefined;
    }
    return {
      task: {
        created_at: convertTimeOperators(createdAt),
      },
    };
  },
};

function convertFilterInputToFilterLeaf(
  filter: HeliconeTaskFilter
): FilterNode {
  const keys = Object.keys(filter) as (keyof HeliconeTaskFilter)[];
  const convertedFilters = keys
    .map((key) => {
      const toLeaf = filterInputToFilterLeaf[key];
      if (toLeaf === undefined) {
        return undefined;
      }
      return toLeaf(filter[key] as any);
    })
    .filter((f): f is FilterLeaf => f !== undefined);
  return filterListToTree(convertedFilters, "and");
}

export async function heliconeTask(
  root: any,
  args: QueryHeliconeTaskArgs,
  context: Context,
  info: any
): Promise<HeliconeTask[]> {
  const orgId = await context.getOrgIdOrThrow();
  const { limit, offset, filters } = {
    limit: args.limit ?? 100,
    offset: args.offset ?? 0,
    filters: args.filters ?? [],
  };
  const convertedFilters: FilterNode[] = filters.map((f) =>
    convertFilterInputToFilterLeaf(f)
  );
  const filter = filterListToTree(convertedFilters, "and");

  const { data, error } = await getTasks(orgId, filter, offset, limit);

  if (error !== null) {
    throw new ApolloError(error, "INTERNAL_SERVER_ERROR");
  }

  return data.map((task) => ({
    id: task.id,
    name: task.name,
    description: task.description,
    created_at: task.created_at,
    updated_at: task.updated_at,
    run_id: task.run_id,
    parent_id: task.parent_id,
    properties: Object.entries(task.properties).map(([key, value]) => ({
      name: key,
      value,
    })),
  }));
}
