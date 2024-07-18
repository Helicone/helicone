"use client";

import { MdOutlineArrowForwardIos, MdOutlineExpandMore } from "react-icons/md";
import React, { useState } from "react";




const questions = [
  {
    prompt: "Is there a latency impact to my requests with Helicone’s Proxy?",
    description: (
      <>
        <p>We understand that low latency is crucial for the success of your LLM application. Helicone uses Cloudflare's global network of servers as proxies for efficient web traffic routing. Cloudflare workers maintain a sub-millisecond latency through their worldwide distribution. This results in a fast and reliable proxy for your LLM requests.</p>
      </>
    )
  },
  {
    prompt: "What are the risks of using Helicone’s Proxy?",
    description: (
      <>
        <div className="flex flex-col gap-5">
          <p>Using a proxy means that any downtime or issues with the proxy can affect your application's performance. Helicone provides an <span className="font-bold underline">async option</span> for logging events that is not on the critical path, which can offer more reliability in case of network issues or service downtimes. That being said, Helicone has consistently had 99.9999% up-time in the last year.</p>
          <p>In addition, while Helicone uses Cloudflare’s global network to minimize latency, there can still be a minor increase in latency. Benchmarking data showed that Helicone's proxy service latency was nearly identical to OpenAI's, but with a few requests running longer. This slight performance difference needs to be considered, especially in latency-sensitive applications.</p>
        </div>
      </>
    )
  },
  {
    prompt: "I don’t want to use the Proxy, can I still use Helicone?",
    description: (
      <>
        <div className="flex flex-col gap-5">
        <p>Yes, you can still use Helicone without using the proxy by using the <span className="font-bold">Async</span> method. This allows for request logging without being on the critical path, ensuring that network issues do not affect your application.</p>
        <p>However, async integration does not come with the suite of middleware features available to proxy integrations, such as caching, prompt threat detection, moderation, key vault, rate limiting, etc. In addition, integrating using Proxy is simple and requires 2 lines of code.</p>
        <p>Check out our docs for instructions on <span className="underline">async logging with OpenAI</span> and other providers. For more ways to integrate Helicone into your application, feel free to reach out to <span className="underline">help@helicone.ai</span>.</p>
        </div>
      </>
    )
  },
  {
    prompt: "How does Helicone ensure data compliance and security?",
    description: (
      <>
        <p>Helicone takes compliance and security seriously. We have robust measures to protect user data and adhere to regulatory standards. Our EU deployment ensures data residency and processing within the European Union, aligning with GDPR requirements. In addition, we are SOC-2 certified, ensuring a high standard of security and confidentiality of your data.</p>
      </>
    )
  }
];

export default function FAQ() {
  const [openQuestions, setOpenQuestions] = useState<{ [key: number]: boolean }>({});

  const toggleQuestion = (index: number) => {
    setOpenQuestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="py-4 flex flex-col mx-auto w-full">
      {questions.map((question, index) => (
        <div key={index} className="border rounded-md mb-2 px-6 py-4 w-full">
          <div className="flex justify-between items-center cursor-pointer gap-6 lg:justify-start" onClick={() => toggleQuestion(index)}>
            {openQuestions[index] ? (
              <MdOutlineExpandMore className="h-7 w-7 py-1" />
            ) : (
              <MdOutlineArrowForwardIos className="h-7 w-7 py-1" />
            )}
            <h1 className="text-sm font-medium lg:text-lg lg:font-semibold text-left ">
              {question.prompt}
            </h1>
          </div>
          {openQuestions[index] && (
            <div className="pt-4 pl-11">
              <p className="text-gray-600 font-light text-sm text-left leading-6">{question.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}