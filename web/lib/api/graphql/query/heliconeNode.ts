import { ApolloError } from "apollo-server-errors";
import { Context } from "../../../../pages/api/graphql";
import {
  FilterLeaf,
  filterListToTree,
  FilterNode,
} from "../../../../services/lib/filters/filterDefs";
import {
  QueryHeliconeNodeArgs,
  HeliconeNode,
  HeliconeNodeFilter,
} from "../schema/types/graphql";
import { convertTextOperators, convertTimeOperators } from "./helper";
import { getNodes } from "../../nodes/nodes";

const filterInputToFilterLeaf: {
  [key in keyof HeliconeNodeFilter]: (
    filter: HeliconeNodeFilter[key]
  ) => FilterLeaf | undefined;
} = {
  id: (id) => {
    if (id === undefined || id === null) {
      return undefined;
    }
    return {
      job_node: {
        id: convertTextOperators(id),
      },
    };
  },
  property: (property) => {
    if (property === undefined || property === null) {
      return undefined;
    }
    return {
      job_node: {
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
      job_node: {
        name: convertTextOperators(name),
      },
    };
  },
  description: (description) => {
    if (description === undefined || description === null) {
      return undefined;
    }
    return {
      job_node: {
        description: convertTextOperators(description),
      },
    };
  },
  updated_at: (updatedAt) => {
    if (updatedAt === undefined || updatedAt === null) {
      return undefined;
    }
    return {
      job_node: {
        updated_at: convertTimeOperators(updatedAt),
      },
    };
  },
  created_at: (createdAt) => {
    if (createdAt === undefined || createdAt === null) {
      return undefined;
    }
    return {
      job_node: {
        created_at: convertTimeOperators(createdAt),
      },
    };
  },
};

/**
 * Converts a HeliconeNodeFilter object to a FilterNode object.
 *
 * @param filter - The HeliconeNodeFilter object to be converted.
 * @returns The converted FilterNode object.
 */
function convertFilterInputToFilterLeaf(
  filter: HeliconeNodeFilter
): FilterNode {
  const keys = Object.keys(filter) as (keyof HeliconeNodeFilter)[];
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
 * Retrieves Helicone nodes based on the provided arguments.
 * @param args - The query arguments.
 * @param context - The execution context.
 * @returns A promise that resolves to an array of HeliconeNode objects.
 * @throws ApolloError if there is an error retrieving the nodes.
 */
export async function heliconeNode(
  args: QueryHeliconeNodeArgs,
  context: Context
): Promise<HeliconeNode[]> {
  const orgId = await context.getOrgIdOrThrow();
  const { limit, offset, filters, jobId } = {
    limit: args.limit ?? 100,
    offset: args.offset ?? 0,
    filters: args.filters ?? [],
    jobId: args.job_id ?? undefined,
  };
  const convertedFilters: FilterNode[] = filters.map((f) =>
    convertFilterInputToFilterLeaf(f)
  );

  let filter = filterListToTree(convertedFilters, "and");
  if (jobId !== undefined) {
    filter = {
      left: {
        job_node: {
          job_id: {
            equals: jobId,
          },
        },
      },
      right: filter,
      operator: "and",
    };
  }

  const { data, error } = await getNodes(orgId, filter, offset, limit);

  if (error !== null) {
    throw new ApolloError(error, "INTERNAL_SERVER_ERROR");
  }

  return data.map((node) => ({
    id: node.id,
    name: node.name,
    description: node.description,
    created_at: node.created_at,
    updated_at: node.updated_at,
    job_id: node.job_id,
    parent_node_ids: node.parent_node_ids ?? [],
    properties: Object.entries(node.properties).map(([key, value]) => ({
      name: key,
      value,
    })),
  }));
}
