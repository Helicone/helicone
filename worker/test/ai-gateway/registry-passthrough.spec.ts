// import { SELF } from "cloudflare:test";
// import { fetchMock } from "cloudflare:test";
// import {
//   describe,
//   it,
//   expect,
//   beforeAll,
//   afterAll,
//   beforeEach,
//   afterEach,
// } from "vitest";
// import "../setup";
// import {
//   setupTestEnvironment,
//   cleanupTestEnvironment,
//   createAIGatewayRequest,
//   createOpenAIMockResponse,
// } from "../test-utils";

// const TEST_HELICONE_API_KEY = "sk-helicone-aaaaaa1-bbbbbbb-ccccccc-ddddddd";

// describe("Passthrough and Fallback Registry Tests", () => {
//   beforeEach(() => {
//     setupTestEnvironment();
//   });

//   afterEach(() => {
//     cleanupTestEnvironment();
//   });

//   describe("Fallback with comma-separated models", () => {
//     it("should try bedrock first, then fallback to anthropic", async () => {
//       console.log("[TEST] Starting test - setting up mocks");

//       // Mock Anthropic FIRST (this works fine)
//       fetchMock
//         .get("https://api.anthropic.com")
//         .intercept({
//           path: "/v1/chat/completions",
//           method: "POST",
//         })
//         .reply(() => {
//           console.log("[TEST] Anthropic mock hit");
//           return {
//             statusCode: 200,
//             data: createOpenAIMockResponse("claude-3-7-sonnet-20250219"),
//           };
//         })
//         .persist();

//       // Now mock Bedrock - try without persist to see if that helps
//       console.log("[TEST] Setting up Bedrock mock");
//       fetchMock
//         .get("https://bedrock-runtime.us-east-1.amazonaws.com")
//         .intercept({
//           path: "/model/us.anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
//           method: "POST",
//         })
//         .reply(() => {
//           console.log("[TEST] Bedrock mock hit");
//           return {
//             statusCode: 500,
//             data: { error: "Bedrock failed" },
//           };
//         })
//         .persist();

//       console.log("[TEST] Sending request to AI Gateway");
//       const response = await SELF.fetch(
//         "https://ai-gateway.helicone.ai/v1/chat/completions",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
//           },
//           body: JSON.stringify({
//             model:
//               "us.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock,claude-3-7-sonnet-20250219/anthropic",
//             messages: [{ role: "user", content: "Test fallback" }],
//             max_tokens: 50,
//           }),
//         }
//       );

//       console.log("[TEST] Got response with status:", response.status);
//       expect(response.status).toBe(200);
//       const body = (await response.json()) as any;
//       console.log("[TEST] Response body:", body);
//       expect(body).toHaveProperty("id");
//       expect(body.id).toBe("chatcmpl-test");
//     });
//     // it("should handle both models failing", async () => {
//     //   // Mock Bedrock to fail
//     //   fetchMock
//     //     .get("https://bedrock-runtime.us-east-1.amazonaws.com")
//     //     .intercept({
//     //       path: "/model/us.anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
//     //       method: "POST",
//     //     })
//     //     .reply(() => ({
//     //       statusCode: 500,
//     //       data: { error: "Bedrock failed" },
//     //     }))
//     //     .persist();
//     //   // Mock Anthropic to also fail (on /v1/chat/completions for OPENAI mapping)
//     //   fetchMock
//     //     .get("https://api.anthropic.com")
//     //     .intercept({
//     //       path: "/v1/chat/completions",
//     //       method: "POST",
//     //     })
//     //     .reply(() => ({
//     //       statusCode: 503,
//     //       data: { error: "Anthropic service unavailable" },
//     //     }))
//     //     .persist();
//     //   const response = await SELF.fetch(
//     //     "https://ai-gateway.helicone.ai/v1/chat/completions",
//     //     {
//     //       method: "POST",
//     //       headers: {
//     //         "Content-Type": "application/json",
//     //         Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
//     //       },
//     //       body: JSON.stringify({
//     //         model:
//     //           "us.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock,claude-3-7-sonnet-20250219/anthropic",
//     //         messages: [{ role: "user", content: "Test fallback" }],
//     //         max_tokens: 50,
//     //       }),
//     //     }
//     //   );
//     //   // Should return error when all models fail
//     //   expect(response.status).toBeGreaterThanOrEqual(400);
//     // });
//   });

