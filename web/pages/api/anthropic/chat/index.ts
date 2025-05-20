import { getAnthropicKeyFromAdmin } from "@/lib/clients/settings";
import { getSSRHeliconeAuthClient } from "@/packages/common/auth/client/getSSRHeliconeAuthClient";
import Anthropic from "@anthropic-ai/sdk";
import { NextApiRequest, NextApiResponse } from "next";

import {
  ImageBlockParam,
  TextBlockParam,
} from "@anthropic-ai/sdk/resources/messages";
import { DEMO_EMAIL } from "../../../../lib/constants";
import { Result } from "@/packages/common/result";

export interface ChatParams {
  content: string | Array<TextBlockParam | ImageBlockParam>;
  role: "user" | "assistant" | "system";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<Anthropic.Messages.Message, string>>
) {
  const client = await getSSRHeliconeAuthClient({ ctx: { req, res } });
  const user = await client.getUser();
  let { messages, requestId, temperature, model, maxTokens, anthropicAPIKey } =
    req.body as {
      messages: ChatParams[];
      requestId: string;
      temperature: number;
      model: string;
      maxTokens: number;
      anthropicAPIKey?: string;
    };

  if (!temperature || !model) {
    res.status(400).json({
      error: "Bad request - missing required body parameters",
      data: null,
    });
    return;
  }

  if (!anthropicAPIKey || anthropicAPIKey == "") {
    anthropicAPIKey =
      (await getAnthropicKeyFromAdmin()) || process.env.ANTHROPIC_API_KEY;
  }

  const anthropic = new Anthropic({
    baseURL: "https://anthropic.helicone.ai/",
    apiKey: anthropicAPIKey,
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.TEST_HELICONE_API_KEY}`,
      user: user.data?.id || "",
      "Helicone-Property-RequestId": requestId,
      "Helicone-Property-Tag": "experiment",
    },
  });

  if (!user.data) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  if (user.data.email === DEMO_EMAIL) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  try {
    // filter the messages with role `system`. This is to prevent the user from sending messages with role `system`
    // add the first message with role `system` into the `create` method
    const systemMessage = messages.find((message) => {
      return message.role === "system";
    })?.content as string | undefined;

    const cleanMessages = (): Anthropic.Messages.MessageParam[] => {
      if (systemMessage) {
        const filteredMessages = messages.filter((message) => {
          return message.role !== "system";
        });
        return filteredMessages as Anthropic.Messages.MessageParam[];
      } else {
        return messages as Anthropic.Messages.MessageParam[];
      }
    };

    const anthropicMessages = cleanMessages();

    const completion = await anthropic.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      metadata: {
        user_id: user.data.id,
      },
      system: systemMessage || undefined,
      messages: anthropicMessages,
    });
    res.status(200).json({ error: null, data: completion });
    return;
  } catch (err) {
    res.status(500).json({ error: `${err}`, data: null });
    return;
  }
}
