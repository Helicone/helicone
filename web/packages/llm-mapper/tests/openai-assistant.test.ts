import { mapOpenAIAssistant } from "../mappers/openai/assistant";

describe("OpenAI Assistant Mapper", () => {
  it("should map assistant run correctly", () => {
    const request = {};
    const response = {
      id: "run_now4Ru31svCdy0QVQ0NwIa54",
      object: "thread.run",
      created_at: 1738230256,
      assistant_id: "asst_ngBFCC4tsPRQAd2C5mgVJQJI",
      thread_id: "thread_npC6DENSFdL8VC0DYjfWe17s",
      status: "completed",
      started_at: 1738230266,
      expires_at: null,
      cancelled_at: null,
      failed_at: null,
      completed_at: 1738230269,
      model: "gpt-4o-2024-08-06",
      instructions: "# Agency Manifesto\n...",
      tools: [],
    };

    const result = mapOpenAIAssistant({
      request,
      response,
      statusCode: 200,
      model: "gpt-4o-2024-08-06",
    });

    expect(result.schema.request.model).toBe("gpt-4o-2024-08-06");
    expect(result.schema.request.messages?.[0].content).toContain(
      "run_now4Ru31svCdy0QVQ0NwIa54"
    );
    expect(result.schema.response?.messages?.[0].content).toContain(
      "Status: completed"
    );
    expect(result.preview.response).toContain("Model: gpt-4o-2024-08-06");
  });

  it("should handle failed runs", () => {
    const request = {};
    const response = {
      id: "run_failed123",
      status: "failed",
      last_error: "Assistant encountered an error",
      model: "gpt-4",
    };

    const result = mapOpenAIAssistant({
      request,
      response,
      statusCode: 200,
      model: "gpt-4",
    });

    expect(result.schema.response?.messages?.[0].content).toBe(
      "Assistant encountered an error"
    );
    expect(result.preview.response).toBe("Assistant encountered an error");
  });

  it("should handle error responses", () => {
    const request = {};
    const response = {
      error: {
        message: "Invalid assistant ID",
      },
    };

    const result = mapOpenAIAssistant({
      request,
      response,
      statusCode: 400,
      model: "gpt-4",
    });

    expect(result.schema.response?.messages?.[0].content).toBe(
      "Invalid assistant ID"
    );
    expect(result.preview.response).toBe("Invalid assistant ID");
  });
});
