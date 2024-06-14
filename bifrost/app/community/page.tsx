"use client";
// import BlogPage from "../../components/templates/blog/blogPage";
import { clsx } from "@/components/shared/utils";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Projects } from "./projects";
import { Integrations } from "./integrations";
import { Customers } from "./customers";

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

const blogContent: BlogStructure[] = [
  {
    title: "Helicone vs. Weights and Biases",
    description:
      "Training modern LLMs is generally less c2omplex than traditional ML models. Here's how to have all the essential tools specifically designed for language model observability without the clutter.",
    badgeText: "compare",
    date: "May 31, 2024",
    href: "/blog/weights-and-biases",
    imageUrl: "/static/blog/weights-and-biases.png",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "5 minute read",
  },
  {
    title: "Insider Scoop: Our Co-founder's Take on GitHub Copilot",
    description:
      "No BS, no affiliations, just genuine opinions from Helicone's co-founder.",
    badgeText: "team's pick",
    date: "May 30, 2024",
    href: "/blog/cole-github-copilot",
    imageUrl: "/static/blog/cole-copilot.png",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "4 minute read",
  },
  {
    title: "Insider Scoop: Our Founding Engineer's Take on PostHog",
    description:
      "No BS, no affiliations, just genuine opinions from the founding engineer at Helicone.",
    badgeText: "team's pick",
    date: "May 23, 2024",
    href: "/blog/stefan-posthog",
    imageUrl: "/static/blog/stefan-posthog/posthog-cover.png",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "3 minute read",
  },
  {
    title: "A step by step guide to switch to gpt-4o safely with Helicone",
    description:
      "Learn how to use Helicone's experiments features to regression test, compare and switch models.",
    badgeText: "Product",
    date: "May 14, 2024",
    href: "/blog/switch-models-safely",
    imageUrl: "static/blog/experiments/gpt-4o.png",
    authors: [
      {
        name: "Scott Nguyen",
        imageUrl: "/static/blog/scottnguyen-headshot.webp",
      },
    ],
    time: "5 minute read",
  },
  {
    title: "A Guide for Datadog Users Building with LLMs",
    description:
      "Datadog has long been a favourite among developers for monitoring and observability. But recently, LLM developers have been exploring new options. Why? We have some answers.",
    badgeText: "Compare",
    date: "Apr 29, 2024",
    href: "/blog/datadog",
    imageUrl: "static/blog/datadog/title.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "4 minute read",
  },
  {
    title:
      "A LangSmith Alternative that Takes LLM Observability to the Next Level",
    description:
      "Both Helicone and LangSmith are capable, powerful DevOps platform used by enterprises and developers building LLM applications. But which is better?",
    badgeText: "Compare",
    date: "Apr 18, 2024",
    href: "/blog/langsmith",
    imageUrl: "static/blog/langsmith-vs-helicone/cover-image.webp",
    authors: [
      {
        name: "Lina Lam",
        imageUrl: "/static/blog/linalam-headshot.webp",
      },
    ],
    time: "4 minute read",
  },
];

const Blog = () => {
  const TABS = ["Projects", "Integrations", "Customers"] as const;

  const [selectedTab, setSelectedTab] =
    useState<(typeof TABS)[number]>("Projects");

  return (
    <div className="w-full bg-[#F8FEFF] h-full antialiased relative text-black mb-[24px]">
      <div className="relative w-full flex flex-col h-full mt-[24px] items-center text-center">
        <Image
          src={"/static/community/hero.svg"}
          alt={"bouncing-cube"}
          width={200}
          height={100}
        />
        <h1 className="mt-[24px] text-3xl font-black text-gray-900">
          Community
        </h1>
        <p className="mt-[12px] text-sm sm:text-lg text-gray-700">
          All projects and companies we love who are using Helicone, and cool
          integrations.
        </p>
        <div className="mt-[24px] mb-[24px] flex flex-row h-[34px] text-gray-500 rounded-lg bg-[#F0F9FF] md:bg-transparent md:gap-5">
          {TABS.map((tab, i) => (
            <button
              key={`${tab}-${i}`}
              className={clsx(
                "w-full h-full flex justify-items-center items-center px-[24px] text-xs font-bold text-center my-auto ",
                selectedTab === tab
                  ? "bg-sky-500 text-white rounded-md"
                  : " text-sky-500 bg-[#F0F9FF] rounded-md"
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

export default Blog;
