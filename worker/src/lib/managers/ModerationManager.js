import { handleProxyRequest } from "../HeliconeProxyRequest/ProxyRequestHandler";
import { HeliconeProxyRequestMapper } from "../models/HeliconeProxyRequest";
import { RequestWrapper } from "../RequestWrapper";
import { ResponseBuilder } from "../ResponseBuilder";
export class Moderator {
    env;
    headers;
    provider;
    responseBuilder;
    constructor(headers, env, provider) {
        this.env = env;
        this.headers = headers;
        this.provider = provider;
        this.responseBuilder = new ResponseBuilder();
    }
    async moderate(message) {
        const moderationRequest = new Request("https://api.openai.com/v1/moderations", {
            method: "POST",
            headers: this.headers,
            body: JSON.stringify({
                input: message,
            }),
        });
        const moderationRequestWrapper = await RequestWrapper.create(moderationRequest, this.env);
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
        const { data: moderationProxyRequest, error: moderationProxyRequestError } = await new HeliconeProxyRequestMapper(moderationRequestWrapper.data, this.provider, this.env).tryToProxyRequest();
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
        const { data: moderationResponse, error: moderationResponseError } = await handleProxyRequest(moderationProxyRequest);
        if (moderationResponseError || !moderationResponse) {
            return {
                error: moderationResponseError,
                data: null,
            };
        }
        const flaggedForModeration = (await moderationResponse.response.json()).results[0].flagged;
        if (flaggedForModeration == true) {
            moderationResponse.response.headers.forEach((value, key) => {
                this.responseBuilder.setHeader(key, value);
            });
            const responseContent = {
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: "PROMPT_FLAGGED_FOR_MODERATION",
                        message: "The given prompt was flagged by the OpenAI Moderation endpoint.",
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
