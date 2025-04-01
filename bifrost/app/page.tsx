import Hero from "@/components/home/Hero";
import { Layout } from "@/app/components/Layout";
import Integrations from "@/components/templates/landing/integrations";
import dynamic from "next/dynamic";
import { Suspense } from "react";

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
      <main className="bg-white text-landing-description">
        <div className="max-w-8xl mx-auto">
          {/* <Banner /> */}
          <Hero />

          {/* Wrap sections below the fold in Suspense */}
          <Suspense fallback={<LoadingSection height="h-[30rem]" />}>
            <Prototype />
          </Suspense>
          <Suspense fallback={<LoadingSection height="h-24" />}>
            <Companies />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <Quote />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <Integrations />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <Quote2 />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <LLMLifecycle />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <Log />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <Evaluate />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <Experiment />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <Production />
          </Suspense>
          <Suspense fallback={<LoadingSection height="h-[40rem]" />}>
            <BigDashboard />
          </Suspense>
          <Suspense fallback={<LoadingSection height="h-48" />}>
            <Stats totalValuesData={totalValuesData} />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <OpenSource />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <FAQ />
          </Suspense>
          <Suspense fallback={<LoadingSection />}>
            <Quote3 />
          </Suspense>
          <Suspense fallback={<LoadingSection height="h-64" />}>
            <CTA />
          </Suspense>
        </div>
      </main>
    </Layout>
  );
}
