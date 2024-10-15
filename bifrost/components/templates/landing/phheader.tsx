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
    <div className="bg-[#FF6154]/10 rounded-lg w-full border-l-4 border-l-[#FF6154] text-[#FF6154] flex flex-col md:flex-row md:gap-2 gap-4 justify-between md:items-center items-start p-4 mt-2 mb-8">
      <div className="flex flex-row gap-1 items-baseline">
        <div className="space-y-2">
          <p className="text-xl font-mono px-[10px] py-[3px] text-[#FF6154] bg-white border-2 border-[#FF6154]/50 rounded-full">
            {Math.trunc(time / (1000 * 60 * 60))}
          </p>
          <p className="text-xs font-bold">HOURS</p>
        </div>
        <p className="font-bold text-2xl">:</p>
        <div className="space-y-2">
          <p className="text-xl font-mono px-[10px] py-[3px] text-[#FF6154] bg-white border-2 border-[#FF6154]/50 rounded-full">
            {Math.trunc((time % (1000 * 60 * 60)) / (1000 * 60))}
          </p>
          <p className="text-xs font-bold">MINS</p>
        </div>
        <p className="font-bold text-2xl">:</p>
        <div className="space-y-2">
          <p className="text-xl font-mono px-[10px] py-[3px] text-[#FF6154] bg-white border-2 border-[#FF6154]/50 rounded-full">
            {Math.trunc((time % (1000 * 60)) / 1000)
              .toString()
              .padStart(2, "0")}
          </p>
          <p className="text-xs font-bold">SECS</p>
        </div>
      </div>

      <div>
        <h1 className="text-lg text-start font-semibold">
          We launched on Product Hunt today!
        </h1>
        <p className="text-sm text-start font-light">
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

      <div className="flex md:flex-row gap-2 md:items-center h-full flex-col-reverse">
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
          className="text-white p-1.5 px-3 rounded-lg bg-[#FF6154] w-fit whitespace-nowrap"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}
