import { GoogleStreamBodyProcessor } from "../googleStreamBodyProcessor";
import { OpenAIStreamProcessor } from "../openAIStreamProcessor";
import { VercelBodyProcessor } from "../vercelBodyProcessor";
import { VercelStreamProcessor } from "../vercelStreamProcessor";

describe("stream parser log redaction", () => {
  afterEach(() => jest.restoreAllMocks());

  it.each([
    ["OpenAI", new OpenAIStreamProcessor()],
    ["Google", new GoogleStreamBodyProcessor()],
    ["Vercel", new VercelStreamProcessor()],
  ])(
    "does not log malformed %s response content",
    async (_provider, processor) => {
      const error = jest.spyOn(console, "error").mockImplementation(() => {});
      const log = jest.spyOn(console, "log").mockImplementation(() => {});

      await processor.parse({
        responseBody: 'data: {"content":"customer-secret-marker"',
      });

      expect(
        JSON.stringify([...error.mock.calls, ...log.mock.calls]),
      ).not.toContain("customer-secret-marker");
    },
  );

  it("does not return malformed Vercel content in an error", async () => {
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await new VercelBodyProcessor().parse({
      responseBody: '{"content":"customer-secret-marker"',
    });

    expect(result.error).toBe("Failed to parse Vercel response body");
    expect(JSON.stringify(error.mock.calls)).not.toContain(
      "customer-secret-marker",
    );
  });
});
