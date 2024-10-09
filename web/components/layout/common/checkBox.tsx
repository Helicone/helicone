import { useEffect, useState, FC, ChangeEvent } from "react";

interface CheckBoxProps {
  id: string;
  onChange: (id: string, checked: boolean) => void;
  value: boolean;
}

const CheckBox: FC<CheckBoxProps> = ({ id, onChange, value }) => {
  const [checked, setChecked] = useState(value);

  useEffect(() => {
    setChecked(value);
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setChecked(e.target.checked);
    onChange(id, e.target.checked);
  };

  return (
    <div className="inline-flex items-center">
      <label
        className="relative flex items-center rounded-full cursor-pointer"
        htmlFor={id}
      >
        <input
          type="checkbox"
          className="before:content[''] peer relative h-5 w-5 cursor-pointer appearance-none rounded-md border border-blue-gray-200 transition-all before:absolute before:top-2/4 before:left-2/4 before:block before:h-12 before:w-12 before:-translate-y-2/4 before:-translate-x-2/4 before:rounded-full before:bg-blue-gray-500 before:opacity-0 before:transition-opacity bg-black border-[#63758933] border-opacity-20  checked:border-gray-900 checked:bg-gray-900 checked:before:bg-gray-900 hover:before:opacity-10"
          id={id}
          checked={checked}
          onChange={handleChange}
        />
        <span className=" absolute text-[#00C2FF] transition-opacity opacity-0 pointer-events-none top-2/4 left-2/4 -translate-y-2/4 -translate-x-2/4 peer-checked:opacity-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            ></path>
          </svg>
        </span>
      </label>
    </div>
  );
};

export default CheckBox;
