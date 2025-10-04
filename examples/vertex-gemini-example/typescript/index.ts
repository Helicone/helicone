import OpenAI from "openai";
import dotenv from "dotenv";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

// Type definitions for Gemini API response
interface GeminiContent {
  parts: Array<{ text: string }>;
}

interface GeminiCandidate {
  content: GeminiContent;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

async function vercel() {
  console.log("🚀 Starting Vercel AI SDK with Azure OpenAI and Helicone...");

  // Create OpenAI provider with Azure configuration (matching main() function)
  const azureOpenAI = createOpenAI({
    baseURL: "https://oai.helicone.ai/openai/deployments/gpt-4o",
    apiKey: "dummy-key", // Azure uses api-key header instead
    headers: {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-OpenAI-API-Base": "https://vercelaisdkdocs.openai.azure.com/",
      "api-key": process.env.AZURE_API_KEY || "",
    },
    fetch: async (url, options) => {
      // Add api-version query parameter to the URL
      const urlWithApiVersion = new URL(url);
      urlWithApiVersion.searchParams.set("api-version", "2024-02-15-preview");
      return fetch(urlWithApiVersion.toString(), options);
    },
  });

  const { text } = await generateText({
    model: azureOpenAI("gpt-4o"),
    prompt: "Write a vegetarian lasagna recipe for 4 people.",
  });

  console.log("✅ Vercel AI SDK Response received:");
  console.log(text);
  console.log(
    "\n📊 Check your Helicone dashboard at https://helicone.ai/requests",
  );
}

async function notVercel() {
  try {
    const client = new OpenAI({
      baseURL: "https://oai.helicone.ai/openai/deployments/gpt-4o",
      defaultHeaders: {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
        "Helicone-OpenAI-API-Base": "https://vercelaisdkdocs.openai.azure.com/",
        "api-key": process.env.AZURE_OPENAI_API_KEY,
      },
      defaultQuery: {
        "api-version": "2024-02-15-preview",
      },
      apiKey: "ghhh",
    });
    console.log("🚀 Starting Azure OpenAI with Helicone example...");

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: "Write a vegetarian lasagna recipe for 4 people.",
        },
      ],
    });

    console.log("✅ Response received:");
    console.log(response.choices[0].message.content);

    console.log(
      "\n📊 Check your Helicone dashboard at https://helicone.ai/requests",
    );
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

async function geminiTest() {
  console.log("🚀 Starting Google Gemini with Helicone...");

  try {
    // Check if required environment variables are set
    if (!process.env.HELICONE_API_KEY) {
      console.log("⚠️ HELICONE_API_KEY not set in environment");
      return;
    }

    const project = process.env.GOOGLE_CLOUD_PROJECT || "your-project-id";
    const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";

    // Check for test image
    const imagePath = path.join(__dirname, "test.png");
    let imageData: string | null = null;

    if (fs.existsSync(imagePath)) {
      console.log(
        "📸 Found test.png - reading image for multimodal request...",
      );
      const imageBuffer = fs.readFileSync(imagePath);
      imageData = imageBuffer.toString("base64");
    } else {
      console.log("ℹ️ No test.png found - using text-only request");
    }

    // Use correct Vertex AI API endpoint
    const apiUrl = `https://gateway.helicone.ai/v1/projects/${project}/locations/${location}/publishers/google/models/gemini-1.5-flash:generateContent`;

    // Prepare the request content - either text+image or text-only
    const requestContents = [];

    if (imageData) {
      // Multimodal request with image and text
      requestContents.push({
        parts: [
          {
            text: "What do you see in this image? Please describe it in detail and suggest what type of food or recipe this might be related to.",
          },
          {
            inlineData: {
              data: imageData,
              mimeType: "image/png",
            },
          },
        ],
      });
      console.log("🖼️ Sending multimodal request (text + image)...");
    } else {
      // Text-only request
      requestContents.push({
        parts: [
          {
            text: "Write a short vegetarian lasagna recipe for 4 people.",
          },
        ],
      });
      console.log("📝 Sending text-only request...");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "helicone-auth": `Bearer ${process.env.HELICONE_API_KEY}`,
        "helicone-target-url": `https://${location}-aiplatform.googleapis.com`,
        Authorization: `Bearer ${process.env.GOOGLE_API_KEY || process.env.VERTEX_AI_TOKEN}`,
      },
      body: JSON.stringify({
        contents: requestContents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP error! status: ${response.status}`);
      console.log(`Response: ${errorText}`);

      if (response.status === 401 || response.status === 403) {
        console.log("💡 This might be an authentication issue.");
        console.log(
          "   Make sure to set GOOGLE_API_KEY or VERTEX_AI_TOKEN in your .env file",
        );
        console.log(
          "   and ensure your Google Cloud project has Vertex AI API enabled.",
        );
      }
      return;
    }

    const data = (await response.json()) as GeminiResponse;

    console.log("✅ Gemini response:");
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      console.log(data.candidates[0].content.parts[0].text);
    } else {
      console.log("Unexpected response format:", data);
    }

    console.log(
      "\n📊 Check your Helicone dashboard at https://helicone.ai/requests",
    );
  } catch (error) {
    console.error("❌ Gemini Error:", error);
    console.log("\n💡 To use Gemini with Helicone, you need:");
    console.log("   1. Set GOOGLE_CLOUD_PROJECT in your .env file");
    console.log(
      "   2. Set GOOGLE_API_KEY or VERTEX_AI_TOKEN in your .env file",
    );
    console.log("   3. Enable Vertex AI API in your Google Cloud project");
    console.log("   4. Ensure proper authentication is configured");
    console.log(
      "   5. Add a test.png file in the same directory for image testing",
    );
  }
}

async function runAllExamples() {
  try {
    // await vercel();
    console.log("\n" + "=".repeat(50) + "\n");

    await geminiTest();
    console.log("\n" + "=".repeat(50) + "\n");

    // Uncomment if you want to test the Azure OpenAI example too
    // await notVercel();
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

runAllExamples().catch(console.error);
