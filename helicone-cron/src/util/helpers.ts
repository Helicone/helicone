import { Env } from "../";
import { SentryManager } from "../managers/SentryManager";

export function chunkArray<T>(array: T[], size: number): T[][] {
  return array.reduce(
    (acc, _, index) =>
      index % size ? acc : [...acc, array.slice(index, index + size)],
    [] as T[][]
  );
}

export async function callJawn<T, R>(
  path: string,
  verb: "POST" | "GET" | "PUT" | "DELETE" | "PATCH",
  body: T | null,
  env: Env
) {
  let response;
  if (body !== null) {
    response = await fetch(`${env.VALHALLA_URL}${path}`, {
      method: verb,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: env.HELICONE_MANUAL_ACCESS_KEY,
      },
    });
  } else {
    response = await fetch(`${env.VALHALLA_URL}${path}`, {
      method: verb,
      headers: {
        "Content-Type": "application/json",
        Authorization: env.HELICONE_MANUAL_ACCESS_KEY,
      },
    });
  }

  if (!response.ok && env.ENVIRONMENT != "dev") {
    const sentry = new SentryManager(env);
    sentry.sendError(
      `Failed to call Jawn: ${response.statusText}`,
      "Jawn Client"
    );
  }

  return response.json() as Promise<R>;
}
