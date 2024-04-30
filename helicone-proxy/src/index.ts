export interface Env {
	S3_BUCKET_NAME: string;
	S3_URL: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method !== 'GET') {
			return new Response('Method Not Allowed', { status: 405 });
		}
		try {
			const url = new URL(request.url);
			const path = url.pathname.replace('/obscured', `/${env.S3_BUCKET_NAME}`);
			const baseUrl = env.S3_URL || 'https://s3.us-west-2.amazonaws.com';
			const s3Url = `${baseUrl}${path}${url.search}`;

			const s3Response = await fetch(s3Url, {
				method: 'GET',
				headers: request.headers,
			});

			return new Response(s3Response.body as BodyInit, {
				status: s3Response.status,
				headers: s3Response.headers,
			});
		} catch (e) {
			console.error(e);
		}

		return new Response('Internal Server Error', { status: 500 });
	},
};
