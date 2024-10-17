import { HeliconeFeedbackRating } from "../core/HeliconeFeedback";
import { HeliconeProxyOpenAI } from "../proxy_logger/HeliconeProxyOpenAI";
import nock from "nock";
import {
  TEST_HELICONE_API_KEY,
  TEST_OPENAI_API_KEY,
  TEST_OPENAI_ORG,
  TEST_PROXY_URL,
  chatCompletionRequestBody,
  chatCompletionResponseBody,
  completionRequestBody,
  completionResponseBody,
} from "./testConsts";
import { v4 as uuidv4 } from "uuid";

require("dotenv").config();

describe("Helicone Proxy OpenAI tests", () => {
  let openai: HeliconeProxyOpenAI;
  let expectedHeaders: { [key: string]: string };
  const mockOnFeedback = jest.fn();

  beforeAll(() => {
    const heliconeMeta = {
      apiKey: TEST_HELICONE_API_KEY,
      properties: { example: "propertyValue" },
      cache: true,
      retry: { num: 3, factor: 2, min_timeout: 1000, max_timeout: 3000 },
      rateLimitPolicy: { quota: 100, time_window: 60, segment: "testSegment" },
      user: "test-user",
      baseUrl: TEST_PROXY_URL,
      onFeedback: mockOnFeedback,
    };

    expectedHeaders = {
      "Helicone-Auth": `Bearer ${TEST_HELICONE_API_KEY}`,
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
      apiKey: TEST_OPENAI_API_KEY,
      organization: TEST_OPENAI_ORG,
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
    const heliconeId = uuidv4();

    const proxyNock = nock(TEST_PROXY_URL, {
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
    const heliconeId = uuidv4();

    const proxyNock = nock(TEST_PROXY_URL, {
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
    const heliconeId = uuidv4();

    const feedbackNock = nock(TEST_PROXY_URL)
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
