"use client";

import { clsx } from "@/utils/clsx";
import { CheckIcon } from "@radix-ui/react-icons";
import { ReactNode, useCallback, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { TwoBillion } from "./TwoBillion";

const LightPurple = ({ className }: { className?: string }) => (
  <svg
    id="light-purple"
    className={className}
    width="1104"
    height="1631"
    viewBox="0 0 1104 1631"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_f_74_16707)">
      <circle cx="815.5" cy="815.5" r="415.5" fill="#FFD5FF" />
    </g>
    <defs>
      <filter
        id="filter0_f_74_16707"
        x="0"
        y="0"
        width="1631"
        height="1631"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur
          stdDeviation="200"
          result="effect1_foregroundBlur_74_16707"
        />
      </filter>
    </defs>
  </svg>
);

const Purple = ({ className }: { className?: string }) => (
  <svg
    id="purple"
    className={className}
    width="1277"
    height="869"
    viewBox="0 0 1277 869"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_f_74_16708)">
      <ellipse
        cx="880.738"
        cy="252.354"
        rx="493.5"
        ry="184.5"
        transform="rotate(-14.2572 880.738 252.354)"
        fill="#6233A9"
      />
    </g>
    <defs>
      <filter
        id="filter0_f_74_16708"
        x="0.251953"
        y="-363.877"
        width="1760.97"
        height="1232.46"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur
          stdDeviation="200"
          result="effect1_foregroundBlur_74_16708"
        />
      </filter>
    </defs>
  </svg>
);

const Blue = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="1442"
    height="1631"
    viewBox="0 0 1442 1631"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_f_74_16706)">
      <circle cx="815.5" cy="815.5" r="415.5" fill="#00E5FF" />
    </g>
    <defs>
      <filter
        id="filter0_f_74_16706"
        x="0"
        y="0"
        width="1631"
        height="1631"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur
          stdDeviation="200"
          result="effect1_foregroundBlur_74_16706"
        />
      </filter>
    </defs>
  </svg>
);

const Pink = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="1116"
    height="1231"
    viewBox="0 0 1116 1231"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_f_74_16709)">
      <path
        d="M407.5 483.158C504 418.658 1094 260.999 1195 -34.0007C1296 -329.001 1738.82 632.61 1460 793.658C1183.49 953.373 311 547.658 407.5 483.158Z"
        fill="url(#paint0_linear_74_16709)"
      />
    </g>
    <defs>
      <filter
        id="filter0_f_74_16709"
        x="0.0859375"
        y="-489.867"
        width="1950.73"
        height="1720.48"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur
          stdDeviation="200"
          result="effect1_foregroundBlur_74_16709"
        />
      </filter>
      <linearGradient
        id="paint0_linear_74_16709"
        x1="975.45"
        y1="-89.8672"
        x2="975.45"
        y2="830.617"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FF006B" />
        <stop offset="1" stopColor="#FF6DC1" />
      </linearGradient>
    </defs>
  </svg>
);

const Cube = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M31.502 11.25L28.127 9.2805M31.502 11.25V14.625M31.502 11.25L28.127 13.2195M4.50195 11.25L7.87695 9.2805M4.50195 11.25L7.87695 13.2195M4.50195 11.25V14.625M18.002 19.125L21.377 17.1555M18.002 19.125L14.627 17.1555M18.002 19.125V22.5M18.002 32.625L21.377 30.6555M18.002 32.625V29.25M18.002 32.625L14.627 30.6555M14.627 5.343L18.002 3.375L21.377 5.3445M31.502 21.375V24.75L28.127 26.7195M7.87695 26.7195L4.50195 24.75V21.375"
      stroke="url(#paint0_linear_83_18092)"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient
        id="paint0_linear_83_18092"
        x1="4.50195"
        y1="5.40625"
        x2="35.1128"
        y2="34.285"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#B490CF" />
        <stop offset="1" stopColor="#00E5FF" />
      </linearGradient>
    </defs>
  </svg>
);

const LightPurpleBottom = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="1631"
    height="1631"
    viewBox="0 0 1631 1631"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_f_203_10303)">
      <circle cx="815.5" cy="815.5" r="415.5" fill="#FFD5FF" />
    </g>
    <defs>
      <filter
        id="filter0_f_203_10303"
        x="0"
        y="0"
        width="1631"
        height="1631"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur
          stdDeviation="200"
          result="effect1_foregroundBlur_203_10303"
        />
      </filter>
    </defs>
  </svg>
);

