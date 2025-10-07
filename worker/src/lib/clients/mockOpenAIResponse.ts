interface OpenAIUsageDetails {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  completion_tokens_details: {
    reasoning_tokens: number;
    audio_tokens: number;
    accepted_prediction_tokens: number;
    rejected_prediction_tokens: number;
  };
}

const exUsage: OpenAIUsageDetails = {
  prompt_tokens: 10,
  completion_tokens: 1870,
  total_tokens: 1880,
  completion_tokens_details: {
    reasoning_tokens: 1792,
    audio_tokens: 0,
    accepted_prediction_tokens: 0,
    rejected_prediction_tokens: 0,
  },
};

export function createOpenAIMockResponse(
  usageDetails?: OpenAIUsageDetails
): Response {
  return new Response(
    JSON.stringify({
      id: "chatcmpl-1234567890",
      object: "chat.completion",
      created: 1759861728,
      model: "gpt-5-2025-08-07",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content:
              "This is a mock response from the OpenAI API for testing purposes. - Helicone ooga booga",
            refusal: null,
            annotations: [],
          },
          finish_reason: "stop",
        },
      ],
      usage: usageDetails || exUsage,
      service_tier: "default",
      system_fingerprint: null,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
