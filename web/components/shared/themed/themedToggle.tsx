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
    <div className="flex flex-row items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5">
      {label}
      <button
        onClick={() => {
          onChange(!value);
        }}
        className={`relative h-5 w-8 rounded-full bg-gray-300 shadow-inner transition-all duration-300 focus:outline-none ${
          value ? "bg-sky-600" : ""
        }`}
      >
        <span
          className={`absolute bottom-1 left-0 h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-300 ${value ? "translate-x-4" : "translate-x-1"}`}
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
    <div className="flex flex-row items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 hover:bg-sky-50">
      {label}
      <button
        onClick={() => {
          onChange(!value);
        }}
        className={`relative h-5 w-8 rounded-full bg-gray-300 shadow-inner transition-all duration-300 focus:outline-none ${
          value ? "bg-sky-600" : ""
        }`}
      >
        <span
          className={`absolute bottom-1 left-0 h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-300 ${value ? "translate-x-4" : "translate-x-1"}`}
        ></span>
      </button>
    </div>
  );
};
