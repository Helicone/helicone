export type FilterRow = {
  filterMapIdx: number;
  operatorIdx: number;
  value: string;
};

export type OrganizationFilter = {
  id: string;
  name: string;
  filter: FilterRow[];
  createdAt?: Date;
  softDelete: boolean;
};

export type OrganizationLayout = {
  id: string;
  organization_id: string;
  type: string;
  filters: OrganizationFilter[];
};
