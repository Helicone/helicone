require("dotenv").config({
  path: ".env",
});

import { randomUUID } from "crypto";
import { OpenAI } from "openai";

import { HeliconeManualLogger } from "@helicone/helpers";

async function manualLoggerTest() {
  const heliconeLogger = new HeliconeManualLogger({
    apiKey: process.env.HELICONE_API_KEY ?? "", // Can be set as env variable
    headers: {},
    loggingEndpoint: `${process.env.HELICONE_BASE_LOGGING_URL}`,
  });

  const reqBody = {
    messages: [
      {
        role: "user",
        content: "What is the meaning of life, the universe, and everything?",
      },
    ],
    model: "grok-3",
    stream: false,
    temperature: 0.7,
  };

  const res = await heliconeLogger.logRequest(
    reqBody,
    async (resultRecorder) => {
      const r = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify(reqBody),
      });
      const resBody = await r.json();
      resultRecorder.appendResults(resBody as any);
      return resBody;
    },
    {
      "Helicone-Session-Id": "123",
      "Helicone-Session-Name": "test",
    },
  );

  console.log(res);
}

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
        "Helicone-Cache-Enabled": "true",
        "Helicone-Cache-Max-Bucket-Size": "3",
      },
    },
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
    },
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
    },
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
        },
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
            },
          );
        }),
      );
    }),
  );
}

// manualLoggerTest();
main();
