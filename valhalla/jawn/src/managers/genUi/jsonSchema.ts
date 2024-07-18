import { ChatCompletionTool } from "openai/resources";

export const generateRequestFiltersSchema: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "generate-clickhouse-sql-query",
      description:
        "Generate Clickhouse sql query based on the filters schema and user queryprovided",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The final clickhouse query",
          },
          params: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "The name of the return parameter",
                },
                parameterType: {
                  type: "string",
                  description: "The typescript type of the parameter",
                },
              },
              required: ["name", "parameterType"],
            },
          },
          chartType: {
            type: "string",
            description: "The type of chart to be generated",
            enum: ["line", "bar", "pie"],
          },
        },
      },
    },
  },
];

export const getFinalPrompt = (
  prompt: string,
  additionalParams: string
): string =>
  `Generate Clickhouse query for the request data based on follow user request: ${prompt} and return as a query with output params(selected fields with types).
   Final result of executing this query should return data like {name: string, value: number} to be rendered in Frontend, so you need to diced which metric or DB field to pass to name and value. And also you need to choose suitable chart to render this data. For line chart we need return data in follow style {name: "date", value1: "number", value2: "number"} and so on, so this line chart can have multiple lines like value1 it's a first metric, value2 is a second and so on.
   Use Line chart for multiple metric comparison and bar or donut chart for single metric comparison.
    here's Clickhouse DB schema:
    default.request_response_versioned (
    response_id Nullable(UUID),
    response_created_at Nullable(DateTime64),
    latency Nullable(Int64),
    status Int64,
    completion_tokens Nullable(Int64),
    prompt_tokens Nullable(Int64),
    model String,
    request_id UUID,
    request_created_at DateTime64,
    user_id String,
    organization_id UUID,
    proxy_key_id Nullable(UUID),
    threat Nullable(Bool),
    time_to_first_token Nullable(Int64),
    provider String,
    target_url Nullable(String),
    country_code Nullable(String),
    created_at DateTime DEFAULT now(),
    sign Int8,
    version UInt32, 
    properties Map(LowCardinality(String), String) CODEC(ZSTD(1)),
    scores Map(LowCardinality(String), Int64) CODEC(ZSTD(1)),
    INDEX idx_properties_key mapKeys(properties) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_properties_value mapValues(properties) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_scores_key mapKeys(scores) TYPE bloom_filter(0.01) GRANULARITY 1,
    INDEX idx_scores_value mapValues(scores) TYPE bloom_filter(0.01) GRANULARITY 1
) DO NOT GENERATE DESTRUCTIVE REQUESTS SUCH AS DROP or DELETE and Also add to the query the following filters: ${additionalParams}`;
