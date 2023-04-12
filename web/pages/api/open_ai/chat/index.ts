import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { NextApiRequest, NextApiResponse } from "next";
import {
  ChatCompletionRequestMessage,
  Configuration,
  CreateChatCompletionResponse,
  OpenAIApi,
} from "openai";
import { DEMO_EMAIL } from "../../../../lib/constants";
import { Result } from "../../../../lib/result";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<CreateChatCompletionResponse, string>>
) {
  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
    basePath: "https://oai.hconeai.com/v1",
    baseOptions: {
      header: {
        "OpenAI-Organization": "",
        "Helicone-Property-Tag": "prompt_edit",
      },
    },
  });
  const openai = new OpenAIApi(configuration);

  const client = createServerSupabaseClient({ req, res });
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  if (user.data.user.email === DEMO_EMAIL) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  const { messages } = req.body as { messages: ChatCompletionRequestMessage[] };
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: messages,
    user: user.data.user.email,
  });

  if (completion.status !== 200) {
    res.status(500).json({ error: "Internal server error", data: null });
    return;
  }
  res.status(200).json({ error: null, data: completion.data });
}
