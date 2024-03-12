import { useEffect, useState } from "react";
import { Result } from "../../../lib/result";
import {
  SearchSelect,
  SearchSelectItem,
  Tab,
  TabGroup,
  TabList,
  TextInput,
} from "@tremor/react";
import React from "react";

interface ThemedTextDropDownProps {
  options: string[];
  onChange: (option: string | null) => void;
  value: string;
  onSearchHandler?: (search: string) => Promise<Result<void, string>>;
}

export function ThemedTextDropDown(props: ThemedTextDropDownProps) {
  const { options: parentOptions, onChange, value, onSearchHandler } = props;
  const [selected, setSelected] = useState(value);
  const [query, setQuery] = useState("");
  const [tabMode, setTabMode] = useState<"smart" | "raw">("smart");

  const customOption = query && !parentOptions.includes(query) ? query : null;

  const options = customOption
    ? parentOptions.concat([customOption])
    : parentOptions;

  const filteredPeople =
    query === ""
      ? options
      : options.filter((option) =>
          option
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  useEffect(() => {
    onSearchHandler?.(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex items-center gap-1 text-xs w-full justify-end">
        <div>
          <TabGroup>
            <TabList variant="solid" defaultValue="1">
              <Tab
                value="1"
                className="text-xs px-2 py-0.5"
                onClick={() => {
                  setTabMode("smart");
                }}
              >
                smart
              </Tab>
              <Tab
                value="2"
                className="text-xs px-2 py-0.5"
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
      {tabMode === "smart" ? (
        <SearchSelect
          value={selected}
          onValueChange={(value) => {
            setSelected(value);
            onChange(value);
          }}
          onSelect={async () => {
            await onSearchHandler?.(query);
          }}
        >
          {filteredPeople.map((option, i) => (
            <SearchSelectItem value={option} key={option}>
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
