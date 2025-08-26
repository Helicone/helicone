import { vi } from 'vitest';

// Mock Supabase before any imports happen
vi.mock('@supabase/supabase-js', () => ({
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
          if (table === 'organization') {
            return Promise.resolve({ 
              data: { 
                id: 'test-org-id',
                tier: 'free',
                percent_to_log: 100000
              }, 
              error: null 
            });
          }
          if (table === 'helicone_api_keys') {
            return Promise.resolve({
              data: {
                id: 'test-key-id',
                user_id: 'test-user-id',
                organization_id: 'test-org-id',
                soft_delete: false,
                api_key_hash: 'test-hash'
              },
              error: null
            });
          }
          return Promise.resolve({ data: null, error: null });
        }),
      };
      
      // Override the chain to return data array (not single) for helicone_api_keys
      if (table === 'helicone_api_keys') {
        // Return after all eq() calls complete
        let eqCount = 0;
        const originalEq = chainObj.eq;
        chainObj.eq = vi.fn(() => {
          eqCount++;
          // After second eq() call, we're done with filters
          if (eqCount === 2) {
            return {
              ...chainObj,
              then: (resolve: any) => resolve({
                data: [{
                  organization_id: 'test-org-id',
                  api_key_hash: '4f682ea29277878f3faf962e6ed00792659de06e604cbca2ce5218adc115ead5',
                  soft_delete: false
                }],
                error: null
              })
            };
          }
          return chainObj;
        });
      }
      
      // Mock decrypted_provider_keys_v2 table for AI Gateway
      if (table === 'decrypted_provider_keys_v2') {
        // Return provider key for Anthropic
        let eqCount = 0;
        chainObj.eq = vi.fn(() => {
          eqCount++;
          // After third eq() call (provider_name, org_id, soft_delete), we're done
          if (eqCount === 3) {
            return {
              ...chainObj,
              then: (resolve: any) => resolve({
                data: [{
                  org_id: 'test-org-id',
                  provider_name: 'ANTHROPIC',
                  decrypted_provider_key: 'test-anthropic-api-key',
                  decrypted_provider_secret_key: null,
                  auth_type: 'api_key',
                  config: {}
                }],
                error: null
              })
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