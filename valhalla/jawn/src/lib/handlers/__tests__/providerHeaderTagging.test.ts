import { describe, it, expect } from 'vitest';

/**
 * Isolated unit tests for Helicone provider custom header prefix parsing.
 */

function extractHeliconeCustomTags(headers: Record<string, string>): Record<string, string> {
  const tags: Record<string, string> = {};
  const prefix = 'helicone-property-';
  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.startsWith(prefix)) {
      const propName = lowerKey.slice(prefix.length);
      tags[propName] = typeof value === 'string' ? value.trim() : '';
    }
  }
  return tags;
}

describe('Helicone Custom Property Header Tagging', () => {
  it('should extract headers with helicone-property- prefix', () => {
    const headers = {
      'Helicone-Property-Environment': 'production',
      'helicone-property-user-id': 'user_123',
      'Authorization': 'Bearer test'
    };
    const tags = extractHeliconeCustomTags(headers);
    expect(tags).toEqual({
      'environment': 'production',
      'user-id': 'user_123'
    });
  });

  it('should trim surrounding whitespace from property values', () => {
    const headers = { 'helicone-property-session': '   session_xyz   ' };
    expect(extractHeliconeCustomTags(headers)).toEqual({ 'session': 'session_xyz' });
  });
});
