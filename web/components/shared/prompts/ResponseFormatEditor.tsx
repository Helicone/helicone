import MarkdownEditor from "@/components/shared/markdownEditor";
import UniversalPopup from "@/components/shared/universal/Popup";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { logger } from "@/lib/telemetry/logger";

interface ResponseFormatEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialSchema?: object;
  onSave: (schema?: object) => void;
}

export default function ResponseFormatEditor({
  isOpen,
  onClose,
  initialSchema,
  onSave,
}: ResponseFormatEditorProps) {
  const [schemaJson, setSchemaJson] = useState(
    initialSchema ? JSON.stringify(initialSchema, null, 2) : "{}",
  );

  const isValidJson = (jsonString: string): boolean => {
    if (jsonString.trim() === "{}") {
      return true; // Allow empty object as valid (clears schema)
    }
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSave = () => {
    if (!isValidJson(schemaJson)) return;
    try {
      const parsedSchema =
        schemaJson.trim() === "{}" ? undefined : JSON.parse(schemaJson);
      onSave(parsedSchema);
      onClose();
    } catch (e) {
      logger.error({ error: e }, "Invalid response format JSON");
      // Potentially show an error message to the user
    }
  };

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSchemaJson(
        initialSchema ? JSON.stringify(initialSchema, null, 2) : "{}",
      );
    }
  }, [isOpen, initialSchema]); // Add dependencies

  return (
    <UniversalPopup
      title="Edit Response Format Schema"
      isOpen={isOpen}
      onClose={onClose}
      width="max-w-5xl w-full"
    >
      <div className="flex flex-col gap-6 p-4">
        <div className="h-[500px]">
          <MarkdownEditor
            text={schemaJson}
            setText={setSchemaJson} // Directly set the state
            language="json"
            className="h-full rounded-lg bg-white dark:bg-black"
          />
        </div>
        <div className="flex flex-row items-center justify-end gap-2">
          {!isValidJson(schemaJson) && (
            <p className="mr-auto text-sm text-red-500">Invalid JSON Schema</p>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="action"
            onClick={handleSave}
            disabled={!isValidJson(schemaJson)} // Use the helper directly
          >
            Save Schema
          </Button>
        </div>
      </div>
    </UniversalPopup>
  );
}
