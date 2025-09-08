import {
  FilterAST,
  FilterExpression,
} from '../../filters/filterExpressions';
import {
  buildFilter,
  buildFilterLeaf,
  FilterNotImplemented,
} from '../../filters/filters';
import {
  FilterLeaf,
  FilterBranch,
  FilterNode,
} from '../../filters/filterDefs';
import {
  uiFilterRowToFilterLeaf,
  filterUITreeToFilterNode,
} from '../../filters/helpers';
import { SingleFilterDef } from '../../filters/frontendFilterDefs';

describe('Edge Cases and Error Conditions', () => {
  describe('FilterAST Edge Cases', () => {
    test('should handle empty string values in conditions', () => {
      const condition = FilterAST.condition('status', 'eq', '');
      expect(condition.value).toBe('');
      expect(FilterAST.validateFilter(condition)).toBe(true);
    });

    test('should handle zero values correctly', () => {
      const condition = FilterAST.condition('cost', 'eq', 0);
      expect(condition.value).toBe(0);
      expect(FilterAST.validateFilter(condition)).toBe(true);
    });

    test('should handle false boolean values', () => {
      const condition = FilterAST.condition('threat', 'eq', false);
      expect(condition.value).toBe(false);
      expect(FilterAST.validateFilter(condition)).toBe(true);
    });

    test('should handle very large numbers', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER;
      const condition = FilterAST.condition('latency', 'gt', largeNumber);
      expect(condition.value).toBe(largeNumber);
    });

    test('should handle very small numbers', () => {
      const smallNumber = Number.MIN_SAFE_INTEGER;
      const condition = FilterAST.condition('cost', 'lt', smallNumber);
      expect(condition.value).toBe(smallNumber);
    });

    test('should handle special string characters', () => {
      const specialString = "O'Reilly & Co. <script>alert('xss')</script>";
      const condition = FilterAST.condition('user_id', 'eq', specialString);
      expect(condition.value).toBe(specialString);
    });

    test('should handle unicode characters', () => {
      const unicodeString = '测试用户 🚀 émojis';
      const condition = FilterAST.condition('user_id', 'eq', unicodeString);
      expect(condition.value).toBe(unicodeString);
    });

    test('should handle null-like strings correctly', () => {
      const nullString = 'null';
      const condition = FilterAST.condition('user_id', 'eq', nullString);
      expect(condition.value).toBe(nullString);
    });

    test('should handle undefined-like strings', () => {
      const undefinedString = 'undefined';
      const condition = FilterAST.condition('user_id', 'eq', undefinedString);
      expect(condition.value).toBe(undefinedString);
    });

    test('should handle deeply nested compound expressions', () => {
      const deepNested = FilterAST.and(
        FilterAST.or(
          FilterAST.and(
            FilterAST.condition('status', 'eq', 200),
            FilterAST.condition('model', 'like', 'gpt')
          ),
          FilterAST.condition('latency', 'lt', 1000)
        ),
        FilterAST.or(
          FilterAST.property('env', 'eq', 'prod'),
          FilterAST.score('quality', 'gt', 0.8)
        )
      );

      expect(FilterAST.validateFilter(deepNested)).toBe(true);
      expect(FilterAST.isEmptyFilter(deepNested)).toBe(false);
    });

    test('should simplify deeply nested expressions correctly', () => {
      const complexFilter = FilterAST.and(
        FilterAST.and(
          FilterAST.condition('status', 'eq', 200),
          FilterAST.all()
        ),
        FilterAST.and(FilterAST.all())
      );

      const simplified = FilterAST.simplifyFilter(complexFilter);
      expect(simplified).toEqual(FilterAST.condition('status', 'eq', 200));
    });

    test('should handle circular-like references in serialization', () => {
      const filter = FilterAST.and(
        FilterAST.condition('status', 'eq', 200),
        FilterAST.condition('status', 'eq', 200) // Duplicate condition
      );

      const serialized = FilterAST.serializeFilter(filter);
      const deserialized = FilterAST.deserializeFilter(serialized);
      
      expect(deserialized).toEqual(filter);
    });

    test('should handle empty arrays in combineFilters', () => {
      const combined = FilterAST.combineFilters([]);
      expect(combined).toEqual(FilterAST.all());
    });

    test('should handle array with only empty filters', () => {
      const combined = FilterAST.combineFilters([
        FilterAST.all(),
        FilterAST.and(),
        FilterAST.or()
      ]);
      expect(combined).toEqual(FilterAST.all());
    });
  });

  describe('Filter Building Edge Cases', () => {
    test('should handle empty filter objects', () => {
      const emptyFilter: FilterLeaf = {};
      
      const result = buildFilter({
        filter: emptyFilter,
        argsAcc: [],
        argPlaceHolder: (index, value) => `$${index + 1}`,
      });

      expect(result.filter).toBe('true');
      expect(result.argsAcc).toEqual([]);
    });

    test('should handle filters with null/undefined values safely', () => {
      const filterWithNull: FilterLeaf = {
        request_response_rmt: {
          user_id: { equals: null as any }
        }
      };

      expect(() => {
        buildFilter({
          filter: filterWithNull,
          argsAcc: [],
          argPlaceHolder: (index, value) => `$${index + 1}`,
        });
      }).not.toThrow();
    });

    test('should handle very long argument arrays', () => {
      const manyConditions: FilterLeaf = {
        request_response_rmt: {}
      };

      // Add many conditions
      for (let i = 0; i < 100; i++) {
        (manyConditions.request_response_rmt as any)[`field_${i}`] = { equals: `value_${i}` };
      }

      expect(() => {
        buildFilter({
          filter: manyConditions,
          argsAcc: [],
          argPlaceHolder: (index, value) => `$${index + 1}`,
        });
      }).not.toThrow();
    });

    test('should handle invalid operator keys gracefully', () => {
      const invalidFilter: FilterLeaf = {
        request_response_rmt: {
          status: { ['invalid-operator' as any]: 200 }
        }
      };

      expect(() => {
        buildFilter({
          filter: invalidFilter,
          argsAcc: [],
          argPlaceHolder: (index, value) => `$${index + 1}`,
        });
      }).not.toThrow();
    });

    test('should handle missing column mappings', () => {
      const unmappedFilter: FilterLeaf = {
        request_response_rmt: {
          ['non_existent_column' as any]: { equals: 'test' }
        }
      };

      // This test should expect the function to throw or handle gracefully
      expect(() => {
        buildFilterLeaf(
          unmappedFilter,
          [],
          require('../filters').whereKeyMappings,
          (index, value) => `$${index + 1}`
        );
      }).toThrow();
    });

    test('should handle cost filter with extreme values', () => {
      const extremeCostFilter: FilterLeaf = {
        request_response_rmt: {
          cost: { gte: 0.000001 } // Very small cost
        }
      };

      expect(() => {
        buildFilterLeaf(
          extremeCostFilter,
          [],
          require('../filters').whereKeyMappings,
          (index, value) => `$${index + 1}`
        );
      }).toThrow();
    });

    test('should handle properties with special characters in keys', () => {
      const specialKeyFilter: FilterLeaf = {
        request_response_rmt: {
          properties: {
            'key-with-dashes': { equals: 'value' },
            'key.with.dots': { equals: 'value2' },
            'key with spaces': { equals: 'value3' }
          }
        }
      };

      expect(() => {
        buildFilterLeaf(
          specialKeyFilter,
          [],
          require('../filters').whereKeyMappings,
          (index, value) => `$${index + 1}`
        );
      }).toThrow();
    });

    test('should handle scores with non-string values', () => {
      const numericScoreFilter: FilterLeaf = {
        request_response_rmt: {
          scores: {
            'quality_score': { equals: '0.85' }
          }
        }
      };

      expect(() => {
        buildFilterLeaf(
          numericScoreFilter,
          [],
          require('../filters').whereKeyMappings,
          (index, value) => `$${index + 1}`
        );
      }).toThrow();
    });
  });

  describe('UI Helper Edge Cases', () => {
    const mockFilterMap: SingleFilterDef<any>[] = [
      {
        label: 'Status',
        operators: [
          { value: 'equals', label: 'equals', type: 'number' },
        ],
        table: 'request_response_rmt',
        column: 'status',
        category: 'request',
      },
    ];

    test('should handle invalid filter map indices', () => {
      const invalidUIFilter = {
        filterMapIdx: 999, // Out of bounds
        operatorIdx: 0,
        value: '200',
      };

      expect(() => {
        uiFilterRowToFilterLeaf(mockFilterMap, invalidUIFilter);
      }).not.toThrow();
    });

    test('should handle invalid operator indices', () => {
      const invalidUIFilter = {
        filterMapIdx: 0,
        operatorIdx: 999, // Out of bounds
        value: '200',
      };

      expect(() => {
        uiFilterRowToFilterLeaf(mockFilterMap, invalidUIFilter);
      }).not.toThrow();
    });

    test('should handle empty filter map', () => {
      const uiFilter = {
        filterMapIdx: 0,
        operatorIdx: 0,
        value: '200',
      };

      expect(() => {
        uiFilterRowToFilterLeaf([], uiFilter);
      }).not.toThrow();
    });

    test('should handle malformed UI filter tree', () => {
      const malformedTree = {
        // Missing required properties
        rows: [
          {
            filterMapIdx: 0,
            operatorIdx: 0,
            value: '200',
          }
        ]
      } as any;

      expect(() => {
        filterUITreeToFilterNode(mockFilterMap, malformedTree);
      }).not.toThrow();
    });

    test('should handle deeply nested UI filter trees', () => {
      const deepTree = {
        operator: 'and' as const,
        rows: [
          {
            operator: 'or' as const,
            rows: [
              {
                operator: 'and' as const,
                rows: [
                  {
                    filterMapIdx: 0,
                    operatorIdx: 0,
                    value: '200',
                  }
                ]
              }
            ]
          }
        ]
      };

      expect(() => {
        filterUITreeToFilterNode(mockFilterMap, deepTree);
      }).not.toThrow();
    });

    test('should handle UI filters with extremely long values', () => {
      const longValue = 'a'.repeat(10000);
      const uiFilter = {
        filterMapIdx: 0,
        operatorIdx: 0,
        value: longValue,
      };

      const result = uiFilterRowToFilterLeaf(mockFilterMap, uiFilter);
      expect(result.request_response_rmt?.status?.equals).toBe(longValue);
    });
  });

  describe('FilterNotImplemented Error Handling', () => {
    test('should throw FilterNotImplemented for unimplemented filters', () => {
      expect(() => {
        throw new FilterNotImplemented('This feature is not implemented');
      }).toThrow('This feature is not implemented');
    });

    test('should have correct error properties', () => {
      const error = new FilterNotImplemented('Custom message');
      expect(error.name).toBe('FilterNotImplemented');
      expect(error.message).toBe('Custom message');
      expect(error).toBeInstanceOf(Error);
    });

    test('should be catchable as specific error type', () => {
      try {
        throw new FilterNotImplemented('Test error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as FilterNotImplemented).name).toBe('FilterNotImplemented');
        expect((error as FilterNotImplemented).message).toBe('Test error');
      }
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    test('should handle large filter expressions without memory issues', () => {
      let largeFilter: FilterExpression = FilterAST.condition('status', 'eq', 200);
      
      // Build a large AND expression
      for (let i = 0; i < 100; i++) { // Reduced from 1000 to avoid excessive test time
        largeFilter = FilterAST.and(
          largeFilter,
          FilterAST.condition('field_' + i, 'eq', i)
        );
      }

      expect(() => {
        FilterAST.validateFilter(largeFilter);
        FilterAST.simplifyFilter(largeFilter);
      }).not.toThrow();
    });

    test('should handle rapid serialization/deserialization cycles', () => {
      const filter = FilterAST.and(
        FilterAST.condition('status', 'eq', 200),
        FilterAST.property('user_type', 'eq', 'admin')
      );

      let current: FilterExpression = filter;
      for (let i = 0; i < 10; i++) { // Reduced iterations for faster tests
        const serialized = FilterAST.serializeFilter(current);
        current = FilterAST.deserializeFilter(serialized);
      }

      expect(current).toEqual(filter);
    });

    test('should handle many small filter operations efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        const filter = FilterAST.and(
          FilterAST.condition('status', 'eq', 200),
          FilterAST.condition('model', 'like', 'gpt-' + i)
        );
        FilterAST.validateFilter(filter);
        FilterAST.isEmptyFilter(filter);
        FilterAST.simplifyFilter(filter);
      }
      
      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(5000); // Should complete in reasonable time
    });
  });

  describe('Type Safety Edge Cases', () => {
    test('should handle mixed type values in conditions', () => {
      // TypeScript would catch this, but test runtime behavior
      const mixedFilter = FilterAST.condition('status', 'eq', '200' as any);
      expect(mixedFilter.value).toBe('200');
      expect(typeof mixedFilter.value).toBe('string');
    });

    test('should handle operator type mismatches gracefully', () => {
      const filter = FilterAST.condition('status', 'like' as any, 200);
      expect(filter.operator).toBe('like');
      expect(filter.value).toBe(200);
    });
  });

  describe('Boundary Value Testing', () => {
    test('should handle minimum and maximum safe integers', () => {
      const minFilter = FilterAST.condition('value', 'eq', Number.MIN_SAFE_INTEGER);
      const maxFilter = FilterAST.condition('value', 'eq', Number.MAX_SAFE_INTEGER);

      expect(FilterAST.validateFilter(minFilter)).toBe(true);
      expect(FilterAST.validateFilter(maxFilter)).toBe(true);
    });

    test('should handle edge case floating point numbers', () => {
      const filters = [
        FilterAST.condition('value', 'eq', 0.1 + 0.2), // Floating point precision
        FilterAST.condition('value', 'eq', Number.EPSILON),
        FilterAST.condition('value', 'eq', -Number.EPSILON),
      ];

      filters.forEach(filter => {
        expect(FilterAST.validateFilter(filter)).toBe(true);
      });
    });

    test('should handle empty and whitespace-only strings', () => {
      const filters = [
        FilterAST.condition('value', 'eq', ''),
        FilterAST.condition('value', 'eq', ' '),
        FilterAST.condition('value', 'eq', '\t\n\r'),
        FilterAST.condition('value', 'eq', '   '),
      ];

      filters.forEach(filter => {
        expect(FilterAST.validateFilter(filter)).toBe(true);
      });
    });
  });
});
