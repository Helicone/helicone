import { FileInfo, API, Options } from "jscodeshift";
import { Collection } from "jscodeshift/src/Collection";

interface Transformation {
  type: string;
  [key: string]: any;
}

interface ImportTransformation extends Transformation {
  type: "add_import";
  module: string;
  imports: string[];
}

interface VariableTransformation extends Transformation {
  type: "modify_variable";
  variable_name: string;
  api_key_env_var: string;
  proxy_url_env_var: string;
}

interface FunctionCallTransformation extends Transformation {
  type: "modify_function_call";
  function_name: string;
  api_key_env_var: string;
  proxy_url_env_var: string;
}

/**
 * A jscodeshift transform that applies Helicone integration changes
 * based on a Unified Transformation Specification
 */
export default function transform(
  fileInfo: FileInfo,
  api: API,
  options: Options & { transformations?: Transformation[] }
): string {
  const j = api.jscodeshift;

  try {
    console.log(`Transform starting for file: ${fileInfo.path}`);
    console.log(
      `Transformations to apply:`,
      JSON.stringify(options.transformations, null, 2)
    );

    // Check if source is valid
    if (!fileInfo.source || typeof fileInfo.source !== "string") {
      console.error(
        `Invalid source for file ${fileInfo.path}:`,
        fileInfo.source
      );
      return fileInfo.source || "";
    }

    // Try to parse the source code
    let root;
    try {
      root = j(fileInfo.source);
    } catch (parseError) {
      console.error(`Parse error in file ${fileInfo.path}:`, parseError);
      return fileInfo.source;
    }

    // Get transformations for this file from the options
    const fileTransformations = options.transformations || [];
    let transformationApplied = false;

    // Apply each transformation in sequence
    fileTransformations.forEach((transformation, index) => {
      console.log(
        `Applying transformation ${index + 1}/${fileTransformations.length}: ${
          transformation.type
        }`
      );

      try {
        let success = false;
        switch (transformation.type) {
          case "add_import":
            success = addImport(
              j,
              root,
              transformation as ImportTransformation
            );
            if (success) {
              console.log(
                `- Added import from ${
                  (transformation as ImportTransformation).module
                }`
              );
              transformationApplied = true;
            } else {
              console.log(
                `- Import from ${
                  (transformation as ImportTransformation).module
                } already exists or could not be added`
              );
            }
            break;
          case "modify_variable":
            success = modifyVariable(
              j,
              root,
              transformation as VariableTransformation
            );
            if (success) {
              console.log(
                `- Modified variable ${
                  (transformation as VariableTransformation).variable_name
                }`
              );
              transformationApplied = true;
            } else {
              console.log(
                `- Variable ${
                  (transformation as VariableTransformation).variable_name
                } not found or could not be modified`
              );
            }
            break;
          case "modify_function_call":
            success = modifyFunctionCall(
              j,
              root,
              transformation as FunctionCallTransformation
            );
            if (success) {
              console.log(
                `- Modified function call ${
                  (transformation as FunctionCallTransformation).function_name
                }`
              );
              transformationApplied = true;
            } else {
              console.log(
                `- Function call ${
                  (transformation as FunctionCallTransformation).function_name
                } not found or could not be modified`
              );
            }
            break;
          default:
            console.warn(
              `- Unknown transformation type: ${transformation.type}`
            );
        }
      } catch (error) {
        console.error(
          `Error applying transformation ${index + 1} (${
            transformation.type
          }):`,
          error
        );
      }
    });

    // Only return the transformed source if at least one transformation was applied
    if (transformationApplied) {
      try {
        const result = root.toSource();
        console.log(`Transform completed for file: ${fileInfo.path}`);
        return result;
      } catch (toSourceError) {
        console.error(
          `Error generating source for ${fileInfo.path}:`,
          toSourceError
        );
        return fileInfo.source;
      }
    } else {
      console.log(`No transformations applied to file: ${fileInfo.path}`);
      return fileInfo.source;
    }
  } catch (error) {
    console.error(`Fatal error in transform for file ${fileInfo.path}:`, error);
    return fileInfo.source;
  }
}

/**
 * Adds an import statement to the file
 */
