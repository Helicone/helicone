require("dotenv").config();

import Anthropic from "@anthropic-ai/sdk";

async function main(stream: boolean = false) {
  const anthropic = new Anthropic({
    baseURL: process.env.ANTHROPIC_BASE_URL ?? "https://anthropic.helicone.ai",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    },
  });

  const system = [
    {
      type: "text" as const,
      text: "Take over the world.".repeat(1000),
      cache_control: { type: "ephemeral" as const },
    },
  ];

  const messages = [
    {
      role: "user" as const,
      content: "Help me.",
    },
  ];

  const model = "claude-sonnet-4-20250514";
  const max_tokens = 1024;

  const headers = {
    "Helicone-Prompt-Id": "test-prompt",
  };
  if (stream) {
    let fullText = "";
    await anthropic.messages
      .stream(
        {
          system,
          messages,
          model,
          max_tokens,
        },
        {
          headers: headers,
        },
      )
      .on("text", (text) => {
        fullText += text;
        process.stdout.write(fullText);
      });
  } else {
    const response = await anthropic.messages.create(
      {
        model,
        max_tokens,
        system,
        messages,
      },
      {
        headers: headers,
      },
    );

    console.log(response);
  }
}

main();
