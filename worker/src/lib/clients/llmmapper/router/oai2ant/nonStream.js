import { toOpenAI } from "../../providers/anthropic/response/toOpenai";
import { toAnthropic } from "../../providers/openai/request/toAnthropic";
export async function oai2ant({ body, headers, }) {
    console.log(body);
    const anthropicBody = toAnthropic(body);
    console.log(anthropicBody);
    let auth = headers.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
        auth = auth.split(" ")[1];
    }
    let anthropicVersion = headers.get("anthropic-version");
    if (!anthropicVersion) {
        anthropicVersion = "2023-06-01";
    }
    console.log(anthropicBody);
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        body: JSON.stringify(anthropicBody),
        headers: {
            ...headers,
            "Content-Type": "application/json",
            "x-api-key": auth ?? "",
            "anthropic-version": anthropicVersion,
        },
    });
    const responseBody = await response.json();
    console.log(responseBody);
    try {
        return new Response(JSON.stringify(toOpenAI(responseBody)), {
            headers: {
                ...response.headers,
                "Content-Type": "application/json",
            },
        });
    }
    catch (e) {
        return new Response(JSON.stringify(responseBody), {
            headers: {
                ...response.headers,
                "Content-Type": "application/json",
            },
        });
    }
}
