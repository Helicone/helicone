// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { getRequests } from "../../../lib/shared/request/request";
import { Result } from "../../../lib/shared/result";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { supabaseServer } from "../../../lib/supabaseServer";
import { Database } from "../../../supabase/database.types";

const characters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateRandomString(length: number) {
  let result = " ";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return "txt_" + result;
}

async function handler(option: HandlerWrapperOptions<Result<boolean, string>>) {
  const {
    res,
    userData: { orgId },
    supabaseClient: client,
  } = option;

  const { error: ffError, data: ffData } = await supabaseServer
    .from("feature_flags")
    .select("*")
    .eq("org_id", orgId)
    .eq("feature", "webhook_beta");

  if (ffError || !ffData || ffData.length === 0) {
    res.status(400).json({
      error: "Feature flag not found",
      data: null,
    });
    return;
  }

  const { destination } = option.req.body as {
    destination: string;
  };
  //ensure https and valid url
  if (!destination.startsWith("https://")) {
    res.status(400).json({
      error: "Invalid URL",
      data: null,
    });
    return;
  }

  const { error: webhookError, data: webhook } = await supabaseServer
    .from("webhooks")
    .insert([
      {
        txt_record: generateRandomString(64),
        destination: destination,
        org_id: orgId,
        is_verified: true,
      },
    ])
    .select()
    .single();
  if (webhookError) {
    res.status(400).json({
      error: webhookError.message,
      data: null,
    });
    return;
  }
  const { error: webHookSubscriptionError, data: webHookSubscriptionData } =
    await supabaseServer
      .from("webhook_subscriptions")
      .insert([
        {
          webhook_id: webhook.id,
          payload_type: {},
          event: "beta",
        },
      ])
      .select()
      .single();
  if (webHookSubscriptionError) {
    res.status(400).json({
      error: webHookSubscriptionError.message,
      data: null,
    });
    return;
  }

  return res.status(200).json({
    data: true,
    error: null,
  });
}

export default withAuth(handler);
