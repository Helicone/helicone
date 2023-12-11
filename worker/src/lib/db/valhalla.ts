import { HeliconeAuth } from "../../db/DBWrapper";
import { Result, err, ok } from "../../results";
import { AuthParams } from "../dbLogger/DBLoggable";
import { paths } from "./valhalla.types";

type PostMethods<T> = {
  [K in keyof T]: T[K] extends { post: any } ? T[K] : never;
};

type OnlyPostMethods = PostMethods<paths>;

export class Valhalla {
  private url: URL;

  constructor(
    private database_url: string,
    private heliconeAuth: HeliconeAuth
  ) {
    this.url = new URL(this.database_url);
  }

  authenticateClient(params: AuthParams): Promise<Result<null, string>> {
    throw new Error("Method not implemented.");
  }
  private route(path: string): string {
    const urlCopy = new URL(this.url.toString());
    urlCopy.pathname = path;
    return urlCopy.toString();
  }

  async post<T, K extends keyof OnlyPostMethods>(
    path: K,
    data: OnlyPostMethods[K]["post"]["requestBody"]["content"]["application/json"]
  ) {
    return this.send<T>(path, "POST", JSON.stringify(data));
  }

  private async send<T>(
    path: string,
    method: string,
    body: string
  ): Promise<Result<T, string>> {
    const response = await fetch(this.route(path), {
      method,
      headers: {
        "Content-Type": "application/json",
        "Helicone-Authorization": JSON.stringify(this.heliconeAuth),
      },
      body: body,
    });
    const responseText = await response.text();
    if (response.status !== 200) {
      return err(`Failed to send request to Valhalla ${responseText}`);
    }

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
