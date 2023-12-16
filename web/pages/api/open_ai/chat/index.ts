import { NextApiRequest, NextApiResponse } from "next";
import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionResponse,
  OpenAIApi,
} from "openai";
import { DEMO_EMAIL } from "../../../../lib/constants";
import { Result } from "../../../../lib/result";
import { SupabaseServerWrapper } from "../../../../lib/wrappers/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<CreateChatCompletionResponse, string>>
) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  const { messages, requestId, temperature, model, maxTokens } = req.body as {
    messages: ChatCompletionRequestMessage[];
    requestId: string;
    temperature: number;
    model: string;
    maxTokens: number;
  };

  if (!requestId || !temperature || !model) {
    res.status(400).json({
      error: "Bad request - missing required body parameters",
      data: null,
    });
    return;
  }

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    basePath: "https://oai.hconeai.com/v1",
    baseOptions: {
      headers: {
        "OpenAI-Organization": "",
        "Helicone-Property-Tag": "experiment",
        "Helicone-Auth": `Bearer ${process.env.TEST_HELICONE_API_KEY}`,
        user: user.data.user?.id || "",
        "Helicone-Property-RequestId": requestId,
      },
    },
  });

  const openai = new OpenAIApi(configuration);

  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  if (user.data.user.email === DEMO_EMAIL) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  try {
    const completion = await openai.createChatCompletion({
      model: model,
      messages: messages,
      user: user.data.user.email,
      temperature: temperature,
      max_tokens: maxTokens,
    });
    res.status(200).json({ error: null, data: completion.data });
    return;
  } catch (err) {
    res.status(500).json({ error: `${err}`, data: null });
    return;
  }
}
