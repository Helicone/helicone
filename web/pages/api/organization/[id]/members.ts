import { dbExecute } from "../../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";

export async function getMembers(orgId: String) {
  const query = `
  select email, member, org_role from organization_member om 
    left join auth.users u on u.id = om.member
    where om.organization = $1
`;

  return await dbExecute<{
    email: string;
    member: string;
    org_role: string;
  }>(query, [orgId]);
}
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type Members = UnwrapPromise<ReturnType<typeof getMembers>>;

async function checkAccessToOrg(
  orgId: string,
  userId: string
): Promise<boolean> {
  const query = `
  select * from organization_member om
  where om.organization = $1 and (om.member = $2)
`;

  const { data, error } = await dbExecute<{
    email: string;
    member: string;
    org_role: string;
  }>(query, [orgId, userId]);

  return error === null && data?.length > 0;
}

async function handler({
  res,
  userData: { orgId, user, userId },
  supabaseClient: { client },
  req,
}: HandlerWrapperOptions<Members>) {
  const { id } = req.query;
  const orgToCheck = await client
    .from("organization")
    .select("*")
    .eq("id", id)
    .single();
  if (!orgToCheck.data || orgToCheck.error !== null) {
    res
      .status(404)
      .json({ error: "Not found or don't have access to org", data: null });
    return;
  }

  const hasAccess =
    (await checkAccessToOrg(id as string, userId)) ||
    (orgToCheck.data.reseller_id &&
      (await checkAccessToOrg(orgToCheck.data.reseller_id as string, userId)));
  if (hasAccess) {
    res.status(200).json(await getMembers(id as string));
  } else {
    console.error("No access to org", orgId, user, userId);
    res
      .status(404)
      .json({ error: "Not found or don't have access to org", data: null });
  }
}

export default withAuth(handler);
