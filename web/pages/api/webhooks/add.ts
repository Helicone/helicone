// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { getRequests } from "../../../lib/api/request/request";
import { Result } from "../../../lib/result";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { supabaseServer } from "../../../lib/supabaseServer";

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

  const { error } = await supabaseServer.from("webhooks").insert([
    {
      txt_record: generateRandomString(64),
      destination: destination,
      org_id: orgId,
    },
  ]);
  if (error) {
    res.status(400).json({
      error: error.message,
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
