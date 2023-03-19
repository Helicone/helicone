import { GenericResult, Result } from ".";

export interface Prompt {
    prompt: string;
    values: { [key: string]: string };
}

interface Message {
    role: string;
    content: string;
}

export interface ChatPrompt {
    prompt: Message[];
    values: { [key: string]: string };
}

interface PromptResult {
    request: Request,
    body: string,
    prompt?: Prompt | ChatPrompt,
}

function formatPrompt(prompt: Prompt): Result {
    let formattedString = prompt.prompt;
    const missingValues = [];

    for (const key in prompt.values) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        if (!formattedString.includes(`{{${key}}}`)) {
            missingValues.push(key);
        } else {
            formattedString = formattedString.replace(placeholder, prompt.values[key]);
        }
    }

    // if (missingValues.length > 0) {
    //     return {
    //         data: null,
    //         error: `Missing values in the prompt: ${missingValues.join(', ')}`,
    //     };
    // }

    const regex = /{{([^{}]+)}}/g;
    let match = regex.exec(formattedString);
    const missingPlaceholders = [];

    while (match) {
        if (!prompt.values.hasOwnProperty(match[1])) {
            missingPlaceholders.push(match[1]);
        }
        match = regex.exec(formattedString);
    }

    // if (missingPlaceholders.length > 0) {
    //     return {
    //         data: null,
    //         error: `Missing placeholders in the prompt regex: ${missingPlaceholders.join(', ')}`,
    //     };
    // }

    return {
        data: formattedString,
        error: null,
    };
}

function updateContentLength(clone: Request, text: string): Request {
    const body = new TextEncoder().encode(text);
    const headers = new Headers(clone.headers);
    headers.set("Content-Length", `${body.byteLength}`);

    return new Request(clone.url, {
        method: clone.method,
        headers,
        body
    });
}

export async function extractPrompt(
    request: Request,
): Promise<GenericResult<PromptResult>> {
    const isPromptRegexOn = request.headers.get("Helicone-Prompt-Format") !== null;
	
    if (isPromptRegexOn) {
        try {
            const cloneRequest = request.clone();
            const cloneBody = await cloneRequest.text();
            const json = cloneBody ? JSON.parse(cloneBody) : {};
            if ("messages" in json) {
                return extractPromptMessages(cloneRequest, json);
            }

            const prompt = JSON.parse(json["prompt"]);
            const stringPromptResult = formatPrompt(prompt);
            if (stringPromptResult.error !== null) {
                return {
                    data: null,
                    error: stringPromptResult.error,
                };
            }
            const stringPrompt = stringPromptResult.data;
            json["prompt"] = stringPrompt;
            const body = JSON.stringify(json);
            const formattedRequest = updateContentLength(cloneRequest, body);

            return {
                data: {
                    request: formattedRequest,
                    body: body,
                    prompt: prompt,
                },
                error: null,
            };
        } catch (error) {
            console.error(error);
            return {
                data: null,
                error: `Error parsing prompt: ${error}`,
            }
        }
    } else {
        return {
            data: {
                request: request,
                body: await request.text(),
            },
            error: null,
        }
    }
}

async function extractPromptMessages(
    cloneRequest: Request,
    json: any,
): Promise<GenericResult<PromptResult>> {
    console.log("Original body", cloneRequest.body)
    const regexPrompt = json["messages"];
    const regexMessages = regexPrompt["prompt"];
    const regexValues = regexPrompt["values"];

    let formattedMessages = [];
    for (let i = 0; i < regexMessages.length; i++) {
        let message = regexMessages[i];
        const content = message["content"];

        const formattedContent = formatPrompt(
            {
                prompt: content,
                values: regexValues,
            }
        )

        if (formattedContent.error !== null) {
            console.log("ERROR", formattedContent.error)
            return {
                data: null,
                error: formattedContent.error,
            };
        }

        const formattedMessage = {
            ...message,
            content: formattedContent.data,
        }

        formattedMessages.push(formattedMessage);
    }
    json["messages"] = formattedMessages;
    console.log("FORMATTED", formattedMessages)
    const body = JSON.stringify(json);
    const formattedRequest = updateContentLength(cloneRequest, body);

    const data = {
        request: formattedRequest,
        prompt: regexPrompt,
        body,
    }
    console.log("Final data", data)

    return {
        data: {
            request: formattedRequest,
            prompt: regexPrompt,
            body,
        },
        error: null,
    };
}
