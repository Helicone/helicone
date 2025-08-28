import {
  buildFilter,
  buildFilterLeaf,
  buildFilterBranch,
  buildFilterClickHouse,
  buildFilterPostgres,
  buildFilterWithAuth,
  buildFilterWithAuthClickHouse,
  clickhouseParam,
  FilterNotImplemented,
  TagType,
} from '../filters';
import {
  FilterLeaf,
  FilterBranch,
  FilterNode,
} from '../filterDefs';

describe('Filter Building', () => {
  describe('clickhouseParam', () => {
    test('should handle integers', () => {
      expect(clickhouseParam(0, 42)).toBe('{val_0 : Int32}');
      expect(clickhouseParam(1, -10)).toBe('{val_1 : Int32}');
    });

    test('should handle floats', () => {
      expect(clickhouseParam(0, 3.14)).toBe('{val_0 : Float64}');
      expect(clickhouseParam(1, -2.5)).toBe('{val_1 : Float64}');
    });

    test('should handle booleans', () => {
      expect(clickhouseParam(0, true)).toBe('{val_0 : UInt8}');
      expect(clickhouseParam(1, false)).toBe('{val_1 : UInt8}');
    });

    test('should handle dates', () => {
      const date = new Date('2023-01-01');
      expect(clickhouseParam(0, date)).toBe('{val_0 : DateTime}');
    });

    test('should handle strings', () => {
      expect(clickhouseParam(0, 'test')).toBe('{val_0 : String}');
      expect(clickhouseParam(1, '')).toBe('{val_1 : String}');
    });
  });

  describe('FilterNotImplemented', () => {
    test('should create proper error instance', () => {
      const error = new FilterNotImplemented('Test message');
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('FilterNotImplemented');
      expect(error.message).toBe('Test message');
    });
  });

  describe('TagType enum', () => {
    test('should have correct values', () => {
      expect(TagType.REQUEST).toBe('request');
      expect(TagType.SESSION).toBe('session');
    });
  });
});
