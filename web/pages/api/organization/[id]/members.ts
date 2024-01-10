// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute } from "../../../../lib/shared/db/dbExecute";
import { SupabaseServerWrapper } from "../../../../lib/wrappers/supabase";

export async function getMembers(orgId: String, userId: string) {
  const query = `
  select email, member, org_role from organization_member om 
    left join auth.users u on u.id = om.member
    where om.organization = $1 AND (
      -- Auth check
      EXISTS (
        select * from organization_member om
        left join organization o on o.id = om.organization
        where om.organization = $1 and (
          o.owner = $2 or om.member = $2
        )
      )
    )
`;

  return await dbExecute<{
    email: string;
    member: string;
    org_role: string;
  }>(query, [orgId, userId]);
}
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type Members = UnwrapPromise<ReturnType<typeof getMembers>>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Members>
) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { id } = req.query;
  res.status(200).json(await getMembers(id as string, user.data.user.id));
}
