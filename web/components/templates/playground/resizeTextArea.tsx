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
      className="text-md h-full w-full flex-1 resize-none whitespace-pre-wrap rounded-md border-gray-300 bg-transparent p-3 text-gray-900 dark:border-gray-700 dark:text-gray-100"
      style={{
        resize: "none",
        overflow: "hidden",
      }}
    />
  );
};

export default ResizeTextArea;
