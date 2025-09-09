import "reflect-metadata";
import { checkFeatureFlag } from "../lib/utils/featureFlags";
import { isError } from "../packages/common/result";
import { createHqlError, HqlErrorCode } from "../lib/errors/HqlErrors";
import { Controller } from "tsoa";
import { JawnAuthenticatedRequest } from "../types/request";

const FEATURE_FLAG_METADATA_KEY = Symbol("featureFlags");

export interface FeatureFlagMetadata {
  flags: string[];
  errorCode?: HqlErrorCode;
}

export function RequireFeatureFlag(
  flag: string,
  errorCode: HqlErrorCode = HqlErrorCode.FEATURE_NOT_ENABLED
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
    ) || { flags: [] };

    existingMetadata.flags.push(flag);
    existingMetadata.errorCode = errorCode;

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
          const error = createHqlError(
            metadata.errorCode || HqlErrorCode.FEATURE_NOT_ENABLED,
            `Feature '${flagName}' is not enabled for this organization`
          );
          this.setStatus(error.statusCode || 403);
          
          const codePrefix = error.code ? `[${error.code}] ` : '';
          const message = error.details ? `${error.message}: ${error.details}` : error.message;
          return {
            error: `${codePrefix}${message}`,
            data: null,
          };
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export function RequireFeatureFlags(
  flags: string[],
  errorCode: HqlErrorCode = HqlErrorCode.FEATURE_NOT_ENABLED
): MethodDecorator {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    flags.forEach((flag) => {
      RequireFeatureFlag(flag, errorCode)(target, propertyKey, descriptor);
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