"use client";

import React from "react";
import { MdOutlineArrowForwardIos } from "react-icons/md";


const questions = [
  {
    prompt: "Is there a latency impact to my requests with Helicone’s Proxy?",
    description: "We understand that low latency is crucial for the success of your LLM application. Helicone uses Cloudflare’s global network of servers as proxies for efficient web traffic routing. Cloudflare workers maintain a sub-millisecond latency through their worldwide distribution. This results in a fast and reliable proxy for your LLM requests."
  },
  {
    prompt: "What are the risks of using Helicone’s Proxy?",
    description: `Using a proxy means that any downtime or issues with the proxy can affect your application's performance. Helicone provides an async option for logging events that is not on the critical path, which can offer more reliability in case of network issues or service downtimes. That being said, Helicone has consistently had 99.9999% up-time in the last year. 
                        In addition, while Helicone uses Cloudflare’s global network to minimize latency, there can still be a minor increase in latency. Benchmarking data showed that Helicone's proxy service latency was nearly identical to OpenAI's, but with a few requests running longer. This slight performance difference needs to be considered, especially in latency-sensitive applications.`
  },
  {
    prompt: "I don’t want to use the Proxy, can I still use Helicone?",
    description: `Yes, you can still use Helicone without using the proxy by using the Async method. This allows for request logging without being on the critical path, ensuring that network issues do not affect your application.

However, async integration does not come with the suite of middleware features available to proxy integrations, such as caching, prompt threat detection, moderation, key vault, rate limiting, etc. In addition, integrating using Proxy is simple and requires 2 lines of code. 

Check out our docs for instructions on async logging with OpenAI and other providers. For more ways to integrate Helicone into your application, feel free to reach out to help@helicone.ai. `
  },
  {
    prompt: "How does Helicone ensure data compliance and security?",
    description: `Helicone takes compliance and security seriously. We have robust measures to protect user data and adhere to regulatory standards. Our EU deployment ensures data residency and processing within the European Union, aligning with GDPR requirements. In addition, we are SOC-2 certified, ensuring a high standard of security and confidentiality of your data. `
  }
]

export default function FAQ() {
  return (
    <div className="py-4 flex flex-col mx-auto" >
      {questions.map((question) => (
        <div key={question.prompt} className="flex gap-2 border rounded-md mb-2 px-6 py-4">
          <MdOutlineArrowForwardIos className="h-6 w-6 py-1" />
          <div className="pl-3">
            <h1 className="text-sm font-medium lg:text-lg lg:font-semibold text-left">{question.prompt}</h1>
          </div>
        </div>
      ))}
    </div>
  )
}