import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_TS_PATH = path.join(__dirname, "src/types/public.ts");
const OUTPUT_PATH = path.join(__dirname, "src/types/flat.ts");

// Root types we want to flatten
const ROOT_TYPES = [
  "RequestFilterNode",
  "SessionFilterNode",
  "SortLeafRequest",
];

// Additional types needed for proper schema generation
const ADDITIONAL_TYPES_TO_FLATTEN = [
  "SortDirection",
  "RequestFilterBranch",
  "SessionFilterBranch",
];

// Track visited types to avoid infinite loops
const visitedTypes = new Set<string>();
const typeDefinitions = new Map<string, string>();

function readPublicTs(): string {
  return fs.readFileSync(PUBLIC_TS_PATH, "utf-8");
}

function extractTypeDefinition(content: string, typeName: string): string | null {
  // Find the type definition in the schemas interface
  // Look for: typeName: <something>;  where something ends at ; or ,
  // Use a more precise regex to avoid matching inside comments or strings
  const searchRegex = new RegExp(`\\s${typeName}:\\s`);
  let match = searchRegex.exec(content);

  // If we found a match, verify it's in the schemas context (after "schemas" property)
  while (match) {
    const beforeMatch = content.substring(Math.max(0, match.index - 500), match.index);
    // Check if we're in the schemas section
    if (beforeMatch.includes('schemas:') || beforeMatch.includes('"schemas"')) {
      break;
    }
    // Try next match
    const nextSearchIndex = match.index! + 1;
    match = null;
    const nextMatch = searchRegex.exec(content.substring(nextSearchIndex));
    if (nextMatch) {
      match = {
        0: nextMatch[0],
        index: nextSearchIndex + nextMatch.index,
        groups: nextMatch.groups,
        input: nextMatch.input,
        length: nextMatch.length,
      } as RegExpExecArray;
    }
  }

  if (!match) {
    return null;
  }
  const colonIndex = match.index! + match[0].indexOf(':');

  const startIndex = colonIndex + typeName.length + 1; // After the ":"
  let depth = 0;
  let endIndex = startIndex;
  let inString = false;
  let stringChar = '';

  // Scan forward until we find the terminator (;, or ,) at depth 0
  while (endIndex < content.length) {
    const char = content[endIndex];

    // Handle strings
    if ((char === '"' || char === "'") && content[endIndex - 1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
    }

    if (!inString) {
      if (char === '{' || char === '[') {
        depth++;
      } else if (char === '}' || char === ']') {
        depth--;
      } else if ((char === ';' || char === ',') && depth === 0) {
        // Found the end
        break;
      }
    }

    endIndex++;
  }

  const typeContent = content.substring(startIndex, endIndex).trim();

  // Check if it's a reference to another type that needs resolving
  if (typeContent.startsWith('components["schemas"]["')) {
    const match = typeContent.match(/components\["schemas"\]\["([^"]+)"\]/);
    if (match) {
      return extractTypeDefinition(content, match[1]);
    }
  }

  // Return the definition
  return `type ${typeName} = ${typeContent};`;
}

function extractNestedTypeNames(definition: string): string[] {
  const types: string[] = [];

  // Find components["schemas"]["TypeName"] patterns
  const componentRegex = /components\["schemas"\]\["([^"]+)"\]/g;
  let match;
  while ((match = componentRegex.exec(definition)) !== null) {
    types.push(match[1]);
  }

  // Find direct type references (PascalCase identifiers that look like types)
  const typeRefRegex = /(?::\s*|<\s*|extends\s+|=\s*)([A-Z][a-zA-Z0-9_]*)\s*(?:[,;}]|>|&|\|)/g;
  while ((match = typeRefRegex.exec(definition)) !== null) {
    const potentialType = match[1];
    // Filter out keywords and common names
    if (
      ![
        "Record",
        "Partial",
        "Pick",
        "Omit",
        "Extract",
        "Exclude",
        "Array",
      ].includes(potentialType)
    ) {
      types.push(potentialType);
    }
  }

  return [...new Set(types)];
}

function flattenType(
  content: string,
  typeName: string,
  depth: number = 0
): void {
  if (visitedTypes.has(typeName) || depth > 50) {
    return;
  }

  visitedTypes.add(typeName);
  const definition = extractTypeDefinition(content, typeName);

  if (!definition) {
    console.warn(`Could not find type definition for: ${typeName}`);
    return;
  }

  // Replace components["schemas"]["X"] with X in the definition
  const flattenedDef = definition.replace(
    /components\["schemas"\]\["([^"]+)"\]/g,
    (_, nestedType) => {
      // Recursively flatten nested types
      flattenType(content, nestedType, depth + 1);
      return nestedType;
    }
  );

  typeDefinitions.set(typeName, flattenedDef);

  // Find and process nested types
  const nestedTypes = extractNestedTypeNames(definition);
  for (const nestedType of nestedTypes) {
    if (!visitedTypes.has(nestedType)) {
      flattenType(content, nestedType, depth + 1);
    }
  }
}

function generateOutput(): string {
  const lines: string[] = [
    "/**",
    " * This file is auto-generated by flatten-types.ts",
    " * It flattens the nested components types for use with ts-to-zod",
    " * Do not edit manually",
    " */",
    "",
  ];

  // Add definitions in dependency order (simple approach: sorted by dependencies)
  const sorted = topologicalSort(typeDefinitions);

  for (const typeName of sorted) {
    const def = typeDefinitions.get(typeName);
    if (def) {
      lines.push(def);
      lines.push("");
    }
  }

  return lines.join("\n");
}

function topologicalSort(
  defs: Map<string, string>
): string[] {
  const result: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(typeName: string) {
    if (visited.has(typeName)) return;
    if (visiting.has(typeName)) return; // Cycle detected, skip

    visiting.add(typeName);
    const def = defs.get(typeName);

    if (def) {
      // Find dependencies in this definition
      const depRegex = /:\s*([A-Z][a-zA-Z0-9_]*)\s*(?:[,;}]|<|>|&|\|)/g;
      let match;
      while ((match = depRegex.exec(def)) !== null) {
        const dep = match[1];
        if (defs.has(dep) && !visited.has(dep)) {
          visit(dep);
        }
      }
    }

    visiting.delete(typeName);
    visited.add(typeName);
    result.push(typeName);
  }

  for (const typeName of defs.keys()) {
    visit(typeName);
  }

  return result;
}

function main() {
  console.log("📖 Reading public.ts...");
  const content = readPublicTs();

  console.log("🔍 Flattening types...");
  for (const rootType of ROOT_TYPES) {
    flattenType(content, rootType);
  }
  for (const additionalType of ADDITIONAL_TYPES_TO_FLATTEN) {
    if (!visitedTypes.has(additionalType)) {
      flattenType(content, additionalType);
    }
  }

  console.log(`✅ Found ${typeDefinitions.size} types`);
  console.log("📝 Generating output...");
  const output = generateOutput();

  fs.writeFileSync(OUTPUT_PATH, output);
  console.log(`✨ Generated: ${OUTPUT_PATH}`);
  console.log(`   Types included: ${Array.from(typeDefinitions.keys()).sort().join(", ")}`);
}

try {
  main();
} catch (err: any) {
  console.error("❌ Error:", err);
  process.exit(1);
}
