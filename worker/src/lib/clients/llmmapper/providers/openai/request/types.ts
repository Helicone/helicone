export interface OpenAIRequestBody {
	model: string;
	messages: {
		role: 'system' | 'user' | 'assistant' | 'function';
		content:
			| string
			| null
			| Array<{
					type: 'text' | 'image_url';
					text?: string;
					image_url?: {
						url: string;
						detail?: 'auto' | 'low' | 'high';
					};
			  }>;
		name?: string;
		function_call?: {
			name: string;
			arguments: string;
		};
	}[];
	functions?: {
		name: string;
		description?: string;
		parameters: object; // JSON Schema object
	}[];
	function_call?: 'auto' | 'none' | { name: string };
	temperature?: number;
	top_p?: number;
	n?: number;
	stream?: boolean;
	stop?: string | string[];
	max_tokens?: number;
	presence_penalty?: number;
	frequency_penalty?: number;
	logit_bias?: { [key: string]: number };
	user?: string;
	seed?: number;
	tools?: {
		type: string;
		function: {
			name: string;
			description?: string;
			parameters: object; // JSON Schema object
		};
	}[];
	tool_choice?: 'auto' | 'none' | { type: string; function: { name: string } };
	response_format?: { type: 'text' | 'json_object' };
}
