
interface Prompt {
    prompt: string;
    values: { [key: string]: string };
}

function formatPrompt(prompt: Prompt): string {
    let formattedString = prompt.prompt;

    for (const key in prompt.values) {
        const placeholder = new RegExp(`{${key}}`, 'g');
        formattedString = formattedString.replace(placeholder, prompt.values[key]);
    }

    return formattedString;
}

export function updateContentLength(clone: Request, text: string): Request {
    const body = new TextEncoder().encode(text);
    const headers = new Headers(clone.headers);
    headers.set("Content-Length", `${body.byteLength}`);

    return new Request(clone.url, {
        method: clone.method,
        headers,
        body
    });
}

export function fillPromptRegex(jsonString: string): string {
    const parsedData = JSON.parse(jsonString)

    return formatPrompt(parsedData)
}
 
export function formatBody(body: string): string {
    const json = body ? JSON.parse(body) : {};
    const prompt = fillPromptRegex(json["prompt"]);
    json["prompt"] = prompt
    return JSON.stringify(json);
}