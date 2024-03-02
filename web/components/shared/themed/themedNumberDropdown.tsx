import { SearchSelect, SearchSelectItem } from "@tremor/react";
import { useState } from "react";
import { clsx } from "../clsx";

interface ThemedNumberDropdownProps {
  options: {
    key: string;
    param: string;
  }[];
  onChange: (option: string | null) => void;
  value: string;
}

const ThemedNumberDropdown = (props: ThemedNumberDropdownProps) => {
  const { options, onChange, value } = props;

  const [selected, setSelected] = useState(value);

  return (
    <>
      <SearchSelect
        value={selected}
        placeholder="Select value..."
        onValueChange={(value) => {
          setSelected(value);
          onChange(value);
        }}
      >
        {options.map((option, i) => (
          <SearchSelectItem value={option.key} key={i}>
            <p>
              {/* capitalize the first letter */}
              {option.param.charAt(0).toUpperCase() + option.param.slice(1)}
              {/* {option.param} */}
            </p>
          </SearchSelectItem>
        ))}
      </SearchSelect>
    </>
  );
};

export default ThemedNumberDropdown;
