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
      {/* <select
        id="location"
        name="location"
        className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md"
        defaultValue={defaultKey || "all"}
        onChange={(e) => {
          e.target.value !== "all"
            ? sessionStorage.setItem("currentKey", e.target.value)
            : sessionStorage.removeItem("currentKey");
          setFilter((f) => {
            if (e.target.value === "all" && f !== "all") {
              return {
                ...f,
                user_api_keys: undefined,
              };
            }

            if (f === "all") {
              return {
                user_api_keys: {
                  api_key_hash: {
                    equals: e.target.value,
                  },
                },
              };
            }
            if ("left" in f) {
              throw new Error("Not implemented");
            }

            return {
              ...f,
              user_api_keys: {
                api_key_hash: {
                  equals: e.target.value,
                },
              },
            };
          });
        }}
      >
        <option value={"all"}>All</option>
        {keys.map((key) => (
          <option key={key.api_key_hash} value={key.api_key_hash}>
            {key.key_name === "" ? key.api_key_preview : key.key_name}
          </option>
        ))}
      </select> */}
    </div>
  );
}
