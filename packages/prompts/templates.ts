import { TemplateVariable, ValidationError, SubstitutionResult } from './types';

export class HeliconeTemplateManager {
  private static readonly TEMPLATE_REGEX = /\{\{\s*hc\s*:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
  
  /**
   * Extract all distinct variables and their types from a template string
   * @param template - The template string containing {{hc:NAME:type}} patterns
   * @returns Array of unique variables with their names and types
   */
  static extractVariables(template: string): TemplateVariable[] {
    const variables = new Map<string, TemplateVariable>();
    let match;
    
    this.TEMPLATE_REGEX.lastIndex = 0;
    
    while ((match = this.TEMPLATE_REGEX.exec(template)) !== null) {
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
          actual: 'undefined',
          value
        });
        continue;
      }
      
      const actualType = this.getValueType(value);
      if (!this.isTypeCompatible(actualType, variable.type)) {
        errors.push({
          variable: variable.name,
          expected: variable.type,
          actual: actualType,
          value
        });
      }
    }
    
    return errors;
  }
  
  /**
   * Get the type of a value
   * @param value - The value to check
   * @returns String representation of the type
   */
  private static getValueType(value: any): string {
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }
  
  /**
   * Check if actual type is compatible with expected type
   * @param actualType - The actual type of the value
   * @param expectedType - The expected type from template
   * @returns True if types are compatible
   */
  private static isTypeCompatible(actualType: string, expectedType: string): boolean {
    // Exact match
    if (actualType === expectedType) return true;
    
    switch (expectedType.toLowerCase()) {
      case 'string':
        return ['string', 'number', 'boolean'].includes(actualType);
      
      case 'number':
        return actualType === 'number';
      
      case 'boolean':
        return actualType === 'boolean';
      
      case 'object':
        return actualType === 'object';
      
      default:
        return actualType === expectedType;
    }
  }
  
  /**
   * Convert value to string for substitution
   * @param value - The value to convert
   * @param expectedType - The expected type for proper formatting
   * @returns String representation of the value
   */
  private static valueToString(value: any, expectedType: string): string {
    switch (expectedType.toLowerCase()) {
      case 'string':
        return String(value);
      
      case 'number':
        return String(value);
      
      case 'boolean':
        return String(value);
      
      case 'object':
        return typeof value === 'object' ? JSON.stringify(value) : String(value);
      
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
    this.TEMPLATE_REGEX.lastIndex = 0;
    
    result = result.replace(this.TEMPLATE_REGEX, (match, name, type) => {
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
