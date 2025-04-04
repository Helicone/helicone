import { dbExecute } from "@/lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";

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

  const { data: user, error: userError } = await dbExecute<{ user: string }>(
    "SELECT user FROM user_settings WHERE referral_code = $1",
    [referralCode]
  );

  if (userError || !user?.[0]?.user) {
    res.status(500).json({ error: "Failed to retrieve user", data: null });
    return;
  }

  const { error: updateError } = await dbExecute(
    "INSERT INTO referrals (referred_user_id, referrer_user_id) VALUES ($1, $2)",
    [userData?.userId, user?.[0]?.user]
  );

  if (updateError) {
    res.status(500).json({ error: "Failed to create referral", data: null });
    return;
  }

  res.status(200).json({ error: null, data: null });
}

export default withAuth(handler);