const BlueBottom = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="1316"
    height="1511"
    viewBox="0 0 1316 1511"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g filter="url(#filter0_f_203_10079)">
      <ellipse
        cx="658"
        cy="755.5"
        rx="258"
        ry="355.5"
        fill="#00E5FF"
        fillOpacity="0.7"
      />
    </g>
    <defs>
      <filter
        id="filter0_f_203_10079"
        x="0"
        y="0"
        width="1316"
        height="1511"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur
          stdDeviation="200"
          result="effect1_foregroundBlur_203_10079"
        />
      </filter>
    </defs>
  </svg>
);

const PinkBottom = ({ className }: { className?: string }) => (
  <svg
    width="1697"
    height="1546"
    viewBox="0 0 1697 1546"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <g filter="url(#filter0_f_203_10078)">
      <path
        d="M405.779 864.404C481.001 812.131 940.91 684.357 1019.64 445.277C1098.37 206.196 1443.55 985.527 1226.21 1116.05C1010.67 1245.49 330.557 916.678 405.779 864.404Z"
        fill="url(#paint0_linear_203_10078)"
      />
    </g>
    <defs>
      <filter
        id="filter0_f_203_10078"
        x="0"
        y="0"
        width="1697"
        height="1546"
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity="0" result="BackgroundImageFix" />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="BackgroundImageFix"
          result="shape"
        />
        <feGaussianBlur
          stdDeviation="200"
          result="effect1_foregroundBlur_203_10078"
        />
      </filter>
      <linearGradient
        id="paint0_linear_203_10078"
        x1="848.5"
        y1="400"
        x2="848.5"
        y2="1146"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FF006B" />
        <stop offset="1" stopColor="#FF6DC1" />
      </linearGradient>
    </defs>
  </svg>
);

export default function ExperimentsWaitlist() {
  const [email, setEmail] = useState("");

  const scrollToForm = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: window.innerHeight + 300,
        behavior: "smooth",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      return;
    }

    try {
      const response = await fetch(
        "https://api.helicone.ai/v1/public/waitlist/experiments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        toast.success("Added to waitlist!");
      } else {
        console.error(result.error);
        toast.error(
          result.error.includes("duplicate")
            ? "You're already on the waitlist"
            : "Failed to add to waitlist"
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to add to waitlist");
    }
  };

  return (
    <div className="relative h-full min-h-[calc(100vh-65px)] w-full overflow-hidden">
      <div className="relative flex h-[calc(100vh-65px)] w-screen flex-col justify-center">
        <div
          id="content"
          className="z-[4] flex w-full flex-col px-4 sm:px-16 md:px-24 lg:px-28 xl:px-32 2xl:px-40"
        >
          <div className="mb-6 flex flex-row items-center gap-2 text-slate-700 md:gap-3 lg:mb-10">
            {/* <CubeTransparentIcon className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" /> */}
            <Cube className="h-5 w-5 lg:h-6 lg:w-6" />
            <div className="text-sm font-medium md:text-base lg:text-lg">
              Experiments
            </div>
          </div>
          <h1 className="mb-6 w-full max-w-3xl text-wrap text-5xl font-medium sm:text-7xl md:text-8xl lg:mb-10">
            A new way to improve your prompts.
          </h1>
          <div className="mb-6 flex flex-col gap-4 lg:mb-10">
            <div className="flex items-center gap-1.5">
              <CheckIcon className="text-brand h-5 w-5 lg:h-6 lg:w-6" />
              <p className="text-sm text-slate-700 md:text-base lg:text-lg">
                Test multiple prompts simultaneously over extensive datasets.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckIcon className="text-brand h-5 w-5 lg:h-6 lg:w-6" />
              <p className="text-sm text-slate-700 md:text-base lg:text-lg">
                Utilize real-world data to improve relevance of results.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckIcon className="text-brand h-5 w-5 lg:h-6 lg:w-6" />
              <p className="text-sm text-slate-700 md:text-base lg:text-lg">
                Move beyond subjective assessment.
              </p>
            </div>
          </div>
          <button
            onClick={scrollToForm}
            className="bg-brand self-start rounded-xl border-2 border-[#0569A0] px-8 py-3 text-base font-semibold text-white md:text-lg"
          >
            Join the waitlist
          </button>
        </div>
        <ExperimentsTable />
        <Purple className="absolute right-0 top-[-300px] z-[1]" />
        <Blue className="absolute -bottom-1/2 left-[35%] z-[1] h-[calc(100vh-65px)] w-screen -translate-x-1/2" />
        <Pink className="absolute left-0 top-0 z-[1] h-[calc(100vh-65px)] w-screen opacity-90" />
        <LightPurple className="absolute -bottom-3/4 right-0 z-[1]" />
      </div>
      <div className="z-[5] mx-4 mb-20 flex items-center justify-center lg:mb-52">
        <div className="z-[5] h-full w-full max-w-7xl">
          <video controls autoPlay loop className="z-[5] rounded-lg">
            <source
              src="https://marketing-assets-helicone.s3.us-west-2.amazonaws.com/experiments.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className="z-[5] mx-4 mb-60 flex flex-col items-stretch justify-center gap-3 sm:flex-row md:mb-80"
        id="waitlist-form"
      >
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="z-[5] w-full rounded-xl border-2 border-white bg-black/10 px-8 py-4 text-sm font-medium text-white placeholder:text-white focus:outline-none sm:w-[436px] md:text-lg"
        />
        <button
          type="submit"
          className="bg-brand z-[5] rounded-xl border-2 border-[#0569A0] px-8 py-4 text-sm font-medium font-semibold text-white md:text-lg"
        >
          Join the waitlist
        </button>
      </form>
      <LightPurpleBottom className="absolute left-[100px] z-[0] h-[calc(100vh-65px)] w-screen lg:-bottom-[250px]" />
      <BlueBottom className="absolute -bottom-[320px] left-1/3 z-[0] h-[calc(100vh-65px)] w-screen lg:-bottom-[250px]" />
      <PinkBottom className="absolute -bottom-[320px] -left-1/4 z-[0] h-[calc(100vh-65px)] w-screen lg:-bottom-[250px]" />
      <TwoBillion className="absolute -bottom-[180px] left-1/2 z-[5] m-0 w-[90vw] -translate-x-1/2 whitespace-nowrap p-0 leading-none md:-bottom-[150px]" />
      <Toaster />
    </div>
  );
}

