import Hero from "@/components/home/Hero";
import { Layout } from "@/app/components/Layout";
import Integrations from "@/components/templates/landing/integrations";
import dynamic from "next/dynamic";
import LazyLoadComponent from "@/components/shared/LazyLoadComponent";
import { cn, ISLAND_WIDTH } from "@/lib/utils";

const AiGateway = dynamic(() => import("@/components/home/AiGateway"));
const BigDashboard = dynamic(() => import("@/components/home/BigDashboard"));
const Companies = dynamic(() => import("@/components/home/Companies"));
const CTA = dynamic(() => import("@/components/home/CTA"));
const FAQ = dynamic(() => import("@/components/home/FAQ"));
const Log = dynamic(() => import("@/components/home/Log"));
const OpenSource = dynamic(() => import("@/components/home/OpenSource"));
const Production = dynamic(() => import("@/components/home/Production"));
const Prototype = dynamic(() => import("@/components/home/Prototype"));
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
          <Hero />
          <Prototype />
          <LazyLoadComponent fallback={<LoadingSection height="h-24" />}>
            <Companies className={cn("bg-[#f2f9fc]")} />
          </LazyLoadComponent>
          <LazyLoadComponent fallback={<LoadingSection />}>
            <Integrations />
          </LazyLoadComponent>
          <LazyLoadComponent fallback={<LoadingSection />}>
            <Quote2 />
          </LazyLoadComponent>
          <LazyLoadComponent fallback={<LoadingSection />}>
            <AiGateway />
          </LazyLoadComponent>
          <LazyLoadComponent fallback={<LoadingSection />}>
            <Log />
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
      </main>
    </Layout>
  );
}
