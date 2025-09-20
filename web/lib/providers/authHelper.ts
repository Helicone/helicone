import { getProvider } from "@helicone-package/cost/models/provider-helpers";
import { ModelProviderName } from "@helicone-package/cost/models/providers";

export function getProviderAuthType(
  providerId: ModelProviderName
): "api-key" | "oauth" | "aws-signature" | "service_account" | null {
  const providerResult = getProvider(providerId);
  if (providerResult.error || !providerResult.data) {
    return null;
  }
  return providerResult.data.auth;
}

export function getProviderRequiredConfig(
  providerId: ModelProviderName
): readonly string[] | null {
  const providerResult = getProvider(providerId);
  if (providerResult.error || !providerResult.data) {
    return null;
  }
  return providerResult.data.requiredConfig || null;
}