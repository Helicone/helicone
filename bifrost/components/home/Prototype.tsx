"use client";

import { ISLAND_WIDTH } from "@/app/page";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button, buttonVariants } from "../ui/button";
import {
  BeakerIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  ListTreeIcon,
  NotepadTextIcon,
  RocketIcon,
  SparklesIcon,
  TagIcon,
  TestTube2Icon,
  UsersIcon,
} from "lucide-react";
import { CircleStackIcon, TableCellsIcon } from "@heroicons/react/24/outline";

const IMG_PATH = {
  dashboard: "/static/home/dashboard.png",
  requests: "/static/home/requests.png",
  sessions: "/static/home/sessions.png",
};

const Prototype = () => {
  const [openedPage, setOpenedPage] = useState<
    "dashboard" | "requests" | "sessions"
  >("dashboard");

  return (
    <div className=" bg-gradient-to-b from-white from-50% via-[#f2f9fc80] via-[61%] to-[#f2f9fc]">
      <div className={cn(ISLAND_WIDTH, "py-12")}>
        <div className="bg-white rounded-[20px] p-3 border border-[#D1D5DC] aspect-[2/1] shadow-md">
          <div className="hidden lg:grid w-full h-full bg-[#f8fafc] border border-[#f0f0f0] rounded-xl grid-cols-6">
            <PrototypeSidebar
              openedPage={openedPage}
              setOpenedPage={setOpenedPage}
            />
            <div className="col-span-5">
              <img
                src={IMG_PATH[openedPage]}
                alt={openedPage}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="block lg:hidden">
            <img
              src="/static/home/dashboard_with_sidebar.png"
              alt="dashboard"
              className="w-full h-full object-contain"
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
    <div className="bg-white border-r border-[#e5e7eb] h-full flex-1 rounded-l-xl overflow-y-auto">
      <div className="w-full flex flex-col h-full border-r dark:border-slate-800">
        <div className="flex-grow overflow-y-auto pb-14">
          <div className="flex items-center justify-between gap-2 h-14 border-b dark:border-slate-800 mx-1">
            <Button
              variant="ghost"
              className="flex items-center justify-start w-full p-2 truncate"
            >
              <RocketIcon className="mr-2 flex-shrink-0 h-4 w-4 text-[#5592F8]" />
              <p className="text-xs text-black font-semibold w-fit text-left">
                Xpedia AI
              </p>
            </Button>
            <Button variant="ghost" size="icon">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col justify-between h-[calc(100%-16px)]">
            {/* Navigation items */}
            <div className="flex flex-col justify-between">
              <div className="group flex flex-col py-2 data-[collapsed=true]:py-2 ">
                <nav className="grid flex-grow overflow-y-auto px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
                  <div
                    className={cn(
                      buttonVariants({
                        variant:
                          openedPage === "dashboard" ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "justify-start w-full text-[12px] h-8 px-2 cursor-pointer"
                    )}
                    onClick={() => setOpenedPage("dashboard")}
                  >
                    <div className="flex items-center">
                      <HomeIcon className="mr-2 h-4 w-4" />
                      Dashboard
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant:
                          openedPage === "requests" ? "secondary" : "ghost",
                        size: "sm",
                      }),
                      "justify-start w-full text-[12px] h-8 px-2 cursor-pointer"
                    )}
                    onClick={() => setOpenedPage("requests")}
                  >
                    <div className="flex items-center">
                      <TableCellsIcon className="mr-2 h-4 w-4" />
                      <div className="relative">
                        Requests
                        <div className="absolute w-1.5 h-1.5 bg-[#32ACEB] rounded-full top-[-1px] right-[-5px]"></div>
                        <div className="absolute w-1.5 h-1.5 bg-[#32ACEB] rounded-full top-[-1px] right-[-5px] animate-ping"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-normal text-slate-400 text-xs mt-[10px] text-[11px]">
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
                      "justify-start w-full text-[12px] h-8 px-2 cursor-pointer"
                    )}
                    onClick={() => setOpenedPage("sessions")}
                  >
                    <div className="flex items-center">
                      <ListTreeIcon className="mr-2 h-4 w-4" />
                      <div className="relative">
                        Sessions
                        <div className="absolute w-1.5 h-1.5 bg-[#32ACEB] rounded-full top-[-1px] right-[-5px]"></div>
                        <div className="absolute w-1.5 h-1.5 bg-[#32ACEB] rounded-full top-[-1px] right-[-5px] animate-ping"></div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      }),
                      "justify-start w-full text-[12px] h-8 px-2"
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
                      "justify-start w-full text-[12px] h-8 px-2"
                    )}
                  >
                    <div className="flex items-center">
                      <UsersIcon className="mr-2 h-4 w-4" />
                      Users
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-normal text-slate-400 text-xs mt-[10px] text-[11px]">
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
                      "justify-start w-full text-[12px] h-8 px-2"
                    )}
                  >
                    <div className="flex items-center">
                      <NotepadTextIcon className="mr-2 h-4 w-4" />
                      Prompts
                    </div>
                  </div>
                  <div
                    className={cn(
                      buttonVariants({
                        variant: "ghost",
                        size: "sm",
                      }),
                      "justify-start w-full text-[12px] h-8 px-2"
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
                      "justify-start w-full text-[12px] h-8 px-2"
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
                      "justify-start w-full text-[12px] h-8 px-2"
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
                      "justify-start w-full text-[12px] h-8 px-2"
                    )}
                  >
                    <div className="flex items-center">
                      <CircleStackIcon className="mr-2 h-4 w-4" />
                      Datasets
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-normal text-slate-400 text-xs mt-[10px] text-[11px]">
                    <div className="flex items-center">
                      Datasets
                      <ChevronRightIcon className="h-3 w-3 transition-transform" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-normal text-slate-400 text-xs mt-[10px] text-[11px]">
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
