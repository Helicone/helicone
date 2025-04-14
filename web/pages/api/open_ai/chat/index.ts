import { getOpenAIKeyFromAdmin } from "@/lib/clients/settings";
import { getSSRHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";
import {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat";
import { DEMO_EMAIL } from "../../../../lib/constants";
import { Result } from "../../../../packages/common/result";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<ChatCompletion, string>>
) {
  const client = await getSSRHeliconeAuthClient({ ctx: { req, res } });
  const user = await client.getUser();
  if (!user.data || user.error !== null) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  if (user.data.email === DEMO_EMAIL) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  let {
    messages,
    requestId,
    temperature,
    model,
    maxTokens,
    tools,
    openAIApiKey,
  } = req.body as {
    messages: ChatCompletionMessageParam[];
    requestId: string;
    temperature: number;
    model: string;
    maxTokens: number;
    tools: ChatCompletionTool[];
    openAIApiKey?: string;
  };

  if (!temperature || !model) {
    res.status(400).json({
      error: "Bad request - missing required body parameters",
      data: null,
    });
    return;
  }

  if (!openAIApiKey || openAIApiKey == "") {
    openAIApiKey =
      (await getOpenAIKeyFromAdmin()) || process.env.OPENAI_API_KEY;
  }

  const openai = new OpenAI({
    apiKey: openAIApiKey,
    baseURL: "https://oai.helicone.ai/v1",
    defaultHeaders: {
      "OpenAI-Organization": "",
      "Helicone-Property-Tag": "experiment",
      "Helicone-Auth": `Bearer ${process.env.TEST_HELICONE_API_KEY}`,
      user: user.data.id || "",
      "Helicone-Property-RequestId": requestId,
    },
  });

  try {
    const isO1orO3 = model.includes("o1") || model.includes("o3");
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      user: user.data.email,
      temperature: isO1orO3 ? undefined : temperature,
      max_tokens: isO1orO3 ? undefined : maxTokens,
      tools: tools && tools.length > 0 ? tools : undefined,
    });
    res.status(200).json({ error: null, data: completion });
    return;
  } catch (err) {
    res.status(500).json({ error: `${err}`, data: null });
    return;
  }
}
