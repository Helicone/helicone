import { ModelRow } from "../../interfaces/Cost";

// Vercel AI Gateway uses pass-through pricing - no markup on provider costs
// The actual costs depend on the underlying provider (OpenAI, Anthropic, etc.)
// Since we don't have direct access to Vercel's model list, we'll need to:
// 1. Parse the model from the response (e.g., "xai/grok-3" -> provider: xai, model: grok-3)
// 2. Map to the underlying provider's costs

export const costs: ModelRow[] = [];

// Note: Vercel AI Gateway pricing is dynamic and depends on:
// - The underlying provider (OpenAI, Anthropic, Google, xAI, etc.)
// - The specific model being used
// - Whether using Vercel credits (no markup) or custom API keys (3% markup)
//
// To get accurate costs, we would need to:
// 1. Extract the provider from the model string (e.g., "xai/grok-3" -> "xai")
// 2. Look up the model costs from the underlying provider
// 3. Apply any markup if using custom API keys (3%)
//
// Since Vercel's model list requires authentication to view, and costs are
// pass-through from providers, the best approach is to handle this dynamically
// in the cost calculation logic rather than maintaining a static list here.