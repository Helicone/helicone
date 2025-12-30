import { vi } from "vitest";
import { TestCase } from "./providers/base.test-config";
import { InMemoryCache } from "../src/lib/util/cache/inMemoryCache";

type MutableTestCase = Partial<TestCase> | undefined;

let currentTestCase: MutableTestCase;

export function setSupabaseTestCase(tc: MutableTestCase) {
  currentTestCase = tc;
  // Clear in-memory cache when test case changes to avoid stale data
  InMemoryCache.getInstance().clear();
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

      // Mock feature_flags table
      if (table === "feature_flags") {
        chainObj.eq = vi.fn((field: string, value: any) => {
          if (field === "org_id") {
            const hasCredits = currentTestCase?.creditsEnabled === true;
            return {
              ...chainObj,
              then: (resolve: any) =>
                resolve({
                  data: hasCredits ? [{ feature: "credits" }] : [],
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
            decrypted_provider_key: JSON.stringify({
              type: "service_account",
              project_id: "test-project",
              private_key_id: "test-key-id",
              private_key:
                "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCsJKIUJeD/qHPf\nb53+BG6p7I8qclGNQrFL2IXqQZFR4843PF7vDleIq55ZxxFCZ8s30/evOsbmbPpY\n/0rDy0cKYoWOYg/i72XtPiReXQjFKa2+cHdjIwIFAi6YIoO0JJKF3k98Q2U4iETV\nOY5usQ7M8XXKQ9/B3OvLdE35lCMUVSFGjSQWN49XJ8dynH3JZ2n/UflP35ZGFKg7\nmGJdnt3+u9W0WRShlJ6GMD029zHnHIvxc0g3ESZ5NogSlO7xAg5nExramhmbpjRQ\nL39+wjw3in2XQSuPPZHtFCGBjFLqUJq5cJsaJ7TmZPMDbL2Zus1JKgxMVya/eKmA\nvOZxzo9HAgMBAAECggEAU+KGGMtcmTi9PmRl2SLPyn48RbLviqa1PwCEQWMyLXWV\nR9VjbZrPjQoUYCthfbqWjN3+FKXPxvnUBQpipIaqV6Uq7/dZRnzibnmZv2IWo/1r\nbSHhC65Dja1Ch2BKTb6EqDdtBGDTMnk1EbK6dbZSQAxqGeZ5Yz8EqGBEnxpQ/dav\ntwiCn/MolNldfi3r0e56+pih7jM9UlzZz7nygESygdGCoew667iLzNVAgcIjBnEJ\nH7UF1sTt91UqY6DfeOnFX1HWmPHHlJqnU7wW4Oqc9FWTkPerG8UBSCQGTE1AZNbN\ncfh9g5W0JoTvh2fcg8IGZsi0PR2m3Y2KZqlXxdDgAQKBgQDv01zI+JdRSC62McRH\nac1peINSWKbXZZD8xWvyFMo61e5bocv5of8HaeMSI44MIfvX2CCI8/nJg6zL6X61\npaVJQezPawGVeQKds3KT4vZPpufycGdk/yU5BUz0vp1VgjH0JAMyKC5lDfi3kvNh\nQQufvPQWhkauf6FuQOAfHvnJwQKBgQC3wLfYe5dz3K5Ga1WRLiPnDx1t9w1NdA5Y\ngdCWzs0MRwn6bgHYHO1ivSBtlbK6epQCdSt0x12cF19lhFCvFWupXmwlpF7L6GSE\nzCpdx+elAZvPlpmtyCRtUjA6vSIw0iFTZzUcBdPtX+rF24JOqHi3OX4UgjOUgRaG\nwkTveX7LBwKBgQC9Ic72nzWWYHqWLMFCIGpiVywZcNiC3hJthbQPgd3KcJQ9p2eZ\nQuxBCHyO/YM0hkh6fHOMDfxbs4A+f7HxxuSG1XrQSO9C1d/+RlqBzme5gUNCquqf\nd6f/Q/LgwMKLgNWsWAo9L/sGrvIKs9VESWvFWdqVOOfdDcJdlMQrRt5vAQKBgQCN\nSVJS0xztylX58Ve2rIqQhA+12MrSrhTFuvL+sf35nbmvY9xpJjzkudTwTbVCKzQY\n+6yxOwXgGhyQuv8q0Eaa0O5ItyzojkST00QUHbwgJK+AGyUI+SYBJLvOvlRGw5s6\nPNYaOOTt1N14ysJT5rgC8eLetAoi+mqurTtCAuIaCwKBgQCO5Gm81959RrnIPfvE\nop73k1gpGsG8ogckrGux6VRnu0WHUon/7JPru8eH+4qBMsiGgCq6FMtGL0qerFTm\nleUB+B7JBTw0nDpT/ri7AhBClh6okFEOXizdZObm6OuiY2pyCkD2ixfdpQdSw50k\nVoOOvy3ufoYcLzM601qivR+k7g==\n-----END PRIVATE KEY-----",
              client_email:
                "test-service-account@test-project.iam.gserviceaccount.com",
              client_id: "123456789",
              auth_uri: "https://accounts.google.com/o/oauth2/auth",
              token_uri: "https://oauth2.googleapis.com/token",
            }),
            decrypted_provider_secret_key: null,
            auth_type: "service_account",
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
          deepinfra: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "deepinfra",
            decrypted_provider_key: "helicone-deepinfra-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          deepseek: {
            org_id: "test-org-id",
            provider_name: "deepseek",
            decrypted_provider_key: "test-deepseek-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          mistral: {
            org_id: "test-org-id",
            provider_name: "mistral",
            decrypted_provider_key: "test-mistral-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          novita: {
            org_id: "test-org-id",
            provider_name: "novita",
            decrypted_provider_key: "test-novita-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          canopywave: {
            org_id: "test-org-id",
            provider_name: "canopywave",
            decrypted_provider_key: "test-canopywave-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          nebius: {
            org_id: "test-org-id",
            provider_name: "nebius",
            decrypted_provider_key: "test-nebius-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          chutes: {
            org_id: "test-org-id",
            provider_name: "chutes",
            decrypted_provider_key: "test-chutes-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          cerebras: {
            org_id: "test-org-id",
            provider_name: "cerebras",
            decrypted_provider_key: "test-cerebras-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          baseten: {
            org_id: "test-org-id",
            provider_name: "baseten",
            decrypted_provider_key: "test-baseten-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          fireworks: {
            org_id: "test-org-id",
            provider_name: "fireworks",
            decrypted_provider_key: "test-fireworks-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: isByokEnabled,
          },
          openrouter: {
            org_id: "test-org-id",
            provider_name: "openrouter",
            decrypted_provider_key: "test-openrouter-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
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
          helicone: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "helicone",
            decrypted_provider_key: "helicone-ptb-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
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
            decrypted_provider_key: JSON.stringify({
              type: "service_account",
              project_id: "helicone-project",
              private_key_id: "helicone-key-id",
              private_key:
                "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCsJKIUJeD/qHPf\nb53+BG6p7I8qclGNQrFL2IXqQZFR4843PF7vDleIq55ZxxFCZ8s30/evOsbmbPpY\n/0rDy0cKYoWOYg/i72XtPiReXQjFKa2+cHdjIwIFAi6YIoO0JJKF3k98Q2U4iETV\nOY5usQ7M8XXKQ9/B3OvLdE35lCMUVSFGjSQWN49XJ8dynH3JZ2n/UflP35ZGFKg7\nmGJdnt3+u9W0WRShlJ6GMD029zHnHIvxc0g3ESZ5NogSlO7xAg5nExramhmbpjRQ\nL39+wjw3in2XQSuPPZHtFCGBjFLqUJq5cJsaJ7TmZPMDbL2Zus1JKgxMVya/eKmA\nvOZxzo9HAgMBAAECggEAU+KGGMtcmTi9PmRl2SLPyn48RbLviqa1PwCEQWMyLXWV\nR9VjbZrPjQoUYCthfbqWjN3+FKXPxvnUBQpipIaqV6Uq7/dZRnzibnmZv2IWo/1r\nbSHhC65Dja1Ch2BKTb6EqDdtBGDTMnk1EbK6dbZSQAxqGeZ5Yz8EqGBEnxpQ/dav\ntwiCn/MolNldfi3r0e56+pih7jM9UlzZz7nygESygdGCoew667iLzNVAgcIjBnEJ\nH7UF1sTt91UqY6DfeOnFX1HWmPHHlJqnU7wW4Oqc9FWTkPerG8UBSCQGTE1AZNbN\ncfh9g5W0JoTvh2fcg8IGZsi0PR2m3Y2KZqlXxdDgAQKBgQDv01zI+JdRSC62McRH\nac1peINSWKbXZZD8xWvyFMo61e5bocv5of8HaeMSI44MIfvX2CCI8/nJg6zL6X61\npaVJQezPawGVeQKds3KT4vZPpufycGdk/yU5BUz0vp1VgjH0JAMyKC5lDfi3kvNh\nQQufvPQWhkauf6FuQOAfHvnJwQKBgQC3wLfYe5dz3K5Ga1WRLiPnDx1t9w1NdA5Y\ngdCWzs0MRwn6bgHYHO1ivSBtlbK6epQCdSt0x12cF19lhFCvFWupXmwlpF7L6GSE\nzCpdx+elAZvPlpmtyCRtUjA6vSIw0iFTZzUcBdPtX+rF24JOqHi3OX4UgjOUgRaG\nwkTveX7LBwKBgQC9Ic72nzWWYHqWLMFCIGpiVywZcNiC3hJthbQPgd3KcJQ9p2eZ\nQuxBCHyO/YM0hkh6fHOMDfxbs4A+f7HxxuSG1XrQSO9C1d/+RlqBzme5gUNCquqf\nd6f/Q/LgwMKLgNWsWAo9L/sGrvIKs9VESWvFWdqVOOfdDcJdlMQrRt5vAQKBgQCN\nSVJS0xztylX58Ve2rIqQhA+12MrSrhTFuvL+sf35nbmvY9xpJjzkudTwTbVCKzQY\n+6yxOwXgGhyQuv8q0Eaa0O5ItyzojkST00QUHbwgJK+AGyUI+SYBJLvOvlRGw5s6\nPNYaOOTt1N14ysJT5rgC8eLetAoi+mqurTtCAuIaCwKBgQCO5Gm81959RrnIPfvE\nop73k1gpGsG8ogckrGux6VRnu0WHUon/7JPru8eH+4qBMsiGgCq6FMtGL0qerFTm\nleUB+B7JBTw0nDpT/ri7AhBClh6okFEOXizdZObm6OuiY2pyCkD2ixfdpQdSw50k\nVoOOvy3ufoYcLzM601qivR+k7g==\n-----END PRIVATE KEY-----",
              client_email:
                "helicone-service-account@helicone-project.iam.gserviceaccount.com",
              client_id: "987654321",
              auth_uri: "https://accounts.google.com/o/oauth2/auth",
              token_uri: "https://oauth2.googleapis.com/token",
            }),
            decrypted_provider_secret_key: null,
            auth_type: "service_account",
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
          deepinfra: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "deepinfra",
            decrypted_provider_key: "helicone-deepinfra-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
          deepseek: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "deepseek",
            decrypted_provider_key: "helicone-deepseek-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
          novita: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "novita",
            decrypted_provider_key: "helicone-novita-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
          canopywave: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "canopywave",
            decrypted_provider_key: "helicone-canopywave-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
          nebius: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "nebius",
            decrypted_provider_key: "helicone-nebius-api-key",
            decrypted_provider_secret_key: null,
            auth_type: "api_key",
            config: null,
            byok_enabled: true,
          },
          openrouter: {
            org_id: "0afe3a6e-d095-4ec0-bc1e-2af6f57bd2a5",
            provider_name: "openrouter",
            decrypted_provider_key: "helicone-openrouter-api-key",
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

// Clear module cache so test file mocks can work
vi.resetModules();
