// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({ name: "John Doe" });
  var es = await fetch("http://127.0.0.1:8787/v1/engines/davinci/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + "<API KEY>",
    },
    method: "POST",
    body: JSON.stringify({
      prompt: "HELLO write me a book",
      temperature: 0.75,
      top_p: 0.95,
      max_tokens: 10,
      stream: true,
      stop: ["\n\n"],
    }),
  });

  const reader = es.body?.pipeThrough(new TextDecoderStream()).getReader();

  while (true) {
    const res = await reader?.read();
    if (res?.done) break;
    console.log("Received", res?.value);
  }
}
