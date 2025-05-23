"use client";

import { cn, ISLAND_WIDTH } from "@/lib/utils";
import { CircleStackIcon, TableCellsIcon } from "@heroicons/react/24/outline";
import {
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
  requests: "/static/home/requestsv3.webp",
  sessions: "/static/home/sessions.webp",
};

const Prototype = () => {
  const [openedPage, setOpenedPage] = useState<
    "dashboard" | "requests" | "sessions"
  >("dashboard");

  return (
    <div className="bg-white">
      <div className="w-full flex flex-col">
        <div className="w-full md:max-w-5xl max-w-7xl mx-auto px-0 relative z-10 bg-white">
          <div className="border-t border-b border-slate-200 p-0">
            <div className="hidden lg:flex w-full h-full">
              <div className="min-w-[200px] flex-shrink-0">
                <PrototypeSidebar
                  openedPage={openedPage}
                  setOpenedPage={setOpenedPage}
                />
              </div>
              <div className="flex-1 border-l border-slate-200 bg-[#f9fbfc]">
                <Image
                  src={IMG_PATH[openedPage]}
                  alt={openedPage}
                  width={1000}
                  height={500}
                  quality={100}
                  className="w-full h-full object-contain"
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
                className="w-full h-full object-contain"
                priority
              />
            </div>
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
  // Custom class for non-clickable items
  const nonClickableClass =
    "text-[12px] h-8 px-4 flex items-center text-slate-600 hover:bg-transparent cursor-default";

  return (
    <div className="bg-white h-full flex-1 rounded-l-xl overflow-y-auto">
      <div className="w-full flex flex-col h-full px-2">
        <div className="flex-grow overflow-y-hidden pb-14">
          <div className="flex items-center justify-between gap-2 h-14 mx-1">
            <div className="flex items-center justify-start w-full p-2 truncate hover:bg-transparent cursor-default">
              <RocketIcon className="mr-2 flex-shrink-0 h-4 w-4 text-[#5592F8]" />
              <p className="text-xs text-black font-semibold w-fit text-left">
                Xpedia AI
              </p>
            </div>
            <div className="w-6 h-6 flex items-center justify-center cursor-default">
              <ChevronLeftIcon className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="flex flex-col justify-between h-[calc(100%-16px)] ">
            {/* Navigation items */}
            <div className="flex flex-col justify-between">
              <div className="group flex flex-col py-2 data-[collapsed=true]:py-2 ">
                <nav className="grid gap-y-1 flex-grow overflow-y-auto group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                  <div
                    className={cn(
                      buttonVariants({
                        variant:
                          openedPage === "dashboard" ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "justify-start w-full text-[12px] h-8 px-4 cursor-pointer"
                    )}
                    onClick={() => setOpenedPage("dashboard")}
                  >
                    <div className="flex items-center">
                      <HomeIcon className="mr-2 h-4 w-4" />
                      <div className="relative">
                        Dashboard
                        {openedPage !== "dashboard" && (
                          <>
                            <div className="absolute w-1.5 h-1.5 bg-[#32ACEB] rounded-full top-[1px] right-[-9px]"></div>
                            <div className="absolute w-1.5 h-1.5 bg-[#32ACEB] rounded-full top-[1px] right-[-9px] animate-ping"></div>
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
                      "justify-start w-full text-[12px] h-8 px-4 cursor-pointer"
                    )}
                    onClick={() => setOpenedPage("requests")}
                  >
                    <div className="flex items-center">
                      <TableCellsIcon className="mr-2 h-4 w-4" />
                      <div className="relative">
                        Requests
                        {openedPage !== "requests" && (
                          <>
                            <div className="absolute w-1.5 h-1.5 bg-[#32ACEB] rounded-full top-[1px] right-[-9px]"></div>
                            <div className="absolute w-1.5 h-1.5 bg-[#32ACEB] rounded-full top-[1px] right-[-9px] animate-ping"></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 font-normal text-slate-400 mt-[10px] text-[11px]">
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
                      "justify-start w-full text-[12px] h-8 px-4 cursor-pointer"
                    )}
                    onClick={() => setOpenedPage("sessions")}
                  >
                    <div className="flex items-center">
                      <ListTreeIcon className="mr-2 h-4 w-4" />
                      <div className="relative">
                        Sessions
                        {openedPage !== "sessions" && (
                          <>
                            <div className="absolute w-1.5 h-1.5 bg-[#32ACEB] rounded-full top-[1px] right-[-9px]"></div>
                            <div className="absolute w-1.5 h-1.5 bg-[#32ACEB] rounded-full top-[1px] right-[-9px] animate-ping"></div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={nonClickableClass}>
                    <TagIcon className="mr-2 h-4 w-4" />
                    Properties
                  </div>
                  <div className={nonClickableClass}>
                    <UsersIcon className="mr-2 h-4 w-4" />
                    Users
                  </div>
                  <div className="flex items-center gap-1 px-2 font-normal text-slate-400 mt-[10px] text-[11px]">
                    <div className="flex items-center">
                      Improve
                      <ChevronDownIcon className="h-3 w-3 transition-transform" />
                    </div>
                  </div>
                  <div className={nonClickableClass}>
                    <ScrollTextIcon className="mr-2 h-4 w-4" />
                    Prompts
                  </div>
                  <div className={nonClickableClass}>
                    <TestTube2Icon className="mr-2 h-4 w-4" />
                    Playground
                  </div>
                  <div className={nonClickableClass}>
                    <CircleStackIcon className="mr-2 h-4 w-4" />
                    Datasets
                  </div>
                  <div className="flex items-center gap-1 px-2 font-normal text-slate-400 mt-[10px] text-[11px]">
                    <div className="flex items-center">
                      Developer
                      <ChevronRightIcon className="h-3 w-3 transition-transform" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 font-normal text-slate-400 mt-[10px] text-[11px]">
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
