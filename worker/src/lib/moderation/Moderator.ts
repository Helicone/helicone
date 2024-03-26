import { Env, Provider } from "../..";
import { DBLoggable } from "../dbLogger/DBLoggable";
import { handleProxyRequest } from "../HeliconeProxyRequest/handler";
import { HeliconeProxyRequestMapper } from "../HeliconeProxyRequest/mapper";
import { RequestWrapper } from "../RequestWrapper";
import { ResponseBuilder } from "../ResponseBuilder";

import type { Result } from "../../results";

export class Moderator {
  env: Env;
  headers: Headers;
  provider: Provider;
  responseBuilder: ResponseBuilder;

  constructor(headers: Headers, env: Env, provider: Provider) {
    this.env = env;
    this.headers = headers;
    this.provider = provider;
    this.responseBuilder = new ResponseBuilder();
  }

  async moderate(message: string): Promise<Result<ModerationResponse, string>> {
    const moderationRequest = new Request(
      "https://api.openai.com/v1/moderations",
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          input: message,
        }),
      }
    );

    const moderationRequestWrapper = await RequestWrapper.create(
      moderationRequest,
      this.env
    );

    if (moderationRequestWrapper.error || !moderationRequestWrapper.data) {
      return {
        error: JSON.stringify({
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Request to OpenAI moderation endpoint failed.",
          },
        }),
        data: null,
      };
    }

    const { data: moderationProxyRequest, error: moderationProxyRequestError } =
      await new HeliconeProxyRequestMapper(
        moderationRequestWrapper.data,
        this.provider,
        this.env
      ).tryToProxyRequest();

    if (moderationProxyRequestError || !moderationProxyRequest) {
      return {
        error: JSON.stringify({
          success: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "Proxy request to OpenAI moderation endpoint failed.",
          },
        }),
        data: null,
      };
    }

    const { data: moderationResponse, error: moderationResponseError } =
      await handleProxyRequest(moderationProxyRequest);

    if (moderationResponseError || !moderationResponse) {
      return {
        error: moderationResponseError,
        data: null,
      };
    }

    const flaggedForModeration = (
      (await moderationResponse.response.json()) as OpenAIModerationResponse
    ).results[0].flagged;

    if (flaggedForModeration == true) {
      moderationResponse.response.headers.forEach((value, key) => {
        this.responseBuilder.setHeader(key, value);
      });

      const responseContent = {
        body: JSON.stringify({
          success: false,
          error: {
            code: "PROMPT_FLAGGED_FOR_MODERATION",
            message:
              "The given prompt was flagged by the OpenAI Moderation endpoint.",
            details: `See your Helicone request page for more info: https://www.helicone.ai/requests?${moderationProxyRequest.requestId}`,
          },
        }),
        inheritFrom: moderationResponse.response,
        status: 400,
      };

      const res = this.responseBuilder
        .setHeader("content-type", "application/json")
        .build(responseContent);

      return {
        error: null,
        data: {
          isModerated: true,
          loggable: moderationResponse.loggable,
          response: res,
        },
      };
    }

    return {
      error: null,
      data: {
        isModerated: false,
        loggable: moderationResponse.loggable,
        response: null,
      },
    };
  }
}

type OpenAIModerationResponse = {
  id: string;
  model: string;
  results: Array<{
    flagged: boolean;
    categories: object;
    category_scores: object;
  }>;
};

type UnFlaggedResponse = {
  isModerated: false;
  loggable: DBLoggable;
  response: null;
};

type FlaggedResponse = {
  isModerated: true;
  loggable: DBLoggable;
  response: Response;
};

type ModerationResponse = UnFlaggedResponse | FlaggedResponse;
