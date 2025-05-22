import Hero from "@/components/home/Hero";
import { Layout } from "@/app/components/Layout";
import Integrations from "@/components/templates/landing/integrations";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import LazyLoadComponent from "@/components/shared/LazyLoadComponent";
import { cn, ISLAND_WIDTH } from "@/lib/utils";

const BigDashboard = dynamic(() => import("@/components/home/BigDashboard"));
const Companies = dynamic(() => import("@/components/home/Companies"));
const CTA = dynamic(() => import("@/components/home/CTA"));
const Evaluate = dynamic(() => import("@/components/home/Evaluate"));
const Experiment = dynamic(() => import("@/components/home/Experiment"));
const FAQ = dynamic(() => import("@/components/home/FAQ"));
const LLMLifecycle = dynamic(() => import("@/components/home/LLMLifecycle"));
const Log = dynamic(() => import("@/components/home/Log"));
const OpenSource = dynamic(() => import("@/components/home/OpenSource"));
const Production = dynamic(() => import("@/components/home/Production"));
const Prototype = dynamic(() => import("@/components/home/Prototype"));
const Quote = dynamic(() => import("@/components/home/Quote"));
const Quote2 = dynamic(() => import("@/components/home/Quote2"));
const Quote3 = dynamic(() => import("@/components/home/Quote3"));
const Stats = dynamic(() => import("@/components/home/Stats"));

const LoadingSection = ({ height = "h-96" }: { height?: string }) => (
  <div
    className={`w-full bg-gray-100 animate-pulse rounded-lg ${height}`}
  ></div>
);

export default async function Home() {
  const response = await fetch(
    "https://api.helicone.ai/v1/public/dataisbeautiful/total-values",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    }
  );
  // console.log(await response.text());
  // const totalValuesData = undefined;
  const totalValuesData = response.ok
    ? ((await response.json()).data as {
        total_requests?: number;
        total_tokens?: number;
        total_cost?: number;
      })
    : undefined;

  return (
    <Layout>
      <main className="bg-white text-landing-description relative">
        {/* Grid overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Horizontal lines */}
          <div className="absolute top-0 left-0 right-0 h-full flex flex-col">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`h-line-${i}`}
                className="flex-1 border-t border-slate-200"
              />
            ))}
          </div>

          {/* Vertical lines */}
          <div className="absolute top-0 left-0 bottom-0 w-full flex flex-row max-w-7xl mx-auto right-0 left-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`v-line-${i}`}
                className="flex-1 border-l border-slate-200"
              />
            ))}
            <div className="w-0 border-l border-slate-200"></div>
          </div>

          {/* Curved decorative lines */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] border-l border-t border-slate-200 rounded-bl-[600px]"></div>
          <div className="absolute bottom-[30%] left-0 w-[400px] h-[400px] border-r border-b border-slate-200 rounded-tl-[400px]"></div>
        </div>

        <div className="relative z-10">
          <Hero />
          <Prototype />
          <div className="max-w-7xl mx-auto">
            <LazyLoadComponent fallback={<LoadingSection height="h-24" />}>
              <Companies className={cn(ISLAND_WIDTH)} />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Quote />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Integrations />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Quote2 />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <LLMLifecycle />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Log />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Evaluate />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Experiment />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Production />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection height="h-[40rem]" />}>
              <BigDashboard />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection height="h-48" />}>
              <Stats totalValuesData={totalValuesData} />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <OpenSource />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <FAQ />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Quote3 />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection height="h-64" />}>
              <CTA />
            </LazyLoadComponent>
          </div>
        </div>
      </main>
    </Layout>
  );
}
