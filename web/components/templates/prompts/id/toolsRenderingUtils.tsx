import React from "react";
import { isJSON } from "../../requests/builder/components/chatComponent/single/utils";

// Update the props to accept auto_prompt_inputs directly
export const FunctionCall: React.FC<{ auto_prompt_inputs: any[] }> = ({
  auto_prompt_inputs,
}) => {
  // Check if auto_prompt_inputs is an array
  if (Array.isArray(auto_prompt_inputs) && auto_prompt_inputs.length > 0) {
    return (
      <div className="flex flex-col space-y-4">
        {auto_prompt_inputs.map((item, index) => {
          // Handle 'function' type
          if (
            item.type === "function" &&
            item.function &&
            (item.function.parameters || item.function.arguments)
          ) {
            return renderFunctionCall(
              item.function.name,
              item.function.parameters || item.function.arguments,
              index,
              item.function.description
            );
          }
          // Handle 'json_schema' type
          else if (item.type === "json_schema" && item.json_schema) {
            return renderJsonSchemaDefinition(item.json_schema, index);
          } else {
            return null;
          }
        })}
      </div>
    );
  } else {
    return null;
  }
};

const renderFunctionCall = (
  name: string,
  args: any,
  key?: number,
  description?: string
) => {
  let argsString = "";

  if (typeof args === "string") {
    if (isJSON(args)) {
      // Parse and pretty-print JSON strings
      argsString = JSON.stringify(JSON.parse(args), null, 2);
    } else {
      // Use the string as-is
      argsString = args;
    }
  } else if (typeof args === "object" && args !== null) {
    // Pretty-print objects
    argsString = JSON.stringify(args, null, 2);
  } else {
    // Fallback for other types (numbers, booleans, etc.)
    argsString = String(args);
  }

  return (
    <pre
      key={key}
      className="text-xs whitespace-pre-wrap rounded-lg overflow-auto"
    >
      <div className="flex flex-col space-y-4">
        <div>{description}</div>
        <div>{`${name}(${argsString})`}</div>
      </div>
    </pre>
  );
};

const renderJsonSchemaDefinition = (jsonSchema: any, key?: number) => {
  const properties = jsonSchema.schema?.properties || {};

  return (
    <div key={key} className="flex flex-col space-y-2">
      <div className="text-sm font-semibold">Schema: {jsonSchema.name}</div>

      {jsonSchema.description && (
        <div className="text-sm italic text-gray-500">
          {jsonSchema.description}
        </div>
      )}
      {Object.keys(properties).length > 0 ? (
        <div className="text-sm">
          <div className="font-semibold">Properties:</div>
          <ul className="ml-4 list-disc">
            {Object.entries(properties).map(([propName, propValue]) => (
              <li key={propName}>
                <span className="font-mono">{propName}</span>:{" "}
                <span className="italic">{getTypeString(propValue)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

const getTypeString = (propValue: any): string => {
  if (propValue.type) {
    if (propValue.type === "array" && propValue.items) {
      return `Array<${getTypeString(propValue.items)}>`;
    } else if (typeof propValue.type === "string") {
      return propValue.type;
    } else if (Array.isArray(propValue.type)) {
      return propValue.type.join(" | ");
    }
  }
  return "any";
};
