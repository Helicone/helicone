"use client";

import React from "react";
import Image from "next/image";
import { AiOutlineDollarCircle } from "react-icons/ai";
import { HiOutlineTableCells } from "react-icons/hi2";



export default function Essentials() {
  return (
    <>
      <div className="max-w-6xl md:grid md:grid-cols-3 flex flex-col gap-6 md:gap-5 px-3">
        <div className="max-w-sm bg-gradient-to-b from-slate-200 border to-white rounded-xl shadow-d overflow-hidden mb-2 md:h-fit ">
          <div className="md:flex flex-col">
            <div className="p-3">
              <p className="text-[9px] text-gray-500 ml-4 px-1 mt-5 bg-slate-200 rounded-lg absolute">oai.hconeai.com /</p>
            </div>
            <div className="md:flex-shrink-0">
              <div className="flex items-center justify-between gap-2 p-4">
                <div className="bg-white rounded-lg py-2 pl-4 ">
                  <p className="text-blue-700 font-bold text-xs inline bg-blue-200 rounded-lg px-2 py-1">POST</p>
                  <p className="text-[9px] md:text-xs font-medium text-black inline-block pl-2 pr-4">
                    <span className="text-gray-200 ">|</span> v1 <span className="text-gray-400">/</span> chat <span className="text-gray-400">/</span> completions <span className="text-gray-400">/</span> query
                  </p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md ">
                  Send
                </button>
              </div>
              <div className="pl-4 pt-2">
                <div className="bg-white p-3 rounded-md gap-2">
                  <div className="flex justify-between py-2">
                    <p className="text-black font-semibold text-[9px]">Created At</p>
                    <p className="text-black font-semibold text-[9px]">Status</p>
                    <p className="text-black font-semibold text-[9px]">Latency</p>
                    <p className="text-black font-semibold text-[9px]">Cost</p>
                  </div>
                  <div className="flex justify-between border rounded-md border-slate-200 bg-gray-50 p-2 mb-2 ">
                    <p className="text-black text-[9px]">June 1 11:07 AM</p>
                    <p className="text-green-700 bg-green-50 font-medium border border-green-200 rounded-md text-[9px] px-2 ">Success</p>
                    <p className="text-black text-[9px]">0.417 s</p>
                    <p className="text-black text-[9px]">$0.000023</p>
                  </div>
                  <div className="flex justify-between border rounded-md border-slate-200 bg-gray-50 p-2 mb-2">
                    <p className="text-black text-[9px]">June 1 11:07 AM</p>
                    <p className="text-green-700 bg-green-50 font-medium border border-green-200 rounded-md text-[9px] px-2">Success</p>
                    <p className="text-black text-[9px]">0.333 s</p>
                    <p className="text-black text-[9px]">$0.000016</p>
                  </div>
                  <div className="flex justify-between rounded-md border-slate-200 bg-gray-50 py-4 px-2 mb-2 opacity-25">
                    <p className="text-black text-[9px]">June 1 11:05 AM</p>
                    <p className="text-green-700 bg-green-50 font-medium border border-green-200 rounded-md text-[9px] px-2">Success</p>
                    <p className="text-black text-[9px]">0.348 s</p>
                    <p className="text-black text-[9px]">$0.000027</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white md:flex md:flex-col gap-2">
                <p className="text-2xl text-blue-600 font-semibold">Send requests in seconds</p>
                <p className="text-gray-500 text-sm text-[16px]">Filter, segment and analyze your requests.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-md pt-3 pb-2 mb-3 md:col-span-2 bg-gradient-to-b from-slate-200 border to-white rounded-xl shadow-d overflow-hidden md:max-w-2xl">
          <div className="md:flex flex-col">
            <div className="flex text-center w-fit rounded-md bg-white mt-5 ml-36 mr-3 ">
              <button className="text-sky-500 bg-white font-semibold px-3 my-1 flex items-center border rounded-md shadow-lg">
                <AiOutlineDollarCircle className="inline-block h-6 w-6 text-center pr-2" />
                <span className="text-[10px]">Cost</span>
              </button>
              <button className="px-4 my-1 mr-1 font-semibold flex items-center bg-white">
                <HiOutlineTableCells className="inline-block h-6 w-6 pr-2" />
                <span className="text-[10px]">Requests</span>
              </button>
            </div>
            <div className="relative">
              <div className="relative pt-3 pb-5">
                <Image
                  className="translate-x-16 scale-125 mt-5 md:scale-100 md:translate-x-0 "
                  src={"/static/chart.svg"}
                  alt={"Chart"}
                  height={500}
                  width={600}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <p className="text-2xl text-blue-600 font-semibold">Instant analytics</p>
              <p className="text-gray-500 text-sm">Get detailed analytics such as latency, cost, time to first tokens.</p>
            </div>
          </div>
        </div>
        <div className="max-w-md pt-3 mb-3 bg-gradient-to-b from-slate-200 border to-white rounded-xl shadow-d overflow-hidden md:max-w-2xl md:col-span-2">
          <div className="flex flex-col mb-10 bg-white rounded-md translate-x-10">
            <h1 className="text-gray-700 bg-gray-100 text-[10px] border px-4 py-3">Version</h1>
            <h2 className="text-gray-700 text-[10px] px-4 py-4 border"><span className="font-medium bg-gray-100 rounded-md py-1 px-2">System</span>
              <p className="inline-block font-medium pl-3">{" "}This is a rap battle between <span className="bg-yellow-100 border rounded-md font-semibold p-1">person1</span> and</p>
              <p className="pl-16 font-medium">Here are the rules...</p>
            </h2>
            <h3 className="text-gray-700 text-[10px] px-4 py-4"><span className="bg-gray-100 rounded-md py-1 px-2">Assistant</span>
              <span className="ml-6 bg-yellow-100 border rounded-md font-semibold py-1 px-2 ">output</span>
            </h3>
          </div>
          <div className="p-4">
            <p className="text-2xl text-blue-600 font-semibold">Create prompt templates</p>
            <p className="text-gray-500 text-sm">Create variations of your prompts and collect a dataset of input and outputs. </p>
          </div>
        </div>
        <div className="max-w-sm pt-3 pb-2 mb-3 bg-gradient-to-b from-slate-200 border to-white rounded-xl shadow-d overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern bg-no-repeat bg-cover z-0"></div>
          <div className="relative z-10">
            <div className="bg-white p-4 mt-12 mb-3 rounded-xl shadow-md border border-gray-200 flex items-end justify-center flex-col -translate-x-10  ">
              <p className="text-gray-400 text-sm font-semibold mt-2 mb-3 pr-7">uptime 99.99%</p>
              <div className="flex justify-center items-center gap-1 mb-4 -translate-x-10 ">
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 "></div>
                <div className="h-[59px] w-3 bg-gradient-to-t from-green-400 to-blue-500 rounded-r-xl"></div>
              </div>
            </div>
            <div className="mt-6 px-5">
              <h2 className="text-2xl font-bold text-blue-600">99.99% uptime</h2>
              <p className="text-gray-500 mt-2 text-sm">Helicone leverages Cloudflare Workers to maintain low latency and high reliability.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

