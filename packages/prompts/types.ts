export interface TemplateVariable {
  name: string;
  type: string;
  raw: string;
}

export interface ValidationError {
  variable: string;
  expected: string;
  actual: string;
  value: any;
}

export interface SubstitutionResult {
  success: boolean;
  result?: string;
  errors?: ValidationError[];
}
