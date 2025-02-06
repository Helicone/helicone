import { mapOpenAIAssistant } from "../../llm-mapper/mappers/openai/assistant";

describe("OpenAI Assistant Mapper", () => {
  it("should map assistant run response correctly", () => {
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
      required_action: null,
      last_error: null,
      model: "gpt-4o-2024-08-06",
      instructions:
        "# Agency Manifesto\n-all your interactions should be friendly",
      tools: [
        { type: "file_search" },
        { type: "function", function: { name: "AddLeadsToCampaignTool" } },
      ],
    };

    const result = mapOpenAIAssistant({
      request,
      response,
      statusCode: 200,
      model: "gpt-4o-2024-08-06",
    });

    expect(result.schema.request.model).toBe("gpt-4o-2024-08-06");
    expect(result.preview.response).toContain("Status: completed");
    expect(result.preview.response).toContain("Model: gpt-4o-2024-08-06");
    expect(result.preview.response).toContain("Tools Available: 2");
  });

  it("should handle failed assistant runs", () => {
    const request = {};

    const response = {
      id: "run_failed123",
      status: "failed",
      last_error: {
        message: "Assistant encountered an error",
      },
      model: "gpt-4",
    };

    const result = mapOpenAIAssistant({
      request,
      response,
      statusCode: 500,
      model: "gpt-4",
    });

    expect(result.preview.response).toBe("Assistant encountered an error");
    expect(result.schema.response?.messages?.[0].content).toBe(
      "Assistant encountered an error"
    );
  });

  it("should handle assistant requests with tools", () => {
    const request = {
      assistant_id: "asst_123",
      thread_id: "thread_456",
      tools: [
        { type: "code_interpreter" },
        { type: "retrieval" },
        { type: "function" },
      ],
      instructions: "Help with data analysis",
    };

    const response = {
      status: "completed",
      model: "gpt-4",
    };

    const result = mapOpenAIAssistant({
      request,
      response,
      statusCode: 200,
      model: "gpt-4",
    });

    expect(result.preview.request).toContain("Assistant ID: asst_123");
    expect(result.preview.request).toContain("Thread ID: thread_456");
    expect(result.preview.request).toContain(
      "Instructions: Help with data analysis"
    );
    expect(result.preview.request).toContain(
      "Available Tools: code_interpreter, retrieval, function"
    );
  });
});
