import React from "react";

export const Toggle = ({
  onChange,
  value,
  label,
}: {
  onChange: (isToggled: boolean) => void;
  value?: boolean;
  label?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-row items-center bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 gap-2">
      {label}
      <button
        onClick={() => {
          onChange(!value);
        }}
        className={`relative w-8 h-5 bg-gray-300 rounded-full shadow-inner focus:outline-none transition-all duration-300 ${
          value ? "bg-sky-600" : ""
        }`}
      >
        <span
          className={`absolute w-3 h-3 bg-white rounded-full shadow transform transition-transform duration-300 left-0 bottom-1
           ${value ? "translate-x-4" : "translate-x-1"}`}
        ></span>
      </button>
    </div>
  );
};

export const ToggleButton = ({
  onChange,
  value,
  label,
}: {
  onChange: (isToggled: boolean) => void;
  value?: boolean;
  label?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-row items-center bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 gap-2 hover:bg-sky-50">
      {label}
      <button
        onClick={() => {
          onChange(!value);
        }}
        className={`relative w-8 h-5 bg-gray-300 rounded-full shadow-inner focus:outline-none transition-all duration-300 ${
          value ? "bg-sky-600" : ""
        }`}
      >
        <span
          className={`absolute w-3 h-3 bg-white rounded-full shadow transform transition-transform duration-300 left-0 bottom-1
           ${value ? "translate-x-4" : "translate-x-1"}`}
        ></span>
      </button>
    </div>
  );
};
