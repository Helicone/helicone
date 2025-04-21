-- Add config JSON column to provider_keys table for storing provider-specific configuration
ALTER TABLE public.provider_keys
ADD COLUMN config JSONB DEFAULT NULL;
COMMENT ON COLUMN public.provider_keys.config IS 'Stores provider-specific configuration parameters (e.g., Azure Base URI, API Version, Deployment Name; AWS Region, Access Key, Session Token)';
-- Example of the expected structure for different providers:
/*
 -- Azure OpenAI Configuration
 {
 "baseUri": "https://your-resource-name.openai.azure.com",
 "apiVersion": "2023-05-15",
 "deploymentName": "gpt-35-turbo"
 }
 
 -- AWS Bedrock Configuration
 {
 "region": "us-west-2",
 "accessKeyId": "aws-access-key",
 "sessionToken": "aws-session-token-optional"
 }
 */