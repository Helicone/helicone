"use client"
import { useState, useEffect } from "react";

export default function PhHeader() {

  const [time, setTime] = useState(0);
  useEffect(() => {
    setInterval(() => {
      setTime(Math.abs(new Date("2024-08-23").getTime() - new Date().getTime()));
    }, 1000);
  }, []);

  return (
    <div className="bg-[#FF6154]/10 rounded-lg w-full border-l-4 border-l-[#FF6154] text-[#FF6154] flex flex-col md:flex-row md:gap-2 gap-4 justify-between md:items-center items-start p-4 mt-2 mb-8">

      <div className="flex flex-row gap-1 items-baseline">
        <div className="space-y-2">
          <p className="text-3xl font-mono px-[12px] py-[6px] bg-[#FF6154] text-white rounded-full">{Math.trunc(time / (1000 * 60 * 60))}</p>
          <p className="text-xs font-bold">HOURS</p>
        </div>
        <p className="font-bold text-2xl">:</p>
        <div className="space-y-2">
          <p className="text-3xl font-mono px-[12px] py-[6px] bg-[#FF6154] text-white rounded-full">{Math.trunc((time % (1000 * 60 * 60)) / (1000 * 60))}</p>
          <p className="text-xs font-bold">MINUTES</p>
        </div>
        <p className="font-bold text-2xl">:</p>
        <div className="space-y-2">
          <p className="text-3xl font-mono px-[12px] py-[6px] bg-[#FF6154] text-white rounded-full">{Math.trunc((time % (1000 * 60)) / 1000)}</p>
          <p className="text-xs font-bold">SECONDS</p>
        </div>
      </div>

      <div>
        <h1 className="text-xl text-start font-semibold">We are launching on Product Hunt soon!</h1>
        <p className="text-sm text-start font-light">Sign up / upgrade to Growth today and get $500 in credit. Here&apos;s how to{' '}
          <a href="/blog/redeem-promo-code" className="underline">Redeam</a>
        </p>
      </div>

      <div className="flex flex-row gap-2 items-center h-full">
        <a href="https://us.helicone.ai/signup" className="text-white p-1.5 px-3 rounded-lg bg-[#FF6154]">Sign up</a>
        <a
          href="https://www.producthunt.com/posts/helicone-ai?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-helicone&#0045;ai"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=475050&theme=light"
            alt="Helicone&#0032;AI - Open&#0045;source&#0032;LLM&#0032;Observability&#0032;for&#0032;Developers | Product Hunt"
            width="180"
            height="54"
          />
        </a>
      </div>

    </div>
  );
}