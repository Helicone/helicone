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
        <h2 className="text-4xl sm:text-5xl font-semibold text-foreground">
          Questions &amp; Answers
        </h2>
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="item-1" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              Will Helicone add latency to my LLM calls?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              Minimal impact. Our{" "}
              <a
                href="https://github.com/Helicone/ai-gateway/tree/main/benchmarks"
                target="_blank"
                rel="noopener"
                className="text-brand"
              >
                self-hosted AI Gateway
              </a>{" "}
              benchmarks at <span className="font-bold">less than 1ms</span> per
              request with no network overhead.
              <br />
              <br />
              For our cloud gateway, computational overhead is still under 1ms,
              plus one network hop. We&apos;re deployed globally on the edge to
              minimize latency - see our{" "}
              <a
                href="https://docs.helicone.ai/references/latency-affect"
                target="_blank"
                rel="noopener"
                className="text-brand"
              >
                cloud benchmarks
              </a>{" "}
              for real-world performance.
              <br />
              <br />
              This overhead is negligible compared to actual LLM response times
              (500ms to several seconds). You get massive gains from caching,
              load balancing, and failover that far outweigh the minimal latency
              cost.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-3" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              How is Helicone different from other monitoring solutions?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              Unlike general observability tools that treat LLMs as black boxes,
              Helicone is purpose-built for AI applications with specialized
              features like prompt version tracking, token-level cost analysis,
              and LLM-specific debugging tools, plus a full routing layer
              enabling caching, rate limiting, load balancing, and more.
              <br />
              <br />
              We provide end-to-end visibility from user sessions to individual
              token decisions. Most importantly, Helicone scales with you from
              prototype to production without requiring changes to your
              monitoring approach as you grow or new models are released —
              something traditional APM tools can&apos;t offer for LLM
              workflows.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-4" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              How quickly can I integrate Helicone?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              There&apos;s no SDK required, so most developers integrate
              Helicone in under 2 minutes with merely two line changes -
              starting the AI Gateway with a single command and updating the
              base URL in your LLM request.
              <br />
              <br />
              Our{" "}
              <a
                href="https://docs.helicone.ai/getting-started/quick-start"
                target="_blank"
                rel="noopener"
                className="text-brand"
              >
                documentation
              </a>{" "}
              includes examples for all major providers and frameworks including
              OpenAI, Anthropic, LangChain, LlamaIndex, and more.
              <br />
              <br />
              Developers typically see their first dashboard data within 5
              minutes of starting integration.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-5" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              Is Helicone secure and compliant for enterprise use?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              Yes, Helicone is built for enterprise-grade security and
              compliance. We&apos;re SOC 2 Type II certified, HIPAA compliant,
              and implement industry best practices including end-to-end
              encryption, least-privilege access controls, and regular
              penetration testing.
              <br />
              <br />
              We protect your data with the same care we&apos;d expect for our
              own sensitive information. For more information, please{" "}
              <a
                href="https://helicone.ai/contact"
                target="_blank"
                rel="noopener"
                className="text-brand"
              >
                reach out
              </a>{" "}
              to our team.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-6" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              Can I deploy Helicone in my own infrastructure?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              Absolutely. As an open-source platform, Helicone offers complete
              deployment flexibility. You can self-host using our
              production-ready Helm charts on your Kubernetes cluster, deploy
              via Docker in your own cloud environment, or use our managed cloud
              service.
              <br />
              <br />
              Our enterprise plans include deployment support, custom
              integrations with your existing monitoring stack, and SLAs for
              mission-critical workloads.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-2" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              What if I don&apos;t want Helicone in my critical path?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              You have two options: use Helicone Observability without the AI
              Gateway (SDK integration without proxying), or self-host our
              open-source AI Gateway to eliminate any dependency on
              Helicone&apos;s uptime while keeping all routing benefits.
              <br />
              <br />
              However, <span className="font-bold">thousands</span> of companies
              use our cloud proxy in production with high reliability. We
              leverage Cloudflare&apos;s global network for minimal latency and
              maximum uptime.
              <br />
              <br />
              For complete control, see our{" "}
              <a
                href="https://docs.helicone.ai/ai-gateway/quickstart"
                target="_blank"
                rel="noopener"
                className="text-brand"
              >
                self-hosting guide
              </a>{" "}
              or our{" "}
              <a
                href="https://docs.helicone.ai/references/availability#how-helicone-ensures-high-availability"
                target="_blank"
                rel="noopener"
                className="text-brand"
              >
                cloud reliability documentation
              </a>
              .
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
        </Accordion>
      </div>
    </div>
  );
};

export default FAQ;
