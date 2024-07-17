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
      <div className="flex flex-col md:text-center w-full md:gap-4">
        <div className="flex flex-col md:items-center space-y-4 w-full md:py-6 ">
          <p className="text-[16px] md:text-lg font-bold text-blue-600">Enterprise</p>
          <h2 className="text-3xl md:text-5xl font-semibold sm:leading-[1.15]">
            Get to production-quality{" "}
            <span className="text-blue-600">faster</span>
          </h2>
        </div>
        <div>
          <button className="md:items-center w-fit px-3 py-[6px] md:px-6 md:py-3 text-blue-600 text-sm md:text-lg font-semibold border border-blue-600 rounded-lg md:tracking-wide">
            Get a demo
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-40">
        {prompts.map((pr) => (
          <div key={pr.title} className="flex flex-col md:text-left gap-2">
            <PiTerminalBold className="text-blue-700 h-6 w-6 pr-1 md:h-7 md:w-7" />
            <h1 className="font-bold text-[14px] md:text-lg">{pr.title} </h1>
            <p className="text-[14px] md:text-base font-light">{pr.description}</p>
          </div>
        ))}
      </div>
      <div className="md:grid md:grid-cols-3 md:gap-5 flex flex-col gap-6">
        <div className="w-full border border-gray-200 rounded-lg lg:flex lg:col-span-3 items-center justify-center overflow-hidden">
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 md:bg-[url('/static/enterprise/stripes.webp')] bg-repeat bg-sky-50 rounded-lg">
            <div className="col-span-1 w-full flex flex-col items-start p-8 text-left space-y-2 gap-3">
              <p className="text-blue-700 text-sm bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium lg:text-base">Experiments</p>
              <h1 className="font-semibold text-2xl text-blue-700 lg:text-[29.46px]">Run expirements on prompts</h1>
              <p className="text-gray-600 font-normal text-sm lg:text-[14.9px] ">Identify issues and analyze the performance of your prompt, by modifying it, changing the model or datasets.</p>
              <p className="text-blue-700 font-semibold text-sm">View docs <PiArrowUpRightLight className="text-blue-700 inline h-5 w-5" /> </p>
            </div>
            <div className="relative">
              <Image
                src={"static/enterprise/run-experiments.svg"}
                alt="run-exp"
                width={700}
                height={700}
                className="absolute translate-x-12 translate-y-8 scale-110 lg:translate-x-0 lg:scale-110"
              />
              <Image
                src={"/static/enterprise/output-2.0.webp"}
                alt="run-exp"
                width={400}
                height={400}
                className="translate-y-48 -translate-x-16 h-fit lg:translate-x-0 scale-75 "
              />
              <Image
                src={"/static/enterprise/output-2.1.webp"}
                alt="run-exp"
                width={400}
                height={400}
                className="translate-x-12 h-fit -translate-y-20 scale-75 lg:-translate-x-32 "
              />
            </div>
          </div>
        </div>
        <div className="w-full border border-gray-200 rounded-lg lg:flex lg:flex-col lg:col-span-2 items-center justify-center overflow-hidden">
          <div className="w-full grid grid-cols-1 bg-sky-50 md:bg-[url('/static/enterprise/stripes.webp')] bg-repeat rounded-lg">
            <div className="col-span-1 w-full flex flex-col items-start px-6 py-7 text-left space-y-2 gap-3">
              <p className="text-blue-700 text-sm bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium">Customer Portal</p>
              <h1 className="font-semibold text-2xl text-blue-700">Share analytics with your customers</h1>
              <p className="text-gray-600 font-normal text-sm">Access built-in customer usage dashboard, billing system and usage tracking by customers. </p>
              <p className="text-blue-700 font-semibold text-sm">Contact Us <PiArrowUpRightLight className="text-blue-700 inline h-5 w-5" /> </p>
            </div>
            <div className="lg:grid lg:grid-rows-1 relative">
              <Image
                src={"/static/enterprise/customer-portal.webp"}
                alt="cust-exp"
                width={500}
                height={500}
                className="translate-x-40 translate-y-6 scale-125 lg:translate-x-0 lg:scale-100"
              />
              <Image
                src={"/static/enterprise/set-limits.webp"}
                alt="limits-exp"
                width={200}
                height={200}
                className="-translate-y-20 "
              />

            </div>
          </div>
        </div>
        <div className="w-full h-fit border border-gray-200 rounded-lg items-center justify-center overflow-hidden">
          <div className="w-full grid grid-cols-1 bg-sky-50 md:bg-[url('/static/enterprise/stripes.webp')] bg-repeat rounded-lg">
            <div className="col-span-1 w-full flex flex-col items-start p-8 text-left space-y-2 gap-3">
              <p className="text-blue-700 text-sm bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium">ETL</p>
              <h1 className="font-semibold text-2xl text-blue-700">Bring data into your data warehouse</h1>
              <p className="text-gray-600 font-normal text-sm">Extracting, Transforming, and Loading (ETL) data from Helicone into your personal data warehouse.</p>
              <p className="text-blue-700 font-semibold text-sm">View docs <PiArrowUpRightLight className="text-blue-700 inline h-5 w-5" /> </p>
            </div>
            <div className="relative justify-center items-center p-8 hidden md:flex">
              <Image
                src={"/static/enterprise/customer-portal.webp"}
                alt="cust-exp"
                width={700}
                height={700}
                className="scale-150 translate-x-36 lg:scale-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enterprise;
