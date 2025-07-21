"use client";
import { useState, useEffect } from "react";

export default function PhHeader() {
  const [time, setTime] = useState(0);
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const targetDate = new Date(Date.UTC(2024, 7, 23, 7, 0, 0)); // UTC midnight PST on August 23, 2024
      setTime(Math.max(0, targetDate.getTime() - now.getTime()));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-8 mt-2 flex w-full flex-col items-start justify-between gap-4 rounded-lg border-l-4 border-l-[#FF6154] bg-[#FF6154]/10 p-4 text-[#FF6154] md:flex-row md:items-center md:gap-2">
      <div className="flex flex-row items-baseline gap-1">
        <div className="space-y-2">
          <p className="rounded-full border-2 border-[#FF6154]/50 bg-white px-[10px] py-[3px] font-mono text-xl text-[#FF6154]">
            {Math.trunc(time / (1000 * 60 * 60))}
          </p>
          <p className="text-xs font-bold">HOURS</p>
        </div>
        <p className="text-2xl font-bold">:</p>
        <div className="space-y-2">
          <p className="rounded-full border-2 border-[#FF6154]/50 bg-white px-[10px] py-[3px] font-mono text-xl text-[#FF6154]">
            {Math.trunc((time % (1000 * 60 * 60)) / (1000 * 60))}
          </p>
          <p className="text-xs font-bold">MINS</p>
        </div>
        <p className="text-2xl font-bold">:</p>
        <div className="space-y-2">
          <p className="rounded-full border-2 border-[#FF6154]/50 bg-white px-[10px] py-[3px] font-mono text-xl text-[#FF6154]">
            {Math.trunc((time % (1000 * 60)) / 1000)
              .toString()
              .padStart(2, "0")}
          </p>
          <p className="text-xs font-bold">SECS</p>
        </div>
      </div>

      <div>
        <h1 className="text-start text-lg font-semibold">
          We launched on Product Hunt today!
        </h1>
        <p className="text-start text-sm font-light">
          Sign up / upgrade to Growth today and get $500 in credit. Here&apos;s
          how to{" "}
          <a
            href="/blog/redeem-promo-code"
            className="underline underline-offset-2"
          >
            redeem
          </a>
        </p>
      </div>

      <div className="flex h-full flex-col-reverse gap-2 md:flex-row md:items-center">
        <a
          href="https://www.producthunt.com/leaderboard/daily/2024/8/22?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-helicone&#0045;ai"
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-[180px]"
        >
          <img
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=475050&theme=light"
            alt="Helicone&#0032;AI - Open&#0045;source&#0032;LLM&#0032;Observability&#0032;for&#0032;Developers | Product Hunt"
            width="180"
            height="54"
          />
        </a>
        <a
          href="https://us.helicone.ai/signup"
          className="w-fit whitespace-nowrap rounded-lg bg-[#FF6154] p-1.5 px-3 text-white"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}
