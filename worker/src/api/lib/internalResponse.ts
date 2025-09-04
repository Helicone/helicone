export const InternalResponse = {
  newError(message: string, status: number): Response {
    console.error(`Response Error: `, message);
    return new Response(JSON.stringify({ error: message }), { status });
  },
  successJSON(data: unknown, enableCors = false): Response {
    if (enableCors) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          "content-type": "application/json;charset=UTF-8",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "PUT",
          "Access-Control-Allow-Headers":
            "Content-Type, helicone-jwt, helicone-org-id",
        },
      });
    }
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json;charset=UTF-8",
      },
    });
  },
  unauthorized(): Response {
    return this.newError("Unauthorized", 401);
  },
};
