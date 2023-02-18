import { GenericResult } from ".";

export interface Prompt {
    prompt: string;
    values: { [key: string]: string };
}
 
interface PromptResult {
    request: Request,
    body: string,
    prompt?: Prompt,
}

function formatPrompt(prompt: Prompt): string {
    let formattedString = prompt.prompt;

    for (const key in prompt.values) {
        const placeholder = new RegExp(`{{${key}}}`, 'g');
        formattedString = formattedString.replace(placeholder, prompt.values[key]);
    }

    return formattedString;
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
            const prompt = JSON.parse(json["prompt"]);
            const stringPrompt = formatPrompt(prompt);
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
