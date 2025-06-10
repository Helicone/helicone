import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: "AIzaSyCnLPrWw8WrfjTotsIJp5VaTxha97mrW18",
  vertexai: true,
  httpOptions: {
    baseUrl: "https://gateway.helicone.ai",
    headers: {
      "Helicone-Auth": "Bearer sk-helicone-xykmybq-tx2u5ba-wkawkuy-jmjkqji",
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
