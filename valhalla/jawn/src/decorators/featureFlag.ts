import "reflect-metadata";
import { checkFeatureFlag } from "../lib/utils/featureFlags";
import { isError } from "../packages/common/result";
import { Controller } from "tsoa";
import { JawnAuthenticatedRequest } from "../types/request";

const FEATURE_FLAG_METADATA_KEY = Symbol("featureFlags");

export interface FeatureFlagError {
  message: string;
  statusCode: number;
  code?: string;
}

export interface FeatureFlagOptions {
  errorFormatter?: (flag: string) => FeatureFlagError;
}

export interface FeatureFlagMetadata {
  flags: string[];
  options?: FeatureFlagOptions;
}

/**
 * Decorator to require feature flag(s) for a controller method.
 * 
 * @param flag - The feature flag name to check
 * @param options - Optional configuration for error handling
 * 
 * @example
 * // Using default error format
 * @RequireFeatureFlag("my-feature")
 * 
 * @example
 * // Using custom error format for HQL
 * @RequireFeatureFlag(HQL_FEATURE_FLAG, {
 *   errorFormatter: (flag) => ({
 *     message: `[HQL_FEATURE_NOT_ENABLED] Access to HQL feature is not enabled for your organization`,
 *     statusCode: 403
 *   })
 * })
 */
export function RequireFeatureFlag(
  flag: string,
  options?: FeatureFlagOptions
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    const existingMetadata: FeatureFlagMetadata = Reflect.getMetadata(
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

      const metadata: FeatureFlagMetadata = Reflect.getMetadata(
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
 */
export function RequireFeatureFlags(
  flags: string[],
  options?: FeatureFlagOptions
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    flags.forEach((flag) => {
      RequireFeatureFlag(flag, options)(target, propertyKey, descriptor);
    });
    return descriptor;
  };
}

export function getFeatureFlagMetadata(
  target: any,
  propertyKey: string | symbol
): FeatureFlagMetadata | undefined {
  return Reflect.getMetadata(FEATURE_FLAG_METADATA_KEY, target, propertyKey);
}