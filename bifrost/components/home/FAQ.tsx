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
      <div className="flex flex-col md:flex-row justify-between w-full gap-6 md:gap-10">
        <h2 className="text-4xl sm:text-5xl font-semibold text-black">
          Questions &amp; Answers
        </h2>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              Will Helicone add latency to my LLM calls?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              No, with our Async integration, there&apos;s zero added latency. Our Proxy integration adds under 50ms through our global Cloudflare Workers deployment.
              <br />
              <br />
              We recommend using our Proxy for the simplest integration and access to gateway features like request caching, rate limiting, centralized API key management.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-2" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              What if I don&apos;t want Helicone in my critical path?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              You can still use Helicone to log your requests using the
              Helicone SDK&apos;s Async Integration without proxying.
              <br />
              <br />
              However, it&apos;s worth noting that thousands of companies use our proxy in production with high reliability. We leverage Cloudflare&apos;s global network to ensure minimal latency and maximum uptime.
              <br />
              <br />
              If you have concerns about using our proxy in your critical path, we have a <a href="https://docs.helicone.ai/references/availability#how-helicone-ensures-high-availability" target="_blank" rel="noopener" className="text-brand">detailed documentation</a> on our availability and reliability that addresses common concerns and explains our robust infrastructure.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-3" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              How is Helicone different from other monitoring solutions?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              Unlike general observability tools that treat LLMs as black boxes, Helicone is purpose-built for AI applications with specialized features like prompt version tracking, token-level cost analysis, and LLM-specific debugging tools.
              <br />
              <br />
              We provide end-to-end visibility from user sessions to individual token decisions. Most importantly, Helicone scales with you from prototype to production without requiring changes to your monitoring approach as you grow—something traditional APM tools can&apos;t offer for LLM workflows.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          {/* <AccordionItem value="item-4" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              How do I know Helicone is compatible with my framework?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              Helicone works with any LLM provider and framework through a
              simple header-based or SDK integration! We have dedicated
              integrations for OpenAI, Anthropic, Azure, Gemini, LangChain,
              LiteLLM, Together AI, and more.
              <br />
              <br />
              For custom setups, our flexible API accepts any provider format.
              If you can make LLM API calls, you can use Helicone — regardless
              of your tech stack.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" /> */}
          <AccordionItem value="item-4" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              How quickly can I integrate Helicone?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">

              Most developers integrate Helicone in under 2 minutes with two line changes—just update your base URL and add a Helicone header to your existing requests. There&apos;s no SDK required.
              <br />
              <br />
              Our <a href="https://docs.helicone.ai/getting-started/quick-start" target="_blank" rel="noopener" className="text-brand">documentation</a> includes examples for all major providers and frameworks including OpenAI, Anthropic, LangChain, and LlamaIndex. Developers typically see their first dashboard data within 5 minutes of starting integration.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-5" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              Is Helicone secure and compliant for enterprise use?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              Yes, Helicone is built for enterprise-grade security and compliance. We&apos;re SOC 2 Type II certified, HIPAA compliant, and implement industry best practices including end-to-end encryption, least-privilege access controls, and regular penetration testing.
              <br />
              <br />
              We protect your data with the same care we&apos;d expect for our own sensitive information. For more information, please <a href="https://helicone.ai/contact" target="_blank" rel="noopener" className="text-brand">reach out</a> to our team.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-6" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              Can I deploy Helicone in my own infrastructure?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              Absolutely. As an open-source platform, Helicone offers complete deployment flexibility. You can self-host using our production-ready Helm charts on your Kubernetes cluster, deploy via Docker in your own cloud environment, or use our managed cloud service.
              <br />
              <br />
              Our enterprise plans include deployment support, custom integrations with your existing monitoring stack, and SLAs for mission-critical workloads.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
