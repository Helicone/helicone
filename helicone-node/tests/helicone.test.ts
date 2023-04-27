import { Configuration, OpenAIApi } from "./../index";
import { v4 as uuidv4 } from "uuid";

const apiKey = process.env.OPENAI_API_KEY;
const heliconeApiKey = process.env.HELICONE_API_KEY;

if (!apiKey || !heliconeApiKey) {
  throw new Error("API keys must be set as environment variables.");
}

const configuration = new Configuration({
    apiKey,
    heliconeApiKey,
    cache: true,
});

const openai = new OpenAIApi(configuration);

// Test cache behavior
test("cache", async () => {
  const uniqueId = uuidv4();
  const prompt = `Cache test with UUID: ${uniqueId}`;

  await openai.createCompletion({
    model: "text-ada-001",
    prompt,
    max_tokens: 10,
  });
});

// Test rate limit policy
test("rate limit policy", async () => {
  const rateLimitPolicyDict = { quota: 10, time_window: 60 };
  const rateLimitPolicyStr = "10;w=60";

  await openai.ChatCompletion.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Rate limit policy test" }],
    rate_limit_policy: rateLimitPolicyDict,
  });

  await openai.ChatCompletion.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: "Rate limit policy test" }],
    rate_limit_policy: rateLimitPolicyStr,
  });
});

// Test custom properties
test("custom properties", async () => {
  const properties = {
    Session: "24",
    Conversation: "support_issue_2",
    App: "mobile",
  };

  await openai.Completion.create({
    model: "text-ada-001",
    prompt: "Custom properties test",
    max_tokens: 10,
    properties,
  });
});
