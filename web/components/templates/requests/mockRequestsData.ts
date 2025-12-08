import {
  DEFAULT_UUID,
  MappedLLMRequest,
} from "@helicone-package/llm-mapper/types";

// Simple mock filter map with just the properties we need for display
export const getMockFilterMap = () => {
  return [
    {
      label: "Model",
      operators: [
        { label: "equals", value: "equals" },
        { label: "not equals", value: "not equals" },
      ],
      table: "request_response_rmt",
      column: "model",
      category: "request",
    },
    {
      label: "User",
      operators: [
        { label: "equals", value: "equals" },
        { label: "not equals", value: "not equals" },
      ],
      table: "request_response_rmt",
      column: "user_id",
      category: "request",
    },
    {
      label: "Status",
      operators: [
        { label: "equals", value: "equals" },
        { label: "not equals", value: "not equals" },
      ],
      table: "request_response_rmt",
      column: "status",
      category: "request",
    },
    {
      label: "Source",
      operators: [
        { label: "equals", value: "equals" },
        { label: "not equals", value: "not equals" },
        { label: "contains", value: "contains" },
      ],
      table: "properties",
      column: "source",
      category: "custom properties",
      isCustomProperty: true,
    },
  ];
};

// Generate a realistic-looking mock request
const generateMockRequest = (
  id: string,
  forceStatusCode?: number,
): MappedLLMRequest => {
  const models = ["gpt-4", "gpt-3.5-turbo", "claude-2", "llama-2"];
  const modelIndex = Math.floor(Math.random() * models.length);
  const model = models[modelIndex];

  // Generate status code with 85% success, 10% rate limit, 5% server error
  const randomStatusCode = (): number => {
    const rand = Math.random();
    if (rand < 0.85) return 200;
    if (rand < 0.95) return 429;
    return 500;
  };

  const statusCode = forceStatusCode ?? randomStatusCode();
  const getStatusType = (code: number): "success" | "error" => {
    return code >= 200 && code < 300 ? "success" : "error";
  };

  const timeOffset = Math.floor(Math.random() * 12 * 60 * 60 * 1000); // Random time within 12 hours
  const time = new Date(Date.now() - timeOffset);
  const isStream = Math.random() > 0.7; // 30% chance of being a stream
  const promptTokens = Math.floor(Math.random() * 40) + 10;
  const completionTokens = Math.floor(Math.random() * 60) + 20;
  // Randomly add cache tokens (about 30% of requests have cache tokens)
  const hasCacheTokens = Math.random() > 0.7;
  const promptCacheReadTokens = hasCacheTokens
    ? Math.floor(Math.random() * 20)
    : 0;
  const promptCacheWriteTokens = hasCacheTokens
    ? Math.floor(Math.random() * 10)
    : 0;
  const totalTokens =
    promptTokens +
    completionTokens +
    promptCacheReadTokens +
    promptCacheWriteTokens;

  // Random feedback (about 30% of requests have feedback)
  const hasFeedback = Math.random() > 0.7;
  const feedbackRating = hasFeedback ? Math.random() > 0.5 : null;
  const feedbackTime = hasFeedback
    ? new Date(time.getTime() + 1000 * 60 * 5).toISOString()
    : null; // 5 min after request

  // Define different question types and responses
  const questions = [
    {
      type: "capital",
      countries: ["France", "Spain", "Italy", "Germany", "Japan"],
      templates: [
        "What is the capital of {country}?",
        "Can you tell me the capital city of {country}?",
        "I need to know what the capital of {country} is.",
        "What city serves as the capital of {country}?",
      ],
      answers: {
        France:
          "The capital of France is Paris. It is known for the Eiffel Tower, the Louvre Museum, and its beautiful architecture.",
        Spain:
          "Madrid is the capital of Spain. It's famous for the Prado Museum, Royal Palace, and vibrant city life.",
        Italy:
          "Rome is the capital of Italy. It's home to ancient ruins like the Colosseum, Vatican City, and delicious cuisine.",
        Germany:
          "Berlin is the capital of Germany. It's known for its history, the Brandenburg Gate, and vibrant cultural scene.",
        Japan:
          "Tokyo is the capital of Japan. It's a blend of ultramodern and traditional, with skyscrapers, historic temples, and amazing food.",
      },
    },
    {
      type: "population",
      countries: ["United States", "China", "India", "Brazil", "Australia"],
      templates: [
        "What is the population of {country}?",
        "How many people live in {country}?",
        "Can you tell me {country}'s current population?",
        "I'm researching demographics - what's the population of {country}?",
      ],
      answers: {
        "United States":
          "The United States has a population of approximately 332 million people, making it the third most populous country in the world.",
        China:
          "China has the world's largest population with about 1.4 billion people, though its growth rate has slowed in recent years.",
        India:
          "India has around 1.38 billion people and is expected to become the world's most populous country in the near future.",
        Brazil:
          "Brazil has a population of approximately 213 million people, making it the most populous country in South America.",
        Australia:
          "Australia has a population of about 25 million people, with most people living in coastal urban areas.",
      },
    },
    {
      type: "language",
      countries: [
        "Switzerland",
        "Canada",
        "Belgium",
        "Singapore",
        "South Africa",
      ],
      templates: [
        "What languages are spoken in {country}?",
        "What are the official languages of {country}?",
        "Can you tell me about the languages used in {country}?",
        "I'm curious about linguistic diversity in {country} - what languages do they speak?",
      ],
      answers: {
        Switzerland:
          "Switzerland has four official languages: German, French, Italian, and Romansh. German is the most widely spoken, followed by French.",
        Canada:
          "Canada has two official languages: English and French. English is the most commonly spoken, while French is predominant in Quebec.",
        Belgium:
          "Belgium has three official languages: Dutch (Flemish), French, and German, with Dutch and French being the most widely spoken.",
        Singapore:
          "Singapore has four official languages: English, Mandarin Chinese, Malay, and Tamil. English is the language of business and government.",
        "South Africa":
          "South Africa has 11 official languages, including English, Afrikaans, Zulu, Xhosa, and others, reflecting its diverse population.",
      },
    },
  ];

  // Select a random question type
  const questionType = questions[Math.floor(Math.random() * questions.length)];

  // Select a random country from the question type
  const countryIndex = Math.floor(
    Math.random() * questionType.countries.length,
  );
  const country = questionType.countries[countryIndex];

  // Select a random template and insert the country
  const templateIndex = Math.floor(
    Math.random() * questionType.templates.length,
  );
  const questionText = questionType.templates[templateIndex].replace(
    "{country}",
    country,
  );

  // Get the corresponding answer
  const answerText =
    questionType.answers[country as keyof typeof questionType.answers];

  // Generate a meaningful prompt ID based on the question type and country
  const promptId = `prompt-${questionType.type}-${country
    .toLowerCase()
    .replace(/\s+/g, "-")}-${Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0")}`;

  // Random evaluation scores (about 40% of requests have scores)
  const hasScores = Math.random() > 0.6;
  const scores = hasScores
    ? {
        "helicone-score-feedback": Math.random() > 0.5 ? 1 : 0,
        "factual-accuracy": {
          value: Math.floor(Math.random() * 10) + 1,
          valueType: "number",
        },
        coherence: {
          value: Math.floor(Math.random() * 10) + 1,
          valueType: "number",
        },
      }
    : null;

  const userMessage = {
    _type: "message" as const,
    role: "user",
    content: questionText,
  };

  const assistantMessage = {
    _type: "message" as const,
    role: "assistant",
    content: answerText,
  };

  return {
    _type: "openai-chat",
    id: id,
    model: model,
    schema: {
      request: {
        model: model,
        messages: [userMessage],
        stream: isStream,
        ...(isStream && { stream_options: { include_usage: true } }),
      },
      response: {
        messages: [assistantMessage],
        model: model,
      },
    },
    preview: {
      request: userMessage.content || "",
      response: assistantMessage.content || "",
      concatenatedMessages: [userMessage, assistantMessage],
    },
    raw: {
      request: {
        model: model,
        stream: isStream,
        ...(isStream && { stream_options: { include_usage: true } }),
      },
      response: {
        model: model,
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      },
    },
    heliconeMetadata: {
      requestId: id,
      path: "/v1/chat/completions",
      countryCode: "US",
      cacheEnabled: false,
      cacheReferenceId: DEFAULT_UUID,
      createdAt: time.toISOString(),
      totalTokens: totalTokens,
      promptTokens: promptTokens,
      completionTokens: completionTokens,
      promptCacheReadTokens: promptCacheReadTokens,
      promptCacheWriteTokens: promptCacheWriteTokens,
      latency: Math.floor(Math.random() * 2000) + 500,
      user: `user-${Math.floor(Math.random() * 999)}`,
      status: {
        code: statusCode,
        statusType: getStatusType(statusCode),
      },
      customProperties: {
        source: ["web", "mobile", "api"][Math.floor(Math.random() * 3)],
        environment: ["production", "staging", "development"][
          Math.floor(Math.random() * 3)
        ],
        "Helicone-Prompt-Id": promptId,
      },
      cost: Math.random() * 0.1,
      feedback: {
        createdAt: feedbackTime,
        id: null,
        rating: feedbackRating,
      },
      provider: "OPENAI",
      timeToFirstToken: Math.floor(Math.random() * 500) + 100,
      scores: scores,
    },
  };
};

// Generate mock requests data
export const getMockRequests = (
  count: number = 25,
  forceStatusCode?: number,
): MappedLLMRequest[] => {
  return Array.from({ length: count }, (_, i) =>
    generateMockRequest(`mock-req-${i}`, forceStatusCode),
  );
};

// Mock property values for the table
export const getMockProperties = (): string[] => {
  return ["source", "environment", "region", "session_id"];
};

// Mock count for pagination
export const getMockRequestCount = (): number => {
  return 1547; // Random realistic-looking total
};
