import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get environment variables
const HELICONE_API_KEY = process.env.HELICONE_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const HELICONE_URL = process.env.HELICONE_URL;
const USER_ID = process.env.USER_ID || "default_user";

async function makeGeminiRequest(
  prompt: string,
  analyticsPermission: boolean = true
) {
  // Set up the request configuration
  const requestConfig = {
    url: `${HELICONE_URL}/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    headers: {
      "Content-Type": "application/json",
      "Helicone-Auth": `Bearer ${HELICONE_API_KEY}`,
      "Helicone-Target-Url": "https://generativelanguage.googleapis.com",
      "Helicone-User-Id": USER_ID,
      "Helicone-Property-App": "cursor-extension-cursorrules",
      "Helicone-Property-AnalyticsPermission": analyticsPermission
        ? "true"
        : "false",
    } as Record<string, string>,
    body: {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    },
  };

  try {
    // Make the API call
    const response = await fetch(requestConfig.url, {
      method: "POST",
      headers: requestConfig.headers,
      body: JSON.stringify(requestConfig.body),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${
          response.status
        }, message: ${await response.text()}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error making Gemini API call:", error);
    throw error;
  }
}

/**
 * Main function to demonstrate Gemini with Helicone
 */
async function main() {
  // Define a simple prompt
  const prompt = "List 3 classic sci-fi movies from the 1980s.";

  console.log("=== Making Gemini API call through Helicone gateway ===");
  console.log(`User ID: ${USER_ID}`);
  console.log(`Prompt: "${prompt}"`);

  try {
    // Make the API call
    const response = await makeGeminiRequest(prompt);

    // Extract and display the response text
    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "No response text";

    console.log("\n=== Response ===");
    console.log(responseText);
  } catch (error) {
    console.error("Error in main function:", error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error("Error in main function:", error);
  process.exit(1);
});
