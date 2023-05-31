import { useState } from "react";

export const Toggle = ({
  onChange,
}: {
  onChange: (isToggled: boolean) => void;
}) => {
  const [isToggled, setIsToggled] = useState(false);

  const handleClick = () => {
    setIsToggled(!isToggled);
    onChange(!isToggled);
  };

  return (
    <button
      onClick={handleClick}
      className={`relative w-12 h-7 bg-gray-300 rounded-full shadow-inner focus:outline-none transition-all duration-300 ${
        isToggled ? "bg-violet-600" : ""
      }`}
    >
      <span
        className={`absolute w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 left-0 bottom-1
           ${isToggled ? "translate-x-6" : "translate-x-1"}`}
      ></span>
    </button>
  );
};
