import type { paths as publicPaths } from "./generatedTypes/public";
import createClient from "openapi-fetch";

function getClient(
  apiKey: string,
  baseURL: string,
  headers?: Record<string, string>
) {
  return createClient<publicPaths>({
    baseUrl: baseURL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...headers,
    },
  });
}

type RequestResponse =
  publicPaths["/v1/request/query"]["post"]["responses"]["200"]["content"]["application/json"];

type RequestRequest =
  publicPaths["/v1/request/query"]["post"]["requestBody"]["content"]["application/json"];

type ScoreRequest =
  publicPaths["/v1/request/{requestId}/score"]["post"]["requestBody"]["content"]["application/json"];

type NotNull<T> = T extends null ? never : T;
type ScoreRequestFunction = (
  request: NotNull<RequestResponse["data"]>[number],
  requestBody: any
) => Promise<ScoreRequest>;
class ScoringListener {
  private listenerActive = true;
  constructor(private client: ReturnType<typeof getClient>) {}

  async start(
    scoreFunction: ScoreRequestFunction,
    options?: {
      filter?: RequestRequest["filter"];
      isScored?: RequestRequest["isScored"];
      isPartOfExperiment?: RequestRequest["isPartOfExperiment"];
    }
  ) {
    while (this.listenerActive) {
      const responsesToScore = await this.client.POST(
        "/v1/request/query-clickhouse",
        {
          body: {
            filter: options?.filter ?? "all",
            isCached: false,
            limit: 10,
            offset: 0,
            sort: {
              created_at: "desc",
            },
            isScored: options?.isScored ?? false,
            isPartOfExperiment: undefined,
          },
        }
      );

      for (const response of responsesToScore.data?.data ?? []) {
        console.log("Scoring...", response.request_id);
        let requestAndResponseBody;
        try {
          if (!response.signed_body_url) {
            console.log("No signed body url found for", response.request_id);
            continue;
          }
          requestAndResponseBody = await fetch(response.signed_body_url).then(
            (res) => res.json()
          );
        } catch (e) {
          console.log("Failed to fetch request body");
          this.stop();
          return;
        }

        const score = await scoreFunction(response, requestAndResponseBody);
        const scoredResult = await this.client.POST(
          `/v1/request/{requestId}/score`,
          {
            params: {
              path: {
                requestId: response.request_id,
              },
            },
            body: score,
          }
        );

        if (scoredResult.response.ok) {
          console.log("Successfully scored", response.request_id);
        } else {
          console.log(
            "Failed to score",
            response.request_id,
            scoredResult.response.status,
            await scoredResult.response.text()
          );
        }
      }

      //sleep for 5 seconds
      console.log("Sleeping for 5 seconds");
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  stop() {
    this.listenerActive = false;
  }
}

export class HeliconeAPIClient {
  public rawClient: ReturnType<typeof getClient>;
  constructor(
    private config: {
      apiKey: string;
      baseURL?: string;
      headers?: Record<string, string>;
    }
  ) {
    if (!this.config.baseURL) {
      this.config.baseURL = "https://api.helicone.ai";
    }
    this.rawClient = getClient(
      this.config.apiKey,
      this.config.baseURL,
      this.config.headers
    );
  }

  scoringWorker() {
    return new ScoringListener(this.rawClient);
  }
}
