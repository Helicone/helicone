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
  const [selected, setSelected] = useState(value);
  const [query, setQuery] = useState("");
  const [tabMode, setTabMode] = useState<"smart" | "raw">("smart");

  const [filteredOptions, setFilteredOptions] =
    useState<string[]>(parentOptions);

  useEffect(() => {
    onSearchHandler?.(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    const filterOptions = query
      ? parentOptions.filter((option) =>
          option
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        )
      : parentOptions;

    if (query && !filterOptions.includes(query)) {
      filterOptions.push(query);
    }

    setFilteredOptions(filterOptions);
  }, [query, parentOptions]);

  const handleValueChange = (value: string) => {
    setSelected(value);
    onChange(value);
    if (!filteredOptions.includes(value)) {
      setFilteredOptions((prevOptions) => [...prevOptions, value]);
    }
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
      )}
      {tabMode === "smart" ? (
        <SearchSelect
          searchValue={selected}
          onSearchValueChange={(value) => {
            setQuery(value);
            handleValueChange(value);
          }}
          value={selected}
          onValueChange={(value) => {
            handleValueChange(value);
          }}
          onSelect={async () => {
            await onSearchHandler?.(query);
          }}
          enableClear={true}
        >
          {filteredOptions.map((option, i) => (
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