//   // describe("Model with NO_MAPPING and fallback", () => {
//   //   it("should handle Anthropic SDK format with fallback", async () => {
//   //     const model =
//   //       "claude-3-7-sonnet-20250219/anthropic,us.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock";

//   //     // Mock first model (anthropic) to succeed on /v1/messages
//   //     fetchMock
//   //       .get("https://api.anthropic.com")
//   //       .intercept({
//   //         path: "/v1/messages",
//   //         method: "POST",
//   //       })
//   //       .reply(() => ({
//   //         statusCode: 200,
//   //         data: {
//   //           id: "msg_anthropic_sdk",
//   //           type: "message",
//   //           role: "assistant",
//   //           content: [{ type: "text", text: "Anthropic SDK response" }],
//   //           model: "claude-3-7-sonnet-20250219",
//   //           usage: { input_tokens: 10, output_tokens: 5 },
//   //         },
//   //       }))
//   //       .persist();

//   //     const response = await SELF.fetch(
//   //       "https://ai-gateway.helicone.ai/v1/chat/completions",
//   //       {
//   //         method: "POST",
//   //         headers: {
//   //           "Content-Type": "application/json",
//   //           Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
//   //           "Helicone-Gateway-Body-Mapping": "NO_MAPPING",
//   //         },
//   //         body: JSON.stringify({
//   //           model: model,
//   //           messages: [{ role: "user", content: "Test SDK format" }],
//   //           max_tokens: 50,
//   //         }),
//   //       }
//   //     );

//   //     expect(response.status).toBe(200);
//   //     const body = (await response.json()) as any;
//   //     expect(body).toHaveProperty("id");
//   //     expect(body.id).toBe("msg_anthropic_sdk");
//   //   });

//   //   // it("should fallback to bedrock when anthropic fails with NO_MAPPING", async () => {
//   //   //   const model =
//   //   //     "claude-3-7-sonnet-20250219/anthropic,us.anthropic.claude-3-7-sonnet-20250219-v1:0/bedrock";

//   //   //   // Mock first model (anthropic) to fail on /v1/messages (NO_MAPPING)
//   //   //   fetchMock
//   //   //     .get("https://api.anthropic.com")
//   //   //     .intercept({
//   //   //       path: "/v1/messages",
//   //   //       method: "POST",
//   //   //     })
//   //   //     .reply(() => ({
//   //   //       statusCode: 500,
//   //   //       data: { error: "Anthropic failed" },
//   //   //     }))
//   //   //     .persist();

//   //   //   // Mock Bedrock to succeed (Bedrock doesn't change with NO_MAPPING)
//   //   //   fetchMock
//   //   //     .get("https://bedrock-runtime.us-east-1.amazonaws.com")
//   //   //     .intercept({
//   //   //       path: "/model/us.anthropic.claude-3-7-sonnet-20250219-v1:0/invoke",
//   //   //       method: "POST",
//   //   //     })
//   //   //     .reply(() => ({
//   //   //       statusCode: 200,
//   //   //       data: {
//   //   //         id: "msg_bedrock_fallback",
//   //   //         type: "message",
//   //   //         role: "assistant",
//   //   //         content: [{ type: "text", text: "Bedrock fallback response" }],
//   //   //         model: "us.anthropic.claude-3-7-sonnet-20250219-v1:0",
//   //   //         usage: { input_tokens: 10, output_tokens: 5 },
//   //   //       },
//   //   //     }))
//   //   //     .persist();

