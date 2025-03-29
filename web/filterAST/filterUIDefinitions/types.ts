import { FieldSpec, FilterOperator } from "../filterAst";

// Define the type for the UI rendering constants
export interface FilterUIDefinition {
  id: string;
  label: string;
  table: FieldSpec["table"];
  type: "string" | "number" | "boolean" | "datetime" | "select" | "searchable";
  subType?: "property" | "score" | "sessions" | "user";
  operators: FilterOperator[];
  valueOptions?: { label: string; value: string | number | boolean }[];
  // Callback for dynamic searching of options
  onSearch?: (
    searchTerm: string
  ) => Promise<{ label: string; value: string | number | boolean }[]>;
}

// Mock API responses for dynamic data
export interface DynamicFilterOptions {
  models: { label: string; value: string }[];
  providers: { label: string; value: string }[];
  countryCodes: { label: string; value: string }[];
  propertyKeys: { label: string; value: string }[];
  scoreKeys: { label: string; value: string }[];
}
