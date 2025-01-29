import { Provider } from "../../packages/llm-mapper/types";
import { KafkaProducer } from "../clients/KafkaProducer";
import { supabaseServer } from "../db/supabase";
import { RequestWrapper } from "../requestWrapper/requestWrapper";
import { S3Client } from "../shared/db/s3Client";
import { DBLoggable } from "./DBLoggable";
import {
  HeliconeProxyRequest,
  HeliconeProxyRequestMapper,
} from "./HeliconeProxyRequest";
import { handleProxyRequest } from "./ProxyRequestHandler";
import { checkRateLimit } from "./RateLimiter";
import { ResponseBuilder } from "./ResponseBuilder";
import { S3Manager } from "./S3Manager";
import { Response } from "node-fetch";

export async function proxyForwarder(
  request: RequestWrapper,
  provider: Provider
): Promise<Response> {
  const { data: proxyRequest, error: proxyRequestError } =
    await new HeliconeProxyRequestMapper(request, provider).tryToProxyRequest();

  if (proxyRequestError !== null) {
    return new Response(proxyRequestError, {
      status: 500,
    });
  }
  const responseBuilder = new ResponseBuilder();

  if (proxyRequest.rateLimitOptions) {
    if (!proxyRequest.providerAuthHash) {
      return new Response("Authorization header required for rate limiting", {
        status: 401,
      });
    }

    const rateLimitCheckResult = await checkRateLimit({
      providerAuthHash: proxyRequest.providerAuthHash,
      heliconeProperties: proxyRequest.heliconeProperties,
      rateLimitOptions: proxyRequest.rateLimitOptions,
      userId: proxyRequest.userId,
      cost: 0,
    });

    responseBuilder.addRateLimitHeaders(
      rateLimitCheckResult,
      proxyRequest.rateLimitOptions
    );

    if (rateLimitCheckResult.status === "rate_limited") {
      return responseBuilder.buildRateLimitedResponse();
    }
  }

  const { data, error } = await handleProxyRequest(proxyRequest);
  if (error !== null) {
    return responseBuilder.build({
      body: error,
      status: 500,
    });
  }
  const { loggable, response } = data;

  try {
    void log(loggable, request, proxyRequest);
  } catch (e) {
    console.error("Error logging", e);
  }
  // const tex;

  return response;
}

async function log(
  loggable: DBLoggable,
  request: RequestWrapper,
  proxyRequest: HeliconeProxyRequest
) {
  const { data: auth, error: authError } = await request.auth();
  if (authError !== null) {
    console.error("Error getting auth", authError);
    return;
  }

  const { data: authParams, error: authParamsError } =
    await supabaseServer.authenticate(auth);

  if (authParamsError || !authParams) {
    console.error("Error getting auth params", authParamsError);
    return;
  }

  const { data: orgParams, error: orgParamsError } =
    await supabaseServer.getOrganization(authParams);

  if (orgParamsError || !orgParams) {
    console.error("Error getting organization", orgParamsError);
    return;
  }

  const res = await loggable.log(
    {
      s3Manager: new S3Manager(
        new S3Client(
          process.env.S3_ACCESS_KEY ?? "",
          process.env.S3_SECRET_KEY ?? "",
          process.env.S3_ENDPOINT ?? "",
          process.env.S3_BUCKET_NAME ?? "",
          (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
        )
      ),
      kafkaProducer: new KafkaProducer(),
    },
    authParams,
    orgParams,
    proxyRequest?.requestWrapper.heliconeHeaders
  );

  if (res.error !== null) {
    console.error("Error logging", res.error);
  }
}
