import Stripe from "stripe";

/**
 * Stripe server instance.
 * @remarks
 * This instance is used to interact with the Stripe API.
 */
export const stripeServer = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});
