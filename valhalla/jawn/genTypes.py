# Adjusting the script to replace the specific lines when it detects the start of the complex type definition.
import os

'''
THIS IS A HACK UNTIL THIS CAN BE SOLVED: https://github.com/drwpow/openapi-typescript/issues/1603
'''


def update_typescript_file_with_line_detection(content: str) -> str:
    """
    This function updates the TypeScript file content by detecting the start of the complex Json type definition
    and replacing that line and the next two lines with 'Json: JsonObject'. It also adds the type definitions
    for 'JsonValue', 'JsonArray', and 'JsonObject' to the top of the file.
    """
    # Define the start of the complex type pattern
    pattern_start = "Json: (string | number"

    # Define the replacement string
    replacement = "Json: JsonObject;"

    # Split the content into lines
    lines = content.split("\n")

    # Initialize an empty list to hold updated lines
    updated_lines = []

    # Track whether the pattern has been found and replaced
    found_and_replaced = False

    for i, line in enumerate(lines):
        # If the start of the pattern is found and it hasn't been replaced yet
        if pattern_start in line and not found_and_replaced:
            # Replace the current line and skip the next two lines
            updated_lines.append(replacement)
            found_and_replaced = True
        elif found_and_replaced and i <= updated_lines.index(replacement) + 2:
            # Skip the next two lines after the replacement
            continue
        else:
            # Add the line to the updated lines if not part of the pattern to be replaced
            updated_lines.append(line)

    # Join the updated lines back into a single string
    updated_content = "\n".join(updated_lines)

    # Add the new type definitions to the top of the updated content
    new_type_definitions = """type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
interface JsonArray extends Array<JsonValue> {}
interface JsonObject { [key: string]: JsonValue; }

"""
    updated_content = new_type_definitions + updated_content

    return updated_content


def fixJsonType(fileString: str) -> str:
    with open(fileString, "r") as file:
        content = file.read()

    updated_content = update_typescript_file_with_line_detection(content)

    with open(fileString, "w") as file:

        file.write(updated_content)


def main():

    # Read the content of the TypeScript file
    current_dir = os.path.dirname(os.path.realpath(__file__))

    # npx openapi-typescript  src/tsoa-build/swagger.json -o ../../web/lib/clients/jawnTypes.ts
    os.system(
        f"npx openapi-typescript {current_dir}/src/tsoa-build/public/swagger.json -o {current_dir}/../../web/lib/clients/jawnTypes/public.ts")

    os.system(
        f"npx openapi-typescript {current_dir}/src/tsoa-build/private/swagger.json -o {current_dir}/../../web/lib/clients/jawnTypes/private.ts")

    fixJsonType(f"{current_dir}/../../web/lib/clients/jawnTypes/public.ts")
    fixJsonType(f"{current_dir}/../../web/lib/clients/jawnTypes/private.ts")


if __name__ == "__main__":
    main()
