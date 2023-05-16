import { Configuration, OpenAIApi } from "../dist";
import { v4 as uuidv4 } from "uuid";

const apiKey = process.env.OPENAI_API_KEY;
const heliconeApiKey = process.env.HELICONE_API_KEY;

if (!apiKey || !heliconeApiKey) {
  throw new Error("API keys must be set as environment variables.");
}

// Test cache behavior
test("cache", async () => {
  const uniqueId = uuidv4();
  const prompt = `Cache test with UUID: ${uniqueId}`;

  const configuration = new Configuration({
    apiKey,
    heliconeApiKey,
    cache: true,
  });

  const openai = new OpenAIApi(configuration);

  await openai.createCompletion({
    model: "text-ada-001",
    prompt,
    max_tokens: 10,
  });
}, 60000);

// Test cache behavior
test("cache", async () => {
  const uniqueId = uuidv4();
  const prompt = `Cache test with UUID: ${uniqueId}`;

  const configuration = new Configuration({
    apiKey,
    heliconeApiKey,
    cache: true,
  });

  const openai = new OpenAIApi(configuration);

  await openai.createCompletion({
    model: "text-ada-001",
    prompt,
    max_tokens: 10,
  });
}, 60000);

// Test rate limit policy
test("rate limit policy", async () => {
  const rateLimitPolicyDict = { quota: 10, time_window: 60 };
  const rateLimitPolicyStr = "10;w=60";

  let configuration = new Configuration({
    apiKey,
    heliconeApiKey,
    rateLimitPolicy: rateLimitPolicyDict,
  });

  let openai = new OpenAIApi(configuration);

  await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Rate limit policy test" }],
  });

  configuration = new Configuration({
    apiKey,
    heliconeApiKey,
    rateLimitPolicy: rateLimitPolicyStr,
  });

  openai = new OpenAIApi(configuration);

  await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Rate limit policy test" }],
  });
}, 60000);

// Test custom properties
test("custom properties", async () => {
  const properties = {
    Session: "24",
    Conversation: "support_issue_2",
    App: "mobile",
  };

  const configuration = new Configuration({
    apiKey,
    heliconeApiKey,
    properties,
  });

  const openai = new OpenAIApi(configuration);

  await openai.createCompletion({
    model: "text-ada-001",
    prompt: "Custom properties test",
    max_tokens: 10,
  });
}, 60000);
