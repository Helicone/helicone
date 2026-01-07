import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: "<GOOGLE_API_KEY>",
  vertexai: true,
  httpOptions: {
    baseUrl: "https://gateway.helicone.ai",
    headers: {
      "Helicone-Auth": "Bearer <HELICONE_API_KEY>",
      "Helicone-Target-URL": "https://generativelanguage.googleapis.com",
    },
  },
});

async function generateContent() {
  const response = await genAI.models.generateContent({
    model: "gemini-2.0-flash-001",
    contents: "Why is the sky blue?",
  });
  console.log(response.text);
}

generateContent();
