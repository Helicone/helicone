import { describe, it, expect } from 'vitest';
import { toOpenAI } from '../../src/lib/clients/llmmapper/providers/anthropic/response/toOpenai';
import { AntResponseBody } from '../../src/lib/clients/llmmapper/providers/anthropic/response/types';
import { toAnthropic } from '../../src/lib/clients/llmmapper/providers/openai/request/toAnthropic';
import { OpenAIRequestBody } from '../../src/lib/clients/llmmapper/providers/openai/request/types';

describe('Anthropic to OpenAI Response Mapper', () => {
  // ANTHROPIC NON-STREAM RESPONSE -> OPENAI RESPONSE
  describe('toOpenAI', () => {
    it('should convert basic text response', () => {
      const anthropicResponse: AntResponseBody = {
        id: 'msg_01ABC123',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: 'Hello, how can I help you today?'
          }
        ],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 10,
          output_tokens: 8,
        }
      };

      const result = toOpenAI(anthropicResponse);

      expect(result.choices[0].message.content).toBe('Hello, how can I help you today?');
      expect(result.choices[0].finish_reason).toBe('stop');
      expect(result.usage.prompt_tokens).toBe(10);
      expect(result.usage.completion_tokens).toBe(8);
    });

    it('should convert response with tool calls', () => {
      const anthropicResponse: AntResponseBody = {
        id: 'msg_01P37SV1XSyfxDaMsoqTLkU5',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [
          {
            type: 'text',
            text: "I'll help you calculate 50+50 using the calculate function."
          },
          {
            type: 'tool_use',
            id: 'toolu_01MCbeU64BixKafff5eomNEP',
            name: 'calculate',
            input: { expression: '50 + 50' }
          }
        ],
        stop_reason: 'tool_use',
        stop_sequence: null,
        usage: {
          input_tokens: 387,
          output_tokens: 69,
        }
      };

      const result = toOpenAI(anthropicResponse);

      expect(result.choices[0].message.content).toBe("I'll help you calculate 50+50 using the calculate function.");
      expect(result.choices[0].message.tool_calls).toHaveLength(1);
      expect(result.choices[0].message.tool_calls![0]).toEqual({
        id: 'toolu_01MCbeU64BixKafff5eomNEP',
        type: 'function',
        function: {
          name: 'calculate',
          arguments: '{"expression":"50 + 50"}'
        }
      });
      expect(result.choices[0].finish_reason).toBe('function_call');
    });

    it('should handle cached tokens', () => {
      const anthropicResponse: AntResponseBody = {
        id: 'msg_cached',
        type: 'message',
        role: 'assistant',
        model: 'claude-3-5-sonnet-20241022',
        content: [{ type: 'text', text: 'Cached response' }],
        stop_reason: 'end_turn',
        stop_sequence: null,
        usage: {
          input_tokens: 100,
          output_tokens: 20,
          cache_creation_input_tokens: 50,
          cache_read_input_tokens: 30,
        }
      };

      const result = toOpenAI(anthropicResponse);

      expect(result.usage.prompt_tokens_details?.cached_tokens).toBe(30);
    });
  });

  // OPENAI REQUEST -> ANTHROPIC REQUEST
  describe('toAnthropic', () => {
    it('should convert basic text request', () => {
      const openAIRequest: OpenAIRequestBody = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?'
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      };

      const result = toAnthropic(openAIRequest);

      expect(result.model).toBe('gpt-4o');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toEqual({
        role: 'user',
        content: 'Hello, how are you?'
      });
      expect(result.temperature).toBe(0.7);
      expect(result.max_tokens).toBe(1000);
      expect(result.stream).toBe(false);
    });

    it('should convert request with tool calls', () => {
      const openAIRequest: OpenAIRequestBody = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'What is 50+50?'
          },
          {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: 'call_DoWwQL7W9AJBpwCtn9tRC2gt',
                type: 'function',
                function: {
                  name: 'calculate',
                  arguments: '{"expression":"50+50"}'
                }
              }
            ]
          },
          {
            role: 'tool',
            content: '100',
            tool_call_id: 'call_DoWwQL7W9AJBpwCtn9tRC2gt'
          }
        ],
        temperature: 0.7,
        stream: false,
        tools: [
          {
            type: 'function',
            function: {
              name: 'calculate',
              description: 'Calculate a mathematical expression',
              parameters: {
                type: 'object',
                properties: {
                  expression: {
                    type: 'string',
                    description: 'The mathematical expression to calculate'
                  }
                },
                required: ['expression']
              }
            }
          }
        ]
      };

      const result = toAnthropic(openAIRequest);

      expect(result.messages).toHaveLength(3);
      
      expect(result.messages[0]).toEqual({
        role: 'user',
        content: 'What is 50+50?'
      });

      expect(result.messages[1].role).toBe('assistant');
      expect(Array.isArray(result.messages[1].content)).toBe(true);
      const assistantContent = result.messages[1].content as any[];
      expect(assistantContent).toHaveLength(1);
      expect(assistantContent[0]).toEqual({
        type: 'tool_use',
        id: 'call_DoWwQL7W9AJBpwCtn9tRC2gt',
        name: 'calculate',
        input: { expression: '50+50' }
      });

      expect(result.messages[2].role).toBe('user');
      expect(Array.isArray(result.messages[2].content)).toBe(true);
      const toolResultContent = result.messages[2].content as any[];
      expect(toolResultContent).toHaveLength(1);
      expect(toolResultContent[0]).toEqual({
        type: 'tool_result',
        tool_use_id: 'call_DoWwQL7W9AJBpwCtn9tRC2gt',
        content: '100'
      });

      expect(result.tools).toHaveLength(1);
      expect(result.tools![0]).toEqual({
        name: 'calculate',
        description: 'Calculate a mathematical expression',
        input_schema: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'The mathematical expression to calculate'
            }
          },
          required: ['expression']
        }
      });
    });

    it('should handle assistant message with both text and tool calls', () => {
      const openAIRequest: OpenAIRequestBody = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'assistant',
            content: "I'll help you calculate that.",
            tool_calls: [
              {
                id: 'call_123',
                type: 'function',
                function: {
                  name: 'calculate',
                  arguments: '{"expression":"2+2"}'
                }
              }
            ]
          }
        ]
      };

      const result = toAnthropic(openAIRequest);

      expect(result.messages[0].role).toBe('assistant');
      const content = result.messages[0].content as any[];
      expect(content).toHaveLength(2);
      expect(content[0]).toEqual({
        type: 'text',
        text: "I'll help you calculate that."
      });
      expect(content[1]).toEqual({
        type: 'tool_use',
        id: 'call_123',
        name: 'calculate',
        input: { expression: '2+2' }
      });
    });

    it('should extract system message', () => {
      const openAIRequest: OpenAIRequestBody = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      };

      const result = toAnthropic(openAIRequest);

      expect(result.system).toBe('You are a helpful assistant.');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]).toEqual({
        role: 'user',
        content: 'Hello'
      });
    });
  });

  // ANTHROPIC STREAM RESPONSE -> OPENAI STREAM RESPONSE
});
