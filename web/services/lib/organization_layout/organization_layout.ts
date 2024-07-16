import { UIFilterRowTree } from "../filters/uiFilterRowTree";

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
