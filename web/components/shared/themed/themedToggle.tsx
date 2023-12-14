import React from "react";

/**
 * A toggle component that allows users to switch between two states.
 *
 * @param onChange - A callback function that is called when the toggle state changes.
 * @param value - The current state of the toggle.
 * @param label - The label to display next to the toggle.
 */
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

/**
 * A toggle button component.
 *
 * @param onChange - The callback function called when the toggle button is clicked.
 * @param value - The current value of the toggle button.
 * @param label - The label to display next to the toggle button.
 */
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
