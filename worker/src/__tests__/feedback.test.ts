import { createClient } from "@supabase/supabase-js";
import axios from "axios";

const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const SUPABASE_URL = "http://localhost:54321";

const dbClient = createClient(
  SUPABASE_URL ?? "",
  SUPABASE_SERVICE_ROLE_KEY ?? ""
);

const app = "http://127.0.0.1:8787";

async function truncateTables() {
  await dbClient.from("feedback").delete();
  await dbClient.from("feedback_metrics").delete();
}

async function sendPostRequest(endpoint: string, data: any) {
  const app = "http://127.0.0.1:8787";

  try {
    const response = await axios.post(`${app}${endpoint}`, data, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "helicone-auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      },
    });
    return response;
  } catch (error) {
    console.error(`Error sending POST request to ${endpoint}:`, error);
    throw error;
  }
}

// Helper function to perform a completion request
async function performCompletionRequest() {
  const response = await sendPostRequest("/v1/completions", {
    model: "text-ada-001",
    prompt: "Write a poem about butterfly",
    max_tokens: 15,
    temperature: 1.0,
  });

  return response.headers["helicone-id"];
}

async function performFeedbackRequest(
  heliconeId: string,
  name: string,
  value: any,
  dataType?: string
) {
  // Add data type optionally if it is provided
  let response;
  if (dataType !== undefined) {
    response = await sendPostRequest("/v1/feedback", {
      "helicone-id": heliconeId,
      name: name,
      value: value,
      "data-type": dataType,
    });
  } else {
    response = await sendPostRequest("/v1/feedback", {
      "helicone-id": heliconeId,
      name: name,
      value: value,
    });
  }

  return response;
}

describe("Feedback functionality", () => {
  beforeEach(async () => {
    await truncateTables();
  });

  test("Should create a feedback metric and insert feedback with explicit data type", async () => {
    const heliconeId = await performCompletionRequest();

    const feedbackResponse = await performFeedbackRequest(
      heliconeId,
      "rating",
      false,
      "boolean"
    );

    expect(feedbackResponse.status).toBe(200);

    // Check that the feedback metric and feedback entry are created in the database
    const { data: metricData } = await dbClient
      .from("feedback_metrics")
      .select("*")
      .eq("name", "rating")
      .single();

    expect(metricData).toBeDefined();
    expect(metricData!.data_type).toBe("boolean");

    const { data: feedbackData } = await dbClient
      .from("feedback")
      .select("*")
      .eq("feedback_metric_id", metricData!.id)
      .single();

    expect(feedbackData).toBeDefined();
    expect(feedbackData!.value).toBe("false");
  });

  test("Should create a feedback metric and insert feedback without explicit data type", async () => {
    const heliconeId = await performCompletionRequest();

    const feedbackResponse = await performFeedbackRequest(
      heliconeId,
      "rating",
      false
    );

    expect(feedbackResponse.status).toBe(200);

    // Check that the feedback metric and feedback entry are created in the database
    const { data: metricData } = await dbClient
      .from("feedback_metrics")
      .select("*")
      .eq("name", "rating")
      .single();

    expect(metricData).toBeDefined();
    expect(metricData!.data_type).toBe("boolean");

    const { data: feedbackData } = await dbClient
      .from("feedback")
      .select("*")
      .eq("feedback_metric_id", metricData!.id)
      .single();

    expect(feedbackData).toBeDefined();
    expect(feedbackData!.value).toBe("false");
  });

  test("Should use the same feedback metric for multiple feedback values", async () => {
    const heliconeId = await performCompletionRequest();

    // First feedback submission
    await performFeedbackRequest(heliconeId, "rating", false);

    // Second feedback submission
    const secondHeliconeId = await performCompletionRequest();
    await performFeedbackRequest(secondHeliconeId, "rating", true);

    // Check that there's only one feedback metric in the database
    const { data: metricsData } = await dbClient
      .from("feedback_metrics")
      .select("*");
    expect(metricsData!.length).toBe(1);
    expect(metricsData![0].name).toBe("rating");
  });

  test("Should throw an error if attempting to change the data type", async () => {
    const heliconeId = await performCompletionRequest();

    // First feedback submission
    await performFeedbackRequest(heliconeId, "rating", false);

    // Second feedback submission with a different data type
    const secondHeliconeId = await performCompletionRequest();
    const response = await performFeedbackRequest(
      secondHeliconeId,
      "rating",
      "good",
      "string"
    );

    expect(response.status).toBe(500);
    expect(response.data).toContain(
      "Data type does not match the existing feedback metric."
    );
  });
});