const columns = [
  {
    name: "Topic",
    type: "Input",
  },
  {
    name: "Audience",
    type: "Input",
  },
  {
    name: "Messages",
    type: "Input",
  },
  {
    name: "Original",
    type: "Output",
  },
  {
    name: "Experiment 1",
    type: "Output",
  },
  {
    name: "Experiment 2",
    type: "Output",
  },
];

const data: {
  topic: string;
  audience: string;
  messages: string;
  original: string;
  experiment1: string;
  experiment2: string;
}[] = [
  {
    topic: "big bang",
    audience: "high schoolers",
    messages: `{"role": "system", "content": "Get...`,
    original: `generateOverview({ "title": "...`,
    experiment1: `generateOverview({ "title": "...`,
    experiment2: `generateOverview({ "title": "...`,
  },
  {
    topic: "big bang",
    audience: "high schoolers",
    messages: `{"role": "system", "content": "Get...`,
    original: `generateOverview({ "title": "...`,
    experiment1: `generateOverview({ "title": "...`,
    experiment2: `generateOverview({ "title": "...`,
  },
  {
    topic: "big bang",
    audience: "high schoolers",
    messages: `{"role": "system", "content": "Get...`,
    original: `generateOverview({ "title": "...`,
    experiment1: `generateOverview({ "title": "...`,
    experiment2: `generateOverview({ "title": "...`,
  },
  {
    topic: "big bang",
    audience: "high schoolers",
    messages: `{"role": "system", "content": "Get...`,
    original: `generateOverview({ "title": "...`,
    experiment1: `generateOverview({ "title": "...`,
    experiment2: `generateOverview({ "title": "...`,
  },
  {
    topic: "big bang",
    audience: "high schoolers",
    messages: `{"role": "system", "content": "Get...`,
    original: `generateOverview({ "title": "...`,
    experiment1: `generateOverview({ "title": "...`,
    experiment2: `generateOverview({ "title": "...`,
  },
  {
    topic: "big bang",
    audience: "high schoolers",
    messages: `{"role": "system", "content": "Get...`,
    original: `generateOverview({ "title": "...`,
    experiment1: `generateOverview({ "title": "...`,
    experiment2: `generateOverview({ "title": "...`,
  },
  {
    topic: "big bang",
    audience: "high schoolers",
    messages: `{"role": "system", "content": "Get...`,
    original: `generateOverview({ "title": "...`,
    experiment1: `generateOverview({ "title": "...`,
    experiment2: `generateOverview({ "title": "...`,
  },
  {
    topic: "big bang",
    audience: "high schoolers",
    messages: `{"role": "system", "content": "Get...`,
    original: `generateOverview({ "title": "...`,
    experiment1: `generateOverview({ "title": "...`,
    experiment2: `generateOverview({ "title": "...`,
  },
  {
    topic: "big bang",
    audience: "high schoolers",
    messages: `{"role": "system", "content": "Get...`,
    original: `generateOverview({ "title": "...`,
    experiment1: `generateOverview({ "title": "...`,
    experiment2: `generateOverview({ "title": "...`,
  },
];

