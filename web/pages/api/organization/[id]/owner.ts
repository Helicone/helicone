// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute } from "../../../../lib/api/db/dbExecute";
import { SupabaseServerWrapper } from "../../../../lib/wrappers/supabase";

export async function getOwner(orgId: String, userId: string) {
  const query = `
  select 
    us.tier as tier,
    email
    from organization o 
    left join auth.users u on u.id = o.owner
    left join user_settings us on us.user = u.id
    where o.id = $1 AND (
      -- Auth check
      EXISTS (
        select * from organization_member om
        left join organization o on o.id = om.organization
        where om.organization = $1 and (
          o.owner = $2 or om.member = $2
        )
      )
      OR o.owner = $2
    )
`;

  return await dbExecute<{
    email: string;
    tier: string;
  }>(query, [orgId, userId]);
}
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
export type Owner = UnwrapPromise<ReturnType<typeof getOwner>>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Owner>
) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { id } = req.query;
  const owner = await getOwner(id as string, user.data.user.id);

  res.status(200).json(owner);
}
