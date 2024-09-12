import { toOpenAI } from '../../providers/anthropic/streamedResponse/toOpenai';
import { toAnthropic } from '../../providers/openai/request/toAnthropic';
import { OpenAIRequestBody } from '../../providers/openai/request/types';

const ENDING_MESSAGE = `data: {"id":"chatcmpl-A4kEtQWA8g4OlOYtKaDdBKLWdhrBx","object":"chat.completion.chunk","created":1725694419,"model":"gpt-4o-2024-05-13","system_fingerprint":"fp_25624ae3a5","choices":[{"index":0,"delta":{},"logprobs":null,"finish_reason":"stop"}]}
data: [DONE]
`;

export function oaiStream2antStream(stream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
	return new ReadableStream({
		start(controller) {
			let currentMessage = '';

			const reader = stream
				.pipeThrough(new TextDecoderStream())
				.pipeThrough(
					new TransformStream({
						transform(chunk) {
							currentMessage += chunk;
							const messages = currentMessage.split('\n\n');

							if (messages.length > 1) {
								const firstChunks = messages.slice(0, -1);
								const lastChunk = messages[messages.length - 1];
								for (const line of firstChunks.join('\n\n').split('\n')) {
									if (line.trim().startsWith('data: ')) {
										console.log('line', line);
										const jsonData = toOpenAI(JSON.parse(line.slice(6)));
										if (jsonData) {
											controller.enqueue(`data: ${JSON.stringify(jsonData).trim()}\n\n`);
										}
									}
								}
								currentMessage = lastChunk;
							}
						},
						flush() {
							for (const line of currentMessage.split('\n')) {
								if (line.trim().startsWith('data: ')) {
									const jsonData = toOpenAI(JSON.parse(line.slice(6)));
									if (jsonData) {
										controller.enqueue(`data: ${JSON.stringify(jsonData).trim()}\n\n`);
									}
								}
							}
							for (const line of ENDING_MESSAGE.split('\n')) {
								controller.enqueue(line + '\n\n');
							}
						},
					})
				)
				.getReader()
				.read();
		},
	})
		.pipeThrough(
			new TransformStream({
				transform(chunk, controller) {
					controller.enqueue(chunk);
				},
			})
		)
		.pipeThrough(new TextEncoderStream());
}

export async function oaiStream2antStreamResponse({ body, headers }: { body: OpenAIRequestBody; headers: Headers }): Promise<Response> {
	const anthropicBody = toAnthropic(body);

	let auth = headers.get('Authorization');
	if (auth?.startsWith('Bearer ')) {
		auth = auth.split(' ')[1];
	}

	const anthropicVersion = headers.get('anthropic-version') || '2023-06-01';

	try {
		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			body: JSON.stringify(anthropicBody),
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': auth ?? '',
				'anthropic-version': anthropicVersion,
			},
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error('Anthropic API error:', errorBody);
			return new Response(errorBody, {
				status: response.status,
				headers: response.headers,
			});
		}

		if (!response.body) {
			console.error('No response body from Anthropic API');
			return new Response('No response body', { status: 500 });
		}

		const stream = oaiStream2antStream(response.body);

		return new Response(stream, {
			headers: {
				// ...response.headers,
				'Content-Type': 'text/event-stream; charset=utf-8',
				'Cache-Control': 'no-cache',
				connection: 'keep-alive',
				'Transfer-Encoding': 'chunked',
				'Content-Length': '',
			},
		});
	} catch (error) {
		console.error('Error in oaiStream2antStreamResponse:', error);
		return new Response(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
	}
}
