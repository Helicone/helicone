import Banner from "@/components/home/Banner";
import BigDashboard from "@/components/home/BigDashboard";
import Companies from "@/components/home/Companies";
import CTA from "@/components/home/CTA";
import Evaluate from "@/components/home/Evaluate";
import Experiment from "@/components/home/Experiment";
import FAQ from "@/components/home/FAQ";
import Hero from "@/components/home/Hero";
import LLMLifecycle from "@/components/home/LLMLifecycle";
import Log from "@/components/home/Log";
import OpenSource from "@/components/home/OpenSource";
import Production from "@/components/home/Production";
import Prototype from "@/components/home/Prototype";
import Quote from "@/components/home/Quote";
import Quote2 from "@/components/home/Quote2";
import Quote3 from "@/components/home/Quote3";
import Stats from "@/components/home/Stats";
import { Layout } from "@/app/components/Layout";
import Integrations from "@/components/templates/landing/integrations";

export default async function Home() {
  const response = await fetch(
    "https://api.helicone.ai/v1/public/dataisbeautiful/total-values",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
          <Prototype />
          <Companies />
          <Quote />
          <Integrations />
          <Quote2 />
          <LLMLifecycle />
          <Log />
          <Evaluate />
          <Experiment />
          <Production />
          <BigDashboard />
          <Stats totalValuesData={totalValuesData} />
          <OpenSource />
          <FAQ />
          <Quote3 />
          <CTA />
        </div>
      </main>
    </Layout>
  );
}
