// import { Tier } from "../components/templates/usage/usagePage";
import getStripe from "../utlis/getStripe";
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

const subscribeToPro = async (discountCode: string) => {
  const response = await fetchPostJSON(
    `/api/checkout_sessions?discountCode=${discountCode}`
  );

  if (response.statusCode === 500) {
    console.error(response.message);
    return;
  }
  const stripe = await getStripe();
  const { error } = await stripe!.redirectToCheckout({
    sessionId: response.id,
  });
  console.warn(error.message);
};

const heliconeContactLink = process.env.NEXT_PUBLIC_HELICONE_CONTACT_LINK;
const heliconeBillingPortalLink =
  process.env.NEXT_PUBLIC_HELICONE_BILLING_PORTAL_LINK;

// export async function subscriptionChange(
//   changeTo: Tier,
//   changeFrom: Tier,
//   client: SupabaseClient,
//   discountCode: string
// ): Promise<Result<Stripe.Subscription, string>> {
//   if ((await client.auth.getUser()).data.user?.email === DEMO_EMAIL) {
//     alert("This is a demo account. You can't change your subscription.");
//     return { error: "Not implemented", data: null };
//   }
//   if (changeTo === "starter") {
//     if (changeFrom === "free") {
//       await subscribeToPro(discountCode);
//     } else if (changeFrom === "enterprise") {
//       window.open(heliconeContactLink, "_ blank");
//     } else if (changeFrom === "starter-pending-cancel") {
//       window.open(heliconeBillingPortalLink, "_ blank");
//     } else if (changeFrom === "starter") {
//       window.open(heliconeBillingPortalLink, "_ blank");
//     }
//   } else if (changeTo === "enterprise") {
//     window.open(heliconeContactLink, "_ blank");
//   } else if (changeTo === "free") {
//     if (changeFrom === "starter") {
//       window.open(heliconeBillingPortalLink, "_ blank");
//     } else if (changeFrom === "enterprise") {
//       window.open(heliconeContactLink, "_ blank");
//     }
//   }

//   return { error: "Not implemented", data: null };
// }
