require("dotenv").config({
  path: ".env",
});

import { randomUUID } from "crypto";
import { OpenAI } from "openai"

async function fullReq() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.HELICONE_BASE_URL ?? "https://oai.helicone.ai/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Cache-Enabled": "true",
      "Helicone-Cache-Bucket-Max-Size": "10",
    },
  });

  const chatCompletion = await openai.chat.completions.create(
    {
      messages: [
        { role: "user", content: "Who is the prime minister of Canada?" },
      ],
      model: "gpt-3.5-turbo",
    },
    {
      headers: {
        "Helicone-Session-Id": "Test-Session",
        "Helicone-Session-Path": "/bruh/bruh-again-wow",
        "Helicone-Session-Name": "Test-Session-Name",
        "Helicone-User-Id": "charlie@helicone.ai",
        "Helicone-Prompt-Id": "Test-Prompt-Id",
      },
    }
  );

  console.log(chatCompletion.choices[0].message.content);
};

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.HELICONE_BASE_URL ?? "https://oai.helicone.ai/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    },
  });

  const sessionName = "Space Course";
  const session = `${randomUUID()}`;

  openai.chat.completions.create(
    {
      messages: [
        {
          role: "user",
          content: "Generate an abstract for a course on space.",
        },
      ],
      model: "gpt-4",
    },
    {
      headers: {
        "Helicone-Session-Id": session,
        "Helicone-Session-Name": sessionName,
        "Helicone-Session-Path": "/abstract",
      },
    }
  );

  await openai.chat.completions.create(
    {
      messages: [
        {
          role: "user",
          content: "Generate an abstract for a course on space.",
        },
      ],
      model: "gpt-4",
    },
    {
      headers: {
        "Helicone-Session-Id": session,
        "Helicone-Session-Name": sessionName,
        "Helicone-Session-Path": "/abstract",
      },
    }
  );

  await openai.chat.completions.create(
    {
      messages: [
        {
          role: "user",
          content: "Generate a course outline for a course on space.",
        },
      ],
      model: "gpt-4",
    },
    {
      headers: {
        "Helicone-Session-Id": session,
        "Helicone-Session-Name": sessionName,
        "Helicone-Session-Path": "/outline",
      },
    }
  );

  const chapterNames = [
    "Introduction",
    "The Solar System",
    "The Universe",
    "Space Exploration",
    "Space Technology",
    "Space Travel",
  ];

  await Promise.all(
    chapterNames.map(async (chapterName) => {
      await openai.chat.completions.create(
        {
          messages: [
            {
              role: "user",
              content: `Generate a chapter outline for the chapter on ${chapterName}.`,
            },
          ],
          model: "gpt-4",
        },
        {
          headers: {
            "Helicone-Session-Id": session,
            "Helicone-Session-Name": sessionName,
            "Helicone-Session-Path": `/outline/${chapterName}`,
          },
        }
      );
      const sectionNames = [
        "Overview",
        "Key Concepts",
        "Key Figures",
        "Key Events",
        "Key Technologies",
      ];
      await Promise.all(
        sectionNames.map(async (sectionName) => {
          await openai.chat.completions.create(
            {
              messages: [
                {
                  role: "user",
                  content: `Generate a section outline for the section on ${sectionName}.`,
                },
              ],
              model: "gpt-4",
            },
            {
              headers: {
                "Helicone-Session-Id": session,
                "Helicone-Session-Name": sessionName,
                "Helicone-Session-Path": `/outline/${chapterName}/${sectionName}`,
              },
            }
          );
        })
      );
    })
  );
}

// main();
fullReq();
