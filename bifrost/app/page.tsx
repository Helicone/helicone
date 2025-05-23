import Hero from "@/components/home/Hero";
import { Layout } from "@/app/components/Layout";
import Integrations from "@/components/templates/landing/integrations";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import LazyLoadComponent from "@/components/shared/LazyLoadComponent";
import { cn, ISLAND_WIDTH, ISLAND_WIDTH_V2 } from "@/lib/utils";

const BigDashboard = dynamic(() => import("@/components/home/BigDashboard"));
const Companies = dynamic(() => import("@/components/home/Companies"));
const CompaniesLanding = dynamic(
  () => import("@/components/home/CompaniesLanding")
);
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
      {/* Background for Hero and Prototype only */}
      <div
        className="relative w-full"
        style={{
          backgroundImage: "url('/static/home/clouds6.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-white opacity-60 z-0"></div>

        {/* Content for Hero and Prototype with full width but centered content */}
        <div className="relative z-10">
          <div className="md:max-w-5xl max-w-7xl mx-auto w-full">
            <Hero className="" />
            <Prototype />
          </div>
        </div>
      </div>

      {/* Rest of content without the clouds background */}
      <main className="bg-white text-landing-description">
        <div className="flex flex-col gap-10">
          <div className="md:max-w-5xl max-w-7xl mx-auto w-full">
            <LazyLoadComponent fallback={<LoadingSection height="h-24" />}>
              <CompaniesLanding />
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
            {/* <LazyLoadComponent fallback={<LoadingSection />}>
              <LLMLifecycle />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Log />
            </LazyLoadComponent> */}
            {/* <LazyLoadComponent fallback={<LoadingSection />}>
              <Evaluate />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Experiment />
            </LazyLoadComponent>
            <LazyLoadComponent fallback={<LoadingSection />}>
              <Production />
            </LazyLoadComponent> */}
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
