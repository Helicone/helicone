import {
  withTimeout,
  enumerate,
  deepCompare,
  getModelFromRequest,
  getModelFromPath,
  getModelFromResponse,
} from './helpers';

describe('Core Helpers', () => {
  describe('withTimeout', () => {
    it('should resolve when promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);
      expect(result).toBe('success');
    });

    it('should reject when timeout is exceeded', async () => {
      const promise = new Promise((resolve) => setTimeout(resolve, 2000));
      await expect(withTimeout(promise, 100)).rejects.toThrow('Request timed out');
    });
  });

  describe('enumerate', () => {
    it('should enumerate array with indices', () => {
      const arr = ['a', 'b', 'c'];
      const result = enumerate(arr);
      expect(result).toEqual([
        [0, 'a'],
        [1, 'b'],
        [2, 'c'],
      ]);
    });

    it('should handle empty array', () => {
      const result = enumerate([]);
      expect(result).toEqual([]);
    });
  });

  describe('deepCompare', () => {
    it('should return true for identical primitives', () => {
      expect(deepCompare(5, 5)).toBe(true);
      expect(deepCompare('test', 'test')).toBe(true);
      expect(deepCompare(true, true)).toBe(true);
    });

    it('should return false for different primitives', () => {
      expect(deepCompare(5, 6)).toBe(false);
      expect(deepCompare('test', 'test2')).toBe(false);
    });

    it('should compare objects deeply', () => {
      const obj1 = { a: 1, b: { c: 2, d: [3, 4] } };
      const obj2 = { a: 1, b: { c: 2, d: [3, 4] } };
      const obj3 = { a: 1, b: { c: 2, d: [3, 5] } };
      
      expect(deepCompare(obj1, obj2)).toBe(true);
      expect(deepCompare(obj1, obj3)).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(deepCompare(null, null)).toBe(true);
      expect(deepCompare(undefined, undefined)).toBe(true);
      expect(deepCompare(null, undefined)).toBe(false);
    });
  });

  describe('getModelFromRequest', () => {
    it('should extract model from request body', () => {
      const requestBody = { model: 'gpt-4' };
      const result = getModelFromRequest(requestBody, '/v1/chat/completions');
      expect(result).toBe('gpt-4');
    });

    it('should fall back to path when no model in body', () => {
      const result = getModelFromRequest({}, '/engines/davinci/completions');
      expect(result).toBe('davinci');
    });

    it('should return null when no model found', () => {
      const result = getModelFromRequest({}, '/v1/chat/completions');
      expect(result).toBeNull();
    });
  });

  describe('getModelFromPath', () => {
    it('should extract model from engines path', () => {
      const result = getModelFromPath('/engines/gpt-4/completions');
      expect(result).toBe('gpt-4');
    });

    it('should extract model from models path', () => {
      const result = getModelFromPath('/v1/models/claude-3');
      expect(result).toBe('claude-3');
    });

    it('should return undefined for invalid path', () => {
      const result = getModelFromPath('/v1/chat/completions');
      expect(result).toBeUndefined();
    });
  });

  describe('getModelFromResponse', () => {
    it('should extract model from response object', () => {
      const response = { model: 'gpt-4-turbo' };
      expect(getModelFromResponse(response)).toBe('gpt-4-turbo');
    });

    it('should extract model from nested body', () => {
      const response = { body: { model: 'claude-3' } };
      expect(getModelFromResponse(response)).toBe('claude-3');
    });

    it('should return unknown for invalid response', () => {
      expect(getModelFromResponse(null)).toBe('unknown');
      expect(getModelFromResponse([])).toBe('unknown');
      expect(getModelFromResponse({})).toBe('unknown');
    });
  });
});