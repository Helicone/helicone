import { NextApiRequest, NextApiResponse } from "next";
import { getAutoCompleteSuggestion } from "@/app/actions/auto-complete";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { currentText, contextText } = req.body;
    const stream = await getAutoCompleteSuggestion(currentText, contextText, {
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
    console.error("Autocomplete error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
