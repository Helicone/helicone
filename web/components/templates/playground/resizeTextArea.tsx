import { ChangeEvent, useEffect, useRef } from "react";

interface ResizeTextAreaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}

const ResizeTextArea = (props: ResizeTextAreaProps) => {
  const { value, onChange, placeholder } = props;
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
      placeholder={placeholder}
      onChange={onChange}
      className="text-md bg-transparent text-gray-900 dark:text-gray-100 w-full h-full flex-1 p-3 rounded-md whitespace-pre-wrap border-gray-300 dark:border-gray-700 resize-none"
      style={{
        resize: "none",
        overflow: "hidden",
      }}
    />
  );
};

export default ResizeTextArea;
