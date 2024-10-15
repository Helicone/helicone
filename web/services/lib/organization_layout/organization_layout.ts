import { UIFilterRow } from "../../../components/shared/themed/themedAdvancedFilters";
import { isUIFilterRow, UIFilterRowTree } from "../filters/uiFilterRowTree";

export type FilterRow = {
  filterMapIdx: number;
  operatorIdx: number;
  value: string;
};

export type OrganizationFilter = {
  id: string;
  name: string;
  filter: UIFilterRowTree[];
  createdAt?: string;
  softDelete: boolean;
};

export type OrganizationLayout = {
  id: string;
  organization_id: string;
  type: string;
  filters: OrganizationFilter[];
};

export function transformFilter(filter: any): UIFilterRowTree {
  if (Array.isArray(filter)) {
    // Handle old structure (direct array of filters)
    return {
      operator: "and",
      rows: filter.map((f) => ({
        filterMapIdx: f.filterMapIdx,
        operatorIdx: f.operatorIdx,
        value: f.value,
      })),
    };
  } else if (typeof filter === "object" && filter !== null) {
    if (isUIFilterRow(filter)) {
      // Single filter object
      return filter;
    } else if (filter.operator && Array.isArray(filter.rows)) {
      // Nested structure
      return {
        operator: filter.operator as "and" | "or",
        rows: filter.rows.map(transformFilter),
      };
    }
  }

  console.error("Invalid filter structure", filter);
  return { operator: "and", rows: [] };
}

export function transformOrganizationLayoutFilters(
  filters: OrganizationFilter[]
): OrganizationFilter[] {
  return filters.map((filter) => ({
    ...filter,
    filter: [transformFilter(filter.filter[0])],
  }));
}
