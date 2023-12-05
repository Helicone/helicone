import { Result, err, ok } from "../../results";

export class Valhalla {
  constructor(private database_url: string) {}

  private async send<T>(
    path: string,
    method: string,
    body: string
  ): Promise<Result<T, string>> {
    const url = new URL(this.database_url);
    url.pathname = "/v1/request";

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "Hello, world!",
        max_tokens: 5,
        temperature: 1,
        stop: ["\n"],
      }),
    });
    if (response.status !== 200) {
      return err("Failed to send request to Valhalla");
    }

    const responseText = await response.text();
    if (responseText === "") {
      return err("Failed to send request to Valhalla");
    }

    try {
      return ok(JSON.parse(responseText) as T);
    } catch (e) {
      return err(`Failed to parse ${JSON.stringify(e)}`);
    }
  }
}
