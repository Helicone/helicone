/* eslint-disable @next/next/no-img-element */
/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { StarIcon } from "@heroicons/react/20/solid";
import AdvancedAnalytics from "./AdvancedAnalytics";
import { useRouter } from "next/router";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { DEMO_EMAIL } from "../../../lib/constants";
import Details from "./detailsV2";
import BasePageV2 from "../../shared/layout/basePageV2";

import { useState } from "react";
import OnboardingButton from "../../shared/auth/onboardingButton";
import {
  ArrowPathIcon,
  ChevronRightIcon,
  CloudArrowUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { BaseUrlInstructions } from "../welcome/welcomePage";
import { clsx } from "../../shared/clsx";
import Link from "next/link";
import { Dialog } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import Logos from "./logos";
import { CloudIcon } from "@heroicons/react/24/solid";

const timeline = [
  {
    name: "Founded company",
    description:
      "After years of working as software engineers, we quit our jobs looking to build within the generative AI space.",
    date: "Jan 2023",
    dateTime: "2023-01",
  },
  {
    name: "Backed by Y Combinator",
    description:
      "We were accepted into YCombinator's Winter 2023 batch and have been working closely with the YC partners.",
    date: "Jan 2023",
    dateTime: "2023-01",
  },
  {
    name: "Launched Helicone",
    description:
      "After building multiple LLM apps and struggling with the lack of good monitoring and observability tools, we decided to build Helicone.",
    date: "Feb 2022",
    dateTime: "2023-02",
  },
  {
    name: "5 million requests",
    description:
      "We reached 5 million requests in just over a months time, and we're just getting started.",
    date: "Mar 2023",
    dateTime: "2023-03",
  },
];

const testimonials = [
  [
    [
      {
        body: `Keeping costs under control was a huge issue 2-3 weeks ago but we are now profitable per user.
        We leveraged a mix of caching, model-swapping, fine-tuning, and product updates to get here
        @helicone_ai has been a godsend for LLM cost analytics, especially cost/user`,
        author: {
          name: "Daniel Habib",
          handle: "DannyHabibs",
          imageUrl: "/assets/daniel-habib.png",
        },
      },
    ],
    [
      {
        body: "My favourite of the new AI apps? @helicone_ai - Observability for @OpenAI is pretty bad. Hard to track bills and specific usage with native tools. I see Helicone as the next @datadoghq",
        author: {
          name: "John Ndege",
          handle: "johnndege",
          imageUrl: "/assets/john-ndege.png",
        },
      },
      // More testimonials...
    ],
  ],
  [
    [
      {
        body: `I'm now using Helicone and it's a major QoL improvement while deving on LLMs

        Add one line to your python/JS OpenAI project and get
        - input/output logging
        - user-level metrics
        - caching (soon)
        
        Also OSS 👏`,
        author: {
          name: "Jay Hack",
          handle: "mathemagic1an",
          imageUrl: "/assets/jay-hack.png",
        },
      },
      // More testimonials...
    ],
    [
      {
        body: `As an early-stage startup, speed is everything at Trelent. Helicone helps us quickly understand user behaviour when we're iterating with OpenAI, shorten our testing cycles.`,
        author: {
          name: "Calum Bird",
          handle: "calumbirdo",
          imageUrl: "/assets/calum-bird.png",
        },
      },
      // More testimonials...
    ],
  ],
];

export default function HomePage() {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const [demoLoading, setDemoLoading] = useState(false);
  if (!demoLoading && user?.email === DEMO_EMAIL) {
    supabaseClient.auth.signOut();
  }
  const { data: globalMetrics } = useQuery({
    queryKey: ["global_metrics"],
    queryFn: async () => {
      const data = fetch("/api/global_metrics").then((res) => res.json());
      return data;
    },
  });

  return (
    <div className="flex-col w-full">
      <div className="bg-gray-50">
        <div className="flex flex-row px-8 py-4 mx-auto max-w-7xl border-r-2 border-l-2 border-gray-300 border-dashed justify-between">
          <div className="flex flex-row gap-12 items-center">
            <img
              className="rounded-lg"
              alt="Helicone-logo"
              src="/assets/landing/helicone.webp"
              width={150}
              height={150 / (1876 / 528)}
            />
            <a href="#" className="text-md font-semibold text-gray-900">
              Pricing
            </a>
            <a href="#" className="text-md font-semibold text-gray-900">
              Documentation
            </a>
            <a href="#" className="text-md font-semibold text-gray-900">
              Roadmap
            </a>
            <a href="#" className="text-md font-semibold text-gray-900">
              Github
            </a>
          </div>
          <button className="px-4 py-2 border border-gray-900 font-semibold text-gray-900 rounded-lg">
            Sign In
          </button>
        </div>
      </div>
      <div className="bg-gray-50">
        <div className="px-8 grid grid-cols-4 h-full max-w-7xl mx-auto border-r-2 border-l-2 border-gray-300 border-dashed w-full items-center justify-center">
          <div className="col-start-1 col-span-2 space-y-12 h-[80vh] justify-center flex flex-col">
            <div className="text-7xl font-bold text-gray-900 text-left space-y-2">
              <p>Build the future</p>
              <p className="bg-clip-text text-transparent pb-1 bg-gradient-to-r from-sky-500 via-pink-500 to-violet-500">
                Effortlessly
              </p>

              {/* <p className="bg-sky-300 p-2 rounded-lg w-fit">Generative AI</p> */}
            </div>
            <p className="text-lg leading-8 text-gray-600">
              We're committed to helping{" "}
              <span className="underline underline-offset-2 decoration-dashed">
                LLM-developers
              </span>{" "}
              like you spend less time on complex AI management tasks and more
              time innovating. Let our{" "}
              <span className="underline underline-offset-2 decoration-dashed">
                open-source
              </span>{" "}
              tools streamline your workflow and unlock your full creative and
              development potential.
            </p>
            <div className="flex flex-row gap-8">
              <button className="px-4 py-2 bg-gray-800 font-semibold text-white rounded-lg">
                Get Started
              </button>
              <button className="underline underline-offset-2 font-semibold text-gray-900">
                View Demo
              </button>
            </div>
          </div>
          <div className="col-span-2 h-[80vh] flex flex-col items-center justify-center align-middle relative">
            <div className="bg-sky-300 rounded-lg h-1/4 w-[45%] p-4 flex flex-col justify-between z-30 shadow-md">
              <p className="font-semibold text-sky-900 text-lg">
                Tokens per Request
              </p>
              <p className="font-semibold text-sky-900 text-5xl text-right">
                124
              </p>
            </div>
            <div className="bg-pink-300 rounded-lg h-1/4 w-2/5 p-4 flex flex-col justify-between absolute left-[15%] top-[27.5%] z-20 shadow-md">
              <p className="font-semibold text-pink-900 text-lg">User Growth</p>
              <p className="font-semibold text-pink-900 text-5xl text-right">
                1,534
              </p>
            </div>
            <div className="bg-violet-300 rounded-lg h-[30%] w-[45%] p-4 flex flex-col justify-between absolute right-[12.5%] top-[20%] z-10 shadow-md">
              <p className="font-semibold text-violet-900 text-lg">
                Cache Hits
              </p>
              <p className="font-semibold text-violet-900 text-5xl text-right">
                5,421
              </p>
            </div>
          </div>
          <div className="col-span-4 grid grid-cols-4 gap-8 pb-32">
            <img
              className="col-span-1 max-h-12 w-full object-contain lg:col-span-1"
              src="https://tailwindui.com/img/logos/158x48/transistor-logo-gray-900.svg"
              alt="Transistor"
              width={158}
              height={48}
            />
            <img
              className="col-span-1 max-h-12 w-full object-contain lg:col-span-1"
              src="https://tailwindui.com/img/logos/158x48/transistor-logo-gray-900.svg"
              alt="Transistor"
              width={158}
              height={48}
            />
            <img
              className="col-span-1 max-h-12 w-full object-contain lg:col-span-1"
              src="https://tailwindui.com/img/logos/158x48/transistor-logo-gray-900.svg"
              alt="Transistor"
              width={158}
              height={48}
            />
            <img
              className="col-span-1 max-h-12 w-full object-contain lg:col-span-1"
              src="https://tailwindui.com/img/logos/158x48/transistor-logo-gray-900.svg"
              alt="Transistor"
              width={158}
              height={48}
            />
            <img
              className="col-span-1 max-h-12 w-full object-contain lg:col-span-1"
              src="https://tailwindui.com/img/logos/158x48/transistor-logo-gray-900.svg"
              alt="Transistor"
              width={158}
              height={48}
            />
            <img
              className="col-span-1 max-h-12 w-full object-contain lg:col-span-1"
              src="https://tailwindui.com/img/logos/158x48/transistor-logo-gray-900.svg"
              alt="Transistor"
              width={158}
              height={48}
            />
            <img
              className="col-span-1 max-h-12 w-full object-contain lg:col-span-1"
              src="https://tailwindui.com/img/logos/158x48/transistor-logo-gray-900.svg"
              alt="Transistor"
              width={158}
              height={48}
            />
            <img
              className="col-span-1 max-h-12 w-full object-contain lg:col-span-1"
              src="https://tailwindui.com/img/logos/158x48/transistor-logo-gray-900.svg"
              alt="Transistor"
              width={158}
              height={48}
            />
          </div>
        </div>
      </div>
      <div className="bg-gray-100">
        <div className="px-8 pb-24 relative grid grid-cols-4 h-full max-w-7xl mx-auto border-r-2 border-l-2 border-gray-300 border-dashed w-full items-center justify-center">
          <div className="flex flex-col col-span-2 space-y-8 py-32">
            <p className="text-lg text-sky-500 tracking-wide font-semibold">
              Unparalleled Observability
            </p>
            <p className="text-5xl text-gray-900 font-semibold">
              Understand your large-language model usage like never before
            </p>
            <p className="text-xl text-gray-500 leading-9">
              Navigating the vast landscape of AI and large language models can
              be complex. That’s why we've built an observability tool that
              simplifies the process and amplifies understanding. We provide you
              with comprehensive insights, allowing you to deeply understand
              your AI's behavior, performance, and potential bottlenecks.
            </p>
          </div>
          <div className="flex flex-col col-span-2 h-full sticky top-[5%] 2xl:top-[10%]">
            <div className="m-16 border border-gray-300 bg-white h-full rounded-lg shadow-md"></div>
          </div>
          <div className="flex flex-col col-span-2 space-y-8 py-32">
            <p className="text-lg text-pink-500 tracking-wide font-semibold">
              User-Rate Limiting
            </p>
            <p className="text-5xl text-gray-900 font-semibold">
              Protect Your Resources, Without Compromising Service
            </p>
            <p className="text-xl text-gray-500 leading-9">
              In the fast-paced world of AI, resource management is key. With
              our robust User Rate Limiting feature, you can ensure your Large
              Language Model (LLM) endpoints are safeguarded against excessive
              requests. We've made it simple and seamless to limit the frequency
              of user access, all without hampering your service quality or user
              experience.
            </p>
          </div>
          <div className="flex flex-col col-span-2 col-start-1 space-y-8 py-32">
            <p className="text-lg text-purple-500 tracking-wide font-semibold">
              Bucket Cache
            </p>
            <p className="text-5xl text-gray-900 font-semibold">
              Optimize Your Resources, Enhance Your Efficiency
            </p>
            <p className="text-xl text-gray-500 leading-9">
              In today's dynamic AI landscape, efficient resource utilization is
              paramount. That's why we've innovated with our new Bucket Cache
              feature, allowing you to cache any number of responses for a given
              request. No longer will you need to expend valuable resources
              hitting the LLM-endpoint repeatedly with identical requests.
            </p>
          </div>
        </div>
      </div>
      <div className="bg-[#0a2540] h-full">
        <div className="px-8 pb-16 relative grid grid-cols-4 h-full max-w-7xl mx-auto border-r-2 border-l-2 border-gray-400 border-dashed w-full items-center justify-center">
          <div className="col-span-2 flex flex-col space-y-12 py-32">
            <p className="text-lg text-sky-400 tracking-wide font-semibold">
              Made By Developers, For Developers
            </p>
            <p className="text-5xl text-white font-semibold">
              Tailored Solutions for Your Unique Needs
            </p>
            <p className="text-xl text-gray-400 leading-9">
              Your AI tools should adapt to your unique workflow, not the other
              way around. That's why we've incorporated extensive support for a
              range of integrations, along with comprehensive GraphQL support
              and flexible deployment options. Now, you can work the way you
              want, with the tools you prefer.
            </p>
            <div>
              <button className="px-4 py-2 bg-sky-400 font-semibold text-gray-900 rounded-lg">
                View Docs
              </button>
            </div>
          </div>
          <div className="flex flex-col col-span-2 h-full">
            <div className="m-16 bg-sky-900 h-full rounded-lg shadow-md"></div>
          </div>
        </div>
      </div>
      <div className="bg-gray-50">
        <div className="px-8 grid grid-cols-4 gap-24 h-full max-w-7xl mx-auto border-r-2 border-l-2 border-gray-300 border-dashed w-full items-center justify-center">
          <div className="col-span-2 flex flex-col space-y-8 py-32">
            <p className="text-4xl text-sky-500 tracking-wide font-semibold">
              Open Source
            </p>
            <p className="text-2xl text-gray-900 font-semibold">
              Open-source is more than a choice—it's a commitment to
              user-centric development, community collaboration, and absolute
              transparency.
            </p>
            <div className="flex flex-row gap-8">
              <button className="px-4 py-2 bg-gray-800 font-semibold text-white rounded-lg">
                Star us on GitHub
              </button>
              <button className="underline underline-offset-2 font-semibold text-gray-900">
                View Roadmap
              </button>
            </div>
          </div>
          <div className="flex flex-col col-span-1 h-full py-32 space-y-4">
            <div className="flex flex-col space-y-2">
              <CloudIcon className="h-8 w-8 inline" />
              <p className="text-gray-900 font-semibold text-lg">
                Cloud Solution
              </p>
            </div>
            <p className="text-gray-500">
              We offer a fully-managed cloud solution, allowing you to focus on
              what matters most.
            </p>
            <div>
              <button className="underline underline-offset-2 font-semibold text-gray-900">
                View Pricing
              </button>
            </div>
          </div>
          <div className="flex flex-col col-span-1 h-full py-32 space-y-4">
            <div className="flex flex-col space-y-2">
              <CloudArrowUpIcon className="h-8 w-8 inline" />
              <p className="text-gray-900 font-semibold text-lg">AWS Deploy</p>
            </div>
            <p className="text-gray-500">
              Deploy your own instance of Helicone on AWS, with just a few
              clicks.
            </p>
            <div>
              <button className="underline underline-offset-2 font-semibold text-gray-900">
                View Docs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