const ExperimentsTable = () => {
  const [animationState, setAnimationState] = useState(
    Array(data.length).fill(Array(3).fill(0))
  );
  const [highlightState, setHighlightState] = useState(
    Array(data.length).fill(Array(3).fill(false))
  );

  const animateCell = useCallback((row: number, col: number) => {
    const generateTime = Math.random() * 500 + 500; // Random time between 500ms and 1000ms

    setAnimationState((prev) => {
      const newState = [...prev];
      newState[row] = [...newState[row]];
      newState[row][col] = 1;
      return newState;
    });

    setTimeout(() => {
      setAnimationState((prev) => {
        const newState = [...prev];
        newState[row] = [...newState[row]];
        newState[row][col] = 2;
        return newState;
      });

      setHighlightState((prev) => {
        const newState = [...prev];
        newState[row] = [...newState[row]];
        newState[row][col] = true;
        return newState;
      });

      setTimeout(() => {
        setHighlightState((prev) => {
          const newState = [...prev];
          newState[row] = [...newState[row]];
          newState[row][col] = false;
          return newState;
        });
      }, 2000);
    }, generateTime);
  }, []);

  const startAnimation = useCallback(() => {
    setAnimationState(Array(data.length).fill(Array(3).fill(0)));
    setHighlightState(Array(data.length).fill(Array(3).fill(false)));

    data.forEach((_, rowIndex) => {
      [0, 1, 2].forEach((colIndex) => {
        const delay = (rowIndex * 3 + colIndex) * 300 + Math.random() * 200;
        setTimeout(() => animateCell(rowIndex, colIndex), delay);
      });
    });
  }, [animateCell]);

  useEffect(() => {
    startAnimation();
    const intervalId = setInterval(startAnimation, 15000); // Run animation every 10 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount
  }, [startAnimation]);

  const getCellContent = (value: string, state: number): ReactNode => {
    if (state === 0)
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-700"></div>
          <div className="text-sm text-slate-700">Queued...</div>
        </div>
      );
    if (state === 1)
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-700"></div>
          <div className="text-sm text-slate-700">Generating...</div>
        </div>
      );
    return value;
  };

  return (
    <div className="absolute right-0 top-1/2 z-[2] w-full min-w-[1200px] -translate-y-1/2 overflow-visible opacity-20 md:opacity-100">
      <div className="relative overflow-visible rounded-lg">
        {/* Add a div for the glowing box shadow effect */}
        <div className="pointer-events-none absolute bottom-0 left-[66.66%] right-[16.67%] top-0 z-[3] rounded-lg shadow-[0_0_50px_20px_#FF006B30]"></div>

        <div className="relative z-[4] grid grid-cols-6">
          {columns.map((column, index) => (
            <div
              key={column.name}
              className={clsx(
                "flex items-center gap-[10px] px-6 py-3 text-sm font-semibold text-slate-900",
                index < 2
                  ? "opacity-0"
                  : index === 2
                    ? "opacity-10"
                    : index === 3
                      ? "opacity-20"
                      : index === 4
                        ? "rounded-t-lg border-x border-t border-white border-opacity-15 opacity-80"
                        : "opacity-50"
              )}
            >
              {column.name}
              <div className="rounded-md border border-slate-800 border-opacity-20 px-2 py-0.5 text-xs font-medium">
                {column.type}
              </div>
            </div>
          ))}
        </div>
        <div className="relative z-[4]">
          {data.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-6">
              {Object.entries(row).map(([key, value], colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={clsx(
                    "no-wrap truncate px-6 py-3 text-sm text-slate-700",
                    key === "experiment1" &&
                      rowIndex === data.length - 1 &&
                      "rounded-b-xl", // Add slight background to Experiment 1 cells

                    key === "experiment1" &&
                      "border-x border-y-[0.5px] border-white border-opacity-15",

                    (key === "original" ||
                      key === "experiment1" ||
                      key === "experiment2") &&
                      highlightState[rowIndex][
                        key === "original" ? 0 : key === "experiment1" ? 1 : 2
                      ]
                      ? "bg-white bg-opacity-20 backdrop-blur-lg backdrop-filter transition-all duration-300"
                      : "",
                    colIndex < 2
                      ? "opacity-0"
                      : colIndex === 2
                        ? "opacity-10"
                        : colIndex === 3
                          ? "opacity-20"
                          : colIndex === 4
                            ? "opacity-80" // Increased opacity for emphasis
                            : "opacity-50"
                  )}
                >
                  {key === "original" ||
                  key === "experiment1" ||
                  key === "experiment2"
                    ? getCellContent(
                        value,
                        animationState[rowIndex][
                          key === "original" ? 0 : key === "experiment1" ? 1 : 2
                        ]
                      )
                    : value}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
