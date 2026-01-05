import { OpenAI } from 'openai';
import { TEST_ORG_API_KEY, AI_GATEWAY_URL } from '../constants';

export function createOpenAIClient() {
  return new OpenAI({
    apiKey: TEST_ORG_API_KEY,
    baseURL: `${AI_GATEWAY_URL}/v1`,
    maxRetries: 0,
  });
}