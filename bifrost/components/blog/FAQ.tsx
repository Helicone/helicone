"use client";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState, MouseEvent } from "react";

interface FAQProps {
  title?: string;
  items: {
    question: string;
    answer: React.ReactNode;
  }[];
}

export function FAQ({
  title = "Frequently Asked Questions",
  items,
}: FAQProps) {
  const [open, setOpen] = useState(-1);

  // Function to safely render HTML content
  const renderHTML = (content: string) => {
    return { __html: content };
  };

  const handleClick = (e: MouseEvent, index: number) => {
    if ((e.target as HTMLElement).closest('a')) {
      e.stopPropagation();
      return;
    }
    setOpen((prev) => (prev === index ? -1 : index));
  };

  return (
    <div className="flex flex-col w-full bg-sky-50/50 rounded-2xl px-8 md:px-12 pt-6 pb-8 md:pb-12">
      <h2 className="text-[32px] md:text-4xl font-bold text-left mb-6 mt-3">
        {title}
      </h2>

      <div className="flex flex-col items-center gap-3 w-full">
        {items.map((faq, index) => (
          <div
            onClick={(e) => handleClick(e, index)}
            key={index}
            className="w-full py-2.5 px-3 border-2 border-sky-100 rounded-xl cursor-pointer bg-white"
          >
            <h3 className="text-base font-bold flex items-center">
              <ChevronRightIcon
                className={`mx-3 w-6 h-6 transition-transform ${
                  open === index ? "rotate-90" : ""
                }`}
              />
              <span 
                className="text-gray-500"
                dangerouslySetInnerHTML={renderHTML(faq.question)}
              />
            </h3>
            <div
              className={`text-gray-500 text-sm ${
                open === index ? "block mt-2 ml-12" : "hidden"
              }`}
            >
              {typeof faq.answer === 'string' ? (
                <div dangerouslySetInnerHTML={renderHTML(faq.answer)} />
              ) : (
                faq.answer
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}