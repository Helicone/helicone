/* eslint-disable @typescript-eslint/no-explicit-any */
// Base event type
export interface BaseEvent {
	type: string;
}

// Message start event
export interface MessageStartEvent extends BaseEvent {
	type: 'message_start';
	message: {
		id: string;
		type: 'message';
		role: 'assistant';
		content: Array<{
			type: 'text' | 'tool_use';
			text?: string;
			id?: string;
			name?: string;
			input?: Record<string, any>;
		}>;
		model: string;
		stop_reason: string | null;
		stop_sequence: string | null;
		usage: {
			input_tokens: number;
			output_tokens: number;
		};
	};
}

// Content block start event
export interface ContentBlockStartEvent extends BaseEvent {
	type: 'content_block_start';
	index: number;
	content_block: {
		type: 'text' | 'tool_use';
		text?: string;
		id?: string;
		name?: string;
		input?: Record<string, any>;
	};
}

export interface ContentBlockDeltaEvent extends BaseEvent {
	type: 'content_block_delta';
	index: number;
	delta:
		| {
				type: 'text_delta';
				text: string;
		  }
		| {
				type: 'input_json_delta';
				partial_json: string;
		  };
}

// Content block stop event
export interface ContentBlockStopEvent extends BaseEvent {
	type: 'content_block_stop';
	index: number;
}

// Message delta event
export interface MessageDeltaEvent extends BaseEvent {
	type: 'message_delta';
	delta: {
		stop_reason: string | null;
		stop_sequence: string | null;
	};
	usage?: {
		output_tokens?: number;
		input_tokens?: number;
	};
}

// Message stop event
export interface MessageStopEvent extends BaseEvent {
	type: 'message_stop';
}

// Ping event
export interface PingEvent extends BaseEvent {
	type: 'ping';
}

// Error event
export interface ErrorEvent extends BaseEvent {
	type: 'error';
	error: {
		type: string;
		message: string;
	};
}

// Union type for all possible events
export type AnthropicStreamEvent =
	| MessageStartEvent
	| ContentBlockStartEvent
	| ContentBlockDeltaEvent
	| ContentBlockStopEvent
	| MessageDeltaEvent
	| MessageStopEvent
	| PingEvent
	| ErrorEvent;
