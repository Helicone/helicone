import {
  ColumnType,
  InputParam,
  SingleFilterDef,
  textWithSuggestions,
  numberWithSuggestions,
  getPropertyFilters,
  getPropertyFiltersV2,
  getValueFilters,
  DASHBOARD_PAGE_TABLE_FILTERS,
  REQUEST_TABLE_FILTERS,
} from '../../filters/frontendFilterDefs';

describe('Frontend Filter Definitions', () => {
  describe('Types', () => {
    test('should define correct column types', () => {
      const columnTypes: ColumnType[] = [
        'text',
        'timestamp',
        'number',
        'text-with-suggestions',
        'number-with-suggestions',
        'bool',
      ];

      columnTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    test('should define input param structure', () => {
      const inputParam: InputParam = {
        key: 'test-key',
        param: 'test-param',
      };

      expect(inputParam.key).toBe('test-key');
      expect(inputParam.param).toBe('test-param');
    });
  });

  describe('textWithSuggestions', () => {
    test('should create text operators with suggestions', () => {
      const inputParams: InputParam[] = [
        { key: 'option1', param: 'Option 1' },
        { key: 'option2', param: 'Option 2' },
      ];

      const operators = textWithSuggestions(inputParams);

      expect(operators).toHaveLength(6); // equals, not-equals, contains, not-contains, ilike, like
      operators.forEach(operator => {
        expect(operator.type).toBe('text-with-suggestions');
        expect(operator.inputParams).toEqual(inputParams);
      });

      // Check specific operators
      const equalsOp = operators.find(op => op.value === 'equals');
      expect(equalsOp).toBeDefined();
      expect(equalsOp?.label).toBe('equals');

      const containsOp = operators.find(op => op.value === 'contains');
      expect(containsOp).toBeDefined();
      expect(containsOp?.label).toBe('contains');
    });

    test('should work with empty input params', () => {
      const operators = textWithSuggestions([]);

      expect(operators).toHaveLength(6);
      operators.forEach(operator => {
        expect(operator.type).toBe('text-with-suggestions');
        expect(operator.inputParams).toEqual([]);
      });
    });
  });

  describe('numberWithSuggestions', () => {
    test('should create number operators with suggestions', () => {
      const inputParams: InputParam[] = [
        { key: '100', param: '100 requests' },
        { key: '1000', param: '1000 requests' },
      ];

      const operators = numberWithSuggestions(inputParams);

      expect(operators).toHaveLength(4); // equals, not-equals, gte, lte
      operators.forEach(operator => {
        expect(operator.type).toBe('number-with-suggestions');
        expect(operator.inputParams).toEqual(inputParams);
      });

      // Check specific operators
      const gteOp = operators.find(op => op.value === 'gte');
      expect(gteOp).toBeDefined();
      expect(gteOp?.label).toBe('greater than or equal to');

      const lteOp = operators.find(op => op.value === 'lte');
      expect(lteOp).toBeDefined();
      expect(lteOp?.label).toBe('less than or equal to');
    });
  });

  describe('getPropertyFilters', () => {
    test('should create property filters for given properties', () => {
      const properties = ['user_id', 'session_id', 'custom_prop'];
      const inputParams: InputParam[] = [
        { key: 'value1', param: 'Value 1' },
        { key: 'value2', param: 'Value 2' },
      ];

      const filters = getPropertyFilters(properties, inputParams);

      expect(filters).toHaveLength(3);

      filters.forEach((filter, index) => {
        expect(filter.label).toBe(properties[index]);
        expect(filter.table).toBe('properties');
        expect(filter.column).toBe(properties[index]);
        expect(filter.category).toBe('properties');
        expect(filter.operators).toHaveLength(6); // text operators
        expect(filter.operators[0].type).toBe('text-with-suggestions');
        expect(filter.operators[0].inputParams).toEqual(inputParams);
      });
    });

    test('should work with empty properties array', () => {
      const filters = getPropertyFilters([], []);
      expect(filters).toHaveLength(0);
    });
  });

  describe('getPropertyFiltersV2', () => {
    test('should create RMT property filters for given properties', () => {
      const properties = ['user_type', 'environment', 'version'];
      const inputParams: InputParam[] = [
        { key: 'prod', param: 'Production' },
        { key: 'dev', param: 'Development' },
      ];

      const filters = getPropertyFiltersV2(properties, inputParams);

      expect(filters).toHaveLength(3);

      filters.forEach((filter, index) => {
        expect(filter.label).toBe(properties[index]);
        expect(filter.table).toBe('request_response_rmt');
        expect(filter.column).toBe(properties[index]);
        expect(filter.category).toBe('properties');
        expect(filter.isCustomProperty).toBe(true);
        expect(filter.operators).toHaveLength(6); // text operators
        expect(filter.operators[0].type).toBe('text-with-suggestions');
        expect(filter.operators[0].inputParams).toEqual(inputParams);
      });
    });
  });

  describe('getValueFilters', () => {
    test('should create value filters for prompt variables', () => {
      const properties = ['variable1', 'variable2', 'template_var'];
      const inputParams: InputParam[] = [
        { key: 'val1', param: 'Value 1' },
        { key: 'val2', param: 'Value 2' },
      ];

      const filters = getValueFilters(properties, inputParams);

      expect(filters).toHaveLength(3);

      filters.forEach((filter, index) => {
        expect(filter.label).toBe(properties[index]);
        expect(filter.table).toBe('values');
        expect(filter.column).toBe(properties[index]);
        expect(filter.category).toBe('prompt variables');
        expect(filter.operators).toHaveLength(6); // text operators
        expect(filter.operators[0].type).toBe('text-with-suggestions');
        expect(filter.operators[0].inputParams).toEqual(inputParams);
      });
    });
  });

  describe('DASHBOARD_PAGE_TABLE_FILTERS', () => {
    test('should have correct structure and length', () => {
      expect(DASHBOARD_PAGE_TABLE_FILTERS).toHaveLength(4);

      const [modelFilter, statusFilter, latencyFilter, userFilter] = DASHBOARD_PAGE_TABLE_FILTERS;

      // Model filter
      expect(modelFilter.label).toBe('Model');
      expect(modelFilter.table).toBe('request_response_rmt');
      expect(modelFilter.column).toBe('model');
      expect(modelFilter.category).toBe('request');
      expect(modelFilter.operators).toHaveLength(6); // text operators

      // Status filter
      expect(statusFilter.label).toBe('Status');
      expect(statusFilter.table).toBe('request_response_rmt');
      expect(statusFilter.column).toBe('status');
      expect(statusFilter.category).toBe('request');
      expect(statusFilter.operators.length).toBeGreaterThanOrEqual(4); // number operators with suggestions

      // Latency filter
      expect(latencyFilter.label).toBe('Latency');
      expect(latencyFilter.table).toBe('request_response_rmt');
      expect(latencyFilter.column).toBe('latency');
      expect(latencyFilter.category).toBe('request');
      expect(latencyFilter.operators).toHaveLength(4); // number operators

      // User filter
      expect(userFilter.label).toBe('User');
      expect(userFilter.table).toBe('request_response_rmt');
      expect(userFilter.column).toBe('user_id');
      expect(userFilter.category).toBe('request');
      expect(userFilter.operators).toHaveLength(6); // text operators
    });

    test('should have status filter with proper suggestions', () => {
      const statusFilter = DASHBOARD_PAGE_TABLE_FILTERS[1];
      const statusSuggestions = statusFilter.operators[0].inputParams || [];

      expect(statusSuggestions.length).toBeGreaterThan(0);
      
      // Check for common status codes
      const status200 = statusSuggestions.find(s => s.key === '200');
      expect(status200).toBeDefined();
      expect(status200?.param).toBe('200 (success)');

      const status400 = statusSuggestions.find(s => s.key === '400');
      expect(status400).toBeDefined();
      expect(status400?.param).toBe('400 (bad request)');

      const status500 = statusSuggestions.find(s => s.key === '500');
      expect(status500).toBeDefined();
      expect(status500?.param).toBe('500 (internal server error)');

      // Check for special status codes
      const threat = statusSuggestions.find(s => s.key === '-4');
      expect(threat).toBeDefined();
      expect(threat?.param).toBe('threat');

      const timeout = statusSuggestions.find(s => s.key === '-1');
      expect(timeout).toBeDefined();
      expect(timeout?.param).toBe('timeout');
    });
  });

  describe('REQUEST_TABLE_FILTERS', () => {
    test('should have correct structure and length', () => {
      expect(REQUEST_TABLE_FILTERS).toHaveLength(13);

      const filterLabels = REQUEST_TABLE_FILTERS.map(f => f.label);
      const expectedLabels = [
        'Request',
        'Request-Id',
        'Response',
        'Prompt Tokens',
        'Completion Tokens',
        'Total Tokens',
        'User',
        'Model',
        'Provider',
        'Status',
        'Path',
        'Feedback',
        'AI Gateway',
      ];

      expect(filterLabels).toEqual(expectedLabels);
    });

    test('should have all filters targeting request_response_rmt table', () => {
      REQUEST_TABLE_FILTERS.forEach(filter => {
        expect(filter.table).toBe('request_response_rmt');
      });
    });

    test('should have correct categories', () => {
      const requestFilters = REQUEST_TABLE_FILTERS.filter(f => f.category === 'request');
      const responseFilters = REQUEST_TABLE_FILTERS.filter(f => f.category === 'response');
      const feedbackFilters = REQUEST_TABLE_FILTERS.filter(f => f.category === 'feedback');

      expect(requestFilters).toHaveLength(11);
      expect(responseFilters).toHaveLength(1);
      expect(feedbackFilters).toHaveLength(1);
    });

    test('should have vector operators for request and response body', () => {
      const requestFilter = REQUEST_TABLE_FILTERS.find(f => f.label === 'Request');
      const responseFilter = REQUEST_TABLE_FILTERS.find(f => f.label === 'Response');

      expect(requestFilter?.column).toBe('request_body');
      expect(requestFilter?.operators).toHaveLength(1); // vector contains
      expect(requestFilter?.operators[0].value).toBe('contains');

      expect(responseFilter?.column).toBe('response_body');
      expect(responseFilter?.operators).toHaveLength(1); // vector contains
      expect(responseFilter?.operators[0].value).toBe('contains');
    });

    test('should have number operators for token fields', () => {
      const tokenFields = ['Prompt Tokens', 'Completion Tokens', 'Total Tokens'];
      
      tokenFields.forEach(fieldLabel => {
        const filter = REQUEST_TABLE_FILTERS.find(f => f.label === fieldLabel);
        expect(filter?.operators).toHaveLength(4); // number operators
        expect(filter?.operators.some(op => op.value === 'equals')).toBe(true);
        expect(filter?.operators.some(op => op.value === 'gte')).toBe(true);
        expect(filter?.operators.some(op => op.value === 'lte')).toBe(true);
      });
    });

    test('should have boolean operators for feedback', () => {
      const feedbackFilter = REQUEST_TABLE_FILTERS.find(f => f.label === 'Feedback');
      
      expect(feedbackFilter?.column).toBe('helicone-score-feedback');
      expect(feedbackFilter?.category).toBe('feedback');
      expect(feedbackFilter?.operators).toHaveLength(1); // boolean equals
      expect(feedbackFilter?.operators[0].value).toBe('equals');
      expect(feedbackFilter?.operators[0].type).toBe('bool');
    });

    test('should have boolean operators for AI Gateway', () => {
      const aiGatewayFilter = REQUEST_TABLE_FILTERS.find(f => f.label === 'AI Gateway');
      
      expect(aiGatewayFilter).toBeDefined();
      expect(aiGatewayFilter?.column).toBe('request_referrer');
      expect(aiGatewayFilter?.category).toBe('request');
      expect(aiGatewayFilter?.operators).toHaveLength(1); // boolean equals
      expect(aiGatewayFilter?.operators[0].value).toBe('equals');
      expect(aiGatewayFilter?.operators[0].type).toBe('bool');
    });

    test('should have status filter with suggestions', () => {
      const statusFilter = REQUEST_TABLE_FILTERS.find(f => f.label === 'Status');
      
      expect(statusFilter?.category).toBe('response');
      expect(statusFilter?.operators.length).toBeGreaterThanOrEqual(4);
      expect(statusFilter?.operators[0].type).toBe('number-with-suggestions');
      expect(statusFilter?.operators[0].inputParams).toBeDefined();
      expect(statusFilter?.operators[0].inputParams?.length).toBeGreaterThan(0);
    });

    test('should have text operators for request-id with boolean-to-text mapping', () => {
      const requestIdFilter = REQUEST_TABLE_FILTERS.find(f => f.label === 'Request-Id');
      
      expect(requestIdFilter?.column).toBe('request_id');
      expect(requestIdFilter?.operators).toHaveLength(2); // equals and not-equals
      expect(requestIdFilter?.operators.some(op => op.value === 'equals')).toBe(true);
      expect(requestIdFilter?.operators.some(op => op.value === 'not-equals')).toBe(true);
      expect(requestIdFilter?.operators.every(op => op.type === 'text')).toBe(true);
    });
  });

  describe('Operator Consistency', () => {
    test('should have consistent operator structures across all filters', () => {
      const allFilters = [...DASHBOARD_PAGE_TABLE_FILTERS, ...REQUEST_TABLE_FILTERS];

      allFilters.forEach(filter => {
        expect(filter.label).toBeDefined();
        expect(filter.table).toBeDefined();
        expect(filter.column).toBeDefined();
        expect(filter.category).toBeDefined();
        expect(Array.isArray(filter.operators)).toBe(true);
        expect(filter.operators.length).toBeGreaterThan(0);

        filter.operators.forEach(operator => {
          expect(operator.value).toBeDefined();
          expect(operator.label).toBeDefined();
          expect(operator.type).toBeDefined();
          
          if (operator.inputParams) {
            expect(Array.isArray(operator.inputParams)).toBe(true);
            operator.inputParams.forEach(param => {
              expect(param.key).toBeDefined();
              expect(param.param).toBeDefined();
            });
          }
        });
      });
    });

    test('should have valid operator types', () => {
      const validTypes: ColumnType[] = [
        'text',
        'timestamp',
        'number',
        'text-with-suggestions',
        'number-with-suggestions',
        'bool',
      ];

      const allFilters = [...DASHBOARD_PAGE_TABLE_FILTERS, ...REQUEST_TABLE_FILTERS];
      
      allFilters.forEach(filter => {
        filter.operators.forEach(operator => {
          expect(validTypes).toContain(operator.type);
        });
      });
    });
  });
});
