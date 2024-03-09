import { useEffect, useState } from "react";
import { Result } from "../../../lib/result";
import { SearchSelect, SearchSelectItem } from "@tremor/react";
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
  );
}
