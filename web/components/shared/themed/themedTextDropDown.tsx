import { Fragment, useEffect, useState } from "react";
import { Result } from "../../../lib/result";
import { SearchSelect, SearchSelectItem } from "@tremor/react";
import { on } from "events";
import { Transition } from "@headlessui/react";
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
  const [isLoading, setIsLoading] = useState(false);

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

  // // on initial load, reset query to an empty string
  // useEffect(() => {
  //   setIsLoading(false);
  // }, []);

  console.log("hi scott", JSON.stringify(query));

  return (
    <SearchSelect
      value={selected}
      onValueChange={(value) => {
        setSelected(value);
        onChange(value);
      }}
      onSelect={async () => {
        await onSearchHandler?.(query);
        setIsLoading(false);
      }}
      onMouseLeave={() => {
        setIsLoading(true);
      }}
    >
      <>
        {isLoading && (
          <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
            Searching...
          </div>
        )}
        {filteredPeople.map((option, i) => (
          <SearchSelectItem value={option} key={i}>
            {option}
          </SearchSelectItem>
        ))}
      </>
    </SearchSelect>
  );
}
