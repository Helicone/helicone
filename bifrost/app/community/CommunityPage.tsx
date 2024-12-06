"use client";

import { clsx } from "@/components/shared/utils";
import Image from "next/image";
import { useState } from "react";
import { Customers } from "./customers";
import { Integrations } from "./integrations";
import { Projects } from "./projects";

export type BlogStructure = {
  title: string;
  description: string;
  badgeText: string;
  date: string;
  href: string;
  imageUrl: string;
  authors: {
    name: string;
    imageUrl: string;
  }[];
  time: string; // the amount of time it takes to read the blog
};

const CommunityPage = () => {
  const TABS = ["Projects", "Integrations", "Customers"] as const;

  const [selectedTab, setSelectedTab] =
    useState<(typeof TABS)[number]>("Projects");

  return (
    <div className="w-full bg-[#F8FEFF] h-full antialiased relative text-black mb-[24px]">
      <div className="relative w-full flex flex-col space-y-4 mx-auto max-w-5xl h-full py-16 items-center text-center px-2 sm:px-2 lg:px-0">
        <Image
          src={"/static/community/shiny-cube.webp"}
          alt={"shiny-cube"}
          width={200}
          height={100}
        />
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight max-w-4xl">
          Community
        </h1>
        <p className="mt-[12px] text-sm sm:text-lg text-gray-700">
          All projects and companies we love who are using Helicone, and cool
          integrations.
        </p>
        <div className="mt-[24px] mb-[24px] flex flex-row h-[34px] text-gray-500 rounded-md bg-[#F0F9FF] md:bg-transparent md:gap-5">
          {TABS.map((tab, i) => (
            <button
              key={`${tab}-${i}`}
              className={clsx(
                "w-full h-full flex justify-items-center items-center text-sm px-[24px] font-semibold shadow-sm text-center my-auto ",
                selectedTab === tab
                  ? "bg-sky-500 hover:bg-sky-600 border-2 border-sky-700 text-white rounded-md"
                  : "text-sky-500 hover:bg-sky-100 bg-[#F0F9FF] rounded-md"
              )}
              onClick={() => setSelectedTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {selectedTab === "Projects" && <Projects />}
        {selectedTab === "Integrations" && <Integrations />}
        {selectedTab === "Customers" && <Customers />}
      </div>
    </div>
  );
};

export default CommunityPage;
