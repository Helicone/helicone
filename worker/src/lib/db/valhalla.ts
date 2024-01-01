/* eslint-disable @typescript-eslint/no-explicit-any */
import { HeliconeAuth } from "../../db/DBWrapper";
import { Result, err, ok } from "../../results";
import { paths } from "./valhalla.types";

type PostMethods<T> = {
  [K in keyof T]: T[K] extends { post: any } ? T[K] : never;
};

type PatchMethods<T> = {
  [K in keyof T]: T[K] extends { patch: any } ? T[K] : never;
};

type PutMethods<T> = {
  [K in keyof T]: T[K] extends { put: any } ? T[K] : never;
};

type OnlyPostMethods = PostMethods<paths>;
type OnlyPatchMethods = PatchMethods<paths>;
type OnlyPutMethods = PutMethods<paths>;

export class Valhalla {
  private url: URL;

  constructor(
    private database_url: string,
    private heliconeAuth: HeliconeAuth
  ) {
    this.url = new URL(this.database_url);
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
    return this.sendWithRetry<T>(path, "POST", JSON.stringify(data));
  }

  async patch<T, K extends keyof OnlyPatchMethods>(
    path: K,
    data: OnlyPatchMethods[K]["patch"]["requestBody"]["content"]["application/json"]
  ) {
    return this.sendWithRetry<T>(path, "PATCH", JSON.stringify(data));
  }

  async put<T, K extends keyof OnlyPutMethods>(
    path: K,
    data: OnlyPutMethods[K]["put"]["requestBody"]["content"]["application/json"]
  ) {
    return this.sendWithRetry<T>(path, "PUT", JSON.stringify(data));
  }

  // This function will take a maximum of 15 seconds to return
  // (5 seconds for the request to be sent, 5 second pause, and 5 seconds for the request to be sent again)
  private async sendWithRetry<T>(
    path: string,
    method: string,
    body: string,
    timeout = 5000
  ): Promise<Result<T, string>> {
    return this.send<T>(path, method, body, timeout).then((result) => {
      if (result.data) {
        return result;
      }
      // Wait 5 seconds and try again
      return new Promise((resolve) => setTimeout(resolve, 5000)).then(() =>
        this.send<T>(path, method, body, timeout)
      );
    });
  }

  private async send<T>(
    path: string,
    method: string,
    body: string,
    timeout = 5000
  ): Promise<Result<T, string>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(this.route(path), {
        method,
        headers: {
          "Content-Type": "application/json",
          "Helicone-Authorization": JSON.stringify(this.heliconeAuth),
        },
        body: body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
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
    } catch (e: any) {
      clearTimeout(timeoutId);

      if (e?.name === "AbortError") {
        return err("Request timed out");
      }
      return err(`Failed to send request to Valhalla ${JSON.stringify(e)}`);
    }
  }
}
