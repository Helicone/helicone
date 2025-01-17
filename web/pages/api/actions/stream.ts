import { NextApiRequest, NextApiResponse } from "next";
import { streamResponse } from "@/app/actions/stream-response";
import { GenerationParameters } from "@/app/actions/llm";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const params = req.body as GenerationParameters;
    const stream = await streamResponse(params, {
      headers: { "x-cancel": req.headers["x-cancel"] as string },
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // @ts-ignore - ReadableStream type mismatch between Next.js and Node
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        },
      })
    );
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
