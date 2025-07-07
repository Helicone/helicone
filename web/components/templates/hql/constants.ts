import { components } from "@/lib/clients/jawnTypes/public";

export const SQL_KEYWORDS = [
  "SELECT",
  "FROM",
  "WHERE",
  "GROUP BY",
  "ORDER BY",
  "HAVING",
  "JOIN",
  "INNER JOIN",
  "LEFT JOIN",
  "RIGHT JOIN",
  "FULL JOIN",
  "ON",
  "AS",
  "AND",
  "OR",
  "NOT",
  "IN",
  "EXISTS",
  "BETWEEN",
  "LIKE",
  "IS",
  "NULL",
  "DISTINCT",
  "LIMIT",
  "OFFSET",
  "UNION",
  "UNION ALL",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "CAST",
  "COALESCE",
];

export const CLICKHOUSE_KEYWORDS = [
  "FINAL",
  "SAMPLE",
  "PREWHERE",
  "ARRAY JOIN",
  "GLOBAL",
  "uniq",
  "groupArray",
  "arrayJoin",
  "toStartOfHour",
  "toStartOfDay",
  "toStartOfMonth",
  "today",
  "yesterday",
  "now",
  "formatDateTime",
  "toString",
  "toDate",
  "toDateTime",
  "splitByChar",
  "arrayMap",
];

export const ALL_KEYWORDS = [...SQL_KEYWORDS, ...CLICKHOUSE_KEYWORDS];

export const getTableNames = (
  schemas: {
    table_name: string;
    columns: components["schemas"]["ClickHouseTableColumn"][];
  }[],
) => Array.from(new Set(schemas?.map((d) => d.table_name) ?? []));

export const getTableNamesSet = (
  schemas: {
    table_name: string;
    columns: components["schemas"]["ClickHouseTableColumn"][];
  }[],
) => new Set(getTableNames(schemas));

export function parseSqlAndFindTableNameAndAliases(sql: string) {
  const regex =
    /\b(?:FROM|JOIN)\s+([^\s.]+(?:\.[^\s.]+)?)\s*(?:AS)?\s*([^\s,]+)?/gi;
  const tables = [];
  while (true) {
    const match = regex.exec(sql);
    if (!match) break;
    const table_name = match[1];
    if (!/\(/.test(table_name)) {
      let alias = match[2] as string | null;
      if (alias && /on|where|inner|left|right|join/.test(alias)) {
        alias = null;
      }
      tables.push({ table_name, alias: alias || table_name });
    }
  }
  return tables;
}
