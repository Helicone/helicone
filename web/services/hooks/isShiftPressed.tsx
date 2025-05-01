import { useState, useEffect } from "react";

function useShiftKeyPress() {
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);
      }
    };

    // Add a handler for when the window loses focus
    const handleBlur = () => {
      setIsShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    // Add the blur event listener
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      // Remove the blur event listener on cleanup
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  return isShiftPressed;
}

export default useShiftKeyPress;
