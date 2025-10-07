const { Project, SyntaxKind } = require('ts-morph');

/**
 * Extract CreateChatCompletionRequest and all its dependencies from the generated OpenAPI file
 */
async function extractChatCompletionTypes() {
  // Initialize ts-morph project
  const project = new Project();

  // Add the generated file
  const sourceFile = project.addSourceFileAtPath('./openai.chat.zod.ts');

  // Track all dependencies we need to extract
  const dependencies = new Set();

  // Find all variable declarations (Zod schemas) and type aliases
  const variableDeclarations = sourceFile.getVariableDeclarations();
  const typeAliases = sourceFile.getTypeAliases();

  // Create maps for quick lookup
  const zodSchemas = new Map();
  const typeDefinitions = new Map();

  variableDeclarations.forEach(decl => {
    zodSchemas.set(decl.getName(), decl);
  });

  typeAliases.forEach(alias => {
    typeDefinitions.set(alias.getName(), alias);
  });

  // Helper function to find identifiers in AST nodes
  function findIdentifiersInNode(node) {
    const identifiers = new Set();

    node.forEachDescendant((descendant) => {
      if (descendant.getKind() === SyntaxKind.Identifier) {
        const name = descendant.getText();
        // Only include identifiers that start with capital letter (likely type/schema names)
        if (/^[A-Z][a-zA-Z0-9_]*$/.test(name)) {
          identifiers.add(name);
        }
      }
    });

    return identifiers;
  }

  // Recursively find dependencies
  function findDependencies(name, visited = new Set()) {
    if (visited.has(name)) return;
    visited.add(name);
    dependencies.add(name);

    // Check Zod schema dependencies
    const zodSchema = zodSchemas.get(name);
    if (zodSchema) {
      const initializer = zodSchema.getInitializer();
      if (initializer) {
        const referencedNames = findIdentifiersInNode(initializer);
        referencedNames.forEach(refName => {
          if (refName !== name && (zodSchemas.has(refName) || typeDefinitions.has(refName))) {
            findDependencies(refName, visited);
          }
        });
      }
    }

    // Check type alias dependencies
    const typeAlias = typeDefinitions.get(name);
    if (typeAlias) {
      const typeNode = typeAlias.getTypeNode();
      if (typeNode) {
        const referencedNames = findIdentifiersInNode(typeNode);
        referencedNames.forEach(refName => {
          if (refName !== name && (zodSchemas.has(refName) || typeDefinitions.has(refName))) {
            findDependencies(refName, visited);
          }
        });
      }
    }
  }

  // Start with CreateChatCompletionRequest
  findDependencies('CreateChatCompletionRequest');

  console.log(`Found ${dependencies.size} dependencies:`, Array.from(dependencies).sort());

  // Extract all dependencies in dependency order using topological sort
  const sortedDependencies = [];
  const processed = new Set();

  function addDependency(name) {
    if (processed.has(name)) return;

    const zodSchema = zodSchemas.get(name);
    const typeAlias = typeDefinitions.get(name);

    // First, add all dependencies of this declaration
    if (zodSchema) {
      const initializer = zodSchema.getInitializer();
      if (initializer) {
        const referencedNames = findIdentifiersInNode(initializer);
        referencedNames.forEach(refName => {
          if (refName !== name && dependencies.has(refName) && !processed.has(refName)) {
            addDependency(refName);
          }
        });
      }
      sortedDependencies.push({ type: 'zod', name, declaration: zodSchema });
      processed.add(name);
    } else if (typeAlias) {
      const typeNode = typeAlias.getTypeNode();
      if (typeNode) {
        const referencedNames = findIdentifiersInNode(typeNode);
        referencedNames.forEach(refName => {
          if (refName !== name && dependencies.has(refName) && !processed.has(refName)) {
            addDependency(refName);
          }
        });
      }
      sortedDependencies.push({ type: 'type', name, declaration: typeAlias });
      processed.add(name);
    }
  }

  // Process all dependencies, starting with types first, then Zod schemas
  const typeNames = Array.from(dependencies).filter(name => typeDefinitions.has(name));
  const zodNames = Array.from(dependencies).filter(name => zodSchemas.has(name));

  typeNames.forEach(dep => addDependency(dep));
  zodNames.forEach(dep => addDependency(dep));

  // Generate the output file
  let output = `import { z } from "zod";\n\n`;

  // Add type aliases first
  sortedDependencies
    .filter(dep => dep.type === 'type')
    .forEach(({ declaration }) => {
      output += `${declaration.getText()};\n`;
    });

  output += '\n';

  // Add Zod schemas
  sortedDependencies
    .filter(dep => dep.type === 'zod')
    .forEach(({ name, declaration }) => {
      const initializer = declaration.getInitializer().getText();
      const typeAnnotation = declaration.getTypeNode();

      if (typeAnnotation) {
        // Remove the self-referencing type annotation (z.ZodType<TypeName>)
        // and just use type inference from Zod
        output += `const ${name} = ${initializer};\n`;
      } else {
        output += `const ${name} = ${initializer};\n`;
      }
    });

  // Add export for CreateChatCompletionRequest
  output += `\nexport { CreateChatCompletionRequest };\n`;

  return output;
}

// Run the extraction
extractChatCompletionTypes()
  .then(output => {
    const fs = require('fs');
    fs.writeFileSync('./chat-completion-types.ts', output);
    console.log('✅ Successfully extracted CreateChatCompletionRequest and dependencies to chat-completion-types.ts');
  })
  .catch(console.error);