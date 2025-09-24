import { DBWrapper, RateLimitPolicy } from "../db/DBWrapper";
import { RateLimitOptions } from "../clients/DurableObjectRateLimiterClient";
import { Result, ok, err } from "../util/results";
import { HeliconeProperties } from "../models/HeliconeProxyRequest";

export class RateLimitManager {
  async getRateLimitOptionsForKey(
    dbWrapper: DBWrapper,
    userId: string | undefined,
    heliconeProperties: HeliconeProperties
  ): Promise<Result<RateLimitOptions | undefined, string>> {
    try {
      // 1. Fetch policies
      const allPoliciesResult = await dbWrapper.getAllRateLimitPolicies();
      if (allPoliciesResult.error !== null || !allPoliciesResult.data) {
        return err(
          `Failed to retrieve rate limit policies: ${allPoliciesResult.error || "No data returned"}`
        );
      }
      const allPolicies = allPoliciesResult.data;
      if (!allPolicies || allPolicies.length === 0) {
        return ok(undefined);
      }

      const requestPropertyKeys = Object.keys(heliconeProperties);
      let selectedPolicy: RateLimitPolicy | null = null;

      // 2. Try property-based policies (highest priority)
      if (requestPropertyKeys.length > 0) {
        const matchingPropertyPolicies = allPolicies.filter(
          (policy) =>
            policy.segment &&
            policy.segment !== "user" &&
            requestPropertyKeys.includes(policy.segment)
        );
        if (matchingPropertyPolicies.length > 0) {
          selectedPolicy = this.findMostRestrictivePolicy(
            matchingPropertyPolicies
          );
          if (selectedPolicy) {
            return this.formatPolicyToOptions(selectedPolicy);
          }
        }
      }

      // 3. Try user-based policies (medium priority)
      if (userId) {
        const matchingUserPolicies = allPolicies.filter(
          (policy) => policy.segment === "user"
        );
        if (matchingUserPolicies.length > 0) {
          selectedPolicy = this.findMostRestrictivePolicy(matchingUserPolicies);
          if (selectedPolicy) {
            return this.formatPolicyToOptions(selectedPolicy);
          }
        }
      }

      // 4. Try global policies (lowest priority)
      const globalPolicies = allPolicies.filter((policy) => !policy.segment);
      if (globalPolicies.length > 0) {
        selectedPolicy = this.findMostRestrictivePolicy(globalPolicies);
        if (selectedPolicy) {
          return this.formatPolicyToOptions(selectedPolicy);
        }
      }

      // 5. No applicable policy found
      return ok(undefined);
    } catch (error) {
      return err(
        `Exception selecting rate limit policy: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  private formatPolicyToOptions(
    policy: RateLimitPolicy
  ): Result<RateLimitOptions, string> {
    return ok({
      quota: policy.quota,
      time_window: policy.windowSeconds,
      unit: policy.unit,
      segment: policy.segment ?? undefined,
    });
  }

  private findMostRestrictivePolicy(
    policies: RateLimitPolicy[]
  ): RateLimitPolicy | null {
    if (!policies || policies.length === 0) {
      return null;
    }

    // Calculate RPM for a policy - lower is more restrictive
    const calculateRPM = (policy: RateLimitPolicy): number => {
      if (policy.windowSeconds > 0) {
        return (policy.quota / policy.windowSeconds) * 60;
      } else if (policy.windowSeconds === 0 && policy.quota > 0) {
        return Infinity; // Effectively blocks all requests if quota > 0
      } else {
        // windowSeconds <= 0 and quota <= 0 - less restrictive or invalid
        return policy.quota === 0 ? 0 : Infinity;
      }
    };

    // Map each policy to an object with the policy and its RPM,
    // then reduce to find the one with the lowest RPM
    return policies
      .map((policy) => ({
        policy,
        rpm: calculateRPM(policy),
      }))
      .reduce(
        (mostRestrictive, current) =>
          current.rpm < mostRestrictive.rpm ? current : mostRestrictive,
        { policy: policies[0], rpm: calculateRPM(policies[0]) }
      ).policy;
  }
}
