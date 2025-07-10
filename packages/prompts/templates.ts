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
      const value = inputs[variable.name];
      
      if (value === undefined || value === null || !this.isTypeCompatible(value, variable.type)) {
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
      const value = inputs[name.trim()];
      return value ? String(value) : match;
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
