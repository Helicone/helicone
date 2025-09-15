export function formatHQL(query: string): string {
  if (!query || query.trim().length === 0) {
    return query;
  }

  const keywords = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "JOIN",
    "INNER JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "FULL JOIN",
    "CROSS JOIN",
    "ON",
    "AND",
    "OR",
    "NOT",
    "IN",
    "EXISTS",
    "BETWEEN",
    "LIKE",
    "IS",
    "NULL",
    "AS",
    "DISTINCT",
    "ALL",
    "UNION",
    "INTERSECT",
    "EXCEPT",
    "WITH",
    "CASE",
    "WHEN",
    "THEN",
    "ELSE",
    "END",
    "PARTITION BY",
    "OVER",
    "INSERT",
    "INTO",
    "VALUES",
    "UPDATE",
    "SET",
    "DELETE",
    "CREATE",
    "DROP",
    "ALTER",
    "TABLE",
    "INDEX",
    "VIEW",
    "TRUNCATE",
    "REPLACE",
    "INTERVAL",
    "DAY",
    "MONTH",
    "YEAR",
    "HOUR",
    "MINUTE",
    "SECOND",
    "COUNT",
    "SUM",
    "AVG",
    "MIN",
    "MAX",
  ];

  const majorClauses = [
    "SELECT",
    "FROM",
    "WHERE",
    "GROUP BY",
    "HAVING",
    "ORDER BY",
    "LIMIT",
    "JOIN",
    "INNER JOIN",
    "LEFT JOIN",
    "RIGHT JOIN",
    "FULL JOIN",
    "CROSS JOIN",
    "UNION",
    "INTERSECT",
    "EXCEPT",
    "WITH",
  ];

  const subClauses = ["AND", "OR"];

  let formatted = query.trim();

  // Normalize whitespace (but preserve single spaces)
  formatted = formatted.replace(/\s+/g, " ");

  // Convert keywords to uppercase (but be careful with operators)
  keywords.forEach((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    formatted = formatted.replace(regex, keyword);
  });

  // Handle opening parentheses for subqueries
  formatted = formatted.replace(/\(\s*SELECT/gi, "(\n  SELECT");

  // Add line breaks for major clauses
  majorClauses.forEach((clause) => {
    const regex = new RegExp(`\\s+(${clause})\\s+`, "gi");
    formatted = formatted.replace(regex, "\n$1 ");
  });

  // Add line breaks and indentation for sub-clauses
  subClauses.forEach((clause) => {
    const regex = new RegExp(`\\s+(${clause})\\s+`, "gi");
    formatted = formatted.replace(regex, "\n  $1 ");
  });

  // Split into lines for further processing
  let lines = formatted.split("\n");
  let formattedLines: string[] = [];
  let indentLevel = 0;
  let inSelect = false;
  let selectFields: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (line.length === 0) continue;

    // Check if we're starting a subquery
    if (line.startsWith("(")) {
      // If we have pending select fields, add them first
      if (selectFields.length > 0) {
        selectFields.forEach((field, index) => {
          const comma = index < selectFields.length - 1 ? "," : "";
          formattedLines.push("  ".repeat(indentLevel) + "  " + field + comma);
        });
        selectFields = [];
        inSelect = false;
      }
      formattedLines.push("  ".repeat(indentLevel) + line);
      indentLevel++;
      continue;
    }

    // Check if we're ending a subquery
    if (line.startsWith(")")) {
      // If we have pending select fields, add them first
      if (selectFields.length > 0) {
        selectFields.forEach((field, index) => {
          const comma = index < selectFields.length - 1 ? "," : "";
          formattedLines.push("  ".repeat(indentLevel) + "  " + field + comma);
        });
        selectFields = [];
        inSelect = false;
      }
      indentLevel = Math.max(0, indentLevel - 1);
      formattedLines.push("  ".repeat(indentLevel) + line);
      continue;
    }

    // Check if this is a SELECT statement
    if (line.startsWith("SELECT")) {
      // Extract the part after SELECT on the same line
      const afterSelect = line.substring(6).trim();
      if (afterSelect) {
        // Parse comma-separated fields
        const fields = afterSelect.split(/,(?![^()]*\))/);
        selectFields = fields.map((f) => f.trim()).filter((f) => f);
        formattedLines.push("  ".repeat(indentLevel) + "SELECT");
        inSelect = true;
      } else {
        formattedLines.push("  ".repeat(indentLevel) + line);
        inSelect = true;
      }
      continue;
    }

    // Check if this is a major clause (which ends the SELECT list)
    const startsWithMajorClause = majorClauses.some(
      (clause) => line.toUpperCase().startsWith(clause) && clause !== "SELECT",
    );

    if (startsWithMajorClause) {
      // If we have pending select fields, add them first
      if (selectFields.length > 0) {
        selectFields.forEach((field, index) => {
          const comma = index < selectFields.length - 1 ? "," : "";
          formattedLines.push("  ".repeat(indentLevel) + "  " + field + comma);
        });
        selectFields = [];
      }
      inSelect = false;
      formattedLines.push("  ".repeat(indentLevel) + line);
      continue;
    }

    // Check if this is a sub-clause (AND/OR)
    const startsWithSubClause = subClauses.some((clause) =>
      line.toUpperCase().startsWith(clause),
    );

    if (startsWithSubClause) {
      formattedLines.push("  ".repeat(indentLevel) + "  " + line);
      continue;
    }

    // Handle field lists in SELECT
    if (inSelect) {
      // This line contains select fields
      const fields = line.split(/,(?![^()]*\))/);
      fields.forEach((field) => {
        const trimmed = field.trim();
        if (trimmed) {
          selectFields.push(trimmed);
        }
      });
      continue;
    }

    // Default case
    formattedLines.push("  ".repeat(indentLevel) + line);
  }

  // Handle any remaining select fields
  if (selectFields.length > 0) {
    selectFields.forEach((field, index) => {
      const comma = index < selectFields.length - 1 ? "," : "";
      formattedLines.push("  ".repeat(indentLevel) + "  " + field + comma);
    });
  }

  // Join the lines
  formatted = formattedLines.join("\n");

  // Clean up any duplicate line breaks
  formatted = formatted.replace(/\n\n+/g, "\n");

  // Clean up any trailing spaces
  formatted = formatted.replace(/\s+\n/g, "\n");
  formatted = formatted.replace(/\n\s*\n/g, "\n");

  return formatted.trim();
}
