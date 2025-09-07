import { MonacoEditorOptions } from "./types";

export const DEFAULT_QUERY_SQL = "select * from request_response_rmt";
export const DEFAULT_QUERY_NAME = "Untitled query";

export const RESIZABLE_PANEL_SIZES = {
  sidebar: {
    default: 25,
    min: 18,
    max: 40,
  },
  main: {
    default: 80,
  },
  editor: {
    default: 75,
    min: 20,
  },
  results: {
    default: 25,
    collapsed: 10,
  },
} as const;

export const MONACO_EDITOR_OPTIONS: MonacoEditorOptions = {
  minimap: {
    enabled: true,
    side: "right",
    showSlider: "mouseover",
    renderCharacters: false,
    maxColumn: 80,
  },
  fontSize: 14,
  fontFamily: '"Fira Code", "Fira Mono", monospace',
  wordWrap: "on",
  automaticLayout: true,
  scrollBeyondLastLine: false,
};

export const SQL_WRITE_OPERATIONS_REGEX = 
  /\b(insert|update|delete|drop|alter|create|truncate|replace)\b/i;

export const SQL_VALIDATION_ERROR_MESSAGE = 
  "Only read (SELECT) queries are allowed. Write operations are not permitted.";

export const QUERY_RESULT_LIMIT = 100;

export const HQL_WAITLIST_FORM_URL = "https://forms.gle/YXYkFz9Zaa7fWF2v7";