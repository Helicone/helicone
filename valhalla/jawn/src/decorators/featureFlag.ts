import "reflect-metadata";
import { checkFeatureFlag } from "../lib/utils/featureFlags";
import { isError, Result, err } from "../packages/common/result";
import { Controller } from "tsoa";
import { JawnAuthenticatedRequest } from "../types/request";

const FEATURE_FLAG_METADATA_KEY = Symbol("featureFlags");

/**
 * Base constraint for error types - can be string enums, string literals, or any serializable type
 */
export type ErrorType = string | number | symbol;

/**
 * Generic error formatter type that can work with any error system
 */
export type ErrorFormatter<TError extends ErrorType = string> = (flag: string) => {
  message: string;
  statusCode: number;
  error?: TError;
};

/**
 * Options for feature flag decorator with generic error type
 */
export interface FeatureFlagOptions<TError extends ErrorType = string> {
  errorFormatter?: ErrorFormatter<TError>;
}

/**
 * Metadata stored for feature flags
 */
export interface FeatureFlagMetadata<TError extends ErrorType = string> {
  flags: string[];
  options?: FeatureFlagOptions<TError>;
}

/**
 * Type for controller methods that can be decorated
 * These methods take JawnAuthenticatedRequest and return Result
 */
type ControllerMethod = (
  this: Controller,
  ...args: any[]  // Could include @Body, @Request, @Query params etc.
) => Promise<Result<any, string>>;

/**
 * Generic decorator to require feature flag(s) for a controller method.
 * Can be used with any error system by providing a custom error formatter.
 * 
 * @param flag - The feature flag name to check
 * @param options - Optional configuration for error handling
 * 
 * @example
 * // Using default error format
 * @RequireFeatureFlag("my-feature")
 * 
 * @example
 * // Using with HQL error system (strongly typed)
 * @RequireFeatureFlag<HqlErrorCode>(HQL_FEATURE_FLAG, {
 *   errorFormatter: (flag) => ({
 *     message: `[${HqlErrorCode.FEATURE_NOT_ENABLED}] Feature not enabled`,
 *     statusCode: 403,
 *     error: HqlErrorCode.FEATURE_NOT_ENABLED
 *   })
 * })
 * 
 * @example
 * // Using with string literal types
 * type MyError = "FEATURE_DISABLED" | "NOT_AVAILABLE";
 * @RequireFeatureFlag<MyError>("my-feature", {
 *   errorFormatter: (flag) => ({
 *     message: `Feature ${flag} is disabled`,
 *     statusCode: 403,
 *     error: "FEATURE_DISABLED"
 *   })
 * })
 */
export function RequireFeatureFlag<TError extends ErrorType = string>(
  flag: string,
  options?: FeatureFlagOptions<TError>
): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const existingMetadata: FeatureFlagMetadata<TError> = Reflect.getMetadata(
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

    const originalMethod = descriptor.value as ControllerMethod;

    descriptor.value = async function (
      this: Controller,
      ...args: any[]
    ): Promise<Result<any, string>> {
      // Find the JawnAuthenticatedRequest in the arguments
      const request = args.find(
        (arg): arg is JawnAuthenticatedRequest => 
          arg !== null && 
          typeof arg === "object" && 
          "authParams" in arg
      );

      if (!request?.authParams?.organizationId) {
        this.setStatus(401);
        return err("Authentication required");
      }

      const metadata: FeatureFlagMetadata<TError> = Reflect.getMetadata(
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
          return err(errorInfo.message);
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
export function RequireFeatureFlags<TError extends ErrorType = string>(
  flags: string[],
  options?: FeatureFlagOptions<TError>
): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    flags.forEach((flag) => {
      RequireFeatureFlag<TError>(flag, options)(target, propertyKey, descriptor);
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
export function createErrorFormatter<TError extends ErrorType>(
  errorSelector: (flag: string) => TError,
  messageFormatter: (error: TError, flag: string) => string,
  statusCode: number = 403
): ErrorFormatter<TError> {
  return (flag: string) => {
    const error = errorSelector(flag);
    return {
      message: messageFormatter(error, flag),
      statusCode,
      error
    };
  };
}

/**
 * Retrieves feature flag metadata from a decorated method
 */
export function getFeatureFlagMetadata<TError extends ErrorType = string>(
  target: object,
  propertyKey: string | symbol
): FeatureFlagMetadata<TError> | undefined {
  return Reflect.getMetadata(FEATURE_FLAG_METADATA_KEY, target, propertyKey);
}