function addImport(
  j: any,
  root: Collection<any>,
  transformation: ImportTransformation
): boolean {
  try {
    // Check if the import already exists
    const existingImports = root.find(j.ImportDeclaration, {
      source: { value: transformation.module },
    } as any);

    // If the import already exists, check if all specifiers are already imported
    let allSpecifiersExist = false;
    if (existingImports.size() > 0) {
      allSpecifiersExist = true;
      for (const importName of transformation.imports) {
        const specifierExists =
          existingImports
            .find(j.ImportSpecifier, {
              imported: { name: importName },
            } as any)
            .size() > 0;

        if (!specifierExists) {
          allSpecifiersExist = false;
          break;
        }
      }
    }

    // If all specifiers already exist, no need to add the import
    if (allSpecifiersExist) {
      console.log(`All imports from ${transformation.module} already exist`);
      return false;
    }

    // Parse the import statement
    const importSpecifiers = transformation.imports.map((name) =>
      j.importSpecifier(j.identifier(name))
    );

    const importDeclaration = j.importDeclaration(
      importSpecifiers,
      j.literal(transformation.module)
    );

    // Add to the top of the file, after any existing imports
    const body = root.find(j.Program).get("body");
    const lastImportIndex = findLastImportIndex(j, body.value);

    body.value.splice(lastImportIndex + 1, 0, importDeclaration);
    return true;
  } catch (error) {
    console.error(`Error adding import from ${transformation.module}:`, error);
    return false;
  }
}

/**
 * Finds the index of the last import declaration
 */
function findLastImportIndex(j: any, programBody: any[]): number {
  let lastImportIndex = -1;

  programBody.forEach((node, i) => {
    if (j.ImportDeclaration.check(node)) {
      lastImportIndex = i;
    }
  });

  return lastImportIndex;
}

/**
 * Modifies a variable declaration to wrap it with Helicone
 */
function modifyVariable(
  j: any,
  root: Collection<any>,
  transformation: VariableTransformation
): boolean {
  try {
    const variableDeclarators = root.find(j.VariableDeclarator, {
      // @ts-ignore
      id: { name: transformation.variable_name },
    });

    // If no variable found, return false
    if (variableDeclarators.size() === 0) {
      return false;
    }

    let modified = false;
    variableDeclarators.forEach((path) => {
      // Only proceed if there's an initializer
      // @ts-ignore
      if (!path.node.init) return;

      // Create the Helicone wrapper
      // @ts-ignore
      const wrappedInit = j.callExpression(
        j.memberExpression(j.identifier("Helicone"), j.identifier("wrap")),
        [
          // @ts-ignore
          path.node.init,
          j.objectExpression([
            j.property(
              "init",
              j.identifier("apiKey"),
              j.memberExpression(
                j.memberExpression(
                  j.identifier("process"),
                  j.identifier("env")
                ),
                j.identifier(transformation.api_key_env_var)
              )
            ),
            j.property(
              "init",
              j.identifier("proxyUrl"),
              j.memberExpression(
                j.memberExpression(
                  j.identifier("process"),
                  j.identifier("env")
                ),
                j.identifier(transformation.proxy_url_env_var)
              )
            ),
          ]),
        ]
      );

      // Replace the initializer
      // @ts-ignore
      path.node.init = wrappedInit;
      modified = true;
    });

    return modified;
  } catch (error) {
    console.error(
      `Error modifying variable ${transformation.variable_name}:`,
      error
    );
    return false;
  }
}

/**
 * Modifies function calls to wrap them with Helicone
 */
function modifyFunctionCall(
  j: any,
  root: Collection<any>,
  transformation: FunctionCallTransformation
): boolean {
  try {
    const callExpressions = root.find(j.CallExpression).filter((path) => {
      // @ts-ignore
      const callee = path.node.callee;
      return (
        (callee.type === "Identifier" &&
          callee.name === transformation.function_name) ||
        (callee.type === "MemberExpression" &&
          callee.property.type === "Identifier" &&
          callee.property.name === transformation.function_name)
      );
    });

    // If no function calls found, return false
    if (callExpressions.size() === 0) {
      return false;
    }

    let modified = false;
    callExpressions.forEach((path) => {
      // Create the Helicone wrapper
      const wrappedCall = j.callExpression(
        j.memberExpression(j.identifier("Helicone"), j.identifier("wrap")),
        [
          // @ts-ignore
          path.node,
          j.objectExpression([
            j.property(
              "init",
              j.identifier("apiKey"),
              j.memberExpression(
                j.memberExpression(
                  j.identifier("process"),
                  j.identifier("env")
                ),
                j.identifier(transformation.api_key_env_var)
              )
            ),
            j.property(
              "init",
              j.identifier("proxyUrl"),
              j.memberExpression(
                j.memberExpression(
                  j.identifier("process"),
                  j.identifier("env")
                ),
                j.identifier(transformation.proxy_url_env_var)
              )
            ),
          ]),
        ]
      );

      // Replace the call expression
      j(path).replaceWith(wrappedCall);
      modified = true;
    });

    return modified;
  } catch (error) {
    console.error(
      `Error modifying function call ${transformation.function_name}:`,
      error
    );
    return false;
  }
}
