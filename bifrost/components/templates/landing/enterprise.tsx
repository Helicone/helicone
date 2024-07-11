"use client";

import React from "react";
import Image from "next/image";
import { PiTerminalBold } from "react-icons/pi";
import { PiArrowUpRightLight } from "react-icons/pi";

const prompts = [
  {
    title: "Scalability & Reliability",
    description: "Helicone is 100x more scalable than competitors, offering read and write abilities for millions of logs."
  },
  {
    title: "Sub-millisecond latency",
    description: "As a Gateway, we deploy using Cloudflare Workers to minimize response time while bringing smart analytics and convenience to you."
  },
  {
    title: "Risk-free Experimentation",
    description: "Evaluate the outputs of your new prompt without impacting production data (and have stats to back you up)."
  },
];

const Enterprise = () => {


  return (
    <div className="flex flex-col space-y-16 w-full px-3">
      <div className="flex md:text-center w-full">
        <div className="flex flex-col md:items-center space-y-4 w-full ">
          <p className="text-[16px] font-bold text-blue-600">Enterprise</p>
          <h2 className="text-3xl sm:text-5xl font-bold sm:leading-[1.15]">
            Get to production-quality{" "}
            <span className="text-blue-600">faster</span>
          </h2>
          <button className="md:items-center w-fit px-3 py-[6px] text-blue-600 text-sm font-semibold border border-blue-600 rounded-lg  ">
            Get a demo
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-40">
        {prompts.map((pr) => (
          <div key={pr.title} className="flex flex-col md:text-left gap-2">
            <PiTerminalBold className="text-blue-700 h-6 w-6 pr-1" />
            <h1 className="font-bold text-[14px]">{pr.title} </h1>
            <p className="text-[14px]">{pr.description}</p>
          </div>
        ))}
      </div>

      <div className="h-full w-full border border-gray-200 rounded-lg lg:flex items-center justify-center overflow-hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 h-full bg-sky-50 rounded-lg">
          <div className="col-span-1 h-full w-full flex flex-col items-start p-8 text-left space-y-2 gap-3">
            <p className="text-blue-700 text-sm bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium">Experiments</p>
            <h1 className="font-semibold text-2xl text-blue-700">Run expirements on prompts</h1>
            <p className="text-gray-600 font-normal text-sm">Identify issues and analyze the performance of your prompt, by modifying it, changing the model or datasets.</p>
            <p className="text-blue-700 font-semibold text-sm">View Doc <PiArrowUpRightLight className="text-blue-700 inline h-5 w-5"/> </p>
          </div>
          <div className="">
            <Image 
            src={"static/enterprise/run-experiments.svg"}
            alt="run-exp"
            width={500}
            height={500}
            className="translate-x-16 scale-125"
            />
            <Image 
            src={"static/enterprise/output-2.1.svg"}
            alt="run-exp"
            width={200}
            height={200}
            className="translate-x-32 -translate-y-24 h-fit"
            />
            <Image 
            src={"static/enterprise/output-2.0.svg"}
            alt="run-exp"
            width={200}
            height={200}
            className="-translate-y-36 h-fit"
            />
          </div>
        </div>
      </div><div className="h-full w-full border border-gray-200 rounded-lg lg:flex items-center justify-center overflow-hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 h-full bg-sky-50 rounded-lg">
          <div className="col-span-1 h-full w-full flex flex-col items-start px-6 py-7 text-left space-y-2 gap-3">
            <p className="text-blue-700 text-sm bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium">Customer Portal</p>
            <h1 className="font-semibold text-2xl text-blue-700">Share analytics with your customers</h1>
            <p className="text-gray-600 font-normal text-sm">Access built-in customer usage dashboard, billing system and usage tracking by customers. </p>
            <p className="text-blue-700 font-semibold text-sm">Contact Us <PiArrowUpRightLight className="text-blue-700 inline h-5 w-5"/> </p>
          </div>
          <div>
          <Image 
            src={"static/enterprise/customer-portal.svg"}
            alt="cust-exp"
            width={700}
            height={700}
            className="scale-150 translate-x-36"
            />
            <Image 
            src={"static/enterprise/set-limits.svg"}
            alt="limits-exp"
            width={200}
            height={200}
            className="-translate-y-20"
            />

          </div>
        </div>
      </div>
      <div className="h-full w-full border border-gray-200 rounded-lg lg:flex items-center justify-center overflow-hidden">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 h-full bg-sky-50 rounded-lg">
          <div className="col-span-1 h-full w-full flex flex-col items-start p-8 text-left space-y-2 gap-3">
            <p className="text-blue-700 text-sm bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium">ETL</p>
            <h1 className="font-semibold text-2xl text-blue-700">Bring data into your data warehouse</h1>
            <p className="text-gray-600 font-normal text-sm">Extracting, Transforming, and Loading (ETL) data from Helicone into your personal data warehouse.</p>
            <p className="text-blue-700 font-semibold text-sm">View Doc <PiArrowUpRightLight className="text-blue-700 inline h-5 w-5"/> </p>
          </div>
        </div>
        <div className="hidden md:flex">
        <Image 
            src={"static/enterprise/customer-portal.svg"}
            alt="cust-exp"
            width={700}
            height={700}
            className="scale-150 translate-x-36"
            />
        </div>
      </div>
    </div>
  );
};

export default Enterprise;
