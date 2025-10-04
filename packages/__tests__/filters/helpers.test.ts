import {
  TimeFilterSchema,
  timeFilterToFilterNode,
  filterListToTree,
  isFilterRowNode,
  isUIFilterRow,
  getRootFilterNode,
  uiFilterRowToFilterLeaf,
  filterUITreeToFilterNode,
  filterUIToFilterLeafs,
  uiFilterRowTreeToFilterLeafArray,
} from "../../filters/helpers";
import {
  UIFilterRow,
  UIFilterRowNode,
  UIFilterRowTree,
} from "../../filters/types";
import { FilterLeaf, FilterNode, TimeFilter } from "../../filters/filterDefs";
import { SingleFilterDef } from "../../filters/frontendFilterDefs";

describe("Helpers", () => {
  describe("TimeFilterSchema", () => {
    test("should validate and transform valid time filter", () => {
      const validTimeFilter = {
        timeFilter: {
          start: "2023-01-01T00:00:00.000Z",
          end: "2023-12-31T23:59:59.999Z",
        },
      };

      const result = TimeFilterSchema.parse(validTimeFilter);
      expect(result.timeFilter.start).toBeInstanceOf(Date);
      expect(result.timeFilter.end).toBeInstanceOf(Date);
      expect(result.timeFilter.start.getFullYear()).toBeGreaterThanOrEqual(
        2022,
      );
      expect(result.timeFilter.end.getFullYear()).toBeGreaterThanOrEqual(2022);
    });

    test("should reject invalid date format", () => {
      const invalidTimeFilter = {
        timeFilter: {
          start: "invalid-date",
          end: "2023-12-31T23:59:59.999Z",
        },
      };

      expect(() => TimeFilterSchema.parse(invalidTimeFilter)).toThrow();
    });
  });

  describe("timeFilterToFilterNode", () => {
    const timeFilter: TimeFilter = {
      start: new Date("2023-01-01"),
      end: new Date("2023-12-31"),
    };

    test("should create filter node for request_response_rmt table", () => {
      const result = timeFilterToFilterNode(timeFilter, "request_response_rmt");

      expect(result).toEqual({
        left: {
          request_response_rmt: {
            request_created_at: {
              gte: timeFilter.start,
            },
          },
        },
        right: {
          request_response_rmt: {
            request_created_at: {
              lte: timeFilter.end,
            },
          },
        },
        operator: "and",
      });
    });

    test("should create filter node for property_with_response_v1 table", () => {
      const result = timeFilterToFilterNode(
        timeFilter,
        "property_with_response_v1",
      );

      expect(result).toEqual({
        left: {
          property_with_response_v1: {
            request_created_at: {
              gte: timeFilter.start,
            },
          },
        },
        right: {
          property_with_response_v1: {
            request_created_at: {
              lte: timeFilter.end,
            },
          },
        },
        operator: "and",
      });
    });

    test("should create filter node for rate_limit_log table", () => {
      const result = timeFilterToFilterNode(timeFilter, "rate_limit_log");

      expect(result).toEqual({
        left: {
          rate_limit_log: {
            created_at: {
              gte: timeFilter.start,
            },
          },
        },
        right: {
          rate_limit_log: {
            created_at: {
              lte: timeFilter.end,
            },
          },
        },
        operator: "and",
      });
    });

    test("should throw error for unsupported table", () => {
      expect(() => {
        timeFilterToFilterNode(timeFilter, "unsupported_table" as any);
      }).toThrow("Table not supported");
    });
  });

  describe("filterListToTree", () => {
    const filter1: FilterLeaf = {
      request_response_rmt: {
        status: { equals: 200 },
      },
    };
    const filter2: FilterLeaf = {
      request_response_rmt: {
        model: { like: "gpt-4" },
      },
    };
    const filter3: FilterLeaf = {
      request_response_rmt: {
        latency: { gte: 1000 },
      },
    };

    test('should return "all" for empty list', () => {
      const result = filterListToTree([], "and");
      expect(result).toBe("all");
    });

    test("should return single filter for list with one item", () => {
      const result = filterListToTree([filter1], "and");
      expect(result).toEqual(filter1);
    });

    test("should create AND tree for multiple filters", () => {
      const result = filterListToTree([filter1, filter2, filter3], "and");

      expect(result).toEqual({
        left: filter1,
        operator: "and",
        right: {
          left: filter2,
          operator: "and",
          right: filter3,
        },
      });
    });

    test("should create OR tree for multiple filters", () => {
      const result = filterListToTree([filter1, filter2], "or");

      expect(result).toEqual({
        left: filter1,
        operator: "or",
        right: filter2,
      });
    });
  });

  describe("Type Guards", () => {
    describe("isFilterRowNode", () => {
      test("should identify UIFilterRowNode correctly", () => {
        const rowNode: UIFilterRowNode = {
          operator: "and",
          rows: [],
        };
        const filterRow: UIFilterRow = {
          filterMapIdx: 0,
          operatorIdx: 0,
          value: "test",
        };

        expect(isFilterRowNode(rowNode)).toBe(true);
        expect(isFilterRowNode(filterRow)).toBe(false);
      });
    });

    describe("isUIFilterRow", () => {
      test("should identify UIFilterRow correctly", () => {
        const filterRow: UIFilterRow = {
          filterMapIdx: 0,
          operatorIdx: 0,
          value: "test",
        };
        const rowNode: UIFilterRowNode = {
          operator: "and",
          rows: [],
        };

        expect(isUIFilterRow(filterRow)).toBe(true);
        expect(isUIFilterRow(rowNode)).toBe(false);
      });
    });
  });

  describe("getRootFilterNode", () => {
    test("should return root filter node with AND operator", () => {
      const result = getRootFilterNode();
      expect(result).toEqual({
        operator: "and",
        rows: [],
      });
    });
  });

  describe("uiFilterRowToFilterLeaf", () => {
    const mockFilterMap: SingleFilterDef<any>[] = [
      {
        label: "Status",
        operators: [
          { value: "equals", label: "equals", type: "number" },
          { value: "not-equals", label: "not equals", type: "number" },
        ],
        table: "request_response_rmt",
        column: "status",
        category: "request",
      },
      {
        label: "Custom Property",
        operators: [{ value: "equals", label: "equals", type: "text" }],
        table: "request_response_rmt",
        column: "custom_prop",
        category: "properties",
        isCustomProperty: true,
      },
      {
        label: "Feedback",
        operators: [{ value: "equals", label: "equals", type: "bool" }],
        table: "request_response_rmt",
        column: "helicone-score-feedback",
        category: "feedback",
      },
    ];

    test("should convert regular UI filter row to filter leaf", () => {
      const uiFilterRow: UIFilterRow = {
        filterMapIdx: 0,
        operatorIdx: 0,
        value: "200",
      };

      const result = uiFilterRowToFilterLeaf(mockFilterMap, uiFilterRow);

      expect(result).toEqual({
        request_response_rmt: {
          status: {
            equals: "200",
          },
        },
      });
    });

    test("should handle custom property filter", () => {
      const uiFilterRow: UIFilterRow = {
        filterMapIdx: 1,
        operatorIdx: 0,
        value: "test-value",
      };

      const result = uiFilterRowToFilterLeaf(mockFilterMap, uiFilterRow);

      expect(result).toEqual({
        request_response_rmt: {
          properties: {
            custom_prop: {
              equals: "test-value",
            },
          },
        },
      });
    });

    test("should handle feedback filter with boolean conversion", () => {
      const uiFilterRow: UIFilterRow = {
        filterMapIdx: 2,
        operatorIdx: 0,
        value: "true",
      };

      const result = uiFilterRowToFilterLeaf(mockFilterMap, uiFilterRow);

      expect(result).toEqual({
        request_response_rmt: {
          scores: {
            "helicone-score-feedback": {
              equals: "1",
            },
          },
        },
      });
    });

    test("should handle feedback filter with false value", () => {
      const uiFilterRow: UIFilterRow = {
        filterMapIdx: 2,
        operatorIdx: 0,
        value: "false",
      };

      const result = uiFilterRowToFilterLeaf(mockFilterMap, uiFilterRow);

      expect(result).toEqual({
        request_response_rmt: {
          scores: {
            "helicone-score-feedback": {
              equals: "0",
            },
          },
        },
      });
    });
  });

  describe("filterUITreeToFilterNode", () => {
    const mockFilterMap: SingleFilterDef<any>[] = [
      {
        label: "Status",
        operators: [{ value: "equals", label: "equals", type: "number" }],
        table: "request_response_rmt",
        column: "status",
        category: "request",
      },
      {
        label: "Model",
        operators: [{ value: "like", label: "like", type: "text" }],
        table: "request_response_rmt",
        column: "model",
        category: "request",
      },
    ];

    test("should convert UI filter row to filter node", () => {
      const uiFilterRow: UIFilterRow = {
        filterMapIdx: 0,
        operatorIdx: 0,
        value: "200",
      };

      const result = filterUITreeToFilterNode(mockFilterMap, uiFilterRow);

      expect(result).toEqual({
        request_response_rmt: {
          status: {
            equals: "200",
          },
        },
      });
    });

    test('should return "all" for empty value', () => {
      const uiFilterRow: UIFilterRow = {
        filterMapIdx: 0,
        operatorIdx: 0,
        value: "",
      };

      const result = filterUITreeToFilterNode(mockFilterMap, uiFilterRow);
      expect(result).toBe("all");
    });

    test("should handle UI filter row node with AND operator", () => {
      const uiFilterRowNode: UIFilterRowNode = {
        operator: "and",
        rows: [
          {
            filterMapIdx: 0,
            operatorIdx: 0,
            value: "200",
          },
          {
            filterMapIdx: 1,
            operatorIdx: 0,
            value: "gpt-4",
          },
        ],
      };

      const result = filterUITreeToFilterNode(mockFilterMap, uiFilterRowNode);

      expect(result).toEqual({
        left: {
          request_response_rmt: {
            status: {
              equals: "200",
            },
          },
        },
        operator: "and",
        right: {
          request_response_rmt: {
            model: {
              like: "gpt-4",
            },
          },
        },
      });
    });

    test('should filter out "all" nodes when building tree', () => {
      const uiFilterRowNode: UIFilterRowNode = {
        operator: "and",
        rows: [
          {
            filterMapIdx: 0,
            operatorIdx: 0,
            value: "200",
          },
          {
            filterMapIdx: 1,
            operatorIdx: 0,
            value: "", // This will become "all" and be filtered out
          },
        ],
      };

      const result = filterUITreeToFilterNode(mockFilterMap, uiFilterRowNode);

      expect(result).toEqual({
        request_response_rmt: {
          status: {
            equals: "200",
          },
        },
      });
    });

    test('should return "all" when all rows are empty', () => {
      const uiFilterRowNode: UIFilterRowNode = {
        operator: "and",
        rows: [
          {
            filterMapIdx: 0,
            operatorIdx: 0,
            value: "",
          },
          {
            filterMapIdx: 1,
            operatorIdx: 0,
            value: "",
          },
        ],
      };

      const result = filterUITreeToFilterNode(mockFilterMap, uiFilterRowNode);
      expect(result).toBe("all");
    });
  });

  describe("filterUIToFilterLeafs", () => {
    const mockFilterMap: SingleFilterDef<any>[] = [
      {
        label: "Status",
        operators: [{ value: "equals", label: "equals", type: "number" }],
        table: "request_response_rmt",
        column: "status",
        category: "request",
      },
      {
        label: "Model",
        operators: [{ value: "like", label: "like", type: "text" }],
        table: "request_response_rmt",
        column: "model",
        category: "request",
      },
    ];

    test("should convert array of UI filter rows to filter leafs", () => {
      const uiFilters: UIFilterRow[] = [
        {
          filterMapIdx: 0,
          operatorIdx: 0,
          value: "200",
        },
        {
          filterMapIdx: 1,
          operatorIdx: 0,
          value: "gpt-4",
        },
      ];

      const result = filterUIToFilterLeafs(mockFilterMap, uiFilters);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        request_response_rmt: {
          status: {
            equals: "200",
          },
        },
      });
      expect(result[1]).toEqual({
        request_response_rmt: {
          model: {
            like: "gpt-4",
          },
        },
      });
    });

    test("should filter out empty value filters", () => {
      const uiFilters: UIFilterRow[] = [
        {
          filterMapIdx: 0,
          operatorIdx: 0,
          value: "200",
        },
        {
          filterMapIdx: 1,
          operatorIdx: 0,
          value: "", // Empty value should be filtered out
        },
      ];

      const result = filterUIToFilterLeafs(mockFilterMap, uiFilters);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        request_response_rmt: {
          status: {
            equals: "200",
          },
        },
      });
    });

    test("should return empty array for all empty filters", () => {
      const uiFilters: UIFilterRow[] = [
        {
          filterMapIdx: 0,
          operatorIdx: 0,
          value: "",
        },
        {
          filterMapIdx: 1,
          operatorIdx: 0,
          value: "",
        },
      ];

      const result = filterUIToFilterLeafs(mockFilterMap, uiFilters);
      expect(result).toHaveLength(0);
    });
  });

  describe("uiFilterRowTreeToFilterLeafArray", () => {
    const mockFilterMap: SingleFilterDef<any>[] = [
      {
        label: "Status",
        operators: [{ value: "equals", label: "equals", type: "number" }],
        table: "request_response_rmt",
        column: "status",
        category: "request",
      },
      {
        label: "Model",
        operators: [{ value: "like", label: "like", type: "text" }],
        table: "request_response_rmt",
        column: "model",
        category: "request",
      },
    ];

    test("should extract filter leafs from simple UI filter row", () => {
      const uiFilterRow: UIFilterRow = {
        filterMapIdx: 0,
        operatorIdx: 0,
        value: "200",
      };

      const result = uiFilterRowTreeToFilterLeafArray(
        mockFilterMap,
        uiFilterRow,
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        request_response_rmt: {
          status: {
            equals: "200",
          },
        },
      });
    });

    test("should extract filter leafs from nested UI filter row node", () => {
      const uiFilterRowNode: UIFilterRowNode = {
        operator: "and",
        rows: [
          {
            filterMapIdx: 0,
            operatorIdx: 0,
            value: "200",
          },
          {
            operator: "or",
            rows: [
              {
                filterMapIdx: 1,
                operatorIdx: 0,
                value: "gpt-3",
              },
              {
                filterMapIdx: 1,
                operatorIdx: 0,
                value: "gpt-4",
              },
            ],
          },
        ],
      };

      const result = uiFilterRowTreeToFilterLeafArray(
        mockFilterMap,
        uiFilterRowNode,
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        request_response_rmt: {
          status: {
            equals: "200",
          },
        },
      });
      expect(result[1]).toEqual({
        request_response_rmt: {
          model: {
            like: "gpt-3",
          },
        },
      });
      expect(result[2]).toEqual({
        request_response_rmt: {
          model: {
            like: "gpt-4",
          },
        },
      });
    });

    test("should return empty array for empty tree", () => {
      const uiFilterRowNode: UIFilterRowNode = {
        operator: "and",
        rows: [],
      };

      const result = uiFilterRowTreeToFilterLeafArray(
        mockFilterMap,
        uiFilterRowNode,
      );
      expect(result).toHaveLength(0);
    });
  });
});
