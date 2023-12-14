import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { Result } from "../lib/result";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { stripeServer } from "./stripeServer";

/**
 * Retrieves a Stripe customer based on their email.
 * @param email - The email of the customer.
 * @returns A promise that resolves to a Result object containing the customer data or an error message.
 */
export async function getStripeCustomer(
  email: string
): Promise<Result<Stripe.Customer, string>> {
  try {
    const customers = await stripeServer.customers.list({
      email,
      expand: ["data.subscriptions"],
    });
    let customer;
    if (customers.data.length === 0) {
      customer = await stripeServer.customers.create({
        email,
        name: email,
        expand: ["subscriptions"],
      });
    } else {
      customer = customers.data[0];
    }
    return { data: customer, error: null };
  } catch (err) {
    return { data: null, error: `Got exception ${err}` };
  }
}

/**
 * Retrieves the Stripe customer associated with the provided email address.
 *
 * @param req - The NextApiRequest object.
 * @param res - The NextApiResponse object.
 * @returns A Promise that resolves to a Result object containing the Stripe customer or an error message.
 */
export async function getStripeCustomerFromNext(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Result<Stripe.Customer, string>> {
  const supabase = new SupabaseServerWrapper({ req, res }).getClient();
  const email = (await supabase.auth.getUser())?.data.user?.email;
  if (!email) {
    return { data: null, error: "Unauthorized" };
  }
  return await getStripeCustomer(email);
}

/**
 * Formats the amount for Stripe payment.
 * @param amount - The amount to be formatted.
 * @param currency - The currency in which the amount is to be formatted.
 * @returns The formatted amount.
 */
export function formatAmountForStripe(
  amount: number,
  currency: string
): number {
  let numberFormat = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency: boolean = true;
  for (let part of parts) {
    if (part.type === "decimal") {
      zeroDecimalCurrency = false;
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
}
