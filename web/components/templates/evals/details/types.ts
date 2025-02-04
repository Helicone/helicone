export interface Evaluator {
  id: string;
  created_at: string;
  scoring_type: string;
  llm_template: unknown;
  organization_id: string;
  updated_at: string;
  name: string;
  code_template: unknown;
  last_mile_config?: unknown;
}
