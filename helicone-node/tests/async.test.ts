import {
  HeliconeLogBuilder,
  HeliconeLogger,
  ResponseBody,
} from "./../async_logger/HeliconeLogger";
import { HeliconeAsyncOpenAI } from "../async_logger/HeliconeAsyncOpenAI";
import nock from "nock";
import {
  IHeliconeAsyncClientOptions,
  IHeliconeMeta,
} from "../core/HeliconeClientOptions";
import {
  TEST_ASYNC_URL,
  TEST_HELICONE_API_KEY,
  TEST_OPENAI_API_KEY,
  TEST_OPENAI_ORG,
  chatCompletionAsyncModel,
  chatCompletionRequestBody,
  chatCompletionResponseBody,
  completionAsyncLogModel,
  completionRequestBody,
  completionResponseBody,
  createCustomModelRequestBody,
} from "./testConsts";
import { v4 as uuidv4 } from "uuid";

describe("Helicone Proxy OpenAI tests", () => {
  let openai: HeliconeAsyncOpenAI;
  let expectedHeaders: { [key: string]: string };
  const mockOnFeedback = jest.fn();
  const mockOnLog = jest.fn();

  beforeAll(() => {
    const heliconeMeta: IHeliconeMeta = {
      apiKey: TEST_HELICONE_API_KEY,
      properties: { example: "propertyValue" },
      cache: true,
      retry: { num: 3, factor: 2, min_timeout: 1000, max_timeout: 3000 },
      rateLimitPolicy: { quota: 100, time_window: 60, segment: "testSegment" },
      user: "test-user",
      baseUrl: TEST_ASYNC_URL,
      onFeedback: mockOnFeedback,
      onLog: mockOnLog,
    };

    // All headers are not used with async logging
    expectedHeaders = {
      "Helicone-Auth": `Bearer ${TEST_HELICONE_API_KEY}`,
      "Helicone-Property-example": "propertyValue",
      "Helicone-User-Id": "test-user",
    };

    openai = new HeliconeAsyncOpenAI({
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
    jest.clearAllMocks();
    nock.disableNetConnect();
  });

  test("COMPLETION", async () => {
    const heliconeId = uuidv4();
    const openaiNock = nock(openai.baseURL)
      .post("/completions", (body) => {
        expect(body).toMatchObject(completionRequestBody);
        return true;
      })
      .reply(200, completionResponseBody);

    const asyncNock = nock(TEST_ASYNC_URL)
      .post("/oai/v1/log", (body) => {
        expect(body).toMatchObject(completionAsyncLogModel);
        expect(body).toHaveProperty("timing");
        expect(body.timing).toHaveProperty("startTime");
        expect(body.timing.startTime).toHaveProperty("seconds");
        expect(body.timing.startTime).toHaveProperty("milliseconds");
        expect(body.timing).toHaveProperty("endTime");
        expect(body.timing.endTime).toHaveProperty("seconds");
        expect(body.timing.endTime).toHaveProperty("milliseconds");
        return true;
      })
      .reply(200, {}, { "helicone-id": heliconeId });

    const { data, response } = await openai.completions
      .create(completionRequestBody)
      .withResponse();

    await waitFor(100);

    expect(data).toMatchObject(completionResponseBody);
    expect(openaiNock.isDone()).toBe(true);

    expect(mockOnLog).toHaveBeenCalledTimes(1);

    expect(asyncNock.isDone()).toBe(true);
  });

  test("CHAT", async () => {
    const heliconeId = uuidv4();
    const openaiNock = nock(openai.baseURL)
      .post("/chat/completions", (body) => {
        expect(body).toMatchObject(chatCompletionRequestBody);
        return true;
      })
      .reply(200, chatCompletionResponseBody);

    const asyncNock = nock(TEST_ASYNC_URL)
      .post("/oai/v1/log", (body) => {
        expect(body).toMatchObject(chatCompletionAsyncModel);
        expect(body).toHaveProperty("timing");
        expect(body.timing).toHaveProperty("startTime");
        expect(body.timing.startTime).toHaveProperty("seconds");
        expect(body.timing.startTime).toHaveProperty("milliseconds");
        expect(body.timing).toHaveProperty("endTime");
        expect(body.timing.endTime).toHaveProperty("seconds");
        expect(body.timing.endTime).toHaveProperty("milliseconds");
        return true;
      })
      .reply(200, {}, { "helicone-id": heliconeId });

    const { data, response } = await openai.chat.completions
      .create(chatCompletionRequestBody)
      .withResponse();

    await waitFor(100);

    expect(data).toMatchObject(chatCompletionResponseBody);
    expect(openaiNock.isDone()).toBe(true);

    expect(mockOnLog).toHaveBeenCalledTimes(1);

    expect(asyncNock.isDone()).toBe(true);
  });

  test("CUSTOM_MODEL", async () => {
    const heliconeId = uuidv4();

    const options: IHeliconeAsyncClientOptions = {
      heliconeMeta: {
        apiKey: TEST_HELICONE_API_KEY,
        baseUrl: TEST_ASYNC_URL,
      },
    };

    const logger = new HeliconeLogger(options);

    const llmArgs = {
      model: "llama-2",
      prompt: "Say hi!",
    };
    const builder = new HeliconeLogBuilder(llmArgs);

    const result: ResponseBody = {
      text: "This is my response",
      usage: {
        total_tokens: 13,
        prompt_tokens: 5,
        completion_tokens: 8,
      },
    };

    builder.addResponse(result);
    builder.addUser("test-user");

    const asyncNock = nock(TEST_ASYNC_URL)
      .post("/custom/v1/log", (body) => {
        expect(body).toMatchObject(createCustomModelRequestBody(builder.id));
        expect(body).toHaveProperty("timing");
        expect(body.timing).toHaveProperty("startTime");
        expect(body.timing.startTime).toHaveProperty("seconds");
        expect(body.timing.startTime).toHaveProperty("milliseconds");
        expect(body.timing).toHaveProperty("endTime");
        expect(body.timing.endTime).toHaveProperty("seconds");
        expect(body.timing.endTime).toHaveProperty("milliseconds");
        return true;
      })
      .reply(200, {}, { "helicone-id": heliconeId });

    await logger.submit(builder);
    expect(asyncNock.isDone()).toBe(true);
  });
});

function waitFor(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
