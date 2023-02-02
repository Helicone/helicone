import Stripe from "stripe";
import getStripe from "../utlis/getStripe";
import { Result } from "./result";
export async function fetchPostJSON(url: string, data?: {}) {
  try {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *client
      body: JSON.stringify(data || {}), // body data type must match "Content-Type" header
    });
    return await response.json(); // parses JSON response into native JavaScript objects
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(err.message);
    }
    throw err;
  }
}

const subscribeToPro = async () => {
  // Create a Checkout Session.
  const response = await fetchPostJSON("/api/checkout_sessions");

  if (response.statusCode === 500) {
    console.error(response.message);
    return;
  }

  // Redirect to Checkout.
  const stripe = await getStripe();
  const { error } = await stripe!.redirectToCheckout({
    // Make the id field from the Checkout Session creation API response
    // available to this file, so you can provide it as parameter here
    // instead of the {{CHECKOUT_SESSION_ID}} placeholder.
    sessionId: response.id,
  });
  // If `redirectToCheckout` fails due to a browser or network
  // error, display the localized error message to your customer
  // using `error.message`.
  console.warn(error.message);
};

export async function subscriptionChange(
  changeTo: "free" | "pro" | "enterprise"
): Promise<Result<Stripe.Subscription, string>> {
  if (changeTo === "pro") {
    await subscribeToPro();
  }
  return { error: "Not implemented", data: null };
}
