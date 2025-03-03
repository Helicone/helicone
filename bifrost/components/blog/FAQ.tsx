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
  const [openIndices, setOpenIndices] = useState<number[]>([]);

  // Function to safely render HTML content
  const renderHTML = (content: string) => {
    return { __html: content };
  };

  const handleClick = (e: MouseEvent, index: number) => {
    if ((e.target as HTMLElement).closest('a')) {
      e.stopPropagation();
      return;
    }
    setOpenIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index];
    });
  };

  return (
    <section className="w-full max-w-4xl mx-auto mt-6 mb-2">
      {/* <div className="rounded-lg bg-[#F2F9FC] px-6 py-4 border border-[#E3EFF3]"> */}
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">
        {title}
      </h2>

      <div className="flex flex-col">
        {items.map((faq, index) => (
          <div key={index} className="overflow-hidden">
            <div
              onClick={(e) => handleClick(e, index)}
              className="w-full pt-1 pb-4 cursor-pointer"
            >
              <h4 className="text-slate-400 font-medium flex items-center">
                <ChevronRightIcon
                  className={`mr-3 w-4 h-4 transition-transform duration-300 ease-in-out ${openIndices.includes(index) ? "rotate-90" : ""}`}
                />
                <span
                  className="text-slate-700"
                  dangerouslySetInnerHTML={renderHTML(faq.question)}
                />
              </h4>
              <div
                className={`text-slate-500 text-md ml-8 overflow-hidden transition-all duration-200 ease-in-out ${openIndices.includes(index)
                  ? "max-h-[500px] opacity-100 mt-3"
                  : "max-h-0 opacity-0 mt-0"
                  }`}
              >
                <div className="pb-1">
                  {typeof faq.answer === 'string' ? (
                    <div dangerouslySetInnerHTML={renderHTML(faq.answer)} />
                  ) : (
                    faq.answer
                  )}
                </div>
              </div>
            </div>
            {index < items.length - 1 && (
              <div className="border-b border-slate-200"></div>
            )}
          </div>
        ))}
      </div>
      {/* </div> */}
    </section>
  );
}