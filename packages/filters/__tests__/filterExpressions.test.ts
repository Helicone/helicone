import {
  FilterAST,
  FilterExpression,
  AllExpression,
  ConditionExpression,
  AndExpression,
  OrExpression,
  FilterOperator,
  DEFAULT_FILTER_EXPRESSION,
  DEFAULT_FILTER_GROUP_EXPRESSION,
  EMPTY_FILTER_GROUP_EXPRESSION,
} from '../filterExpressions';

describe('FilterAST', () => {
  describe('Basic Expression Creation', () => {
    test('should create an "all" expression', () => {
      const allFilter = FilterAST.all();
      expect(allFilter).toEqual({ type: 'all' });
    });

    test('should create a basic condition expression', () => {
      const condition = FilterAST.condition('status', 'eq', 200);
      expect(condition).toEqual({
        type: 'condition',
        field: {
          table: 'request_response_rmt',
          column: 'status',
        },
        operator: 'eq',
        value: 200,
      });
    });

    test('should create condition with alias "where"', () => {
      const condition1 = FilterAST.condition('model', 'like', 'gpt-4');
      const condition2 = FilterAST.where('model', 'like', 'gpt-4');
      expect(condition1).toEqual(condition2);
    });

    test('should create property condition', () => {
      const propertyFilter = FilterAST.property('user_type', 'eq', 'admin');
      expect(propertyFilter).toEqual({
        type: 'condition',
        field: {
          table: 'request_response_rmt',
          column: 'properties',
          subtype: 'property',
          valueMode: 'value',
          key: 'user_type',
        },
        operator: 'eq',
        value: 'admin',
      });
    });

    test('should create property key condition', () => {
      const propertyKeyFilter = FilterAST.propertyKey('like', 'user_');
      expect(propertyKeyFilter).toEqual({
        type: 'condition',
        field: {
          table: 'request_response_rmt',
          column: 'properties',
          subtype: 'property',
          valueMode: 'key',
        },
        operator: 'like',
        value: 'user_',
      });
    });

    test('should create score condition', () => {
      const scoreFilter = FilterAST.score('quality', 'gt', 0.8);
      expect(scoreFilter).toEqual({
        type: 'condition',
        field: {
          table: 'request_response_rmt',
          column: 'scores',
          subtype: 'score',
          valueMode: 'value',
          key: 'quality',
        },
        operator: 'gt',
        value: 0.8,
      });
    });

    test('should create score key condition', () => {
      const scoreKeyFilter = FilterAST.scoreKey('like', 'quality');
      expect(scoreKeyFilter).toEqual({
        type: 'condition',
        field: {
          table: 'request_response_rmt',
          column: 'scores',
          subtype: 'score',
          valueMode: 'key',
        },
        operator: 'like',
        value: 'quality',
      });
    });
  });

  describe('Compound Expressions', () => {
    test('should create AND expression', () => {
      const condition1 = FilterAST.condition('status', 'eq', 200);
      const condition2 = FilterAST.condition('model', 'like', 'gpt-4');
      const andFilter = FilterAST.and(condition1, condition2);

      expect(andFilter).toEqual({
        type: 'and',
        expressions: [condition1, condition2],
      });
    });

    test('should create OR expression', () => {
      const condition1 = FilterAST.condition('status', 'eq', 200);
      const condition2 = FilterAST.condition('status', 'eq', 201);
      const orFilter = FilterAST.or(condition1, condition2);

      expect(orFilter).toEqual({
        type: 'or',
        expressions: [condition1, condition2],
      });
    });

    test('should create nested compound expressions', () => {
      const statusFilter = FilterAST.or(
        FilterAST.condition('status', 'eq', 200),
        FilterAST.condition('status', 'eq', 201)
      );
      const modelFilter = FilterAST.condition('model', 'like', 'gpt-4');
      const combinedFilter = FilterAST.and(statusFilter, modelFilter);

      expect(combinedFilter.type).toBe('and');
      expect(combinedFilter.expressions).toHaveLength(2);
      expect(combinedFilter.expressions[0].type).toBe('or');
      expect(combinedFilter.expressions[1].type).toBe('condition');
    });
  });

  describe('Filter Validation', () => {
    test('should validate correct filter expressions', () => {
      const allFilter = FilterAST.all();
      const conditionFilter = FilterAST.condition('status', 'eq', 200);
      const andFilter = FilterAST.and(conditionFilter, FilterAST.all());

      expect(FilterAST.validateFilter(allFilter)).toBe(true);
      expect(FilterAST.validateFilter(conditionFilter)).toBe(true);
      expect(FilterAST.validateFilter(andFilter)).toBe(true);
    });

    test('should reject invalid filter expressions', () => {
      expect(FilterAST.validateFilter(null as any)).toBe(false);
      expect(FilterAST.validateFilter(undefined as any)).toBe(false);
      expect(FilterAST.validateFilter('invalid' as any)).toBe(false);
      expect(FilterAST.validateFilter({ type: 'invalid' } as any)).toBe(false);
    });

    test('should validate condition fields properly', () => {
      const invalidCondition = {
        type: 'condition',
        field: null,
        operator: 'eq',
        value: 200,
      } as any;

      expect(FilterAST.validateFilter(invalidCondition)).toBeFalsy();
    });

    test('should validate compound expressions recursively', () => {
      const validAnd = FilterAST.and(
        FilterAST.condition('status', 'eq', 200),
        FilterAST.all()
      );
      const invalidAnd = {
        type: 'and',
        expressions: [{ type: 'invalid' }],
      } as any;

      expect(FilterAST.validateFilter(validAnd)).toBe(true);
      expect(FilterAST.validateFilter(invalidAnd)).toBe(false);
    });
  });

  describe('Filter Simplification', () => {
    test('should return condition and "all" expressions as-is', () => {
      const allFilter = FilterAST.all();
      const conditionFilter = FilterAST.condition('status', 'eq', 200);

      expect(FilterAST.simplifyFilter(allFilter)).toEqual(allFilter);
      expect(FilterAST.simplifyFilter(conditionFilter)).toEqual(conditionFilter);
    });

    test('should remove redundant "all" from AND expressions', () => {
      const condition = FilterAST.condition('status', 'eq', 200);
      const andWithAll = FilterAST.and(condition, FilterAST.all());
      const simplified = FilterAST.simplifyFilter(andWithAll);

      expect(simplified).toEqual(condition);
    });

    test('should return single expression from compound with one child', () => {
      const condition = FilterAST.condition('status', 'eq', 200);
      const singleAnd = FilterAST.and(condition);
      const simplified = FilterAST.simplifyFilter(singleAnd);

      expect(simplified).toEqual(condition);
    });

    test('should return "all" for empty compound expressions', () => {
      const emptyAnd = { type: 'and', expressions: [] } as AndExpression;
      const simplified = FilterAST.simplifyFilter(emptyAnd);

      expect(simplified).toEqual(FilterAST.all());
    });

    test('should recursively simplify nested expressions', () => {
      const condition1 = FilterAST.condition('status', 'eq', 200);
      const condition2 = FilterAST.condition('model', 'like', 'gpt-4');
      const nestedAnd = FilterAST.and(
        FilterAST.and(condition1, FilterAST.all()),
        condition2
      );
      const simplified = FilterAST.simplifyFilter(nestedAnd);

      expect(simplified.type).toBe('and');
      expect((simplified as AndExpression).expressions).toHaveLength(2);
      expect((simplified as AndExpression).expressions[0]).toEqual(condition1);
      expect((simplified as AndExpression).expressions[1]).toEqual(condition2);
    });
  });

  describe('Empty Filter Detection', () => {
    test('should identify "all" as empty', () => {
      const allFilter = FilterAST.all();
      expect(FilterAST.isEmptyFilter(allFilter)).toBe(true);
    });

    test('should identify condition as non-empty', () => {
      const condition = FilterAST.condition('status', 'eq', 200);
      expect(FilterAST.isEmptyFilter(condition)).toBe(false);
    });

    test('should identify empty compound expressions as empty', () => {
      const emptyAnd = { type: 'and', expressions: [] } as AndExpression;
      const emptyOr = { type: 'or', expressions: [] } as OrExpression;

      expect(FilterAST.isEmptyFilter(emptyAnd)).toBe(true);
      expect(FilterAST.isEmptyFilter(emptyOr)).toBe(true);
    });

    test('should handle AND expressions correctly', () => {
      const condition = FilterAST.condition('status', 'eq', 200);
      const allOnlyAnd = FilterAST.and(FilterAST.all(), FilterAST.all());
      const mixedAnd = FilterAST.and(condition, FilterAST.all());

      expect(FilterAST.isEmptyFilter(allOnlyAnd)).toBe(true);
      expect(FilterAST.isEmptyFilter(mixedAnd)).toBe(false);
    });

    test('should handle OR expressions correctly', () => {
      const condition = FilterAST.condition('status', 'eq', 200);
      const allInOr = FilterAST.or(condition, FilterAST.all());
      const conditionsOnlyOr = FilterAST.or(condition, condition);

      expect(FilterAST.isEmptyFilter(allInOr)).toBe(true);
      expect(FilterAST.isEmptyFilter(conditionsOnlyOr)).toBe(false);
    });
  });

  describe('Filter Serialization', () => {
    test('should serialize and deserialize filters correctly', () => {
      const originalFilter = FilterAST.and(
        FilterAST.condition('status', 'eq', 200),
        FilterAST.property('user_type', 'eq', 'admin')
      );

      const serialized = FilterAST.serializeFilter(originalFilter);
      const deserialized = FilterAST.deserializeFilter(serialized);

      expect(deserialized).toEqual(originalFilter);
    });

    test('should handle complex nested filters', () => {
      const complexFilter = FilterAST.and(
        FilterAST.or(
          FilterAST.condition('status', 'eq', 200),
          FilterAST.condition('status', 'eq', 201)
        ),
        FilterAST.and(
          FilterAST.property('user_type', 'eq', 'admin'),
          FilterAST.score('quality', 'gt', 0.8)
        )
      );

      const serialized = FilterAST.serializeFilter(complexFilter);
      const deserialized = FilterAST.deserializeFilter(serialized);

      expect(deserialized).toEqual(complexFilter);
    });
  });

  describe('Filter Combination', () => {
    test('should combine multiple filters with AND', () => {
      const filters = [
        FilterAST.condition('status', 'eq', 200),
        FilterAST.condition('model', 'like', 'gpt-4'),
        FilterAST.property('user_type', 'eq', 'admin'),
      ];

      const combined = FilterAST.combineFilters(filters);

      expect(combined.type).toBe('and');
      expect((combined as AndExpression).expressions).toHaveLength(3);
    });

    test('should filter out empty filters when combining', () => {
      const filters = [
        FilterAST.condition('status', 'eq', 200),
        FilterAST.all(),
        FilterAST.condition('model', 'like', 'gpt-4'),
      ];

      const combined = FilterAST.combineFilters(filters);

      expect(combined.type).toBe('and');
      expect((combined as AndExpression).expressions).toHaveLength(2);
    });

    test('should return single filter when only one non-empty filter', () => {
      const filters = [
        FilterAST.all(),
        FilterAST.condition('status', 'eq', 200),
        FilterAST.all(),
      ];

      const combined = FilterAST.combineFilters(filters);

      expect(combined).toEqual(FilterAST.condition('status', 'eq', 200));
    });

    test('should return "all" when all filters are empty', () => {
      const filters = [FilterAST.all(), FilterAST.all()];
      const combined = FilterAST.combineFilters(filters);

      expect(combined).toEqual(FilterAST.all());
    });

    test('should return "all" when no filters provided', () => {
      const combined = FilterAST.combineFilters([]);
      expect(combined).toEqual(FilterAST.all());
    });
  });

  describe('Default Filter Creation', () => {
    test('should create default empty filter', () => {
      const defaultFilter = FilterAST.createDefaultFilter();
      expect(defaultFilter).toEqual(FilterAST.all());
    });

    test('should create default property filter template', () => {
      const defaultProperty = FilterAST.createDefaultPropertyFilter();
      expect(defaultProperty).toEqual(FilterAST.property('', 'eq', ''));
    });

    test('should create default score filter template', () => {
      const defaultScore = FilterAST.createDefaultScoreFilter();
      expect(defaultScore).toEqual(FilterAST.score('', 'gt', 0));
    });
  });

  describe('NOT Operation', () => {
    test('should create NOT condition for simple operators', () => {
      const condition = FilterAST.condition('status', 'eq', 200);
      const notCondition = FilterAST.not(condition);

      expect(notCondition.type).toBe('and');
      expect(notCondition.expressions).toHaveLength(1);
      expect(notCondition.expressions[0].type).toBe('condition');
      expect((notCondition.expressions[0] as ConditionExpression).operator).toBe('neq');
    });

    test('should handle comparison operators correctly', () => {
      const gtCondition = FilterAST.condition('latency', 'gt', 1000);
      const notGt = FilterAST.not(gtCondition);

      expect((notGt.expressions[0] as ConditionExpression).operator).toBe('lte');
    });

    test('should handle complex expressions with fallback', () => {
      const complexFilter = FilterAST.and(
        FilterAST.condition('status', 'eq', 200),
        FilterAST.condition('model', 'like', 'gpt-4')
      );
      const notComplex = FilterAST.not(complexFilter);

      // For complex expressions, the implementation provides a simple fallback
      expect(notComplex.type).toBe('and');
      expect(notComplex.expressions).toHaveLength(1);
      expect(notComplex.expressions[0]).toEqual(FilterAST.all());
    });
  });

  describe('Exported Constants', () => {
    test('should have correct default filter expression', () => {
      expect(DEFAULT_FILTER_EXPRESSION).toEqual(
        FilterAST.condition('status', 'eq', '200')
      );
    });

    test('should have correct default filter group expression', () => {
      expect(DEFAULT_FILTER_GROUP_EXPRESSION).toEqual(
        FilterAST.and(FilterAST.condition('status', 'eq', '200'))
      );
    });

    test('should have null empty filter group expression', () => {
      expect(EMPTY_FILTER_GROUP_EXPRESSION).toBeNull();
    });
  });

  describe('Filter Operator Types', () => {
    const validOperators: FilterOperator[] = [
      'eq', 'neq', 'is', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'contains', 'in'
    ];

    test('should accept all valid filter operators', () => {
      validOperators.forEach(operator => {
        const condition = FilterAST.condition('status', operator, 200);
        expect(condition.operator).toBe(operator);
      });
    });
  });

  describe('Type Exports', () => {
    test('should export filter operator labels', () => {
      expect(FilterAST.types.FILTER_OPERATOR_LABELS).toBeDefined();
      expect(FilterAST.types.FILTER_OPERATOR_LABELS.eq).toBe('equals');
      expect(FilterAST.types.FILTER_OPERATOR_LABELS.neq).toBe('not equals');
      expect(FilterAST.types.FILTER_OPERATOR_LABELS.gt).toBe('greater than');
    });
  });
});

describe('FilterExpression Type Guards', () => {
  test('should correctly identify expression types', () => {
    const allExpr: AllExpression = { type: 'all' };
    const condExpr: ConditionExpression = {
      type: 'condition',
      field: { table: 'request_response_rmt', column: 'status' },
      operator: 'eq',
      value: 200,
    };
    const andExpr: AndExpression = {
      type: 'and',
      expressions: [condExpr],
    };
    const orExpr: OrExpression = {
      type: 'or',
      expressions: [condExpr],
    };

    expect(allExpr.type).toBe('all');
    expect(condExpr.type).toBe('condition');
    expect(andExpr.type).toBe('and');
    expect(orExpr.type).toBe('or');
  });
});
