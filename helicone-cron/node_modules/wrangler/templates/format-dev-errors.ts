// @ts-expect-error We'll swap in the entry point during build
import Worker from "__ENTRY_POINT__";

// @ts-expect-error
export * from "__ENTRY_POINT__";

export default {
	async fetch(req: Request, env: unknown, ctx: ExecutionContext) {
		try {
			return await Worker.fetch(req, env, ctx);
		} catch (err) {
			return new Response(
				`<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8" />
		<title>Error</title>
	</head>
	<body>
		<pre>${(err as Error).stack}</pre>
	</body>
</html>`,
				{
					status: 500,
					headers: {
						"Content-Type": "text/html",
					},
				}
			);
		}
	},
};
