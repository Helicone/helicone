/**
 * Google endpoint definitions with accurate pricing
 */

import type { Endpoint, EndpointKey } from "../../types";
import { GoogleModelName } from "./models";

export const googleEndpoints = {
  // "gemini-2.5-pro:vertex": {
  //   modelId: "gemini-2.5-pro",
  //   provider: "vertex",
  //   providerModelId: "gemini-2.5-pro",
  //   pricing: {
  //     prompt: 0, // TODO: set from Vertex official pricing
  //     completion: 0,
  //   },
  //   contextLength: 2000000,
  //   maxCompletionTokens: 32768,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "response_format",
  //   ],
  //   ptbEnabled: false,
  // },
  // "gemini-2.5-flash:vertex": {
  //   modelId: "gemini-2.5-flash",
  //   provider: "vertex",
  //   providerModelId: "gemini-2.5-flash",
  //   pricing: {
  //     prompt: 0, // TODO: set from Vertex official pricing
  //     completion: 0,
  //   },
  //   contextLength: 1000000,
  //   maxCompletionTokens: 32768,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "response_format",
  //   ],
  //   ptbEnabled: false,
  // },
  // "gemini-2.0-flash:vertex": {
  //   modelId: "gemini-2.0-flash",
  //   provider: "vertex",
  //   providerModelId: "gemini-2.0-flash",
  //   pricing: {
  //     prompt: 0, // TODO: set from Vertex official pricing
  //     completion: 0,
  //   },
  //   contextLength: 1000000,
  //   maxCompletionTokens: 32768,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "tools",
  //     "tool_choice",
  //     "response_format",
  //   ],
  //   ptbEnabled: false,
  // },
  // "gemini-1.5-pro:vertex": {
  //   modelId: "gemini-1.5-pro",
  //   provider: "vertex",
  //   providerModelId: "gemini-1.5-pro",
  //   pricing: {
  //     prompt: 0, // TODO: set from Vertex official pricing
  //     completion: 0,
  //   },
  //   contextLength: 2000000,
  //   maxCompletionTokens: 8192,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "tools",
  //     "tool_choice",
  //   ],
  //   ptbEnabled: false,
  // },
  // "gemini-1.5-flash:vertex": {
  //   modelId: "gemini-1.5-flash",
  //   provider: "vertex",
  //   providerModelId: "gemini-1.5-flash",
  //   pricing: {
  //     prompt: 0, // TODO: set from Vertex official pricing
  //     completion: 0,
  //   },
  //   contextLength: 1000000,
  //   maxCompletionTokens: 8192,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "top_k",
  //     "stop",
  //     "tools",
  //     "tool_choice",
  //   ],
  //   ptbEnabled: false,
  // },
} satisfies Record<EndpointKey<GoogleModelName>, Endpoint>;

export type GoogleEndpointId = keyof typeof googleEndpoints;
