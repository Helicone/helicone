import { ApolloError } from "apollo-server-errors";
import { Context } from "../../../../pages/api/graphql";
import {
  FilterLeaf,
  filterListToTree,
  FilterNode,
} from "../../../../services/lib/filters/filterDefs";
import { getJobs } from "../../jobs/jobs";
import {
  HeliconeJob,
  HeliconeJobFilter,
  Property,
  QueryHeliconeJobArgs,
} from "../schema/types/graphql";
import { convertTextOperators, convertTimeOperators } from "./helper";

/**
 * Converts the filter input to a filter leaf object.
 * @remarks
 * This object maps each key of the HeliconeJobFilter type to a function that converts the corresponding filter value to a FilterLeaf object.
 * @typeParam HeliconeJobFilter - The type of the filter object.
 * @param filter - The filter object to be converted.
 * @returns The converted FilterLeaf object or undefined if the filter value is undefined or null.
 */
const filterInputToFilterLeaf: {
  [key in keyof HeliconeJobFilter]: (
    filter: HeliconeJobFilter[key]
  ) => FilterLeaf | undefined;
} = {
  id: (id) => {
    if (id === undefined || id === null) {
      return undefined;
    }
    return {
      job: {
        id: convertTextOperators(id),
      },
    };
  },
  property: (property) => {
    if (property === undefined || property === null) {
      return undefined;
    }
    return {
      job: {
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
      job: {
        name: convertTextOperators(name),
      },
    };
  },
  description: (description) => {
    if (description === undefined || description === null) {
      return undefined;
    }
    return {
      job: {
        description: convertTextOperators(description),
      },
    };
  },
  updated_at: (updatedAt) => {
    if (updatedAt === undefined || updatedAt === null) {
      return undefined;
    }
    return {
      job: {
        updated_at: convertTimeOperators(updatedAt),
      },
    };
  },
  created_at: (createdAt) => {
    if (createdAt === undefined || createdAt === null) {
      return undefined;
    }
    return {
      job: {
        created_at: convertTimeOperators(createdAt),
      },
    };
  },
};

/**
 * Converts a HeliconeJobFilter object into a FilterNode object.
 * @param filter - The HeliconeJobFilter object to be converted.
 * @returns The converted FilterNode object.
 */
function convertFilterInputToFilterLeaf(filter: HeliconeJobFilter): FilterNode {
  const keys = Object.keys(filter) as (keyof HeliconeJobFilter)[];
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

/**
 * Retrieves a list of Helicone jobs based on the provided arguments.
 * @param args - The arguments for querying Helicone jobs.
 * @param context - The context object containing additional information.
 * @returns A promise that resolves to an array of HeliconeJob objects.
 */
export async function heliconeJob(
  args: QueryHeliconeJobArgs,
  context: Context
): Promise<HeliconeJob[]> {
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

  const { data, error } = await getJobs(orgId, filter, offset, limit, {
    created_at: "desc",
  });

  if (error !== null) {
    throw new ApolloError(error, "INTERNAL_SERVER_ERROR");
  }
  return data.map((r) => {
    const custom_properties: Property[] = Object.entries(
      r.custom_properties
    ).map(([key, value]) => ({
      name: key,
      value,
    }));
    return {
      id: r.id,
      status: r.status,
      name: r.name,
      description: r.description,
      created_at: r.created_at,
      updated_at: r.updated_at,
      timeout_seconds: r.timeout_seconds,
      properties: custom_properties,
      request_count: r.request_count,

      node_count: r.job_node_count,
    };
  });
}
