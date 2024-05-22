/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	HELICONE_AUTH: string;
}

interface HeliconeRequest {
	request_id?: string; // Helicone request ID
	request_body?: any; // request body (ex: GPT-4, Gemini, etc.)
	response_body?: any; // LLM response body (ex: GPT-4, Gemini, etc.)
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		if (request.method === 'POST') {
			const data = (await request.json()) as HeliconeRequest;

			// Execute the scoring function
			const scores = calculateScore(data);

			// Extract the request ID
			const requestId = data.request_id;

			// Post the scores to the scoring API.
			const result = await postScore(
				`https://jawn.helicone.ai/v1/request/${requestId}/score`,
				scores,
				env
			);

			return new Response(JSON.stringify(result), {
				headers: {
					'Content-Type': 'application/json',
				},
				status: 200,
			});
		} else {
			return new Response('Method Not Allowed', { status: 405 });
		}
	},
};

//Post score data back to Helicone
async function postScore(url: string, scoreData: Record<string, number>, env: Env) {
	const heliconeAuth = `Bearer ${env.HELICONE_AUTH}`;
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Authorization': heliconeAuth,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ scores: scoreData }),
		});
		return {
			status: 'Success',
			responseStatusCode: response.status,
			responseBody: await response.json(),
		};
	} catch (e: any) {
		return {
			status: 'Error',
			message: e.message,
		};
	}
}

// You can customize the scoring function below and add more scores as needed.
function calculateScore(data: HeliconeRequest): Record<string, number> {
	if (data.response_body) {
		return {
			vocabulary_diversity: calculateVocabularyDiversity(data.response_body),
		};
	}

	return {};
}

function countWordsInResponse(response_body: any): number {
	let total_words = 0;

	if (response_body.choices) {
		for (const choice of response_body.choices) {
			if (choice.message && choice.message.content) {
				const content = choice.message.content;
				const word_count = content.split(' ').length;
				total_words += word_count;
				console.log(`Content: ${content} - Words: ${word_count}`);
			}
		}
	}

	return total_words;
}

function calculateVocabularyDiversity(response_body: any): number {
	const uniqueWords = new Set<string>();
	response_body.choices.forEach((choice: any) => {
		if (choice.message && choice.message.content) {
			const words = choice.message.content.toLowerCase().split(/\s+/) as string[];
			words.forEach(word => uniqueWords.add(word));
		}
	});
	const totalWords = countWordsInResponse(response_body);
	if (totalWords === 0) return 0;
	return Math.round((uniqueWords.size / totalWords) * 100);
}
