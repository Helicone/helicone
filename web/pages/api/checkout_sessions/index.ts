import { NextApiRequest, NextApiResponse } from "next";

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
import Stripe from "stripe";
const CURRENCY = "usd";
const MIN_AMOUNT = 50;
const MAX_AMOUNT = 50000;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const amount: number = req.body.amount;
    try {
      // Validate the amount that was passed from the client.
      if (!(amount >= MIN_AMOUNT && amount <= MAX_AMOUNT)) {
        throw new Error("Invalid amount.");
      }

      const customers = await stripe.customers.list({
        email: "justintorre75+test69@gmail.com",
        expand: ["data.subscriptions"],
      });
      // console.log("customers", customers);
      let customer;
      if (customers.data.length === 0) {
        customer = await stripe.customers.create({
          email: "justintorre75+test69@gmail.com",
          name: "Justin Torre",
          expand: ["subscriptions"],
        });
      } else {
        customer = customers.data[0];
      }
      console.log("customer", customer.subscriptions);
      // Create Checkout Sessions from body params.
      const params: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        line_items: [
          {
            price: `price_1MWC01FeVmeixR9wL5VNBGIS`,
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer: customer.id,
        success_url: `${req.headers.origin}/result?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/donate-with-checkout`,
      };
      const checkoutSession: Stripe.Checkout.Session =
        await stripe.checkout.sessions.create(params);

      res.status(200).json(checkoutSession);
    } catch (err) {
      console.log("err", err);
      const errorMessage =
        err instanceof Error ? err.message : "Internal server error";
      res.status(500).json({ statusCode: 500, message: errorMessage });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