//   //   //   const response = await SELF.fetch(
//   //   //     "https://ai-gateway.helicone.ai/v1/chat/completions",
//   //   //     {
//   //   //       method: "POST",
//   //   //       headers: {
//   //   //         "Content-Type": "application/json",
//   //   //         Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
//   //   //         "Helicone-Gateway-Body-Mapping": "NO_MAPPING",
//   //   //       },
//   //   //       body: JSON.stringify({
//   //   //         model: model,
//   //   //         messages: [{ role: "user", content: "Test SDK fallback" }],
//   //   //         max_tokens: 50,
//   //   //       }),
//   //   //     }
//   //   //   );

//   //   //   expect(response.status).toBe(200);
//   //   //   const body = (await response.json()) as any;
//   //   //   expect(body).toHaveProperty("id");
//   //   //   expect(body.id).toBe("msg_bedrock_fallback");
//   //   // });
//   // });

//   // describe("Passthrough models", () => {
//   //   it("should handle unknown model with explicit provider", async () => {
//   //     const model = "custom-model-xyz/openai";

//   //     // Mock OpenAI endpoint for passthrough (always /v1/chat/completions for OpenAI)
//   //     fetchMock
//   //       .get("https://api.openai.com")
//   //       .intercept({
//   //         path: "/v1/chat/completions",
//   //         method: "POST",
//   //       })
//   //       .reply(() => ({
//   //         statusCode: 200,
//   //         data: {
//   //           id: "chatcmpl-passthrough",
//   //           object: "chat.completion",
//   //           created: Date.now(),
//   //           model: "custom-model-xyz",
//   //           choices: [
//   //             {
//   //               index: 0,
//   //               message: {
//   //                 role: "assistant",
//   //                 content: "Passthrough response",
//   //               },
//   //               finish_reason: "stop",
//   //             },
//   //           ],
//   //           usage: {
//   //             prompt_tokens: 10,
//   //             completion_tokens: 5,
//   //             total_tokens: 15,
//   //           },
//   //         },
//   //       }))
//   //       .persist();

//   //     const response = await SELF.fetch(
//   //       "https://ai-gateway.helicone.ai/v1/chat/completions",
//   //       {
//   //         method: "POST",
//   //         headers: {
//   //           "Content-Type": "application/json",
//   //           Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
//   //         },
//   //         body: JSON.stringify({
//   //           model: model,
//   //           messages: [{ role: "user", content: "Test passthrough" }],
//   //           max_tokens: 50,
//   //         }),
//   //       }
//   //     );

//   //     expect(response.status).toBe(200);
//   //     const body = (await response.json()) as any;
//   //     expect(body).toHaveProperty("id");
//   //     expect(body.id).toBe("chatcmpl-passthrough");
//   //   });

//   //   it("should handle custom bedrock model IDs", async () => {
//   //     const model = "us.custom.model-v1:0/bedrock";

//   //     // Mock Bedrock endpoint for custom model
//   //     fetchMock
//   //       .get("https://bedrock-runtime.us-east-1.amazonaws.com")
//   //       .intercept({
//   //         path: "/model/us.custom.model-v1:0/invoke",
//   //         method: "POST",
//   //       })
//   //       .reply(() => ({
//   //         statusCode: 200,
//   //         data: {
//   //           id: "bedrock-custom",
//   //           type: "message",
//   //           role: "assistant",
//   //           content: [{ type: "text", text: "Custom Bedrock response" }],
//   //           model: "us.custom.model-v1:0",
//   //           usage: { input_tokens: 10, output_tokens: 5 },
//   //         },
//   //       }))
//   //       .persist();

//   //     const response = await SELF.fetch(
//   //       "https://ai-gateway.helicone.ai/v1/chat/completions",
//   //       {
//   //         method: "POST",
//   //         headers: {
//   //           "Content-Type": "application/json",
//   //           Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
//   //         },
//   //         body: JSON.stringify({
//   //           model: model,
//   //           messages: [{ role: "user", content: "Test custom bedrock" }],
//   //           max_tokens: 50,
//   //         }),
//   //       }
//   //     );

