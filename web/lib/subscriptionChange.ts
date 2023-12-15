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
