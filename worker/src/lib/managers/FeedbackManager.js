import { FREQUENT_PRECENT_LOGGING, } from "../util/loggers/DBQueryTimer";
export async function handleFeedback(request) {
    const body = await request.getJson();
    const heliconeId = body["helicone-id"];
    const rating = body["rating"];
    const auth = await request.auth();
    if (auth.error) {
        return new Response(auth.error, { status: 401 });
    }
    if (auth.data?._type !== "bearer") {
        return new Response("Invalid token type.", { status: 401 });
    }
    const result = await fetch(`https://api.helicone.ai/v1/request/${heliconeId}/feedback`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: auth.data.token,
        },
        body: JSON.stringify({ rating }),
    });
    if (!result.ok) {
        return new Response(`error ${await result.text()}`, {
            status: 500,
        });
    }
    return new Response(JSON.stringify({
        message: "Feedback added successfully.",
        helicone_id: heliconeId,
    }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
        },
    });
}
export async function getResponse(dbClient, dbQueryTimer, heliconeId) {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        const { data: response, error: responseError } = await dbQueryTimer.withTiming(dbClient.from("response").select("*").eq("request", heliconeId), {
            queryName: "select_response_by_request",
            percentLogging: FREQUENT_PRECENT_LOGGING,
        });
        if (responseError) {
            console.error("Error fetching response:", responseError.message);
            return { error: responseError.message, data: null };
        }
        if (response && response.length > 0) {
            return { error: null, data: response[0] };
        }
        const sleepDuration = i === 0 ? 100 : 1000;
        await new Promise((resolve) => setTimeout(resolve, sleepDuration));
    }
    return { error: "Response not found.", data: null };
}
