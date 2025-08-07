// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { loadStripe } from "@stripe/stripe-js";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  const stripe = await loadStripe(process.env.STRIPE_PUBLISHABLE_KEY!);

  // Create payment request (test endpoint)
  await stripe!.paymentRequest({
    country: "US",
    currency: "usd",
    total: {
      label: "Demo total",
      amount: 1000,
    },
    requestPayerName: true,
    requestPayerEmail: true,
  });

  res.status(200).json({ name: "John Doe" });
}
