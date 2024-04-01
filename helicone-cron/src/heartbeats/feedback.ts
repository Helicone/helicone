import { Env } from "..";
import { IHeartBeat } from "./IHeartBeat";

export class FeedbackHeartBeat implements IHeartBeat {
  async beat(env: Env): Promise<number> {
    const baseUrl = "https://api.hconeai.com/v1/feedback";

    const options = {
      method: "POST",
      headers: {
        "Helicone-Auth": `Bearer ${env.HELICONE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "helicone-id": "d96c4edc-d7c1-49ac-a5b5-031e2d8fa008",
        rating: true,
      }),
    };

    const res = await fetch(baseUrl, options);
    return res.status;
  }
}
