import { TemplateVariable, ValidationError, SubstitutionResult } from './types';
export const TEMPLATE_REGEX = /\{\{\s*hc\s*:\s*([a-zA-Z_-][a-zA-Z0-9_-]*)\s*:\s*([a-zA-Z_-][a-zA-Z0-9_-]*)\s*\}\}/g;
export const BOOLEAN_VALUES = ['true', 'false', 'yes', 'no'];
export class HeliconeTemplateManager {
  /**
   * Extract all distinct variables and their types from a template string
   * @param template - The template string containing {{hc:NAME:type}} patterns
   * @returns Array of unique variables with their names and types
   */
  static extractVariables(template: string): TemplateVariable[] {
    const variables = new Map<string, TemplateVariable>();
    let match: RegExpExecArray | null;
    
    TEMPLATE_REGEX.lastIndex = 0;
    
    while ((match = TEMPLATE_REGEX.exec(template)) !== null) {
      const [fullMatch, name, type] = match;
      const trimmedName = name.trim();
      
      if (!variables.has(trimmedName)) {
        variables.set(trimmedName, {
          name: trimmedName,
          type: type.trim(),
          raw: fullMatch
        });
      }
    }
    
    return Array.from(variables.values());
  }
  
  /**
   * Check if actual type is compatible with expected type
   * @param value - The actual value to check
   * @param expectedType - The expected type from template
   * @returns True if types are compatible
   */
  private static isTypeCompatible(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return true;
      case 'number':
        return typeof value === 'number' || !isNaN(Number(value));
      case 'boolean':
        return typeof value === 'boolean' || 
          (typeof value === 'string' && BOOLEAN_VALUES.includes(value.toLowerCase()));
      default:
        return true;
    }
  }
  
  
  /**
   * Substitute variables in template with provided inputs after type validation
   * @param template - The template string containing {{hc:NAME:type}} patterns
   * @param inputs - Hash map of input values
   * @returns Result object with success status and either result string or errors
   */
  static substituteVariables(
    template: string, 
    inputs: Record<string, any>
  ): SubstitutionResult {
    const variables = this.extractVariables(template);
    const errors: ValidationError[] = [];
    
    for (const variable of variables) {
      const value = variable.name in inputs ? inputs[variable.name] : undefined;
      if (!value) {
        continue;
      }
      
      if (!this.isTypeCompatible(value, variable.type)) {
        errors.push({
          variable: variable.name,
          expected: variable.type,
          value
        });
      }
    }
    
    if (errors.length > 0) {
      return {
        success: false,
        errors
      };
    }
    
    TEMPLATE_REGEX.lastIndex = 0;
    const result = template.replace(TEMPLATE_REGEX, (match, name) => {
      const value = name.trim() in inputs ? inputs[name.trim()] : undefined;
      return value ? String(value) : match;
    });
    
    return {
      success: true,
      result
    };
  }


  private static isWholeMatch = (str: string): boolean => {
    if (typeof str !== 'string') return false;
    TEMPLATE_REGEX.lastIndex = 0;
    const match = TEMPLATE_REGEX.exec(str);
    return match !== null && match[0] === str;
  };

  private static getVariableName = (str: string): string | null => {
    if (typeof str !== 'string') return null;
    TEMPLATE_REGEX.lastIndex = 0;
    const match = TEMPLATE_REGEX.exec(str);
    return match ? match[1].trim() : null;
  };

  private static performRegexReplacement(str: string, inputs: Record<string, any>): string {
    TEMPLATE_REGEX.lastIndex = 0;
    return str.replace(TEMPLATE_REGEX, (match, name) => {
      const value = inputs[name.trim()];
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  private static processObjectKV(
    obj: any, 
    inputs: Record<string, any>, 
    errors: ValidationError[]
  ): any {
    if (typeof obj === 'string') {
      // If it's a string and wholly matches tag regex, replace with input value
      if (this.isWholeMatch(obj)) {
        const varName = this.getVariableName(obj);
        if (varName && inputs[varName] !== undefined) {
          return inputs[varName];
        }
      }
      // Otherwise, perform regex replacement
      return this.performRegexReplacement(obj, inputs);
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.processObjectKV(item, inputs, errors));
    } else if (obj !== null && typeof obj === 'object') {
      const result: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(obj)) {
        let processedKey = key;
        
        if (typeof key === 'string') {
          if (this.isWholeMatch(key)) {
            // Key wholly matches -> must be string replacement only
            const varName = this.getVariableName(key);
            if (varName && inputs[varName]) {
              const inputValue = inputs[varName];
              if (typeof inputValue === 'string') {
                processedKey = inputValue;
              } else {
                errors.push({
                  variable: varName,
                  expected: 'string',
                  value: inputValue
                });
                continue;
              }
            }
          } else {
            // Key contains template but not wholly -> regex replacement
            processedKey = this.performRegexReplacement(key, inputs);
          }
        }
        
        const processedValue = this.processObjectKV(value, inputs, errors);
        result[processedKey] = processedValue;
      }
    
      return result;
    }
    
    // For other types (number, boolean, null), return as-is
    return obj;
  }

  /**
   * Substitute variables in JSON format object with provided inputs
   * @param json - The JSON object containing "{{hc:NAME:type}}" patterns
   * @param inputs - Hash map of input values
   * @returns Result object with success status and either result object or errors
   */
  static substituteVariablesJSON(
    json: Record<string, any>, 
    inputs: Record<string, any>
  ): SubstitutionResult {
    const variables = this.extractVariables(JSON.stringify(json));
    const errors: ValidationError[] = [];

    for (const variable of variables) {
      const value = inputs[variable.name];
      
      if (!value || !this.isTypeCompatible(value, variable.type)) {
        errors.push({
          variable: variable.name,
          expected: variable.type,
          value
        });
      }
    }
    
    if (errors.length > 0) {
      return {
        success: false,
        errors
      };
    }
    
    try {
      const result = this.processObjectKV(json, inputs, errors);
      
      if (errors.length > 0) {
        return {
          success: false,
          errors
        };
      }
      
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        errors: [{
          variable: 'unknown',
          expected: 'valid',
          value: error
        }]
      };
    }
  }
  
  /**
   * Get a list of all variable names from a template (convenience method)
   * @param template - The template string
   * @returns Array of variable names
   */
  static getVariableNames(template: string): string[] {
    return this.extractVariables(template).map(v => v.name);
  }
}
