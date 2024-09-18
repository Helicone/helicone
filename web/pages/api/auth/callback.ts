import { NextApiHandler } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { SupabaseServerWrapper } from "@/lib/wrappers/supabase";

const handler: NextApiHandler = async (req, res) => {
  const { code } = req.query;

  console.log("CALLBACK URL IS CALLED WITH CODE:", code);
  if (code) {
    const supabase = new SupabaseServerWrapper({ req, res });
    const client = supabase.getClient();
    await client.auth.exchangeCodeForSession(String(code));

    const data = await supabase.getUserAndOrg();
    if (data.error) {
      console.error("Error getting user and org:", data.error);
      res.redirect("/signin");
    }
    if (!data.data?.orgId) {
      res.redirect("/welcome");
    }
    res.redirect("/dashboard");
  }

  res.redirect("/signin");
};

export default handler;
