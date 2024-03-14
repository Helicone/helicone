import { Provider } from "@supabase/supabase-js";
import { Env } from "../..";
import { DBLoggable } from "../dbLogger/DBLoggable";
import { handleProxyRequest } from "../HeliconeProxyRequest/handler";
import { HeliconeProxyRequestMapper } from "../HeliconeProxyRequest/mapper";
import { RequestWrapper } from "../RequestWrapper";
import { ResponseBuilder } from "../ResponseBuilder";

export class Moderator {
  env: Env;
  message: string;
  headers: Headers;
  provider: Provider;
  responseBuilder: ResponseBuilder;

  constructor(
    msg: string,
    headers: Headers,
    env: Env,
    provider: Provider
  ) {
    this.env = env;
    this.message = msg;
    this.headers = headers;
    this.provider = provider;
    this.responseBuilder = new ResponseBuilder();
  }

  async moderate(): Promise<ModerationResponse> {
    const moderationRequest = new Request(
      "https://api.openai.com/v1/moderations",
      {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          input: this.message,
        }),
      }
    );

    const moderationRequestWrapper = await RequestWrapper.create(
      moderationRequest,
      this.env
    );

    if (moderationRequestWrapper.error || !moderationRequestWrapper.data) {
      const res = this.responseBuilder.build({
        body: moderationRequestWrapper.error,
        status: 500,
      });

      return {
        error: true,
        response: res
      }
    }

    const {
      data: moderationProxyRequest,
      error: moderationProxyRequestError,
    } = await new HeliconeProxyRequestMapper(
        moderationRequestWrapper.data,
        this.provider,
        this.env
      ).tryToProxyRequest();

    if (moderationProxyRequestError !== null) {
      const res = this.responseBuilder.build({
        body: moderationProxyRequestError,
        status: 500,
      });

      return {
        error: true,
        response: res,
      }
    }

    const { data: moderationResponse, error: moderationResponseError } =
      await handleProxyRequest(moderationProxyRequest);
    if (moderationResponseError != null) {
      const res = this.responseBuilder.build({
        body: moderationResponseError,
        status: 500,
      });

      return {
        error: true,
        response: res,
      }
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
        isModerated: true,
        loggable: moderationResponse.loggable,
        response: res,
      }
    }

    return {
      isModerated: false,
      loggable: moderationResponse.loggable
    }
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
  error: false,
  isModerated: false;
  loggable: DBLoggable;
}

type FlaggedResponse = {
  error: false,
  isModerated: true;
  loggable: DBLoggable;
  response: Response
}

type FailedResponse = {
  error: true;
  response: Response
}

type ModerationResponse = UnFlaggedResponse | FlaggedResponse | FailedResponse;
