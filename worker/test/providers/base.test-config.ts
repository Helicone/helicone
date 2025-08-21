import { registry } from "@helicone-package/cost/models/registry";
import { UserEndpointConfig } from "@helicone-package/cost/models/types";

export interface TestCase {
  name: string;
  provider?: string;
  modelId: string;
  modelString: string;
  testType: 'single-provider' | 'multi-provider-fallback' | 'endpoint-config';
  request: {
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  };
  byokConfig?: UserEndpointConfig;
  failProviders?: string[];
}

export abstract class BaseTestConfig {
  protected provider: string;
  
  constructor(provider: string) {
    this.provider = provider;
  }
  
  // Override this to provide provider-specific BYOK configs
  protected getByokConfig(configKey: string): UserEndpointConfig {
    return configKey === '*' ? {} : { region: configKey };
  }
  
  // Override this if provider needs custom mock response
  generateMockResponse(modelId: string) {
    const config = registry.getModelProviderConfig(modelId, this.provider);
    const providerModelId = config.data?.providerModelId || modelId;

    return {
      id: `chatcmpl-test-${modelId}`,
      object: "chat.completion",
      created: Date.now(),
      model: providerModelId,
      choices: [{
        index: 0,
        message: {
          role: "assistant",
          content: `Test response for ${modelId}`,
        },
        finish_reason: "stop",
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 5,
        total_tokens: 15,
      },
    };
  }
  
  generateByokTestCases(): TestCase[] {
    const cases: TestCase[] = [];
    const models = registry.getProviderModels(this.provider).data;
    if (!models || !(models instanceof Set)) return cases;
    
    models.forEach(modelId => {
      // Type 1: Direct provider test
      cases.push({
        name: `${this.provider} - ${modelId} - BYOK direct`,
        provider: this.provider,
        modelId,
        modelString: `${modelId}/${this.provider}`,
        testType: 'single-provider',
        request: {
          messages: [{ role: "user", content: "Hello, this is a test" }],
          max_tokens: 100,
        },
        byokConfig: this.getByokConfig('*')
      });
      
      // Type 2: Multi-provider fallback
      const allProviders = registry.getModelProviders(modelId).data;
      if (allProviders && allProviders.size > 1) {
        const providerArray = Array.from(allProviders);
        const targetIndex = providerArray.indexOf(this.provider);
        
        if (targetIndex > 0) {
          cases.push({
            name: `${modelId} - BYOK fallback to ${this.provider}`,
            provider: this.provider,
            modelId,
            modelString: modelId,
            testType: 'multi-provider-fallback',
            failProviders: providerArray.slice(0, targetIndex),
            request: {
              messages: [{ role: "user", content: "Hello, this is a test" }],
              max_tokens: 100,
            },
            byokConfig: this.getByokConfig('*')
          });
        }
      }
      
      // Type 3: Different endpoint configs
      const modelConfig = registry.getModelProviderConfig(modelId, this.provider).data;
      if (modelConfig) {
        Object.keys(modelConfig.endpointConfigs).forEach(configKey => {
          if (configKey !== '*') {
            cases.push({
              name: `${this.provider} - ${modelId} - BYOK config:${configKey}`,
              provider: this.provider,
              modelId,
              modelString: `${modelId}/${this.provider}`,
              testType: 'endpoint-config',
              request: {
                messages: [{ role: "user", content: "Hello, this is a test" }],
                max_tokens: 100,
              },
              byokConfig: this.getByokConfig(configKey)
            });
          }
        });
      }
    });
    
    return cases;
  }
  
  generatePtbTestCases(): TestCase[] {
    return []; // PTB not active yet
  }
}