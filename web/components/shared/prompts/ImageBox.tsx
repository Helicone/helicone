import { Message } from "@helicone-package/llm-mapper/types";

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
      className={`group relative grid h-full rounded-xl border border-slate-200 bg-white focus-within:border-transparent focus-within:ring-2 focus-within:ring-heliblue dark:border-slate-800 dark:bg-slate-900 ${
        disabled ? "opacity-50" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={message.image_url}
        alt={message.content || "Image message"}
        className="h-[300px] w-full select-none object-contain p-4"
        draggable={false}
      />
    </div>
  );
}
