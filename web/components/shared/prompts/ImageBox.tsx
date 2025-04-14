import { Message } from "packages/llm-mapper/types";

interface ImageBoxProps {
  message: Message;
  disabled?: boolean;
}

export default function ImageBox({ message, disabled = false }: ImageBoxProps) {
  if (!message.image_url) {
    return null;
    // TODO: Support for base64 images?
  }

  return (
    <div
      className={`group relative grid h-full focus-within:border-transparent focus-within:ring-2 focus-within:ring-heliblue rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <img
        src={message.image_url}
        alt={message.content || "Image message"}
        className="h-[300px] w-full p-4 object-contain select-none"
        draggable={false}
      />
    </div>
  );
}
