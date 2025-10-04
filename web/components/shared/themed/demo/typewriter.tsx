import React, { useState, useEffect } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

const Typewriter: React.FC<TypewriterProps> = ({
  text,
  speed = 50,
  delay = 0,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (delay > 0) {
      timer = setTimeout(startTyping, delay);
    } else {
      startTyping();
    }

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const startTyping = () => {
    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex >= text.length) {
        clearInterval(intervalId);
        onComplete && onComplete();
        return;
      }
      setDisplayedText((prevText) => prevText + text[currentIndex]);
      currentIndex++;
    }, speed);

    return () => clearInterval(intervalId);
  };

  return <div className="font-mono">{displayedText}</div>;
};

export default Typewriter;
