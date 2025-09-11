import { describe, it, expect } from '@jest/globals';
import { toOpenAI } from '../../src/lib/clients/llmmapper/providers/anthropic/response/toOpenai';
import { AntResponseBody } from '../../src/lib/clients/llmmapper/providers/anthropic/response/types';

describe('Anthropic to OpenAI Response Mapper', () => {
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
      expect(result.choices[0].finish_reason).toBe('tool_calls');
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
});
