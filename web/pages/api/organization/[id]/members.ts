// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute } from "../../../../lib/api/db/dbExecute";
import { SupabaseServerWrapper } from "../../../../lib/wrappers/supabase";
import { HandlerWrapperOptions } from "../../../../lib/api/handlerWrappers";
import { Result } from "../../../../lib/result";
import { supabaseServer } from "../../../../lib/supabaseServer";

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

async function handler({
  res,
  userData: { orgId, user, userId },
  supabaseClient: { client },
  req,
}: HandlerWrapperOptions<Members>) {
  const { id } = req.query;
  res.status(200).json(await getMembers(id as string, userId));
}

export default withAuth(handler);
