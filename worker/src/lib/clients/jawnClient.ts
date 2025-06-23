import { Env } from "../..";
import { SentryManager } from "../managers/SentryManager";

export async function callJawn<T, R>(
  path: string,
  verb: "POST" | "GET" | "PUT" | "DELETE",
  body: T,
  env: Env
) {
  const response = await fetch(`${env.VALHALLA_URL}/${path}`, {
    method: verb,
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `${env.HELICONE_MANUAL_ACCESS_KEY}`,
    },
  });

  if (!response.ok) {
    const sentry = new SentryManager(env);
    sentry.sendError(
      `Failed to call Jawn: ${response.statusText}`,
      "Jawn Client"
    );
  }

  return response.json() as Promise<R>;
}
