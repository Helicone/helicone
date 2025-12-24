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
              Minimal impact. You get a similar experience to making direct
              calls to OpenAI, Anthropic, and Google, but with massive gains
              from caching, load balancing, and failover - far outweighing the{" "}
              <strong>minimal latency overhead</strong> (up to 20ms).
              <br />
              <br />
              We&apos;re deployed globally on the edge to minimize latency - see
              our{" "}
              <a
                href="https://docs.helicone.ai/references/latency-affect"
                target="_blank"
                rel="noopener"
                className="text-brand"
              >
                cloud benchmarks
              </a>{" "}
              for real-world performance.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-3" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              How is Helicone different from other AI gateways?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              We&apos;re the only AI gateway{" "}
              <strong>purposefully built for agentic workflows.</strong>
              <br />
              <br />
              Agents still behave in unpredicable ways, so our AI gateway was
              designed with observability built-in by default.
              <br />
              <br />
              Our routing layer enables caching, rate limiting, load balancing,
              and more, while our observability platform provides end-to-end
              visibility with specialized features like prompt management,
              version tracking, token-level cost analysis, and LLM-specific
              debugging tools, and more.
            </AccordionContent>
          </AccordionItem>
          <hr className="my-2 border-t border-slate-200" />
          <AccordionItem value="item-4" className="border-b-0">
            <AccordionTrigger className="text-foreground text-base sm:text-lg font-medium text-left">
              How quickly can I integrate Helicone?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-base sm:text-lg font-normal">
              There&apos;s no SDK required, so most developers integrate
              Helicone in under 2 minutes.
              <br />
              <br />
              As long as you&apos;re using the OpenAI SDK, you will only need to
              update the <code>baseUrl</code> and the <code>model</code> name in
              your code. You can find more detailed examples in our{" "}
              <a
                href="https://docs.helicone.ai/getting-started/quick-start"
                target="_blank"
                rel="noopener"
                className="text-brand"
              >
                documentation,
              </a>{" "}
              including integrations with all major frameworks and providers.
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
