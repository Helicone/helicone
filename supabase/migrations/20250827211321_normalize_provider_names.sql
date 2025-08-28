UPDATE provider_keys SET provider_name = CASE
  WHEN provider_name = 'OpenAI' THEN 'openai'
  WHEN provider_name = 'Anthropic' THEN 'anthropic' 
  WHEN provider_name = 'AWS Bedrock' THEN 'bedrock'
  WHEN provider_name = 'Vertex AI' THEN 'vertex'
  WHEN provider_name = 'Google AI (Gemini)' THEN 'google'
  WHEN provider_name = 'Groq' THEN 'groq'
  WHEN provider_name = 'DeepSeek' THEN 'deepseek'
  WHEN provider_name = 'X.AI (Grok)' THEN 'xai'
  WHEN provider_name = 'Mistral AI' THEN 'mistral'
  WHEN provider_name = 'OpenRouter' THEN 'openrouter'
  WHEN provider_name = 'openai' THEN 'openai'
  WHEN provider_name = 'portal' THEN 'portal'
  ELSE provider_name
END
WHERE provider_name IN (
  'OpenAI',
  'Anthropic',
  'AWS Bedrock',
  'Vertex AI',
  'Google AI (Gemini)',
  'Groq',
  'DeepSeek',
  'X.AI (Grok)',
  'Mistral AI',
  'OpenRouter'
);