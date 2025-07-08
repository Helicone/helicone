import { TemplateVariable, ValidationError, SubstitutionResult } from './types';

export const TEMPLATE_REGEX = /\{\{\s*hc\s*:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
export const BOOLEAN_VALUES = ['true', 'false', 'yes', 'no'];
export class HeliconeTemplateManager {
  /**
   * Extract all distinct variables and their types from a template string
   * @param template - The template string containing {{hc:NAME:type}} patterns
   * @returns Array of unique variables with their names and types
   */
  static extractVariables(template: string): TemplateVariable[] {
    const variables = new Map<string, TemplateVariable>();
    let match;
    
    TEMPLATE_REGEX.lastIndex = 0;
    
    while ((match = TEMPLATE_REGEX.exec(template)) !== null) {
      const [fullMatch, name, type] = match;
      
      if (!variables.has(name)) {
        variables.set(name, {
          name: name.trim(),
          type: type.trim(),
          raw: fullMatch
        });
      }
    }
    
    return Array.from(variables.values());
  }
  
  /**
   * Validate that input values match the expected types
   * @param variables - Array of template variables with their expected types
   * @param inputs - Hash map of input values
   * @returns Array of validation errors (empty if all valid)
   */
  private static validateTypes(
    variables: TemplateVariable[], 
    inputs: Record<string, any>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    for (const variable of variables) {
      const value = inputs[variable.name];
      
      if (value === undefined || value === null) {
        errors.push({
          variable: variable.name,
          expected: variable.type,
          value
        });
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
    
    return errors;
  }
  
  
  /**
   * Check if actual type is compatible with expected type
   * @param actualType - The actual type of the value
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
   * Convert value to string for substitution
   * @param value - The value to convert
   * @param expectedType - The expected type for proper formatting
   * @returns String representation of the value
   */
  private static valueToString(value: any, expectedType: string): string {
    switch (expectedType) {
      case 'string':
        return String(value);
      
      case 'number':
        return String(value);
      
      case 'boolean':
        return String(value);
      
      default:
        return String(value);
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
    const validationErrors = this.validateTypes(variables, inputs);
    
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors
      };
    }
    
    let result = template;
    TEMPLATE_REGEX.lastIndex = 0;
    
    result = result.replace(TEMPLATE_REGEX, (match, name, type) => {
      const value = inputs[name.trim()];
      if (value !== undefined && value !== null) {
        return this.valueToString(value, type.trim());
      }
      return match;
    });
    
    return {
      success: true,
      result
    };
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
