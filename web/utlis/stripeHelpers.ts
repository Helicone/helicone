import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { Result } from "../lib/shared/result";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import { stripeServer } from "./stripeServer";

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
