import { TEST_ORG_ID } from '../../lib/constants';
import { addCreditsToWallet, resetWalletCredits } from '../../lib/wallet-helpers';
import { createOpenAIClient } from '../../lib/ai-gateway/client';
import { CreateChatCompletion } from '../../lib/ai-gateway/completions';
import { CreateResponse } from '../../lib/ai-gateway/responses';
import { ModelProviderName, providers } from '@helicone-package/cost/models/providers';
import { ResponsesAPIEnabledProviders } from '@helicone-package/cost/models/providers';
import { sleep } from '../../lib/test-helpers';

describe('AI Gateway Tests', () => {
  const client = createOpenAIClient();

  beforeAll(async () => {
    await resetWalletCredits(TEST_ORG_ID);
    await addCreditsToWallet({
      orgId: TEST_ORG_ID,
      amount: 50, // 50 cents
      reason: "E2E",
    });
    await sleep(500);
  });

  afterAll(async () => {
    await resetWalletCredits(TEST_ORG_ID);
  });

  const BASIC_PROVIDER_TESTS = {
    'anthropic': {
      model: 'claude-3.5-haiku/anthropic',
    },
    'bedrock': {
      model: 'claude-3.5-haiku/bedrock',
    },
    'azure': {
      model: 'gpt-5-mini/azure',
    },
    'baseten': {
      model: 'kimi-k2-0905/baseten',
    },
    'cerebras': {
      model: 'gpt-oss-120b/cerebras',
    },
    'chutes': {
      model: 'deepseek-tng-r1t2-chimera/chutes',
    },
    'deepinfra': {
      model: 'llama-3.1-8b-instruct-turbo/deepinfra',
    },
    'deepseek': {
      model: 'deepseek-v3/deepseek',
    },
    'fireworks': {
      model: 'kimi-k2-0905/fireworks',
    },
    'google-ai-studio': {
      model: 'gemini-2.5-flash-lite/google-ai-studio',
    },
    'groq': {
      model: 'llama-3.1-8b-instant/groq',
    },
    'helicone': {
      model: 'gpt-5-nano/helicone',
    },
    'mistral': {
      model: 'mistral-large-2411/mistral',
    },
    'nebius': {
      model: 'llama-3.1-8b-instruct-turbo/nebius',
    },
    'novita': {
      model: 'llama-3.1-8b-instruct/novita',
    },
    'openai': {
      model: 'gpt-5-nano/openai',
    },
    'openrouter': {
      model: 'gpt-5-nano/openrouter',
    },
    'perplexity': {
      model: 'sonar/perplexity',
    },
    'vertex': {
      model: 'gemini-2.5-flash-lite/vertex',
    },
    'xai': {
      model: 'grok-4-fast-reasoning/xai',
    },
  };

  describe('Tests for each provider', () => {
    it('should have basic tests for all providers', () => {
      const providerKeys = Object.keys(providers);
      const testKeys = Object.keys(BASIC_PROVIDER_TESTS);
      
      providerKeys.forEach(providerKey => {
        expect(testKeys).toContain(providerKey);
      });
    });

    for (const [provider, config] of Object.entries(BASIC_PROVIDER_TESTS)) {
      describe(provider, () => {
        describe('Basic Requests', () => {
          if (provider === 'helicone') {
            // can't test helicone provider locally, so skip
            return;
          }
          it('should handle simple chat completion', async () => {
            try {
              const responses = await CreateChatCompletion({
                client,
                model: config.model,
                stream: false,
              });

              expect(responses).toBeDefined();
              expect(Array.isArray(responses)).toBe(true);
              expect(responses.length).toBeGreaterThan(0);

              responses.forEach(response => {
                expect(response).toHaveProperty('complete');
              });
            } catch (error) {
              console.error(JSON.stringify(error, null, 2));
              throw error;
            }
          });


          // TODO: enable basic Responses API tests
          // it('should handle simple responses', async () => {
          //   if (ResponsesAPIEnabledProviders.includes(provider as ModelProviderName)) {
          //     try {
          //       const responses = await CreateResponse({
          //         client,
          //         model: config.model,
          //         stream: false,
          //       });

          //       expect(responses).toBeDefined();
          //       expect(Array.isArray(responses)).toBe(true);
          //       expect(responses.length).toBeGreaterThan(0);

          //       responses.forEach(response => {
          //         expect(response).toHaveProperty('complete');
          //       });
          //     } catch (error) {
          //       console.error(`\n❌ ${provider} esponses API failed:`);
          //       console.error('Error:', JSON.stringify(error, null, 2));
          //       throw error;
          //     }
          //   }
          // });
        });
      });
    }
  });
});
