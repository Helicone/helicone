import { ok, err, errMap, Result } from './index';

describe('Core Index - Result Extensions', () => {
  describe('errMap', () => {
    it('should map error type when result is error', () => {
      const result: Result<string, number> = err(404);
      const mapped = errMap(result, (error) => `Error: ${error}`);
      
      expect(mapped.error).toBe('Error: 404');
      expect(mapped.data).toBeNull();
    });

    it('should pass through success result unchanged', () => {
      const result: Result<string, number> = ok('success');
      const mapped = errMap(result, (error) => `Error: ${error}`);
      
      expect(mapped.data).toBe('success');
      expect(mapped.error).toBeNull();
    });

    it('should handle complex error transformations', () => {
      interface ApiError {
        code: number;
        message: string;
      }
      
      const result: Result<string, ApiError> = err({ 
        code: 500, 
        message: 'Internal Server Error' 
      });
      
      const mapped = errMap(result, (error) => 
        `${error.code}: ${error.message}`
      );
      
      expect(mapped.error).toBe('500: Internal Server Error');
    });
  });

  describe('Re-exported Result utilities', () => {
    it('should create success results with ok', () => {
      const result = ok('test');
      expect(result.data).toBe('test');
      expect(result.error).toBeNull();
    });

    it('should create error results with err', () => {
      const result = err('error message');
      expect(result.data).toBeNull();
      expect(result.error).toBe('error message');
    });
  });
});