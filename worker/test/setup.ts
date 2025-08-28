import { vi } from "vitest";

// Mock Supabase before any imports happen
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
          // After second eq() call, we're done with filters
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
      if (table === "decrypted_provider_keys_v2") {
        // Define mock provider keys for testing
        const mockProviderKeys: Record<string, any> = {
          anthropic: {
            org_id: "test-org-id",
            provider_name: "anthropic",
            decrypted_provider_key: "test-anthropic-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
          },
          openai: {
            org_id: "test-org-id",
            provider_name: "openai",
            decrypted_provider_key: "test-openai-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
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
          },
          google: {
            org_id: "test-org-id",
            provider_name: "google",
            decrypted_provider_key: "test-google-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
          },
          bedrock: {
            org_id: "test-org-id",
            provider_name: "bedrock",
            decrypted_provider_key: "test-bedrock-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: {
              region: "us-east-1",
            },
          },
          groq: {
            org_id: "test-org-id",
            provider_name: "groq",
            decrypted_provider_key: "test-groq-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
          },
        };

        // Track filters applied to the query
        const filters: Record<string, any> = {};

        chainObj.eq = vi.fn((field: string, value: any) => {
          filters[field] = value;

          // Once we have all required filters, return the matching provider key
          if (filters.provider_name && filters.org_id && "soft_delete" in filters) {
            const providerKey = mockProviderKeys[filters.provider_name];
            
            if (providerKey && filters.org_id === "test-org-id" && !filters.soft_delete) {
              return {
                ...chainObj,
                then: (resolve: any) =>
                  resolve({
                    data: [providerKey],
                    error: null,
                  }),
              };
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
export {};
