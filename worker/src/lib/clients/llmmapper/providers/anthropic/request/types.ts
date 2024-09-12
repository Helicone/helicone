export interface AntRequestBody {
	model: string;
	messages: {
		role: 'user' | 'assistant' | 'system';
		content: string | ContentBlock[];
	}[];
	max_tokens: number;
	metadata?: {
		user_id?: string;
	};
	system?: string;
	temperature?: number;
	top_p?: number;
	top_k?: number;
	stop_sequences?: string[];
	stream?: boolean;
}

export interface ContentBlock {
	type: 'text' | 'image';
	text?: string;
	source?: {
		type: 'base64' | 'url';
		media_type: string;
		data: string;
	};
}
