import type { Endpoint } from "../../../types";

export const endpoints = {
  // Endpoints are commented out in original file
  // Add endpoints here when they become available
} satisfies Record<string, Endpoint>;

export type EndpointId = keyof typeof endpoints;