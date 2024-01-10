import { Dispatch, SetStateAction, useState } from "react";
import ThemedDropdown from "../../shared/themed/themedDropdown";

export function Filters({
  keys,

  setFilter,
}: {
  keys: {
    created_at: string;
    api_key_hash: string;
    api_key_preview: string;
    user_id: string;
    key_name: string | null;
  }[];

  setFilter: Dispatch<SetStateAction<string | null>>;
}) {
  const sessionStorageKey =
    typeof window !== "undefined" ? sessionStorage.getItem("currentKey") : null;

  const [currentKey, setCurrentKey] = useState<string>(
    sessionStorageKey || "all"
  );

  const options = keys.map((key) => {
    return {
      value: key.api_key_hash,
      label: key.key_name === null ? key.api_key_preview : key.key_name,
    };
  });

  options.unshift({
    value: "all",
    label: "All",
  });

  return (
    <div className="flex flex-row items-center gap-2">
      <label
        htmlFor="location"
        className="block text-sm font-medium text-gray-700 whitespace-nowrap"
      >
        API Key:
      </label>
      <ThemedDropdown
        align="right"
        options={options}
        selectedValue={currentKey}
        onSelect={(option: string) => {
          if (option !== "all") {
            sessionStorage.setItem("currentKey", option);
          } else {
            sessionStorage.removeItem("currentKey");
          }

          setCurrentKey(option);
          setFilter(option !== "all" ? option : null);
        }}
      />
    </div>
  );
}
