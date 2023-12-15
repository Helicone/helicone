// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { encoding_for_model } from "@dqbd/tiktoken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    | number
    | {
        error: string;
      }
  >
) {
  const { model, text } = req.body;
  try {
    const tiktoken = encoding_for_model(model);
    const encoded = tiktoken.encode(text);
    res.status(200).json(encoded.length);
  } catch (e) {
    res.status(400).json({ error: JSON.stringify(e) });
  }
}
