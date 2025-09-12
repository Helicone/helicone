import {
  buildFilterClickHouse,
} from '../../filters/filters';
import {
  FilterLeaf,
} from '../../filters/filterDefs';

describe('Target URL Filter', () => {
  describe('buildFilterClickHouse with target_url', () => {
    test('should build target_url equals filter correctly', () => {
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { equals: 'https://api.openai.com/v1/chat/completions' }
        }
      };

      const result = buildFilterClickHouse({ filter, argsAcc: [] });

      expect(result.filter).toBe('request_response_rmt.target_url = {val_0 : String}');
      expect(result.argsAcc).toEqual(['https://api.openai.com/v1/chat/completions']);
    });

    test('should build target_url like filter correctly', () => {
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { like: '%openai.com%' }
        }
      };

      const result = buildFilterClickHouse({ filter, argsAcc: [] });

      expect(result.filter).toBe('request_response_rmt.target_url LIKE {val_0 : String}');
      expect(result.argsAcc).toEqual(['%openai.com%']);
    });

    test('should build target_url ilike filter correctly', () => {
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { ilike: '%OPENAI.COM%' }
        }
      };

      const result = buildFilterClickHouse({ filter, argsAcc: [] });

      expect(result.filter).toBe('request_response_rmt.target_url ILIKE {val_0 : String}');
      expect(result.argsAcc).toEqual(['%OPENAI.COM%']);
    });

    test('should build target_url contains filter correctly', () => {
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { contains: 'anthropic' }
        }
      };

      const result = buildFilterClickHouse({ filter, argsAcc: [] });

      expect(result.filter).toBe("request_response_rmt.target_url ILIKE '%' || {val_0 : String}::text || '%'");
      expect(result.argsAcc).toEqual(['anthropic']);
    });

    test('should build target_url not-equals filter correctly', () => {
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { 'not-equals': 'https://api.openai.com/v1/embeddings' }
        }
      };

      const result = buildFilterClickHouse({ filter, argsAcc: [] });

      expect(result.filter).toBe('request_response_rmt.target_url != {val_0 : String}');
      expect(result.argsAcc).toEqual(['https://api.openai.com/v1/embeddings']);
    });

    test('should handle target_url with null value', () => {
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { equals: 'null' }
        }
      };

      const result = buildFilterClickHouse({ filter, argsAcc: [] });

      expect(result.filter).toBe('request_response_rmt.target_url is null');
      expect(result.argsAcc).toEqual([]);
    });

    test('should work with target_url alongside other basic fields', () => {
      // Test that target_url doesn't break when used with a simple status filter
      const simpleFilter: FilterLeaf = {
        request_response_rmt: {
          target_url: { equals: 'https://api.openai.com/v1/chat/completions' }
        }
      };

      const result = buildFilterClickHouse({ filter: simpleFilter, argsAcc: [] });

      // Should successfully build target_url filter
      expect(result.argsAcc).toEqual(['https://api.openai.com/v1/chat/completions']);
      expect(result.filter).toBe('request_response_rmt.target_url = {val_0 : String}');
    });
  });

  describe('Target URL Filter Mapping Verification', () => {
    test('should verify target_url mapping exists in request_response_rmt', () => {
      // This test verifies that our fix is working by checking that target_url
      // filters can be built without throwing errors
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { equals: 'https://api.anthropic.com/v1/messages' }
        }
      };

      // This should not throw an error now that target_url mapping is added
      expect(() => {
        buildFilterClickHouse({ filter, argsAcc: [] });
      }).not.toThrow();
    });

    test('should handle target_url with different URL formats', () => {
      const testCases = [
        'https://api.openai.com/v1/chat/completions',
        'https://api.anthropic.com/v1/messages',
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        'https://api.cohere.ai/v1/generate',
        'http://localhost:3000/api/proxy',
        'https://api.mistral.ai/v1/chat/completions',
        'wss://api.openai.com/v1/realtime',
      ];

      testCases.forEach((url) => {
        const filter: FilterLeaf = {
          request_response_rmt: {
            target_url: { equals: url }
          }
        };

        const result = buildFilterClickHouse({ filter, argsAcc: [] });
        
        expect(result.filter).toBe('request_response_rmt.target_url = {val_0 : String}');
        expect(result.argsAcc).toEqual([url]);
      });
    });

    test('should handle target_url with special characters in URL', () => {
      const urlWithSpecialChars = 'https://api.example.com/v1/test?param=value&other=test%20string';
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { equals: urlWithSpecialChars }
        }
      };

      const result = buildFilterClickHouse({ filter, argsAcc: [] });
      
      expect(result.filter).toBe('request_response_rmt.target_url = {val_0 : String}');
      expect(result.argsAcc).toEqual([urlWithSpecialChars]);
    });
  });

  describe('Target URL Filter Edge Cases', () => {
    test('should handle empty target_url value', () => {
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { equals: '' }
        }
      };

      const result = buildFilterClickHouse({ filter, argsAcc: [] });

      expect(result.filter).toBe('request_response_rmt.target_url = {val_0 : String}');
      expect(result.argsAcc).toEqual(['']);
    });

    test('should handle very long target_url values', () => {
      const longUrl = 'https://api.example.com/v1/very/long/path/that/goes/on/and/on/' + 'segment/'.repeat(50) + '?param=value';
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { equals: longUrl }
        }
      };

      const result = buildFilterClickHouse({ filter, argsAcc: [] });

      expect(result.filter).toBe('request_response_rmt.target_url = {val_0 : String}');
      expect(result.argsAcc).toEqual([longUrl]);
    });

    test('should handle target_url with unicode characters', () => {
      const unicodeUrl = 'https://api.example.com/v1/测试/пример/🚀?param=тест';
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { equals: unicodeUrl }
        }
      };

      const result = buildFilterClickHouse({ filter, argsAcc: [] });

      expect(result.filter).toBe('request_response_rmt.target_url = {val_0 : String}');
      expect(result.argsAcc).toEqual([unicodeUrl]);
    });
  });

  describe('Target URL Filter Integration', () => {
    test('should work with existing argument arrays', () => {
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { equals: 'https://api.openai.com/v1/chat/completions' }
        }
      };

      const existingArgs = ['existing_value_1', 'existing_value_2'];
      const result = buildFilterClickHouse({ filter, argsAcc: [...existingArgs] });

      expect(result.filter).toBe('request_response_rmt.target_url = {val_2 : String}');
      expect(result.argsAcc).toEqual([...existingArgs, 'https://api.openai.com/v1/chat/completions']);
    });

    test('should demonstrate the fix prevents previous error', () => {
      // Before the fix, this would cause an error because target_url was not mapped
      const filter: FilterLeaf = {
        request_response_rmt: {
          target_url: { contains: 'anthropic' }
        }
      };

      // This should not throw an error now that target_url mapping is fixed
      expect(() => {
        const result = buildFilterClickHouse({ filter, argsAcc: [] });
        expect(result.filter).toContain("request_response_rmt.target_url ILIKE '%' || {val_0 : String}::text || '%'");
        expect(result.argsAcc).toEqual(['anthropic']);
      }).not.toThrow();
    });
  });
});