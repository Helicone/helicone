import { components } from "@/lib/clients/jawnTypes/public";

export interface TableColumn {
  name: string;
  type: string;
}

export interface TableSchema {
  table_name: string;
  columns: components["schemas"]["ClickHouseTableColumn"][];
}

export type MonacoEditorOptions = {
  minimap?: {
    enabled?: boolean;
    side?: "right" | "left";
    showSlider?: "always" | "mouseover";
    renderCharacters?: boolean;
    maxColumn?: number;
  };
  fontSize?: number;
  fontFamily?: string;
  wordWrap?: "on" | "off" | "bounded" | "wordWrapColumn";
  automaticLayout?: boolean;
  scrollBeyondLastLine?: boolean;
};

export interface QueryState {
  id?: string;
  name: string;
  sql: string;
}


