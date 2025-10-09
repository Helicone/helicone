/**
 * Wallet credit exhaustion tests
 * Tests that requests are rate limited when wallet credits run out
 */

import { gatewayClient } from "../../lib/http-client";
import {
  GATEWAY_ENDPOINTS,
  TEST_MESSAGES,
  TEST_ORG_ID,
} from "../../lib/constants";
import {
  createChatCompletionRequest,
  ChatCompletionResponse,
  sleep,
} from "../../lib/test-helpers";
import {
  addCreditsToWallet,
  resetWalletCredits,
  getWalletState,
} from "../../lib/wallet-helpers";

describe("Wallet Credit Exhaustion", () => {
  beforeAll(async () => {
    // Reset wallet to 0 before tests
    await resetWalletCredits(TEST_ORG_ID);
    await sleep(500);
  });

  afterAll(async () => {
    // Clean up - reset wallet to 0 after tests
    await resetWalletCredits(TEST_ORG_ID);
  });

  it("mock example should bring cost down exactly $0.01871250", async () => {
    // Add $1 worth of credits (100 cents)
    const addCreditsResponse = await addCreditsToWallet({
      orgId: TEST_ORG_ID,
      amount: 100, // $1.00 in cents
      reason: "Credit exhaustion test",
    });

    expect(addCreditsResponse.status).toBe(200);
    expect(addCreditsResponse.data.effectiveBalance).toBe(100);
    // sleep for 2 seconds to ensure wallet state is updated
    await sleep(2000);
    const requestBody = createChatCompletionRequest({
      model: "gpt-5",
      messages: TEST_MESSAGES.SIMPLE,
      max_tokens: 10,
    });

    const response = await gatewayClient.post<ChatCompletionResponse>(
      GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
      requestBody
    );
    console.log("Response status:", response.status);
    if (response.status !== 200) {
      console.log("Response data:", response.data);
    }
    expect(response.status).toBe(200);
    await sleep(500);
    // Check wallet balance
    const walletState = await getWalletState(TEST_ORG_ID);
    console.log("Wallet state after mock request:", walletState.data);

    // With the mock response, we expect the cost to be exactly $0.01871250
    // So the remaining balance should be 100 - 1.87125 = 98.12875 cents
    expect(walletState.data.effectiveBalance).toBeCloseTo(100 - 1.87125, 5);
  });

  // it("should rate limit requests after credits are exhausted", async () => {
  //   // Add $1 worth of credits (100 cents)
  //   const addCreditsResponse = await addCreditsToWallet({
  //     orgId: TEST_ORG_ID,
  //     amount: 100, // $1.00 in cents
  //     reason: "Credit exhaustion test",
  //   });

  //   expect(addCreditsResponse.status).toBe(200);
  //   expect(addCreditsResponse.data.effectiveBalance).toBe(100);
  //   // sleep for 2 seconds to ensure wallet state is updated

  //   // Make requests until we get rate limited
  //   // gpt-4o-mini costs approximately ~$0.0002 per request (input: $0.15/1M, output: $0.6/1M)
  //   // With 50 tokens total per request, that's about $0.000015 per request
  //   // So $1 should allow ~66,666 requests, but let's assume higher costs
  //   // At ~$0.018 per request (if we're billing higher), we should exhaust after ~55 requests
  //   const maxRequests = 60;
  //   let successfulRequests = 0;
  //   let rateLimitedRequests = 0;
  //   let firstRateLimitAt = -1;

  //   const requestBody = createChatCompletionRequest({
  //     model: "gpt-5",
  //     messages: TEST_MESSAGES.SIMPLE,
  //     max_tokens: 10,
  //   });

  //   for (let i = 0; i < maxRequests; i++) {
  //     const response = await gatewayClient.post<ChatCompletionResponse>(
  //       GATEWAY_ENDPOINTS.CHAT_COMPLETIONS,
  //       requestBody
  //     );

  //     if (response.status === 200) {
  //       successfulRequests++;
  //     } else if (response.status === 402 || response.status === 429) {
  //       // 402: Payment Required (no credits)
  //       // 429: Rate Limited
  //       rateLimitedRequests++;
  //       if (firstRateLimitAt === -1) {
  //         firstRateLimitAt = i + 1; // 1-indexed for readability
  //       }
  //     }

  //     // Log progress every 10 requests
  //     if ((i + 1) % 10 === 0) {
  //       const walletState = await getWalletState(TEST_ORG_ID);
  //       console.log(
  //         `After ${i + 1} requests: ${successfulRequests} successful, ${rateLimitedRequests} rate limited, balance: ${walletState.data.effectiveBalance}`
  //       );
  //     }
  //   }

  //   // Get final wallet state
  //   const finalWalletState = await getWalletState(TEST_ORG_ID);

  //   console.log("\n=== Test Results ===");
  //   console.log(`Total successful requests: ${successfulRequests}`);
  //   console.log(`Total rate limited requests: ${rateLimitedRequests}`);
  //   console.log(`First rate limit occurred at request: ${firstRateLimitAt}`);
  //   console.log(
  //     `Final wallet balance: ${finalWalletState.data.effectiveBalance}`
  //   );
  //   console.log(
  //     `Total credits used: ${100 - finalWalletState.data.effectiveBalance}`
  //   );

  //   // Assertions
  //   expect(successfulRequests).toBeGreaterThan(0);
  //   expect(rateLimitedRequests).toBeGreaterThan(0);
  //   expect(firstRateLimitAt).toBeGreaterThan(0);
  //   expect(firstRateLimitAt).toBeLessThanOrEqual(60);
  //   expect(finalWalletState.data.effectiveBalance).toBeLessThanOrEqual(0);

  //   // We expect the first rate limit to occur around request 50-55
  //   // (allowing for some variance in actual costs)
  //   expect(firstRateLimitAt).toBeGreaterThan(30);
  //   expect(firstRateLimitAt).toBeLessThan(60);
  // }, 120000); // 2 minute timeout
});
