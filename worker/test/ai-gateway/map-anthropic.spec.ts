import { describe, it, expect } from 'vitest';
import { toOpenAI } from '../../src/lib/clients/llmmapper/providers/anthropic/response/toOpenai';
import { AnthropicResponseBody } from '../../src/lib/clients/llmmapper/types/anthropic';
import { toAnthropic } from '../../src/lib/clients/llmmapper/providers/openai/request/toAnthropic';
import { AnthropicToOpenAIStreamConverter } from '../../src/lib/clients/llmmapper/providers/anthropic/streamedResponse/toOpenai';
import { AnthropicStreamEvent } from '../../src/lib/clients/llmmapper/types/anthropic';
import { HeliconeChatCreateParams } from '@helicone-package/prompts/types';

describe('Anthropic to OpenAI Response Mapper', () => {
  // ANTHROPIC NON-STREAM RESPONSE -> OPENAI RESPONSE
  describe('toOpenAI', () => {
    it('should convert basic text response', () => {
      const anthropicResponse: AnthropicResponseBody = {
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
      const anthropicResponse: AnthropicResponseBody = {
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
      const anthropicResponse: AnthropicResponseBody = {
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
      const openAIRequest: HeliconeChatCreateParams = {
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
      const openAIRequest: HeliconeChatCreateParams = {
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
      const openAIRequest: HeliconeChatCreateParams = {
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
      const openAIRequest: HeliconeChatCreateParams = {
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

    it('should handle cache control on system message', () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.',
            cache_control: { type: 'ephemeral', ttl: '5m' }
          },
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      };

      const result = toAnthropic(openAIRequest);

      expect(result.system).toEqual([{
        type: 'text',
        text: 'You are a helpful assistant.',
        cache_control: { type: 'ephemeral', ttl: '5m' }
      }]);
      expect(result.messages).toHaveLength(1);
    });

    it('should handle cache control on content parts', () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this document',
                cache_control: { type: 'ephemeral', ttl: '1h' }
              },
              {
                type: 'text',
                text: 'Additional context'
              }
            ]
          }
        ]
      };

      const result = toAnthropic(openAIRequest);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].content).toEqual([
        {
          type: 'text',
          text: 'Analyze this document',
          cache_control: { type: 'ephemeral', ttl: '1h' }
        },
        {
          type: 'text',
          text: 'Additional context'
        }
      ]);
    });

    it('should handle cache control on tool results', () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'tool',
            content: 'Large calculation result...',
            tool_call_id: 'call_123',
            cache_control: { type: 'ephemeral', ttl: '5m' }
          }
        ]
      };

      const result = toAnthropic(openAIRequest);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].role).toBe('user');
      const content = result.messages[0].content as any[];
      expect(content).toHaveLength(1);
      expect(content[0]).toEqual({
        type: 'tool_result',
        tool_use_id: 'call_123',
        content: 'Large calculation result...',
        cache_control: { type: 'ephemeral', ttl: '5m' }
      });
    });

    it('should handle cache control on assistant messages with text and tools', () => {
      const openAIRequest: HeliconeChatCreateParams = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'assistant',
            content: "I'll help you calculate that.",
            cache_control: { type: 'ephemeral', ttl: '1h' },
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
        text: "I'll help you calculate that.",
        cache_control: { type: 'ephemeral', ttl: '1h' }
      });
      expect(content[1]).toEqual({
        type: 'tool_use',
        id: 'call_123',
        name: 'calculate',
        input: { expression: '2+2' }
      });
    });
  });

  // ANTHROPIC STREAM RESPONSE -> OPENAI STREAM RESPONSE
  describe('AnthropicToOpenAIStreamConverter', () => {
    it('should convert basic text streaming', () => {
      const converter = new AnthropicToOpenAIStreamConverter();
      const allChunks: any[] = [];

      // message_start event
      const messageStart: AnthropicStreamEvent = {
        type: 'message_start',
        message: {
          id: 'msg_01ABC123',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-5-sonnet-20241022',
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: {
            input_tokens: 10,
            output_tokens: 0,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0
            }
          }
        }
      };

      allChunks.push(...converter.convert(messageStart));

      // content_block_start
      const blockStart: AnthropicStreamEvent = {
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'text',
          text: ''
        }
      };

      allChunks.push(...converter.convert(blockStart));

      // content_block_delta
      const textDelta: AnthropicStreamEvent = {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: 'Hello world'
        }
      };

      allChunks.push(...converter.convert(textDelta));

      // content_block_stop
      const blockStop: AnthropicStreamEvent = {
        type: 'content_block_stop',
        index: 0
      };

      allChunks.push(...converter.convert(blockStop));

      // message_delta
      const messageDelta: AnthropicStreamEvent = {
        type: 'message_delta',
        delta: {
          stop_reason: 'end_turn',
          stop_sequence: null
        },
        usage: {
          input_tokens: 10,
          output_tokens: 5,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0
        }
      };

      allChunks.push(...converter.convert(messageDelta));

      // message_stop
      const messageStop: AnthropicStreamEvent = {
        type: 'message_stop'
      };

      allChunks.push(...converter.convert(messageStop));

      // Verify the sequence matches OpenAI format
      expect(allChunks).toHaveLength(4);

      // First chunk: role + empty content
      expect(allChunks[0].choices[0].delta).toEqual({
        role: 'assistant',
        content: ''
      });
      expect(allChunks[0].choices[0].finish_reason).toBeNull();

      // Second chunk: text content
      expect(allChunks[1].choices[0].delta).toEqual({
        content: 'Hello world'
      });
      expect(allChunks[1].choices[0].finish_reason).toBeNull();

      // Third chunk: finish_reason
      expect(allChunks[2].choices[0].delta).toEqual({});
      expect(allChunks[2].choices[0].finish_reason).toBe('stop');

      // Fourth chunk: usage with empty choices
      expect(allChunks[3].choices).toEqual([]);
      expect(allChunks[3].usage).toEqual({
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
        completion_tokens_details: {
          reasoning_tokens: 0,
          audio_tokens: 0,
          accepted_prediction_tokens: 0,
          rejected_prediction_tokens: 0,
        }
      });
    });

    it('should convert tool call streaming correctly', () => {
      const converter = new AnthropicToOpenAIStreamConverter();
      const allChunks: any[] = [];

      // message_start
      const messageStart: AnthropicStreamEvent = {
        type: 'message_start',
        message: {
          id: 'msg_016AzhNQ54DpGUeYBsUAqfGo',
          type: 'message',
          role: 'assistant',
          model: 'claude-3-5-sonnet-20241022',
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: {
            input_tokens: 387,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
            cache_creation: {
              ephemeral_5m_input_tokens: 0,
              ephemeral_1h_input_tokens: 0
            },
            output_tokens: 1
          }
        }
      };

      allChunks.push(...converter.convert(messageStart));

      // Text content first
      const textBlockStart: AnthropicStreamEvent = {
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'text',
          text: ''
        }
      };

      allChunks.push(...converter.convert(textBlockStart));

      const textDelta: AnthropicStreamEvent = {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: "I'll help you calculate 50+50 using the calculate function."
        }
      };

      allChunks.push(...converter.convert(textDelta));

      const textBlockStop: AnthropicStreamEvent = {
        type: 'content_block_stop',
        index: 0
      };

      allChunks.push(...converter.convert(textBlockStop));

      // Tool call content
      const toolBlockStart: AnthropicStreamEvent = {
        type: 'content_block_start',
        index: 1,
        content_block: {
          type: 'tool_use',
          id: 'toolu_01GGxNAsyPbYV9WmqKufo7xr',
          name: 'calculate',
          input: {}
        }
      };

      allChunks.push(...converter.convert(toolBlockStart));

      // Multiple JSON deltas
      const jsonDelta1: AnthropicStreamEvent = {
        type: 'content_block_delta',
        index: 1,
        delta: {
          type: 'input_json_delta',
          partial_json: '{"expression":'
        }
      };

      allChunks.push(...converter.convert(jsonDelta1));

      const jsonDelta2: AnthropicStreamEvent = {
        type: 'content_block_delta',
        index: 1,
        delta: {
          type: 'input_json_delta',
          partial_json: ' "50+50"}'
        }
      };

      allChunks.push(...converter.convert(jsonDelta2));

      const toolBlockStop: AnthropicStreamEvent = {
        type: 'content_block_stop',
        index: 1
      };

      allChunks.push(...converter.convert(toolBlockStop));

      // message_delta
      const messageDelta: AnthropicStreamEvent = {
        type: 'message_delta',
        delta: {
          stop_reason: 'tool_use',
          stop_sequence: null
        },
        usage: {
          input_tokens: 387,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
          output_tokens: 69
        }
      };

      allChunks.push(...converter.convert(messageDelta));

      // message_stop
      const messageStop: AnthropicStreamEvent = {
        type: 'message_stop'
      };

      allChunks.push(...converter.convert(messageStop));

      // Verify the sequence
      expect(allChunks.length).toBeGreaterThan(5);

      // First chunk: role
      expect(allChunks[0].choices[0].delta).toEqual({
        role: 'assistant',
        content: ''
      });

      // Second chunk: text content
      expect(allChunks[1].choices[0].delta).toEqual({
        content: "I'll help you calculate 50+50 using the calculate function."
      });

      // Third chunk: tool call start (should have id and name)
      expect(allChunks[2].choices[0].delta.tool_calls).toHaveLength(1);
      expect(allChunks[2].choices[0].delta.tool_calls[0]).toEqual({
        index: 0,
        id: 'toolu_01GGxNAsyPbYV9WmqKufo7xr',
        type: 'function',
        function: {
          name: 'calculate',
          arguments: ''
        }
      });

      // Fourth chunk: first JSON delta
      expect(allChunks[3].choices[0].delta.tool_calls[0]).toEqual({
        index: 0,
        id: 'toolu_01GGxNAsyPbYV9WmqKufo7xr',
        type: 'function',
        function: {
          arguments: '{"expression":'
        }
      });

      // Fifth chunk: second JSON delta
      expect(allChunks[4].choices[0].delta.tool_calls[0]).toEqual({
        index: 0,
        id: 'toolu_01GGxNAsyPbYV9WmqKufo7xr',
        type: 'function',
        function: {
          arguments: ' "50+50"}'
        }
      });

      // Second to last chunk: finish_reason
      expect(allChunks[allChunks.length - 2].choices[0].finish_reason).toBe('tool_calls');

      // Last chunk: usage
      expect(allChunks[allChunks.length - 1].choices).toEqual([]);
      expect(allChunks[allChunks.length - 1].usage).toBeDefined();
    });

    it('should handle cached tokens in streaming', () => {
      const converter = new AnthropicToOpenAIStreamConverter();

      const messageDelta: AnthropicStreamEvent = {
        type: 'message_delta',
        delta: {
          stop_reason: 'end_turn',
          stop_sequence: null
        },
        usage: {
          input_tokens: 100,
          output_tokens: 20,
          cache_creation_input_tokens: 50,
          cache_read_input_tokens: 30
        }
      };

      const chunks = converter.convert(messageDelta);
      expect(chunks).toHaveLength(1);

      const messageStop: AnthropicStreamEvent = {
        type: 'message_stop'
      };

      const finalChunks = converter.convert(messageStop);
      expect(finalChunks[0].usage?.prompt_tokens_details?.cached_tokens).toBe(30);
    });

    it('should map stop reasons correctly', () => {
      const converter = new AnthropicToOpenAIStreamConverter();

      const testCases = [
        { anthropic: 'end_turn', openai: 'stop' },
        { anthropic: 'max_tokens', openai: 'length' },
        { anthropic: 'tool_use', openai: 'tool_calls' }
      ];

      testCases.forEach(({ anthropic, openai }) => {
        const messageDelta: AnthropicStreamEvent = {
          type: 'message_delta',
          delta: {
            stop_reason: anthropic,
            stop_sequence: null
          },
          usage: {
            input_tokens: 10,
            output_tokens: 5,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0
          }
        };

        const chunks = converter.convert(messageDelta);
        expect(chunks[0].choices[0].finish_reason).toBe(openai);
      });
    });
  });
});
