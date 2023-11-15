// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { loadStripe } from "@stripe/stripe-js";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const stripe = await loadStripe(
    "sk_test_51MUEfoFeVmeixR9wo5rQfV6pLNhZpQYYcXclEqUxYsMyREpKBC054irVCORFgcNBC3N4g4Zn35MbeBWSM5AUGBc1002dy4iDYA"
  );
  var charge = await stripe!.paymentRequest({
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
