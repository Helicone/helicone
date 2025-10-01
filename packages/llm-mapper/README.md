# mappers vs transform
Explaining the mappers vs transform utils in this package :p

Written Sept 30th, 2025 (check if still relevant)

## TL;DR
At the risk of oversimplifying it a bit, when you open a request drawer, you can view these modes:
- Rendered: uses the output of `mappers` utils
- Raw: uses the output of `mappers` utils
- JSON: displays full output of `transform` utils
- Debug: displays full outputs of `mappers` utils
The idea is that we have our Helicone types which we use to pretty render stuff in standardized types, but when users want to see the non-rendered source of truth of the request, that would be JSON.

EXAMPLE FLOW (AI Gateway):
1. User makes an AI Gateway request to an Anthropic endpoint (e.g Sonnet 4 @ Vertex)
2. `transform` util to convert OpenAI request -> Anthropic request
3. Send request
4. `transform` util to convert Anthropic response -> OpenAI response
5. Store OpenAI (e.g in completion chunk format) in S3.
note: If its a streaming request, we use body processors (see `ResponseBodyHandler`) to convert the stream chunks into a consolidated chat completion object
6. User queries requests on web
7. `mappers` utils to convert OpenAI response -> Helicone response
8. Use Helicone response to render things like the conversation turns viewport
note: we also use this mapper when logging to Clickhouse to get a preview of the response.

EXAMPLE FLOW (non AI Gateway):
1. User makes Anthropic request
2. Store Anthropic (e.g in Anthropic response format) in S3
3. User queries requests on web
4. `mappers` utils to convert Anthropic response -> Helicone response
5. Use Helicone response to render things like the conversation turns viewport


#### References
- See the `transform/types/logs.ts` file, this outlines the type that we store in S3
- See the `transform/types/openai.ts`, this outlines the provider OpenAI types
- See the `mappers/types.ts`, this outline the standardized Helicone format types