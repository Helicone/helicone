import { components } from "@/lib/clients/jawnTypes/public";

export interface TableSchema {
  table_name: string;
  columns: components["schemas"]["ClickHouseTableColumn"][];
}

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
}

export interface QueryExecutionResult {
  rows: Array<Record<string, unknown>>;
  elapsedMilliseconds: number;
  size: number;
  rowCount: number;
}

export interface MonacoEditorOptions {
  minimap: {
    enabled: boolean;
    side: "right" | "left";
    showSlider: "always" | "mouseover";
    renderCharacters: boolean;
    maxColumn: number;
  };
  fontSize: number;
  fontFamily: string;
  wordWrap: "on" | "off" | "wordWrapColumn" | "bounded";
  automaticLayout: boolean;
  scrollBeyondLastLine: boolean;
}

export interface DirectoryProps {
  tables: TableSchema[];
  currentQuery: {
    id: string | undefined;
    name: string;
    sql: string;
  };
  setCurrentQuery: React.Dispatch<
    React.SetStateAction<{
      id: string | undefined;
      name: string;
      sql: string;
    }>
  >;
  activeTab: "tables" | "queries";
  setActiveTab: React.Dispatch<React.SetStateAction<"tables" | "queries">>;
}

export interface TableListProps {
  tables: TableSchema[];
}

export interface QueryListProps {
  queries: components["schemas"]["HqlSavedQuery"][];
  isLoading: boolean;
  currentQuery: {
    id: string | undefined;
    name: string;
    sql: string;
  };
  setCurrentQuery: React.Dispatch<
    React.SetStateAction<{
      id: string | undefined;
      name: string;
      sql: string;
    }>
  >;
}

export interface TableColumn {
  name: string;
  type: string;
}