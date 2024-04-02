import { SearchSelect, SearchSelectItem } from "@tremor/react";
import { useState } from "react";

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
    <div className="w-full">
      <SearchSelect
        value={selected}
        placeholder="Select value..."
        onValueChange={(value) => {
          setSelected(value);
          onChange(value);
        }}
        enableClear={false}
      >
        {options.map((option, i) => (
          <SearchSelectItem value={option.key} key={i}>
            <p>
              {option.param.charAt(0).toUpperCase() + option.param.slice(1)}
            </p>
          </SearchSelectItem>
        ))}
      </SearchSelect>
    </div>
  );
};

export default ThemedNumberDropdown;
