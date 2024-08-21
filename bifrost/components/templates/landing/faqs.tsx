"use client";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function Faqs() {

  const [open, setOpen] = useState(-1);

  return (
    <div className="flex flex-col pb-2 mt-32 w-full md:items-center items-start text-center text-start md:pl-0 pl-12">
      <h2 className="text-2xl md:text-4xl font-bold md:self-center text-start">
        Frequently Asked Questions
      </h2>

      <div className="flex flex-col md:w-1/3 w-5/6 md:mt-16 mt-8 items-center gap-4">
        {FAQS.map((faq, index) => (
          <div onClick={() => setOpen(prev => prev === index ? -1 : index)} key={index} className="w-full p-4 border-2 border-sky-100 rounded-xl cursor-pointer">
            <h3 className="text-lg font-bold flex justify-start items-center gap-2">
              <ChevronRightIcon className={`w-5 h-5 ${open === index ? "rotate-90" : ""}`} />
              {faq.question}
            </h3>
            <p className={`text-gray-500 ${open === index ? "block mt-2 pl-6" : "hidden"}`}>{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const FAQS = [
  {
    question: "Is there an impact to the latency of the calls to LLM?",
    answer: "Helicone Proxies your requests through globally distributed nodes running on Cloudfare Workers. This means that the latency is minimal and the requests are routed to the closest server to the end user.",
  },
  {
    question: "I don't want to use Helicon's Proxy, can I still use Helicone?",
    answer: "Yes, you can use still use Helicone to log your requests using the Helicone SDK's Async Integration without proxying..",
  }
];