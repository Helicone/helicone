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

-- A MOCK DECRYPTER PROVIDER KEYS TABLE TO REPLICATE THE PROD VIEW
ALTER TABLE provider_keys ADD COLUMN IF NOT EXISTS key_id UUID DEFAULT NULL; /* just to have a column to replicate it as it is in prod */
ALTER TABLE provider_keys ADD COLUMN IF NOT EXISTS nonce BYTEA DEFAULT NULL; /* just to have a column to replicate it as it is in prod */
ALTER TABLE provider_keys ALTER COLUMN vault_key_id DROP NOT NULL;

CREATE VIEW decrypted_provider_keys AS
(
  SELECT
    provider_keys.id,
    provider_keys.org_id,
    provider_keys.provider_name,
    provider_keys.provider_key_name,
    provider_keys.vault_key_id,
    provider_keys.soft_delete,
    provider_keys.created_at,
    provider_keys.provider_key,
    provider_keys.provider_key as decrypted_provider_key,
    provider_keys.key_id,
    provider_keys.nonce,
    provider_keys.config
  FROM provider_keys
)