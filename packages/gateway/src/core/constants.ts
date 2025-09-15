/**
 * Internal error codes used throughout the gateway
 */
export const INTERNAL_ERRORS = {
  Cancelled: -3,
} as const;

export type InternalErrorCode = typeof INTERNAL_ERRORS[keyof typeof INTERNAL_ERRORS];