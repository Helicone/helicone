import { ISLAND_WIDTH } from "@/lib/utils";

import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

const FAQ = () => {
  return (
    <div className={cn(ISLAND_WIDTH, "pt-14 sm:pt-20 pb-12 md:pb-14")}>
      <div className="flex flex-col gap-6 md:gap-10">
        <h2 className="text-4xl sm:text-5xl font-semibold text-black">
          Questions &amp; Answers
        </h2>
        <Accordion type="multiple">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="text-slate-500 text-base sm:text-lg font-medium text-left">
              Is there an impact to the latency of the calls to LLM?
            </AccordionTrigger>
            <AccordionContent className="text-[#ACB3BA] text-base sm:text-lg font-normal">
              There are two ways to interface with Helicone - Proxy and Async.
              You can integrate with Helicone using the async integration to
              ensure zero propagation delay, or choose proxy for the simplest
              integration and access to gateway features like caching, rate
              limiting, API key management.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2" className="border-b-0">
            <AccordionTrigger className="text-slate-500 text-base sm:text-lg font-medium text-left">
              I don&apos;t want to use Helicone&apos;s Proxy, can I still use
              Helicone?
            </AccordionTrigger>
            <AccordionContent className="text-[#ACB3BA] text-base sm:text-lg font-medium">
              Yes, you can still use Helicone to log your requests using the
              Helicone SDK&apos;s Async Integration without proxying. However,
              it&apos;s worth noting that thousands of companies use our proxy
              in production with high reliability. We leverage Cloudflare&apos;s
              global network to ensure minimal latency and maximum uptime. If
              you have concerns about using our proxy in your critical path, we
              have a detailed documentation on our availability and reliability
              that addresses common concerns and explains our robust
              infrastructure.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3" className="border-b-0">
            <AccordionTrigger className="text-slate-500 text-base sm:text-lg font-medium text-left">
              How do you calculate the cost of LLM requests?{" "}
            </AccordionTrigger>
            <AccordionContent className="text-[#ACB3BA] text-base sm:text-lg font-medium">
              We use the usage tag returned by OpenAI, Anthropic, and other
              providers to calculate the cost of LLM requests. For more details,
              see How we calculate costs.
              <br />
              <br />
              To calculate your expected costs across models and providers, you
              can use our free, open-source tool with 300+ models: LLM API
              Pricing Calculator.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
