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
  const [currentIndex, setCurrentIndex] = useState(0);

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
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= text.length) {
          clearInterval(intervalId);
          onComplete && onComplete();
          return prevIndex;
        }
        setDisplayedText((prevText) => prevText + text[prevIndex]);
        return prevIndex + 1;
      });
    }, speed);

    return () => clearInterval(intervalId);
  };

  return <div className="font-mono">{displayedText}</div>;
};

export default Typewriter;
