"use client";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function Faqs() {
  const [open, setOpen] = useState(-1);

  return (
    <div className="flex flex-col pb-2 w-full md:items-center items-start text-start md:pl-0 w-full">
      <h2 className="text-[32px] md:text-4xl font-bold md:self-center text-start">
        Frequently Asked <br /> Questions
      </h2>

      <div className="flex flex-col md:mt-16 mt-8 items-center gap-4 w-full">
        {FAQS.map((faq, index) => (
          <div
            onClick={() => setOpen((prev) => (prev === index ? -1 : index))}
            key={index}
            className="w-full p-4 border-2 border-sky-100 rounded-xl cursor-pointer"
          >
            <h3 className="text-lg font-bold flex justify-start items-center">
              <ChevronRightIcon
                className={`mx-[24px] w-10 h-10 ${
                  open === index ? "rotate-90" : ""
                }`}
              />
              <span className="text-gray-500">{faq.question}</span>
            </h3>
            <p
              className={`text-gray-500 ${
                open === index ? "block mt-2 pl-6" : "hidden"
              }`}
            >
              {faq.answer}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const FAQS = [
  {
    question: "Is there an impact to the latency of the calls to LLM?",
    answer:
      "Helicone Proxies your requests through globally distributed nodes running on Cloudfare Workers. This means that the latency is minimal and the requests are routed to the closest server to the end user.",
  },
  {
    question: "I don't want to use Helicon's Proxy, can I still use Helicone?",
    answer:
      "Yes, you can use still use Helicone to log your requests using the Helicone SDK's Async Integration without proxying..",
  },
];
