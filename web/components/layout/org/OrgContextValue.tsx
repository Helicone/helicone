import { Database } from "@/db/database.types";

type OrganizationTableRow = Database["public"]["Tables"]["organization"]["Row"];

/**
 * Organization as returned by Jawn to the dashboard. Billing identifiers and
 * raw stripe_metadata are never sent to clients; the add-on flags are exposed
 * as `addons`.
 */
export type OrgRow = Omit<
  OrganizationTableRow,
  | "stripe_customer_id"
  | "stripe_metadata"
  | "stripe_subscription_id"
  | "stripe_subscription_item_id"
> & {
  addons?: {
    prompts?: boolean;
    experiments?: boolean;
    evals?: boolean;
  } | null;
};

export interface OrgContextValue {
  currentOrg?: OrgRow;
  allOrgs: OrgRow[];

  setCurrentOrg: (orgId: OrgRow["id"]) => void;
  refetchOrgs: () => void;
}
