import React, { useState } from "react";
import { capitalizeWords } from "../../shared/utils/utils";

interface Props {
  value: string;
  name: string;
}

const Hover: React.FC<Props> = ({ value, name }) => {
  const originIsShrunk: boolean = false;
  const [isHovering, setIsHovering] = useState(false);
  const [isShrunk, setIsShrunk] = useState(originIsShrunk);

  const handleMouseOver = () => {
    setIsHovering(true);
  };

  const handleMouseOut = () => {
    setIsHovering(false);
  };

  const handleClick = () => {
    setIsShrunk(!isShrunk);
  };

  const tooltipClasses = `text-center tooltip bg-black text-white rounded-md px-2 py-1 text-sm absolute bottom-full left-1/2 transform -translate-x-1/2 transition-transform duration-200 ease-in-out ${
    isHovering ? "opacity-100 visible mt-4" : "opacity-0 invisible"
  }`;
  const spanClasses = `bg-yellow-200 hover:bg-yellow-300 rounded py-1 relative`;

  return (
    <span
      className={spanClasses}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onClick={handleClick}
    >
      {isShrunk ? (
        <button className="font-semibold bg-red-200 hover:bg-red-300">
          [{capitalizeWords(name)}]
        </button>
      ) : (
        <span className="cursor-pointer">{value}</span>
      )}
      {isHovering && (
        <span className={tooltipClasses}>{capitalizeWords(name)}</span>
      )}
    </span>
  );
};

export default Hover;
