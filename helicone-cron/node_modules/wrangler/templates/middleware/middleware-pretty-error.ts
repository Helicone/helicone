import type { Middleware } from "./common";

// A middleware has to be a function of type Middleware
const prettyError: Middleware = async (request, env, _ctx, middlewareCtx) => {
	try {
		const response = await middlewareCtx.next(request, env);
		return response;
	} catch (e: any) {
		const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error 🚨</title>
        <style>
          pre {
            margin: 16px auto;
            max-width: 600px;
            background-color: #eeeeee;
            border-radius: 4px;
            padding: 16px;
          }
        </style>
    </head>
    <body>
        <pre>${e.stack}</pre>
    </body>
    </html>
    `;

		return new Response(html, {
			status: 500,
			headers: { "Content-Type": "text/html;charset=utf-8" },
		});
	}
};

export default prettyError;
