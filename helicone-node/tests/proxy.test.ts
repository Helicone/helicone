import { HeliconeFeedbackRating } from "../core/HeliconeFeedback";
import { HeliconeProxyOpenAI } from "./../proxy_logger/HeliconeProxyOpenAI";
import nock from "nock";
import {
  chatCompletionRequestBody,
  chatCompletionResponseBody,
  completionRequestBody,
  completionResponseBody,
} from "./test_objects";

require("dotenv").config();

const heliconeApiKey = process.env.HELICONE_API_KEY;
const proxyUrl = process.env.HELICONE_PROXY_URL ?? "http://127.0.0.1:8788/v1";

if (!heliconeApiKey) {
  throw new Error("API keys must be set as environment variables.");
}

describe("Helicone Proxy OpenAI tests", () => {
  let openai: HeliconeProxyOpenAI;
  let expectedHeaders: { [key: string]: string };
  const mockOnFeedback = jest.fn();

  beforeAll(() => {
    const heliconeMeta = {
      apiKey: process.env.HELICONE_API_KEY,
      properties: { example: "propertyValue" },
      cache: true,
      retry: { num: 3, factor: 2, min_timeout: 1000, max_timeout: 3000 },
      rateLimitPolicy: { quota: 100, time_window: 60, segment: "testSegment" },
      user: "test-user",
      baseUrl: proxyUrl,
      onFeedback: mockOnFeedback,
    };

    expectedHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-example": "propertyValue",
      "Helicone-Cache-Enabled": "true",
      "Helicone-Retry-Enabled": "true",
      "Helicone-Retry-Num": "3",
      "Helicone-Retry-Factor": "2",
      "Helicone-Retry-Min-Timeout": "1000",
      "Helicone-Retry-Max-Timeout": "3000",
      "Helicone-RateLimit-Policy": "100;w=60;s=testSegment",
      "Helicone-User-Id": "test-user",
    };

    openai = new HeliconeProxyOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
      heliconeMeta: heliconeMeta,
    });

    nock.emitter.on("no match", (req, options, requestBodyString) => {
      console.log(req.path, options.method, requestBodyString);
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    nock.disableNetConnect();
  });

  test("COMPLETION", async () => {
    const heliconeId = crypto.randomUUID();

    const proxyNock = nock(proxyUrl, {
      reqheaders: expectedHeaders,
    })
      .post("/completions", (body) => {
        expect(body).toMatchObject(completionRequestBody);
        return true;
      })
      .reply(200, completionResponseBody, {
        "helicone-id": heliconeId,
      });

    const { data, response } = await openai.completions
      .create(completionRequestBody)
      .withResponse();

    expect(data).toMatchObject(completionResponseBody);
    expect(response.headers.get("helicone-id")).toBe(heliconeId);
    expect(proxyNock.isDone()).toBe(true);
  });

  test("CHAT_COMPLETION", async () => {
    const heliconeId = crypto.randomUUID();

    const proxyNock = nock(proxyUrl, {
      reqheaders: expectedHeaders,
    })
      .post("/chat/completions", (body) => {
        expect(body).toMatchObject(chatCompletionRequestBody);
        return true;
      })
      .reply(200, chatCompletionResponseBody, {
        "helicone-id": heliconeId,
      });

    const { data, response } = await openai.chat.completions
      .create(chatCompletionRequestBody)
      .withResponse();

    expect(data).toMatchObject(chatCompletionResponseBody);
    expect(response.headers.get("helicone-id")).toBe(heliconeId);
    expect(proxyNock.isDone()).toBe(true);
  });

  test("FEEDBACK", async () => {
    const heliconeId = crypto.randomUUID();

    const feedbackNock = nock(proxyUrl)
      .post("/feedback", (body) => {
        expect(body).toMatchObject({
          "helicone-id": heliconeId,
          rating: true,
        });
        return true;
      })
      .reply(200, {
        message: "Feedback added successfully.",
        helicone_id: heliconeId,
      });

    await openai.helicone.logFeedback(
      heliconeId,
      HeliconeFeedbackRating.Positive
    );

    expect(feedbackNock.isDone()).toBe(true);
    expect(mockOnFeedback).toHaveBeenCalledTimes(1);
  });
});
