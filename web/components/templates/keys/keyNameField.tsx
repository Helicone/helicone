import { PencilIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { Database } from "../../../db/database.types";

interface KeyNameFieldProps {
  key: Database["public"]["Tables"]["user_api_keys"]["Row"];
}

const KeyNameField = (_props: KeyNameFieldProps) => {
  const [mode] = useState<"view" | "edit">("view");

  return (
    <>
      {mode === "view" ? (
        <div className="flex flex-row items-center">
          <p>Hello World</p>
          <PencilIcon className="inline h-4 w-4" />
        </div>
      ) : (
        <div className="flex flex-row items-center">
          <input
            type="email"
            name="email"
            id="email"
            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="you@example.com"
          />
        </div>
      )}
    </>
  );
};

export default KeyNameField;
