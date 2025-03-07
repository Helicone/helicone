import { MappedLLMRequest } from "../types";
import { PathMapping } from "./builder";

// Core mapping definition - just paths
export interface PathPair {
  external: string;
  internal: string;
}

// Optional transformer for complex cases
export interface ValueTransformer {
  toInternal: (value: any) => any;
  toExternal: (value: any) => any;
}

// Enhanced mapping with optional transformer
export interface EnhancedPathPair extends PathPair {
  transform?: ValueTransformer;
  description?: string; // Documentation for this mapping
}

/**
 * Core PathMapper class that handles transforming between external and internal formats
 */
export class PathMapper<
  ExternalType,
  InternalType extends MappedLLMRequest = MappedLLMRequest
> {
  constructor(private name: string, private mappings: PathMapping[]) {}

  /**
   * Transforms from external API format to internal Helicone format
   */
  toInternal(external: ExternalType): InternalType {
    // Initialize the internal object with default empty values
    const internal: MappedLLMRequest = {
      _type: "unknown",
      id: "",
      schema: { request: {} },
      preview: { request: "", response: "", concatenatedMessages: [] },
      model: "",
      raw: {
        request: external,
        response: null,
      },
      heliconeMetadata: {
        requestId: "",
        path: "",
        countryCode: null,
        createdAt: new Date().toISOString(),
        totalTokens: null,
        promptTokens: null,
        completionTokens: null,
        latency: null,
        user: null,
        status: {
          code: 200,
          statusType: "success",
        },
        customProperties: null,
        cost: null,
        feedback: {
          createdAt: null,
          id: null,
          rating: null,
        },
        provider: "CUSTOM",
      },
    };

    // Apply each mapping
    for (const mapping of this.mappings) {
      const {
        external: externalPath,
        internal: internalPath,
        transform,
      } = mapping;

      // Get the value from the external object
      const externalValue = this.getValueByPath(external, externalPath);

      if (externalValue !== undefined) {
        // Apply transformation if provided
        const valueToSet = transform
          ? transform.toInternal(externalValue)
          : externalValue;

        // Set the value in the internal object
        this.setValueByPath(internal, internalPath, valueToSet);
      }
    }

    return internal as InternalType;
  }

  /**
   * Transforms from internal Helicone format to external API format
   */
  toExternal(internal: InternalType): ExternalType {
    const external = {} as ExternalType;

    // Apply each mapping in reverse
    for (const mapping of this.mappings) {
      const {
        external: externalPath,
        internal: internalPath,
        transform,
      } = mapping;

      // Get the value from the internal object
      const internalValue = this.getValueByPath(internal, internalPath);

      if (internalValue !== undefined) {
        // Apply transformation if provided
        const valueToSet = transform
          ? transform.toExternal(internalValue)
          : internalValue;

        // Set the value in the external object
        this.setValueByPath(external, externalPath, valueToSet);
      }
    }

    return external;
  }

  /**
   * Gets a value from an object by a path string
   * e.g. "user.name" -> obj.user.name
   */
  private getValueByPath(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    const pathParts = this.parsePath(path);
    let current = obj;

    for (const part of pathParts) {
      if (current === undefined || current === null) return undefined;

      if (part.type === "property") {
        current = current[part.name];
      } else if (part.type === "array" && part.index !== undefined) {
        // If index is empty string, just return the array itself
        if (part.index === "") {
          // No op - keep current as is
          continue;
        }

        // Try to parse as a number first for array access
        const numericIndex = !isNaN(Number(part.index))
          ? parseInt(part.index, 10)
          : part.index;

        if (Array.isArray(current)) {
          if (typeof numericIndex === "number" && !isNaN(numericIndex)) {
            current = current[numericIndex];
          } else {
            return undefined; // Non-numeric index for an array
          }
        } else if (current && typeof current === "object") {
          // Allow object property access with brackets too
          current = current[part.index];
        } else {
          return undefined;
        }
      }
    }

    return current;
  }

  /**
   * Sets a value in an object by a path string
   * e.g. "user.name" -> obj.user.name = value
   */
  private setValueByPath(obj: any, path: string, value: any): void {
    if (!obj || !path) return;

    const pathParts = this.parsePath(path);
    let current = obj;

    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      const nextPart = pathParts[i + 1];

      if (part.type === "property") {
        if (current[part.name] === undefined || current[part.name] === null) {
          // Create next object based on next part's type
          current[part.name] = nextPart.type === "array" ? [] : {};
        }
        current = current[part.name];
      } else if (part.type === "array" && part.index !== undefined) {
        // If index is empty string, just use the current array
        if (part.index === "") {
          continue;
        }

        // Try to parse as a number first for array access
        const numericIndex = !isNaN(Number(part.index))
          ? parseInt(part.index, 10)
          : part.index;

        if (Array.isArray(current)) {
          if (typeof numericIndex === "number" && !isNaN(numericIndex)) {
            if (
              current[numericIndex] === undefined ||
              current[numericIndex] === null
            ) {
              current[numericIndex] = nextPart.type === "array" ? [] : {};
            }
            current = current[numericIndex];
          }
        } else if (current && typeof current === "object") {
          // Allow object property access with brackets too
          if (
            current[part.index] === undefined ||
            current[part.index] === null
          ) {
            current[part.index] = nextPart.type === "array" ? [] : {};
          }
          current = current[part.index];
        }
      }
    }

    // Set the last property
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart.type === "property") {
      current[lastPart.name] = value;
    } else if (lastPart.type === "array" && lastPart.index !== undefined) {
      // If index is empty string, we're trying to set the whole array
      if (lastPart.index === "") {
        if (Array.isArray(value)) {
          // We could choose to either:
          // 1. Replace the entire array (current = value)
          // 2. Push all elements (for (const item of value) current.push(item))
          // For consistency with common JS behaviors, we'll replace:
          Object.assign(current, value);
        }
        return;
      }

      // Try to parse as a number first for array access
      const numericIndex = !isNaN(Number(lastPart.index))
        ? parseInt(lastPart.index, 10)
        : lastPart.index;

      if (Array.isArray(current)) {
        if (typeof numericIndex === "number" && !isNaN(numericIndex)) {
          current[numericIndex] = value;
        }
      } else if (current && typeof current === "object") {
        // Allow object property access with brackets too
        current[lastPart.index] = value;
      }
    }
  }

  /**
   * Parse a path string into parts
   * e.g. "users[0].name" -> [{type: "property", name: "users"}, {type: "array", name: "0", index: "0"}, {type: "property", name: "name"}]
   */
  private parsePath(path: string): Array<{
    type: "property" | "array";
    name: string;
    index?: string;
  }> {
    if (!path) return [];

    const result: Array<{
      type: "property" | "array";
      name: string;
      index?: string;
    }> = [];

    // First, split the path by dots outside of brackets
    const segments: string[] = [];
    let currentSegment = "";
    let bracketDepth = 0;

    for (let i = 0; i < path.length; i++) {
      const char = path[i];
      if (char === "[") {
        bracketDepth++;
        currentSegment += char;
      } else if (char === "]") {
        bracketDepth--;
        currentSegment += char;
      } else if (char === "." && bracketDepth === 0) {
        segments.push(currentSegment);
        currentSegment = "";
      } else {
        currentSegment += char;
      }
    }

    if (currentSegment) {
      segments.push(currentSegment);
    }

    // Process each segment for property and array parts
    for (const segment of segments) {
      if (!segment) continue;

      // Extract all array accesses within this segment
      let propertyName = segment;
      let bracketIndex = propertyName.indexOf("[");

      if (bracketIndex === -1) {
        // Simple property with no array access
        result.push({ type: "property", name: propertyName });
        continue;
      }

      // Add the property name first
      result.push({
        type: "property",
        name: propertyName.substring(0, bracketIndex),
      });

      // Process all array bracket pairs in this segment
      const bracketPattern = /\[([^[\]]*)\]/g;
      let bracketMatch;

      while ((bracketMatch = bracketPattern.exec(segment)) !== null) {
        const indexValue = bracketMatch[1];
        // Handle empty index case (e.g., "array[]")
        if (indexValue === "") {
          result.push({ type: "array", name: "", index: "" });
        } else {
          result.push({ type: "array", name: indexValue, index: indexValue });
        }
      }
    }

    return result;
  }

  /**
   * Get the name of this mapper
   */
  get mapperName(): string {
    return this.name;
  }

  /**
   * Get the path pairs defined in this mapper
   */
  get pathPairs(): PathMapping[] {
    return [...this.mappings];
  }
}
