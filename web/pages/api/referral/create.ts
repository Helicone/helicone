import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";

async function handler({
  req,
  res,
  userData,
}: HandlerWrapperOptions<Result<null, string>>) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }

  const { referralCode } = req.body as {
    referralCode: string;
  };

  const { data: user, error: userError } = await supabaseServer
    .from("user_settings")
    .select("*")
    .eq("referral_code", referralCode)
    .single();

  if (userError || !user?.user) {
    res.status(500).json({ error: "Failed to retrieve user", data: null });
    return;
  }

  const { error } = await supabaseServer.from("referrals").insert({
    referred_user_id: userData?.userId,
    referrer_user_id: user?.user,
  });

  if (error) {
    res.status(500).json({ error: "Failed to create referral", data: null });
    return;
  }

  res.status(200).json({ error: null, data: null });
}

export default withAuth(handler);
