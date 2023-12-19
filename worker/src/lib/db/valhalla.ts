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
    return this.send<T>(path, "POST", JSON.stringify(data));
  }

  async patch<T, K extends keyof OnlyPatchMethods>(
    path: K,
    data: OnlyPatchMethods[K]["patch"]["requestBody"]["content"]["application/json"]
  ) {
    return this.send<T>(path, "PATCH", JSON.stringify(data));
  }

  async put<T, K extends keyof OnlyPutMethods>(
    path: K,
    data: OnlyPutMethods[K]["put"]["requestBody"]["content"]["application/json"]
  ) {
    return this.send<T>(path, "PUT", JSON.stringify(data));
  }

  private async send<T>(
    path: string,
    method: string,
    body: string
  ): Promise<Result<T, string>> {
    try {
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
    } catch (e) {
      return err(`Failed to send request to Valhalla ${JSON.stringify(e)}`);
    }
  }
}
