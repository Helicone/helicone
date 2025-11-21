import OpenAI from 'openai';

const TOKEN_REPEAT_COUNT = 2048;

const weatherTool = {
    type: "function",
    function: {
        name: "get_current_weather",
        description: "Get the current weather in a given location",
        parameters: {
            type: "object",
            properties: {
                location: {
                    type: "string",
                    description: "The city and state, e.g. San Francisco, CA"
                },
                unit: {
                    type: "string",
                    enum: ["celsius", "fahrenheit"]
                }
            },
            required: ["location", "unit"]
        }
    }
};

const searchWebTool = {
    type: "function",
    function: {
        name: "search_web",
        description: "Search the web for information",
        parameters: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description: "The search query"
                }
            },
            required: ["query"]
        }
    }
};


async function createSystemMessage(testProviderCache: boolean, cacheTriggerToken: string): Promise<any[]> {
    return [
        {
            role: "system",
            content: "You are a helpful assistant that can answer questions and help with tasks." + (testProviderCache ? `To reach ${TOKEN_REPEAT_COUNT} tokens: ${cacheTriggerToken.repeat(TOKEN_REPEAT_COUNT)}` : ''),
        },
    ]
}

async function makeRequest(
    client: OpenAI,
    model: string,
    stream: boolean,
    testProviderCache: boolean,
    cacheTriggerToken: string,
    messages: any[],
    tools?: any[]
) {
    const systemMessage = await createSystemMessage(testProviderCache, cacheTriggerToken);
    const combinedMessages = [...systemMessage, ...messages];

    const requestBody = {
        model: model,
        messages: combinedMessages,
        temperature: 0.7,
        stream: stream,
        ...(stream ? { stream_options: { include_usage: true } } : {}),
        ...(tools && tools.length > 0 ? { tools: tools, tool_choice: "auto" } : {}),
    };

    return await client.chat.completions.create(requestBody as any);
}

async function processStreamingResponse(completion: any): Promise<{ stream: any[], complete: any }> {
    let completeMessage = {
        role: "assistant" as const,
        content: "",
        tool_calls: [] as any[]
    };

    const chunks: any[] = [];

    for await (const chunk of completion) {
        chunks.push(chunk);
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
            completeMessage.content += delta.content;
        }

        if (delta?.tool_calls) {
            for (const toolCall of delta.tool_calls) {
                if (toolCall.index !== undefined) {
                    if (!completeMessage.tool_calls[toolCall.index]) {
                        completeMessage.tool_calls[toolCall.index] = {
                            id: "",
                            type: "function",
                            function: { name: "", arguments: "" }
                        };
                    }

                    if (toolCall.id) {
                        completeMessage.tool_calls[toolCall.index].id = toolCall.id;
                    }
                    if (toolCall.function?.name) {
                        completeMessage.tool_calls[toolCall.index].function.name += toolCall.function.name;
                    }
                    if (toolCall.function?.arguments) {
                        completeMessage.tool_calls[toolCall.index].function.arguments += toolCall.function.arguments;
                    }
                }
            }
        }
    }

    return { stream: chunks, complete: completeMessage };
}

function processNonStreamingResponse(completion: any): { complete: any } {
    return { complete: completion.choices[0].message };
}

export async function CreateChatCompletion(params: {
    client: OpenAI,
    model: string,
    stream: boolean,
    testProviderCache?: boolean,
    cacheTriggerToken?: string,
    useTools?: boolean
}): Promise<Array<{ stream?: any[], complete: any }>> {
    const {
        client,
        model,
        stream,
        testProviderCache = false,
        cacheTriggerToken = "grug ",
        useTools = false
    } = params;

    const responses: Array<{ stream?: any[], complete: any }> = [];

    const baseMessage = useTools
        ? "What is the weather in San Francisco in Celsius? Tell me your plan, then use the tool."
        : "What is the weather in San Francisco in Celsius?";
    const userMessage = baseMessage;
    const messages = [{ role: "user", content: userMessage }];
    const tools = useTools ? [weatherTool, searchWebTool] : undefined;

    const completion = await makeRequest(client, model, stream, testProviderCache, cacheTriggerToken, messages, tools);

    const firstResponse = stream
        ? await processStreamingResponse(completion)
        : processNonStreamingResponse(completion);

    responses.push(firstResponse);

    if (useTools && firstResponse.complete.tool_calls && firstResponse.complete.tool_calls.length > 0) {
        const toolCall = firstResponse.complete.tool_calls[0];
        if (toolCall.function.name === "get_current_weather") {
            const result = "It is sunny at 30 degrees Celsius in San Francisco.";

            const finalMessages = [
                ...messages,
                firstResponse.complete,
                {
                    role: "tool",
                    content: result,
                    tool_call_id: toolCall.id
                }
            ];

            const finalCompletion = await makeRequest(client, model, stream, testProviderCache, cacheTriggerToken, finalMessages, tools);

            const finalResponse = stream
                ? await processStreamingResponse(finalCompletion)
                : processNonStreamingResponse(finalCompletion);

            responses.push(finalResponse);
        }
    }

    return responses;
}