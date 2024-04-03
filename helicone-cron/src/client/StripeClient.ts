import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Result } from "../result";

class StripeClient {
  private constructor(private stripe: Stripe) {}

  static async create(apiKey: string): Promise<Result<StripeClient, string>> {
    const stripe = await loadStripe(apiKey);

    if (!stripe) {
      throw new Error("Failed to load Stripe client");
    }

    return new StripeClient(stripe);
  }
}
