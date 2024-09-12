import { AntRequestBody, ContentBlock } from '../../anthropic/request/types';
import { OpenAIRequestBody } from './types';

export function toAnthropic(openAIBody: OpenAIRequestBody): AntRequestBody {
	const antBody: AntRequestBody = {
		model: mapModel(openAIBody.model),
		messages: [],
		max_tokens: openAIBody.max_tokens ?? 1024,
		temperature: openAIBody.temperature,
		top_p: openAIBody.top_p,

		stream: openAIBody.stream,
	};

	if (openAIBody.stop) {
		antBody.stop_sequences = Array.isArray(openAIBody.stop)
			? openAIBody.stop
			: openAIBody.stop
			? [openAIBody.stop]
			: [];
	}

	const { messages, system } = extractSystemMessage(openAIBody.messages);
	antBody.messages = mapMessages(messages);
	if (system) {
		antBody.system = system;
	}

	if (openAIBody.user) {
		antBody.metadata = { user_id: openAIBody.user };
	}

	if (openAIBody.function_call || openAIBody.functions) {
		throw new Error('Function calling and tools are not supported');
	}

	if (openAIBody.logit_bias) {
		throw new Error('Logit bias is not supported');
	}

	return antBody;
}

function extractSystemMessage(messages: OpenAIRequestBody['messages']): {
	messages: OpenAIRequestBody['messages'];
	system?: string;
} {
	const systemMessage = messages.find((msg) => msg.role === 'system');
	const otherMessages = messages.filter((msg) => msg.role !== 'system');

	return {
		messages: otherMessages,
		system: systemMessage?.content as string | undefined,
	};
}

function mapModel(model: string): string {
	return model;
}

function mapMessages(
	messages: OpenAIRequestBody['messages']
): AntRequestBody['messages'] {
	return messages.map((message): AntRequestBody['messages'][0] => {
		if (message.role === 'function') {
			throw new Error('Function messages are not supported');
		}

		const antMessage: AntRequestBody['messages'][0] = {
			role: message.role as 'user' | 'assistant',
			content: 'n/a',
		};

		if (typeof message.content === 'string') {
			if (message.content.length === 0) {
				antMessage.content = 'n/a';
			} else {
				antMessage.content = message.content;
			}
		} else if (Array.isArray(message.content)) {
			antMessage.content = message.content.map((item): ContentBlock => {
				if (item.type === 'text') {
					return { type: 'text', text: item.text || '' };
				} else if (item.type === 'image_url' && item.image_url) {
					const url = item.image_url.url;
					return {
						type: 'image',
						source: {
							type: url.startsWith('data:') ? 'base64' : 'url',
							media_type: url.startsWith('data:')
								? url.split(';')[0].split(':')[1]
								: `image/${url.split('.').pop()}`,
							data: url.startsWith('data:') ? url.split(',')[1] : url,
						},
					};
				}
				throw new Error(`Unsupported content type: ${item.type}`);
			});
		} else if (message.content === null) {
			antMessage.content = ' ';
		} else {
			throw new Error('Unsupported message content type');
		}

		return antMessage;
	});
}
