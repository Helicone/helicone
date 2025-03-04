import { mapRealtimeRequest } from "../../llm-mapper/mappers/openai/realtime";

describe("mapRealtimeRequest", () => {
  it("should map audio data for user messages", () => {
    const mockBase64Audio = "base64EncodedAudioData";
    const mockRequest = {
      messages: [
        {
          type: "message",
          from: "client",
          timestamp: "2023-01-01T00:00:00Z",
          content: {
            type: "conversation.item.input_audio_transcription.completed",
            transcript: "Hello, how are you?",
            item: {
              content: [
                {
                  type: "input_audio",
                  audio: mockBase64Audio,
                  transcript: "Hello, how are you?",
                },
              ],
            },
          },
        },
      ],
    };

    const result = mapRealtimeRequest({
      request: mockRequest,
      response: {},
      statusCode: 200,
      model: "gpt-4o-realtime",
    });

    expect(result.schema.request.messages).not.toBeNull();
    expect(result.schema.request.messages?.length).toBeGreaterThan(0);

    const userMessage = result.schema.request.messages?.[0];
    expect(userMessage?.role).toBe("user");
    expect(userMessage?._type).toBe("audio");
    expect(userMessage?.content).toBe("Hello, how are you?");
    expect(userMessage?.audio_data).toBe(mockBase64Audio);
  });

  it("should map audio data for assistant messages", () => {
    const mockBase64Audio = "base64EncodedAudioData";
    const mockResponse = {
      messages: [
        {
          type: "message",
          from: "target",
          timestamp: "2023-01-01T00:00:00Z",
          content: {
            type: "response.done",
            response: {
              output: [
                {
                  type: "message",
                  content: [
                    {
                      type: "audio",
                      audio: mockBase64Audio,
                      transcript: "I'm doing well, thank you!",
                    },
                  ],
                },
              ],
            },
          },
        },
      ],
    };

    const result = mapRealtimeRequest({
      request: {},
      response: mockResponse,
      statusCode: 200,
      model: "gpt-4o-realtime",
    });

    expect(result.schema.response).not.toBeNull();
    expect(result.schema.response?.messages).not.toBeNull();
    expect(result.schema.response?.messages?.length).toBeGreaterThan(0);

    const assistantMessage = result.schema.response?.messages?.[0];
    expect(assistantMessage?.role).toBe("assistant");
    expect(assistantMessage?._type).toBe("audio");
    expect(assistantMessage?.content).toBe("I'm doing well, thank you!");
    expect(assistantMessage?.audio_data).toBe(mockBase64Audio);
  });

  it("should map user-created audio items", () => {
    const mockBase64Audio = "base64EncodedAudioData";
    const mockRequest = {
      messages: [
        {
          type: "message",
          from: "client",
          timestamp: "2023-01-01T00:00:00Z",
          content: {
            type: "conversation.item.create",
            item: {
              type: "message",
              content: [
                {
                  type: "input_audio",
                  audio: mockBase64Audio,
                  transcript: "Hello, how are you?",
                },
              ],
            },
          },
        },
      ],
    };

    const result = mapRealtimeRequest({
      request: mockRequest,
      response: {},
      statusCode: 200,
      model: "gpt-4o-realtime",
    });

    expect(result.schema.request.messages).not.toBeNull();
    expect(result.schema.request.messages?.length).toBeGreaterThan(0);

    const userMessage = result.schema.request.messages?.[0];
    expect(userMessage?.role).toBe("user");
    expect(userMessage?._type).toBe("audio");
    expect(userMessage?.content).toBe("Hello, how are you?");
    expect(userMessage?.audio_data).toBe(mockBase64Audio);
  });
});
