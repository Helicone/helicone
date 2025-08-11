/**
 * Groq endpoint definitions with accurate pricing
 */

import type { Endpoint, EndpointKey } from "../../types";
import { GroqModelName } from "./models";

export const groqEndpoints = {
  // "llama-3.3-70b-versatile:groq": {
  //   modelId: "llama-3.3-70b-versatile",
  //   provider: "groq",
  //   providerModelId: "llama-3.3-70b-versatile",
  //   pricing: {
  //     prompt: 0, // TODO: set from Groq official pricing
  //     completion: 0,
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 32768,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "stop",
  //     "stream",
  //   ],
  //   ptbEnabled: false,
  // },
  // "llama-3.1-8b-instant:groq": {
  //   modelId: "llama-3.1-8b-instant",
  //   provider: "groq",
  //   providerModelId: "llama-3.1-8b-instant",
  //   pricing: {
  //     prompt: 0,
  //     completion: 0,
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 32768,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "stop",
  //     "stream",
  //   ],
  //   ptbEnabled: false,
  // },
  // "llama-guard-4-12b:groq": {
  //   modelId: "llama-guard-4-12b",
  //   provider: "groq",
  //   providerModelId: "meta-llama/llama-guard-4-12b",
  //   pricing: {
  //     prompt: 0,
  //     completion: 0,
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 32768,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "stop",
  //     "stream",
  //   ],
  //   ptbEnabled: false,
  // },
  // "deepseek-r1-distill-llama-70b:groq": {
  //   modelId: "deepseek-r1-distill-llama-70b",
  //   provider: "groq",
  //   providerModelId: "deepseek-r1-distill-llama-70b",
  //   pricing: {
  //     prompt: 0,
  //     completion: 0,
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 32768,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "stop",
  //     "stream",
  //   ],
  //   ptbEnabled: false,
  // },
  // "llama-4-maverick-17b-128e-instruct:groq": {
  //   modelId: "llama-4-maverick-17b-128e-instruct",
  //   provider: "groq",
  //   providerModelId: "meta-llama/llama-4-maverick-17b-128e-instruct",
  //   pricing: {
  //     prompt: 0,
  //     completion: 0,
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 32768,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "stop",
  //     "stream",
  //   ],
  //   ptbEnabled: false,
  // },
  // "llama-4-scout-17b-16e-instruct:groq": {
  //   modelId: "llama-4-scout-17b-16e-instruct",
  //   provider: "groq",
  //   providerModelId: "meta-llama/llama-4-scout-17b-16e-instruct",
  //   pricing: {
  //     prompt: 0,
  //     completion: 0,
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 32768,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "stop",
  //     "stream",
  //   ],
  //   ptbEnabled: false,
  // },
  // "qwen3-32b:groq": {
  //   modelId: "qwen3-32b",
  //   provider: "groq",
  //   providerModelId: "qwen/qwen3-32b",
  //   pricing: {
  //     prompt: 0,
  //     completion: 0,
  //   },
  //   contextLength: 131072,
  //   maxCompletionTokens: 32768,
  //   supportedParameters: [
  //     "max_tokens",
  //     "temperature",
  //     "top_p",
  //     "stop",
  //     "stream",
  //   ],
  //   ptbEnabled: false,
  // },
  // voice/ASR models removed (Helicone does not support voice)
} satisfies Record<EndpointKey<GroqModelName>, Endpoint>;

export type GroqEndpointId = keyof typeof groqEndpoints;
