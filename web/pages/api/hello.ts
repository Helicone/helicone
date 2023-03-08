// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const hello = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Bearer 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",
      "OpenAI-Organization": "",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: "hello" }],
      stream: true,
    }),
  });
  const reader = hello.body?.pipeThrough(new TextDecoderStream()).getReader();

  while (true) {
    const res = await reader?.read();
    if (res?.done) break;
    console.log("Received", res?.value);
  }
  console.log("Done reading");
  console.log("res", hello.body);
  reader?.read().res.status(200).json({ name: "John Doe" });
}