//   //     expect(response.status).toBe(200);
//   //     const body = (await response.json()) as any;
//   //     expect(body).toHaveProperty("id");
//   //     expect(body.id).toBe("bedrock-custom");
//   //   });

//   //   it("should handle unknown anthropic model with NO_MAPPING", async () => {
//   //     const model = "custom-anthropic-model/anthropic";

//   //     // Mock Anthropic /v1/messages endpoint for NO_MAPPING
//   //     fetchMock
//   //       .get("https://api.anthropic.com")
//   //       .intercept({
//   //         path: "/v1/messages",
//   //         method: "POST",
//   //       })
//   //       .reply(() => ({
//   //         statusCode: 200,
//   //         data: {
//   //           id: "msg_custom_anthropic",
//   //           type: "message",
//   //           role: "assistant",
//   //           content: [{ type: "text", text: "Custom Anthropic response" }],
//   //           model: "custom-anthropic-model",
//   //           usage: { input_tokens: 10, output_tokens: 5 },
//   //         },
//   //       }))
//   //       .persist();

//   //     const response = await SELF.fetch(
//   //       "https://ai-gateway.helicone.ai/v1/chat/completions",
//   //       {
//   //         method: "POST",
//   //         headers: {
//   //           "Content-Type": "application/json",
//   //           Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
//   //           "Helicone-Gateway-Body-Mapping": "NO_MAPPING",
//   //         },
//   //         body: JSON.stringify({
//   //           model: model,
//   //           messages: [{ role: "user", content: "Test custom anthropic" }],
//   //           max_tokens: 50,
//   //         }),
//   //       }
//   //     );

//   //     expect(response.status).toBe(200);
//   //     const body = (await response.json()) as any;
//   //     expect(body).toHaveProperty("id");
//   //     expect(body.id).toBe("msg_custom_anthropic");
//   //   });

//   //   it("should handle unknown anthropic model with OPENAI mapping", async () => {
//   //     const model = "custom-anthropic-model/anthropic";

//   //     // Mock Anthropic /v1/chat/completions endpoint for OPENAI mapping
//   //     fetchMock
//   //       .get("https://api.anthropic.com")
//   //       .intercept({
//   //         path: "/v1/chat/completions",
//   //         method: "POST",
//   //       })
//   //       .reply(() => ({
//   //         statusCode: 200,
//   //         data: {
//   //           id: "chatcmpl-custom",
//   //           object: "chat.completion",
//   //           created: Date.now(),
//   //           model: "custom-anthropic-model",
//   //           choices: [
//   //             {
//   //               index: 0,
//   //               message: {
//   //                 role: "assistant",
//   //                 content: "Custom Anthropic OpenAI-style response",
//   //               },
//   //               finish_reason: "stop",
//   //             },
//   //           ],
//   //           usage: {
//   //             prompt_tokens: 10,
//   //             completion_tokens: 5,
//   //             total_tokens: 15,
//   //           },
//   //         },
//   //       }))
//   //       .persist();

//   //     const response = await SELF.fetch(
//   //       "https://ai-gateway.helicone.ai/v1/chat/completions",
//   //       {
//   //         method: "POST",
//   //         headers: {
//   //           "Content-Type": "application/json",
//   //           Authorization: `Bearer ${TEST_HELICONE_API_KEY}`,
//   //           // No Helicone-Gateway-Body-Mapping header means OPENAI mapping
//   //         },
//   //         body: JSON.stringify({
//   //           model: model,
//   //           messages: [{ role: "user", content: "Test custom anthropic openai" }],
//   //           max_tokens: 50,
//   //         }),
//   //       }
//   //     );

//   //     expect(response.status).toBe(200);
//   //     const body = (await response.json()) as any;
//   //     expect(body).toHaveProperty("id");
//   //     expect(body.id).toBe("chatcmpl-custom");
//   //   });
//   // });
// });
