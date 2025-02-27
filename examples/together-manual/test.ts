import { createTogetherClient, main } from "./index";

async function runTest() {
  console.log("Testing Together AI integration with Helicone...");

  try {
    // For Node.js environment, main() will log chunks to console
    await main();
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed with error:", error);
  }
}

runTest();
