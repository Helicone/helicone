const { toFilterNode } = require("../../filters/toFilterNode");
const { FilterAST } = require("../../filters/filterExpressions");

describe("toFilterNode", () => {
  describe("null and undefined inputs", () => {
    it("should return 'all' for null input", () => {
      const result = toFilterNode(null);
      expect(result).toBe("all");
    });

    it("should return 'all' for undefined input", () => {
      const result = toFilterNode(undefined);
      expect(result).toBe("all");
    });

    it("should return 'all' for empty string", () => {
      const result = toFilterNode("");
      expect(result).toBe("all");
    });
  });

  describe("string JSON input parsing", () => {
    it("should parse valid JSON string", () => {
      const filterObj = FilterAST.condition("status", "eq", 200);
      const jsonString = JSON.stringify(filterObj);
      const result = toFilterNode(jsonString);

      const expected = {
        request_response_rmt: {
          status: {
            equals: 200,
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it("should throw error for invalid JSON string", () => {
      const invalidJson = "{ invalid json }";
      expect(() => toFilterNode(invalidJson)).toThrow(
        "Invalid filter JSON string: { invalid json }"
      );
    });

    it("should throw error for non-object JSON", () => {
      const primitiveJson = JSON.stringify("string");
      expect(() => toFilterNode(primitiveJson)).toThrow(
        'Invalid filter object: "string"'
      );
    });

    it("should throw error for object without type property", () => {
      const objectWithoutType = JSON.stringify({ foo: "bar" });
      expect(() => toFilterNode(objectWithoutType)).toThrow(
        'Invalid filter object: {"foo":"bar"}'
      );
    });
  });

  describe("'all' expressions", () => {
    it("should return 'all' for all expression", () => {
      const filter = FilterAST.all();
      const result = toFilterNode(filter);
      expect(result).toBe("all");
    });
  });

  describe("basic condition expressions", () => {
    it("should convert simple condition with equals operator", () => {
      const filter = FilterAST.condition("status", "eq", 200);
      const result = toFilterNode(filter);

      const expected = {
        request_response_rmt: {
          status: {
            equals: 200,
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it("should convert condition with not-equals operator", () => {
      const filter = FilterAST.condition("model", "neq", "gpt-4");
      const result = toFilterNode(filter);

      const expected = {
        request_response_rmt: {
          model: {
            "not-equals": "gpt-4",
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it("should convert condition with like operator", () => {
      const filter = FilterAST.condition("model", "like", "gpt");
      const result = toFilterNode(filter);

      const expected = {
        request_response_rmt: {
          model: {
            like: "gpt",
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it("should map all supported operators correctly", () => {
      const operatorTests = [
        { from: "eq", to: "equals" },
        { from: "neq", to: "not-equals" },
        { from: "is", to: "equals" },
        { from: "gt", to: "gt" },
        { from: "gte", to: "gte" },
        { from: "lt", to: "lt" },
        { from: "lte", to: "lte" },
        { from: "like", to: "like" },
        { from: "ilike", to: "ilike" },
        { from: "contains", to: "contains" },
      ];

      operatorTests.forEach(({ from, to }) => {
        const filter = FilterAST.condition("status", from, 200);
        const result = toFilterNode(filter);
        expect(result.request_response_rmt?.status).toHaveProperty(to, 200);
      });
    });

    it("should throw error for condition with missing field", () => {
      const invalidCondition = {
        type: "condition",
        operator: "eq",
        value: 200,
      };

      expect(() => toFilterNode(invalidCondition)).toThrow(
        "Invalid condition structure:"
      );
    });

    it("should throw error for condition with missing operator", () => {
      const invalidCondition = {
        type: "condition",
        field: { table: "request_response_rmt", column: "status" },
        value: 200,
      };

      expect(() => toFilterNode(invalidCondition)).toThrow(
        "Invalid condition structure:"
      );
    });

    it("should throw error for condition with undefined value", () => {
      const invalidCondition = {
        type: "condition",
        field: { table: "request_response_rmt", column: "status" },
        operator: "eq",
      };

      expect(() => toFilterNode(invalidCondition)).toThrow(
        "Invalid condition structure:"
      );
    });
  });

  describe("property conditions", () => {
    it("should convert property condition with key", () => {
      const filter = {
        type: "condition",
        field: {
          table: "request_response_rmt",
          column: "properties",
          subtype: "property",
          valueMode: "value",
          key: "user_type",
        },
        operator: "eq",
        value: "admin",
      };

      const result = toFilterNode(filter);

      const expected = {
        request_response_rmt: {
          properties: {
            user_type: {
              equals: "admin",
            },
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it("should handle property-like column names with hyphens", () => {
      const filter = {
        type: "condition",
        field: {
          table: "request_response_rmt",
          column: "Helicone-Session-Name",
        },
        operator: "eq",
        value: "test-session",
      };

      const result = toFilterNode(filter);

      const expected = {
        request_response_rmt: {
          properties: {
            "Helicone-Session-Name": {
              equals: "test-session",
            },
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it("should not treat helicone-score-feedback as property", () => {
      const filter = {
        type: "condition",
        field: {
          table: "request_response_rmt",
          column: "helicone-score-feedback",
        },
        operator: "eq",
        value: true,
      };

      const result = toFilterNode(filter);

      const expected = {
        request_response_rmt: {
          "helicone-score-feedback": {
            equals: true,
          },
        },
      };
      expect(result).toEqual(expected);
    });
  });

  describe("score conditions", () => {
    it("should convert score condition with key", () => {
      const filter = {
        type: "condition",
        field: {
          table: "request_response_rmt",
          column: "scores",
          subtype: "score",
          valueMode: "value",
          key: "quality",
        },
        operator: "gt",
        value: 0.8,
      };

      const result = toFilterNode(filter);

      const expected = {
        request_response_rmt: {
          scores: {
            quality: {
              gt: 0.8,
            },
          },
        },
      };
      expect(result).toEqual(expected);
    });
  });

  describe("AND expressions", () => {
    it("should return 'all' for empty AND expression", () => {
      const filter = {
        type: "and",
        expressions: [],
      };

      const result = toFilterNode(filter);
      expect(result).toBe("all");
    });

    it("should return the single expression for AND with one expression", () => {
      const singleExpr = FilterAST.condition("status", "eq", 200);
      const filter = {
        type: "and",
        expressions: [singleExpr],
      };

      const result = toFilterNode(filter);

      const expected = {
        request_response_rmt: {
          status: {
            equals: 200,
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it("should create nested AND structure for multiple expressions", () => {
      const expr1 = FilterAST.condition("status", "eq", 200);
      const expr2 = FilterAST.condition("model", "like", "gpt");

      const filter = {
        type: "and",
        expressions: [expr1, expr2],
      };

      const result = toFilterNode(filter);

      expect(result.operator).toBe("and");
      expect(result.left).toEqual({
        request_response_rmt: {
          status: {
            equals: 200,
          },
        },
      });
      expect(result.right).toEqual({
        request_response_rmt: {
          model: {
            like: "gpt",
          },
        },
      });
    });

    it("should throw error for AND expression with invalid structure", () => {
      const invalidAnd = {
        type: "and",
        expressions: "not an array",
      };

      expect(() => toFilterNode(invalidAnd)).toThrow(
        "Invalid AND expression structure:"
      );
    });
  });

  describe("OR expressions", () => {
    it("should return 'all' for empty OR expression", () => {
      const filter = {
        type: "or",
        expressions: [],
      };

      const result = toFilterNode(filter);
      expect(result).toBe("all");
    });

    it("should return the single expression for OR with one expression", () => {
      const singleExpr = FilterAST.condition("status", "eq", 200);
      const filter = {
        type: "or",
        expressions: [singleExpr],
      };

      const result = toFilterNode(filter);

      const expected = {
        request_response_rmt: {
          status: {
            equals: 200,
          },
        },
      };
      expect(result).toEqual(expected);
    });

    it("should create nested OR structure for multiple expressions", () => {
      const expr1 = FilterAST.condition("status", "eq", 200);
      const expr2 = FilterAST.condition("status", "eq", 201);

      const filter = {
        type: "or",
        expressions: [expr1, expr2],
      };

      const result = toFilterNode(filter);

      expect(result.operator).toBe("or");
      expect(result.left).toEqual({
        request_response_rmt: {
          status: {
            equals: 200,
          },
        },
      });
      expect(result.right).toEqual({
        request_response_rmt: {
          status: {
            equals: 201,
          },
        },
      });
    });

    it("should throw error for OR expression with invalid structure", () => {
      const invalidOr = {
        type: "or",
        expressions: null,
      };

      expect(() => toFilterNode(invalidOr)).toThrow(
        "Invalid OR expression structure:"
      );
    });
  });

  describe("nested complex expressions", () => {
    it("should handle nested AND and OR expressions", () => {
      // Create: (status = 200 AND model LIKE 'gpt') OR (status = 500)
      const innerAnd = FilterAST.and(
        FilterAST.condition("status", "eq", 200),
        FilterAST.condition("model", "like", "gpt")
      );
      const statusError = FilterAST.condition("status", "eq", 500);
      const outerOr = FilterAST.or(innerAnd, statusError);

      const result = toFilterNode(outerOr);

      expect(result.operator).toBe("or");

      // Left side should be an AND branch
      const leftBranch = result.left;
      expect(leftBranch.operator).toBe("and");
      expect(leftBranch.left).toEqual({
        request_response_rmt: {
          status: {
            equals: 200,
          },
        },
      });
      expect(leftBranch.right).toEqual({
        request_response_rmt: {
          model: {
            like: "gpt",
          },
        },
      });

      // Right side should be a simple condition
      expect(result.right).toEqual({
        request_response_rmt: {
          status: {
            equals: 500,
          },
        },
      });
    });
  });

  describe("error cases", () => {
    it("should throw error for unknown filter type", () => {
      const unknownFilter = {
        type: "unknown_type",
        someProperty: "value",
      };

      expect(() => toFilterNode(unknownFilter)).toThrow(
        "Unknown filter type:"
      );
    });

    it("should handle unmapped operators gracefully", () => {
      const filter = {
        type: "condition",
        field: {
          table: "request_response_rmt",
          column: "status",
        },
        operator: "custom_operator",
        value: 200,
      };

      const result = toFilterNode(filter);

      // Should use the original operator if not mapped
      expect(result.request_response_rmt?.status).toHaveProperty(
        "custom_operator",
        200
      );
    });

    it("should handle boolean values", () => {
      const filter = FilterAST.condition("threat", "eq", true);
      const result = toFilterNode(filter);

      expect(result.request_response_rmt?.threat).toHaveProperty("equals", true);
    });

    it("should handle number values", () => {
      const filter = FilterAST.condition("latency", "gte", 1000.5);
      const result = toFilterNode(filter);

      expect(result.request_response_rmt?.latency).toHaveProperty("gte", 1000.5);
    });

    it("should handle string values", () => {
      const filter = FilterAST.condition("model", "contains", "gpt-4");
      const result = toFilterNode(filter);

      expect(result.request_response_rmt?.model).toHaveProperty(
        "contains",
        "gpt-4"
      );
    });

    it("should handle zero values", () => {
      const filter = FilterAST.condition("cost", "eq", 0);
      const result = toFilterNode(filter);

      expect(result.request_response_rmt?.cost).toHaveProperty("equals", 0);
    });

    it("should handle empty string values", () => {
      const filter = FilterAST.condition("model", "eq", "");
      const result = toFilterNode(filter);

      expect(result.request_response_rmt?.model).toHaveProperty("equals", "");
    });

    it("should handle false boolean values", () => {
      const filter = FilterAST.condition("threat", "eq", false);
      const result = toFilterNode(filter);

      expect(result.request_response_rmt?.threat).toHaveProperty("equals", false);
    });
  });
});
