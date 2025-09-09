import "reflect-metadata";
import { checkFeatureFlag } from "../lib/utils/featureFlags";
import { isError } from "../packages/common/result";
import { Controller } from "tsoa";
import { JawnAuthenticatedRequest } from "../types/request";

const FEATURE_FLAG_METADATA_KEY = Symbol("featureFlags");

/**
 * Generic error formatter type that can work with any error system
 */
export type ErrorFormatter<T = any> = (flag: string) => {
  message: string;
  statusCode: number;
  error?: T;
};

/**
 * Options for feature flag decorator with generic error type
 */
export interface FeatureFlagOptions<T = any> {
  errorFormatter?: ErrorFormatter<T>;
}

/**
 * Metadata stored for feature flags
 */
export interface FeatureFlagMetadata<T = any> {
  flags: string[];
  options?: FeatureFlagOptions<T>;
}

export function RequireFeatureFlag<T = any>(
  flag: string,
  options?: FeatureFlagOptions<T>
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const existingMetadata: FeatureFlagMetadata<T> = Reflect.getMetadata(
      FEATURE_FLAG_METADATA_KEY,
      target,
      propertyKey
    ) || { flags: [], options };

    existingMetadata.flags.push(flag);
    if (options) {
      existingMetadata.options = options;
    }

    Reflect.defineMetadata(
      FEATURE_FLAG_METADATA_KEY,
      existingMetadata,
      target,
      propertyKey
    );

    const originalMethod = descriptor.value;

    descriptor.value = async function (
      this: Controller,
      ...args: any[]
    ) {
      const request = args.find(
        (arg) => arg && typeof arg === "object" && "authParams" in arg
      ) as JawnAuthenticatedRequest | undefined;

      if (!request?.authParams?.organizationId) {
        this.setStatus(401);
        return {
          error: "Authentication required",
          data: null,
        };
      }

      const metadata: FeatureFlagMetadata<T> = Reflect.getMetadata(
        FEATURE_FLAG_METADATA_KEY,
        target,
        propertyKey
      );

      for (const flagName of metadata.flags) {
        const featureFlagResult = await checkFeatureFlag(
          request.authParams.organizationId,
          flagName
        );

        if (isError(featureFlagResult)) {
          // Use custom error formatter if provided, otherwise use default
          const errorInfo = metadata.options?.errorFormatter
            ? metadata.options.errorFormatter(flagName)
            : {
                message: `Feature '${flagName}' is not enabled for this organization`,
                statusCode: 403
              };
          
          this.setStatus(errorInfo.statusCode);
          return {
            error: errorInfo.message,
            data: null,
          };
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Decorator to require multiple feature flags for a controller method.
 * All flags must be enabled for the method to execute.
 * 
 * @param flags - Array of feature flag names to check
 * @param options - Optional configuration for error handling
 * 
 * @example
 * @RequireFeatureFlags<MyErrorType>(["feature1", "feature2"], {
 *   errorFormatter: (flag) => ({ ... })
 * })
 */
export function RequireFeatureFlags<T = any>(
  flags: string[],
  options?: FeatureFlagOptions<T>
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    flags.forEach((flag) => {
      RequireFeatureFlag<T>(flag, options)(target, propertyKey, descriptor);
    });
    return descriptor;
  };
}

/**
 * Helper function to create a typed error formatter for a specific error system
 * 
 * @example
 * const hqlErrorFormatter = createErrorFormatter<HqlErrorCode>(
 *   (flag) => HqlErrorCode.FEATURE_NOT_ENABLED,
 *   (code) => `[${code}] Feature not enabled`,
 *   403
 * );
 */
export function createErrorFormatter<T>(
  errorSelector: (flag: string) => T,
  messageFormatter: (error: T, flag: string) => string,
  statusCode: number = 403
): ErrorFormatter<T> {
  return (flag: string) => {
    const error = errorSelector(flag);
    return {
      message: messageFormatter(error, flag),
      statusCode,
      error
    };
  };
}

export function getFeatureFlagMetadata<T = any>(
  target: any,
  propertyKey: string | symbol
): FeatureFlagMetadata<T> | undefined {
  return Reflect.getMetadata(FEATURE_FLAG_METADATA_KEY, target, propertyKey);
}