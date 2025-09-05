import { vi } from "vitest";
import { TestCase } from "./providers/base.test-config";

type MutableTestCase = Partial<TestCase> | undefined;

let currentTestCase: MutableTestCase;

export function setSupabaseTestCase(tc: MutableTestCase) {
  currentTestCase = tc;
}

// Register the mock once at module load and read hoisted state inside the factory
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      const chainObj = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(() => {
          // Return different data based on the table
          if (table === "organization") {
            return Promise.resolve({
              data: {
                id: "test-org-id",
                tier: "free",
                percent_to_log: 100000,
              },
              error: null,
            });
          }
          if (table === "helicone_api_keys") {
            return Promise.resolve({
              data: {
                id: "test-key-id",
                user_id: "test-user-id",
                organization_id: "test-org-id",
                soft_delete: false,
                api_key_hash: "test-hash",
              },
              error: null,
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };

      // Override the chain to return data array (not single) for helicone_api_keys
      if (table === "helicone_api_keys") {
        // Return after all eq() calls complete
        let eqCount = 0;
        const originalEq = chainObj.eq;
        chainObj.eq = vi.fn(() => {
          eqCount++;
          if (eqCount === 2) {
            return {
              ...chainObj,
              then: (resolve: any) =>
                resolve({
                  data: [
                    {
                      organization_id: "test-org-id",
                      api_key_hash:
                        "4ff435549f7ff2c4a644185152e079d2bec8f533996b41f471de44b99f2e3254",
                      soft_delete: false,
                    },
                  ],
                  error: null,
                }),
            };
          }
          return chainObj;
        });
      }

      // Mock decrypted_provider_keys_v2 table for AI Gateway
      let isByokEnabled;
      if (
        currentTestCase?.byokEnabled ||
        (currentTestCase && currentTestCase.byokEnabled === undefined) ||
        currentTestCase === undefined
      ) {
        isByokEnabled = true;
      } else {
        isByokEnabled = false;
      }
      if (table === "decrypted_provider_keys_v2") {
        // Define mock provider keys for testing - separate keys for user and Helicone org
        const mockUserProviderKeys: Record<string, any> = {
          anthropic: {
            org_id: "test-org-id",
            provider_name: "anthropic",
            decrypted_provider_key: "test-anthropic-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          openai: {
            org_id: "test-org-id",
            provider_name: "openai",
            decrypted_provider_key: "test-openai-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          vertex: {
            org_id: "test-org-id",
            provider_name: "vertex",
            decrypted_provider_key: "test-vertex-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: {
              projectId: "test-project",
              region: "us-central1",
            },
            byok_enabled: isByokEnabled,
          },
          "google-ai-studio": {
            org_id: "test-org-id",
            provider_name: "google-ai-studio",
            decrypted_provider_key: "test-google-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          bedrock: {
            org_id: "test-org-id",
            provider_name: "bedrock",
            decrypted_provider_key: "test-bedrock-access-key-id",
            decrypted_provider_secret_key: "test-bedrock-secret-access-key",
            auth_type: "aws-signature",
            config: {
              region: "us-east-1",
            },
            byok_enabled: isByokEnabled,
          },
          groq: {
            org_id: "test-org-id",
            provider_name: "groq",
            decrypted_provider_key: "test-groq-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          xai: {
            org_id: "test-org-id",
            provider_name: "xai",
            decrypted_provider_key: "test-xai-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          azure: {
            org_id: "test-org-id",
            provider_name: "azure",
            decrypted_provider_key: "test-azure-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: {
              baseUri: "https://test-resource.openai.azure.com",
              deploymentName: "test-deployment",
              apiVersion: "2025-01-01-preview",
            },
            byok_enabled: isByokEnabled,
          },
        };

        // Helicone provider keys (for PTB when BYOK is disabled)
        const mockHeliconeProviderKeys: Record<string, any> = {
          anthropic: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "anthropic",
            decrypted_provider_key: "helicone-anthropic-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
          openai: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "openai",
            decrypted_provider_key: "helicone-openai-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
          vertex: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "vertex",
            decrypted_provider_key: "helicone-vertex-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: {
              projectId: "helicone-project",
              region: "us-central1",
            },
            byok_enabled: true,
          },
          "google-ai-studio": {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "google-ai-studio",
            decrypted_provider_key: "helicone-google-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
          bedrock: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "bedrock",
            decrypted_provider_key: "helicone-bedrock-access-key-id",
            decrypted_provider_secret_key: "helicone-bedrock-secret-access-key",
            auth_type: "aws-signature",
            config: {
              region: "us-east-1",
            },
            byok_enabled: true,
          },
          groq: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "groq",
            decrypted_provider_key: "helicone-groq-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
          xai: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "xai",
            decrypted_provider_key: "helicone-xai-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
          azure: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "azure",
            decrypted_provider_key: "helicone-azure-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: {
              baseUri: "https://helicone-resource.openai.azure.com",
              deploymentName: "helicone-deployment",
              apiVersion: "2025-01-01-preview",
            },
            byok_enabled: true,
          },
        };

        // Track filters applied to the query
        const filters: Record<string, any> = {};

        chainObj.eq = vi.fn((field: string, value: any) => {
          filters[field] = value;

          // Once we have all required filters, return the matching provider key
          if (
            filters.provider_name &&
            filters.org_id &&
            "soft_delete" in filters
          ) {
            // Check if it's the Helicone org ID
            if (filters.org_id === "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5") {
              const heliconeKey =
                mockHeliconeProviderKeys[filters.provider_name];
              if (heliconeKey && !filters.soft_delete) {
                return {
                  ...chainObj,
                  then: (resolve: any) =>
                    resolve({
                      data: [heliconeKey],
                      error: null,
                    }),
                };
              }
            } else if (filters.org_id === "test-org-id") {
              const userKey = mockUserProviderKeys[filters.provider_name];
              if (userKey && !filters.soft_delete) {
                return {
                  ...chainObj,
                  then: (resolve: any) =>
                    resolve({
                      data: [userKey],
                      error: null,
                    }),
                };
              }
            }

            // No matching provider key found
            return {
              ...chainObj,
              then: (resolve: any) =>
                resolve({
                  data: [],
                  error: null,
                }),
            };
          }

          return chainObj;
        });
      }

      return chainObj;
    }),
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: null, error: null })),
      signIn: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })),
}));
