// Markup applied on the Helicone AI Gateway when using
// OpenRouter via Pass-Through-Billing.
export const OPENROUTER_PTB_MARKUP = 1.055;

export interface OpenRouterCostDetails {
  upstream_inference_cost?: number;
  upstream_inference_prompt_cost?: number;
  upstream_inference_completions_cost?: number;
}

export function getOpenRouterDeclaredCost(
  isPassthroughBilling: boolean,
  cost?: number,
  cost_details?: OpenRouterCostDetails
): number | undefined {
  // Priority 0: Passthrough Billing markup
  if (isPassthroughBilling && cost) {
    return (cost ?? 0) * OPENROUTER_PTB_MARKUP;
  }

  // Priority 1: Direct cost field
  if (cost && cost > 0) {
    return cost;
  }

  // Priority 2: Upstream inference cost
  if (cost_details?.upstream_inference_cost && cost_details.upstream_inference_cost > 0) {
    return cost_details.upstream_inference_cost;
  }

  // Priority 3: Sum of prompt and completion costs
  if (
    cost_details?.upstream_inference_prompt_cost &&
    cost_details?.upstream_inference_completions_cost &&
    cost_details.upstream_inference_prompt_cost > 0 &&
    cost_details.upstream_inference_completions_cost > 0
  ) {
    return cost_details.upstream_inference_prompt_cost + cost_details.upstream_inference_completions_cost;
  }

  return undefined;
}

