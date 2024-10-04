import {
  SearchSelect,
  SearchSelectItem,
  Tab,
  TabGroup,
  TabList,
  TextInput,
} from "@tremor/react";
import { useState } from "react";
import { Result } from "../../../lib/result";
import clsx from "clsx";

interface ThemedTextDropDownProps {
  options: string[];
  onChange: (option: string | null) => void;
  value: string;
  onSearchHandler?: (search: string) => Promise<Result<void, string>>;
  hideTabModes?: boolean;
}

export function ThemedTextDropDown(props: ThemedTextDropDownProps) {
  const {
    options: parentOptions,
    onChange,
    value,
    onSearchHandler,
    hideTabModes = false,
  } = props;

  const [query, setQuery] = useState("");
  const [tabMode, setTabMode] = useState<"smart" | "raw">("smart");

  const handleValueChange = (value: string) => {
    setQuery(value);

    onChange(value);
  };

  return (
    <div className="w-full flex flex-col gap-1">
      {!hideTabModes && (
        <div className="flex items-center gap-1 text-xs w-full justify-end">
          <div>
            <TabGroup>
              <TabList variant="solid" defaultValue="1">
                <Tab
                  value="1"
                  className={clsx(
                    tabMode === "smart"
                      ? "bg-sky-100 dark:bg-sky-900"
                      : "bg-gray-200",
                    "text-xs px-2 py-0.5"
                  )}
                  onClick={() => {
                    setTabMode("smart");
                  }}
                >
                  smart
                </Tab>
                <Tab
                  value="2"
                  className={clsx(
                    tabMode === "raw"
                      ? "bg-sky-100 dark:bg-sky-900"
                      : "bg-gray-200",
                    "text-xs px-2 py-0.5"
                  )}
                  onClick={() => {
                    setTabMode("raw");
                  }}
                >
                  raw
                </Tab>
              </TabList>
            </TabGroup>
          </div>
        </div>
      )}
      {tabMode === "smart" ? (
        <SearchSelect
          key={`search-select-${value}`}
          searchValue={query}
          onSearchValueChange={(value) => {
            setQuery(value);
          }}
          value={value}
          onValueChange={(value) => {
            handleValueChange(value || query);
          }}
          enableClear={true}
          placeholder="Select or enter a value"
          onSelect={async () => {
            await onSearchHandler?.(query);
          }}
        >
          {Array.from(new Set([value, ...parentOptions, query]))
            .filter(Boolean)
            .sort()
            .map((option, i) => (
              <SearchSelectItem value={option} key={`${i}-${option}`}>
                {option}
              </SearchSelectItem>
            ))}
        </SearchSelect>
      ) : (
        <TextInput
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
        />
      )}
    </div>
  );
}
