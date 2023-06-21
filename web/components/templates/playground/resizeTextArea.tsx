import { ChangeEvent, useEffect, useRef } from "react";

interface ResizeTextAreaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
}

const ResizeTextArea = (props: ResizeTextAreaProps) => {
  const { value, onChange } = props;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(resizeTextarea, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      className="text-gray-900 w-full h-full flex-1 p-2 -m-2 rounded-lg whitespace-pre-wrap border-gray-300 resize-none"
      style={{
        resize: "none",
        overflow: "hidden",
      }}
    />
  );
};

export default ResizeTextArea;
