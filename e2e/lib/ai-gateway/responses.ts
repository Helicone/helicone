import OpenAI from 'openai';

const TOKEN_REPEAT_COUNT = 2048;

const weatherTool = {
    type: "function",
    name: "get_current_weather",
    description: "Get the current weather in a given location",
    parameters: {
        type: "object",
        properties: {
            location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA",
            },
            unit: { type: "string", enum: ["celsius", "fahrenheit"] },
        },
        required: ["location", "unit"],
    }
};

const searchWebTool = {
    type: "function",
    name: "search_web",
    description: "Search the web for information",
    parameters: {
        type: "object",
        properties: {
            query: {
                type: "string",
                description: "The search query",
            },
        },
        required: ["query"],
    }
};

function createInstructions(testProviderCache: boolean, cacheTriggerToken: string): string {
    return "You are a helpful assistant that can answer questions and help with tasks." +
           (testProviderCache ? ` To reach ${TOKEN_REPEAT_COUNT} tokens: ${cacheTriggerToken.repeat(TOKEN_REPEAT_COUNT)}` : '');
}

async function processStreamingResponse(stream: any): Promise<{ stream: any[], complete: any }> {
    const events: any[] = [];

    for await (const event of stream) {
        events.push(event);
    }

    const final = await stream.finalResponse();
    return { stream: events, complete: final };
}

function processNonStreamingResponse(resp: any): { complete: any } {
    return { complete: resp };
}

async function makeRequest(
    client: OpenAI,
    model: string,
    stream: boolean,
    testProviderCache: boolean,
    cacheTriggerToken: string,
    input: any,
    tools?: any[]
) {
    const instructions = createInstructions(testProviderCache, cacheTriggerToken);

    const requestBody: any = {
        model,
        instructions,
        input,
        metadata: {},
        ...(stream ? { stream: true } : {}),
        ...(tools && tools.length > 0 ? { tools, tool_choice: "auto" } : {}),
    };

    return stream
        ? client.responses.stream(requestBody)
        : await client.responses.create(requestBody);
}

export async function CreateResponse(params: {
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

    const userMessage = useTools
        ? `What is the weather in San Francisco in Celsius? Tell me your plan, then use the tool.`
        : `What is the weather in San Francisco in Celsius?`;

    const input: any[] = [
        { role: 'user', content: [{ type: 'input_text', text: userMessage }] }
    ];

    const tools = useTools ? [weatherTool, searchWebTool] : undefined;

    const completion = await makeRequest(
        client,
        model,
        stream,
        testProviderCache,
        cacheTriggerToken,
        input,
        tools
    );

    const firstResponse = stream
        ? await processStreamingResponse(completion)
        : processNonStreamingResponse(completion);

    responses.push(firstResponse);

    if (useTools) {
        const sanitizedOutput = firstResponse.complete.output.map((item: any) => {
            return {
                ...item,
                parsed_arguments: undefined,
            }
        });
        input.push(...sanitizedOutput);

        let hasToolCalls = false;
        firstResponse.complete.output.forEach((item: any) => {
            if (item.type == "function_call") {
                hasToolCalls = true;
                if (item.name == "get_current_weather") {
                    const result = "It is sunny at 30 degrees Celsius in San Francisco.";

                    input.push({
                        type: "function_call_output",
                        call_id: item.call_id,
                        output: JSON.stringify({
                            result
                        })
                    })
                }
            }
        });

        if (hasToolCalls) {
            const finalCompletion = await makeRequest(
                client,
                model,
                stream,
                testProviderCache,
                cacheTriggerToken,
                input,
                tools
            );

            const finalResponse = stream
                ? await processStreamingResponse(finalCompletion)
                : processNonStreamingResponse(finalCompletion);

            responses.push(finalResponse);
        }
    }

    return responses;
}
