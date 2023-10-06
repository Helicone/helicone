/**
 * This uses the transactional storage API from Cloudflare to ensure
 * there are no race conditions when updating our rate limit counters.
 * https://developers.cloudflare.com/durable-objects/api/transactional-storage-api/
 *
 * The API is single threaded, but can interleave between I/O operations.
 * This means we have to obtain a lock before we can update the rate limit
 * counters.
 *
 */
export class AtomicRateLimiter {
  constructor(private state: DurableObjectState) {
    console.log("AtomicRateLimiter created");
  }

  async fetch(request: Request) {
    return new Response("Hello world");
    const { windowSizeSeconds, maxCount } = await request.json<{
      windowSizeSeconds: number;
      maxCount: number;
    }>();
    let isRateLimited = false;

    // maxCount cannot be larger than 4 million with the current implementation
    // due to the size of the array we store in the transactional storage API.
    // We are limited to 128kb on the transactional storage API.
    // For buffer let's cap it at 3 million.

    if (maxCount > 3_000_000) {
      return new Response(
        JSON.stringify({
          isRateLimited: true,
          error: "maxCount cannot be larger than 3 million",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json;charset=UTF-8",
          },
        }
      );
    }

    if (typeof windowSizeSeconds !== "number") {
      return new Response(
        JSON.stringify({
          isRateLimited: true,
          error: "windowSizeSeconds must be a number",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json;charset=UTF-8",
          },
        }
      );
    }

    if (typeof maxCount !== "number") {
      return new Response(
        JSON.stringify({
          isRateLimited: true,
          error: "maxCount must be a number",
        }),
        {
          status: 400,
          headers: {
            "content-type": "application/json;charset=UTF-8",
          },
        }
      );
    }
    let shouldLogInDB = false;
    await this.state.storage.transaction(async (txn) => {
      let transactions = (await txn.get<number[]>("transactions")) || [];

      transactions = transactions.filter(
        (t) => t > Date.now() - windowSizeSeconds * 1000
      );
      if (transactions.length <= maxCount) {
        await txn.put("transactions", transactions.concat([Date.now()]));
      } else {
        const rlCount = (await txn.get<number>("rlCount")) || 0;
        if ((rlCount + 1) % 100 === 0) {
          shouldLogInDB = true;
        }
        await txn.put<number>("rlCount", rlCount + 1);
        isRateLimited = true;
      }
    });

    return new Response(JSON.stringify({ isRateLimited, shouldLogInDB }), {
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    });
  }
}
