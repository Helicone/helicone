"use client";

import { cn, ISLAND_WIDTH } from "@/lib/utils";
import { CircleStackIcon, TableCellsIcon } from "@heroicons/react/24/outline";
import {
  BeakerIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  ListTreeIcon,
  RocketIcon,
  ScrollTextIcon,
  SparklesIcon,
  TagIcon,
  TestTube2Icon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { Button, buttonVariants } from "../ui/button";
import Image from "next/image";

const IMG_PATH = {
  dashboard: "/static/home/dashboard.webp",
  requests: "/static/home/requests.webp",
  sessions: "/static/home/sessions.webp",
};

const Prototype = () => {
  const [openedPage, setOpenedPage] = useState<
    "dashboard" | "requests" | "sessions"
  >("dashboard");

  return (
    <div className="bg-gradient-to-b from-white from-50% via-[#f2f9fc80] via-[61%] to-[#f2f9fc]">
      <div className={cn(ISLAND_WIDTH, "pb-12 pt-6")}>
        <div className="aspect-[2/1] rounded-[20px] border border-[#D1D5DC] bg-white p-1 shadow-md lg:p-3">
          <div className="hidden h-full w-full grid-cols-6 rounded-xl border border-[#f0f0f0] bg-[#f8fafc] lg:grid">
            <PrototypeSidebar
              openedPage={openedPage}
              setOpenedPage={setOpenedPage}
            />
            <div className="col-span-5">
              <Image
                src={IMG_PATH[openedPage]}
                alt={openedPage}
                width={1000}
                height={500}
                quality={100}
                className="h-full w-full object-contain"
                priority
              />
            </div>
          </div>
          <div className="block lg:hidden">
            <Image
              src="/static/home/mobile/dashboard_with_sidebar.webp"
              alt="dashboard"
              width={1200}
              height={600}
              quality={90}
              className="h-full w-full object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const PrototypeSidebar = ({
  openedPage,
  setOpenedPage,
}: {
  openedPage: "dashboard" | "requests" | "sessions";
  setOpenedPage: (page: "dashboard" | "requests" | "sessions") => void;
}) => {
  return (
    <div className="h-full flex-1 overflow-y-auto rounded-l-xl border-r border-[#e5e7eb] bg-white">
      <div className="flex h-full w-full flex-col border-r px-2 dark:border-slate-800">
        <div className="flex-grow overflow-y-auto pb-14">
          <div className="mx-1 flex h-14 items-center justify-between gap-2 border-b dark:border-slate-800">
            <Button
              variant="ghost"
              className="flex w-full items-center justify-start truncate p-2"
            >
              <RocketIcon className="mr-2 h-4 w-4 flex-shrink-0 text-[#5592F8]" />
              <p className="w-fit text-left text-xs font-semibold text-black">
                Xpedia AI
              </p>
            </Button>
            <Button variant="ghost" size="icon">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex h-[calc(100%-16px)] flex-col justify-between">
            {/* Navigation items */}
            <div className="flex flex-col justify-between">
              <div className="group flex flex-col py-2 data-[collapsed=true]:py-2">
                <nav className="grid flex-grow gap-y-1 overflow-y-auto px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                  <div
                    className={cn(
                      buttonVariants({
                        variant:
                          openedPage === "dashboard" ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "h-8 w-full cursor-pointer justify-start px-2 text-[12px]"
                    )}
                    onClick={() => setOpenedPage("dashboard")}
                  >
                    <div className="flex items-center">
                      <HomeIcon className="mr-2 h-4 w-4" />
                      <div className="relative">
                        Dashboard
                        {openedPage !== "dashboard" && (
                          <>
                            <div className="absolute right-[-9px] top-[1px] h-1.5 w-1.5 rounded-full bg-[#32ACEB]"></div>
                            <div className="absolute right-[-9px] top-[1px] h-1.5 w-1.5 animate-ping rounded-full bg-[#32ACEB]"></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant:
                          openedPage === "requests" ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "h-8 w-full cursor-pointer justify-start px-2 text-[12px]"
                    )}
                    onClick={() => setOpenedPage("requests")}
                  >
                    <div className="flex items-center">
                      <TableCellsIcon className="mr-2 h-4 w-4" />
                      <div className="relative">
                        Requests
                        {openedPage !== "requests" && (
                          <>
                            <div className="absolute right-[-9px] top-[1px] h-1.5 w-1.5 rounded-full bg-[#32ACEB]"></div>
                            <div className="absolute right-[-9px] top-[1px] h-1.5 w-1.5 animate-ping rounded-full bg-[#32ACEB]"></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-[10px] flex items-center gap-1 text-[11px] font-normal text-slate-400">
                    <div className="flex items-center">
                      Segments
                      <ChevronDownIcon className="h-3 w-3 transition-transform" />
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant:
                          openedPage === "sessions" ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "h-8 w-full cursor-pointer justify-start px-2 text-[12px]"
                    )}
                    onClick={() => setOpenedPage("sessions")}
                  >
                    <div className="flex items-center">
                      <ListTreeIcon className="mr-2 h-4 w-4" />
                      <div className="relative">
                        Sessions
                        {openedPage !== "sessions" && (
                          <>
                            <div className="absolute right-[-9px] top-[1px] h-1.5 w-1.5 rounded-full bg-[#32ACEB]"></div>
                            <div className="absolute right-[-9px] top-[1px] h-1.5 w-1.5 animate-ping rounded-full bg-[#32ACEB]"></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      }),
                      "h-8 w-full justify-start px-2 text-[12px]"
                    )}
                  >
                    <div className="flex items-center">
                      <TagIcon className="mr-2 h-4 w-4" />
                      Properties
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      }),
                      "h-8 w-full justify-start px-2 text-[12px]"
                    )}
                  >
                    <div className="flex items-center">
                      <UsersIcon className="mr-2 h-4 w-4" />
                      Users
                    </div>
                  </div>
                  <div className="mt-[10px] flex items-center gap-1 text-[11px] font-normal text-slate-400">
                    <div className="flex items-center">
                      Improve
                      <ChevronDownIcon className="h-3 w-3 transition-transform" />
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      }),
                      "h-8 w-full justify-start px-2 text-[12px]"
                    )}
                  >
                    <div className="flex items-center">
                      <ScrollTextIcon className="mr-2 h-4 w-4" />
                      Prompts
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      }),
                      "h-8 w-full justify-start px-2 text-[12px]"
                    )}
                  >
                    <div className="flex items-center">
                      <TestTube2Icon className="mr-2 h-4 w-4" />
                      Playground
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      }),
                      "h-8 w-full justify-start px-2 text-[12px]"
                    )}
                  >
                    <div className="flex items-center">
                      <BeakerIcon className="mr-2 h-4 w-4" />
                      Experiments
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      }),
                      "h-8 w-full justify-start px-2 text-[12px]"
                    )}
                  >
                    <div className="flex items-center">
                      <SparklesIcon className="mr-2 h-4 w-4" />
                      Evaluators
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      }),
                      "h-8 w-full justify-start px-2 text-[11px]"
                    )}
                  >
                    <div className="flex items-center text-[11px]">
                      <CircleStackIcon className="mr-2 h-4 w-4" />
                      Datasets
                    </div>
                  </div>
                  <div className="mt-[10px] flex items-center gap-1 text-[11px] font-normal text-slate-400">
                    <div className="flex items-center">
                      Developer
                      <ChevronRightIcon className="h-3 w-3 transition-transform" />
                    </div>
                  </div>
                  <div className="mt-[10px] flex items-center gap-1 text-[11px] font-normal text-slate-400">
                    <div className="flex items-center">
                      Enterprise
                      <ChevronRightIcon className="h-3 w-3 transition-transform" />
                    </div>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prototype;
