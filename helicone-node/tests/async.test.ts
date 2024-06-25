import { HeliconeAsyncLogger } from "../async_logger/HeliconeAsyncLogger";
import nock from "nock";
import {
  TEST_OPENAI_ORG,
  TEST_OPENAI_URL,
  TEST_OPENAI_API_KEY,
  TEST_TELEMETRY_URL,
  chatCompletionRequestBody,
  chatCompletionResponseBody,
} from "./testConsts";
import { OpenAI } from "openai";

require("dotenv").config();

describe("OpenAI async logging tests", () => {
  let openai: OpenAI;
  let logger: HeliconeAsyncLogger;

  beforeAll(() => {
    logger = new HeliconeAsyncLogger({
      apiKey: TEST_OPENAI_API_KEY,
      baseUrl: TEST_TELEMETRY_URL,
      providers: {
        openAI: OpenAI,
      },
    });

    logger.init();

    openai = new OpenAI({
      apiKey: TEST_OPENAI_API_KEY,
      organization: TEST_OPENAI_ORG,
    });

    nock.emitter.on("no match", (req, options, requestBodyString) => {
      console.log("No match:\n", req.path, options.method, requestBodyString);
    });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  beforeEach(() => {
    nock.disableNetConnect();
  });

  test("COMPLETION", async () => {
    const telemNock = nock(TEST_TELEMETRY_URL)
      .post("/", (body) => {
        expect(
          Object.keys(body.resourceSpans[0].scopeSpans[0].spans[0])
        ).toContain([
          "name",
          "kind",
          "attributes",
          "droppedAttributesCount",
          "events",
          "droppedEventsCount",
          "status",
          "links",
          "droppedLinksCount",
          "startTimeUnixNano",
          "endTimeUnixNano",
          "traceId",
          "spanId",
          "events",
        ]);
        return true;
      })
      .reply(200, { status: "success" });

    const openaiNock = nock(TEST_OPENAI_URL)
      .post("/v1/chat/completions", (body) => {
        expect(body).toMatchObject(chatCompletionRequestBody);
        return true;
      })
      .reply(200, chatCompletionResponseBody);

    const completion = await openai.chat.completions.create(
      chatCompletionRequestBody
    );

    await new Promise(() => setTimeout(() => {}, 2000));

    expect(completion).toMatchObject(chatCompletionResponseBody);
    expect(openaiNock.isDone()).toBe(true);
    expect(telemNock.isDone()).toBe(true);
  }, 10000);
});
