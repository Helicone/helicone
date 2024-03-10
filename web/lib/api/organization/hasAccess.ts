import { supabaseServer } from "../../supabaseServer";
import { dbExecute } from "../db/dbExecute";

async function _checkAccessToOrg(
  orgId: string,
  userId: string
): Promise<boolean> {
  const query = `
  select * from organization_member om
  where om.organization = $1 and (om.member = $2) and (om.org_role = 'admin' or om.org_role = 'owner')
`;

  const { data, error } = await dbExecute<{
    email: string;
    member: string;
    org_role: string;
  }>(query, [orgId, userId]);

  return error === null && data?.length > 0;
}

export async function checkAccessToMutateOrg(
  orgId: string,
  userId: string
): Promise<boolean> {
  const orgToCheck = await supabaseServer()
    .from("organization")
    .select("*")
    .eq("id", orgId)
    .single();

  if (!orgToCheck.data || orgToCheck.error !== null) {
    return false;
  }
  if (await _checkAccessToOrg(orgId as string, userId)) {
    return true;
  } else if (
    orgToCheck.data.reseller_id &&
    (await _checkAccessToOrg(orgToCheck.data.reseller_id as string, userId))
  ) {
    return true;
  } else {
    return false;
  }
}
