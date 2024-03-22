export type OrganizationFilter = {
  id?: string;
  name: string;
  filter: string;
  createdAt?: Date;
  softDelete: boolean;
};

export type OrganizationLayout = {
  id: string;
  organization_id: string;
  type: string;
  filters: OrganizationFilter[];
};
