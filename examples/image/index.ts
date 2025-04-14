require("dotenv").config({
  path: ".env",
});

import { OpenAI } from "openai";
import * as fs from "fs";

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // baseURL: process.env.HELICONE_BASE_URL ?? "https://oai.helicone.ai/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.JAWN_API_KEY}`,
      // "Helicone-Cache-Enabled": "true",
    },
  });

  // Read the image file
  const imagePath = "./logo-clear.png"; // Replace with your image path
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What's in this image?" },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 300,
  });

  console.log("Image description:", response.choices[0].message.content);
}

main().catch(console.error);
