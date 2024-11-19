require("dotenv").config({
  path: ".env",
});

import { OpenAI } from "openai";
import { hpf, hpstatic } from "@helicone/prompts";

async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.HELICONE_BASE_URL ?? "https://oai.helicone.ai/v1",
    defaultHeaders: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    },
  });

  const sampleData = [
    {
      sectionTitle: "Introduction to the course",
      difficulty: "beginner",
      topic: "JavaScript",
    },
    {
      sectionTitle: "Understanding Data Structures",
      difficulty: "intermediate",
      topic: "Python",
    },
    {
      sectionTitle: "Building RESTful APIs",
      difficulty: "advanced",
      topic: "Node.js",
    },
    {
      sectionTitle: "Getting Started with Web Development",
      difficulty: "beginner",
      topic: "HTML/CSS",
    },
    {
      sectionTitle: "Mobile App Development Fundamentals",
      difficulty: "intermediate",
      topic: "React Native",
    },
    {
      sectionTitle: "Database Design Principles",
      difficulty: "advanced",
      topic: "SQL",
    },
    {
      sectionTitle: "Introduction to Version Control",
      difficulty: "beginner",
      topic: "Git",
    },
    {
      sectionTitle: "State Management in Modern Apps",
      difficulty: "intermediate",
      topic: "React",
    },
    {
      sectionTitle: "Cloud Architecture Patterns",
      difficulty: "advanced",
      topic: "AWS",
    },
    {
      sectionTitle: "Basics of Programming Logic",
      difficulty: "beginner",
      topic: "C++",
    },
    {
      sectionTitle: "Server-Side Development",
      difficulty: "intermediate",
      topic: "Java",
    },
    {
      sectionTitle: "Machine Learning Fundamentals",
      difficulty: "advanced",
      topic: "Python",
    },
    {
      sectionTitle: "Web Security Essentials",
      difficulty: "intermediate",
      topic: "Cybersecurity",
    },
    {
      sectionTitle: "Cross-Platform Development",
      difficulty: "advanced",
      topic: "Flutter",
    },
    {
      sectionTitle: "Command Line Basics",
      difficulty: "beginner",
      topic: "Linux",
    },
  ];

  for (const data of sampleData) {
    const chatCompletion = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: hpstatic`You are an expert course creator.`,
          },
          {
            role: "user",
            content: hpf`Generate content that covers the section titled ${{
              sectionTitle: data.sectionTitle,
            }} for a ${{
              difficulty: data.difficulty,
            }} level course on ${{
              topic: data.topic,
            }} under the word limit of 30`,
          },
        ],
      },
      {
        headers: {
          "Helicone-Prompt-Id": "course-creator",
        },
      }
    );

    console.log(chatCompletion.choices[0].message.content);
  }

  // const names = [
  //   "Alice",
  //   "Bob",
  //   "Charlie",
  //   "David",
  //   "Eve",
  //   "Frank",
  //   "Grace",
  //   "Hannah",
  //   "Isaac",
  //   "Jack",
  //   "Liam",
  //   "Mason",
  //   "Noah",
  //   "Olivia",
  //   "Pam",
  //   "Quinn",
  //   "Rachel",
  //   "Sarah",
  //   "Tara",
  //   "Uma",
  //   "Victoria",
  //   "Wendy",
  //   "Xander",
  //   "Yara",
  //   "Zara",
  // ];

  // for (const name of names) {
  //   const chatCompletion = await openai.chat.completions.create(
  //     {
  //       model: "gpt-4-turbo",
  //       messages: [
  //         {
  //           role: "system",
  //           content: hpf`You are a helpful chatbot, that only talks like a pirate.
  //         You are speaking with ${{
  //           person: name,
  //         }}!`,
  //         },
  //       ],
  //       max_tokens: 700,
  //     },
  //     {
  //       headers: {
  //         "Helicone-Prompt-Id": "pirate-bot",
  //       },
  //     }
  //   );
  //   console.log(chatCompletion.choices[0].message.content);
  // }
}

main();
