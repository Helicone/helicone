import { NextApiHandler } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { getHeliconeCookie } from "../../../lib/cookies";

const handler: NextApiHandler = async (req, res) => {
  const { code } = req.query;

  console.log("CALLBACK URL IS CALLED WITH CODE:", code);
  if (code) {
    const supabase = createPagesServerClient({ req, res });
    console.log("cookie", getHeliconeCookie());
    const data = await supabase.auth.exchangeCodeForSession(String(code));
    console.log("cookie after exchange", getHeliconeCookie(), data.data);

    return res.redirect("/dashboard");
  }

  return res.redirect("/signin");
};

export default handler;
