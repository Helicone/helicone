"use client";

import React from "react";
import Image from "next/image";
import { PiTerminalBold, PiArrowUpRightLight } from "react-icons/pi";
import { FiArrowRight } from "react-icons/fi";

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
      <div className="md:grid md:grid-cols-3 md:gap-4 flex flex-col gap-6">
        <div className="md:hidden w-full border border-gray-200 rounded-lg items-center justify-center overflow-hidden grid grid-cols-1 bg-sky-50 ">
          <div className="col-span-1 w-full flex flex-col items-start p-8 text-left space-y-2 gap-3">
            <p className="text-blue-700 text-sm bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium">Experiments</p>
            <h1 className="font-semibold text-2xl text-blue-700 ">Run expirements on prompts</h1>
            <p className="text-gray-600 font-normal text-sm">Identify issues and analyze the performance of your prompt, by modifying it, changing the model or datasets.</p>
            <p className="text-blue-700 font-semibold text-sm">View docs <PiArrowUpRightLight className="text-blue-700 inline h-5 w-5" /> </p>
          </div>
          <div className="relative">
            <Image
              src={"/static/enterprise/run-experiments.webp"}
              alt="run-exp"
              width={255}
              height={500}
              className="scale-150 translate-x-24 translate-y-10 h-fit"
            />
            <Image
              src={"/static/enterprise/output-2.0.webp"}
              alt="run-exp"
              width={210}
              height={400}
              className="translate-y-4 -translate-x-2 h-fit"
            />
            <Image
              src={"/static/enterprise/output-2.1.webp"}
              alt="run-exp"
              width={195}
              height={400}
              className="absolute -translate-y-40 translate-x-32 h-fit"
            />
            <Image
              src={"/static/enterprise/arrow-mobile.svg"}
              alt="run-exp"
              width={85}
              height={200}
              className="absolute -translate-y-16 translate-x-48"
            />

          </div>

        </div>

        <div className="hidden md:block w-full border border-gray-200 rounded-lg col-span-3 overflow-hidden bg-[url('/static/enterprise/stripes.webp')] bg-repeat bg-sky-50 grid-cols-2  ">
          <div className="grid grid-cols-2 ">
            <div className="col-span-1 w-full flex flex-col items-start p-8 text-left space-y-2 gap-3">
              <p className="text-blue-700 text-sm bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium lg:text-base">Experiments</p>
              <h1 className="font-semibold text-2xl text-blue-700 lg:text-[29.46px]">Run expirements on prompts</h1>
              <p className="text-gray-600 font-normal text-[14.9px] mr-12 ">Identify issues and analyze the performance of your {" "} prompt, by modifying it, changing the model or datasets.</p>
              <p className="text-blue-700 font-semibold text-lg">View docs <PiArrowUpRightLight className="text-blue-700 inline h-5 w-5 md:hidden" /><FiArrowRight className="text-blue-700 md:inline h-6 w-6 hidden" /> </p>
              <Image
                src={"/static/enterprise/output-2.0.webp"}
                alt="run-exp"
                width={400}
                height={400}
                className="translate-x-3 translate-y-6 h-fit "
              />
            </div>
            <div className="relative">
              <Image
                src={"/static/enterprise/run-experiments.webp"}
                alt="run-exp"
                width={400}
                height={400}
                className="scale-150 translate-x-4 translate-y-28 h-fit"
              />
              <Image
                src={"/static/enterprise/output-2.1.webp"}
                alt="run-exp"
                width={400}
                height={400}
                className="absolute -translate-x-24 h-fit"
              />
              <Image
                src={"/static/enterprise/arrow-lg.svg"}
                alt="run-exp"
                width={95}
                height={200}
                className="absolute -translate-x-32 translate-y-28 h-fit scale-75 "
              />
            </div>
          </div>
        </div>

        <div className="h-fit border border-gray-200 rounded-lg col-span-2 overflow-hidden hidden md:block w-full grid-cols-1 bg-sky-50 bg-[url('/static/enterprise/stripes.webp')] bg-repeat">
          <div className="col-span-1 flex flex-col items-start px-9 py-7 text-left space-y-2 gap-3 ">
            <p className="text-blue-700 bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium text-base">Customer Portal</p>
            <h1 className="font-semibold text-blue-700 lg:text-3xl">Share analytics with your customers</h1>
            <p className="text-gray-600 font-normal text-sm">Access built-in customer usage dashboard, billing system and usage tracking by customers. </p>
            <p className="text-blue-700 font-semibold text-lg flex gap-3">Contact Us <FiArrowRight className="text-blue-700 inline h-6 w-6 " /> </p>
          </div>
          <div className="flex flex-row ">
            <Image
              src={"/static/enterprise/set-limits.webp"}
              alt="limits-exp"
              width={200}
              height={200}
              className="translate-x-4 translate-y-5 scale-105 h-fit "
            />
            <Image
              src={"/static/enterprise/customer-portallg.webp"}
              alt="cust-exp"
              width={381}
              height={600}
              className="translate-x-20 -translate-y-5 scale-125 border rounded-lg shadow-2xl"
            />
          </div>
        </div>

        <div className="md:hidden border bg-sky-50 border-gray-200 rounded-lg items-center justify-center overflow-hidden ">
          <div className="col-span-1 flex flex-col items-start px-6 py-7 text-left space-y-2 gap-3">
            <p className="text-blue-700 text-sm bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium">Customer Portal</p>
            <h1 className="font-semibold text-2xl text-blue-700">Share analytics with your customers</h1>
            <p className="text-gray-600 font-normal text-sm">Access built-in customer usage dashboard, billing system and usage tracking by customers. </p>
            <p className="text-blue-700 font-semibold text-lg ">Contact Us <PiArrowUpRightLight className="text-blue-700 inline h-5 w-5" /> </p>
          </div>
          <div>
            <Image
              src={"/static/enterprise/customer-portal.webp"}
              alt="cust-exp"
              width={500}
              height={700}
              className="translate-x-36 scale-110 border rounded-lg shadow-2xl"
            />
            <Image
              src={"/static/enterprise/set-limits.webp"}
              alt="limits-exp"
              width={200}
              height={200}
              className="translate-x-3 -translate-y-36 scale-95 absolute"
            />
          </div>
        </div>



        <div className="h-fit border border-gray-200 rounded-lg items-center justify-center overflow-hidden ">
          <div className="w-full grid grid-cols-1 bg-sky-50 md:bg-[url('/static/enterprise/stripes.webp')] bg-repeat rounded-lg">
            <div className="col-span-1 w-full flex flex-col items-start p-8 text-left space-y-2 gap-3 lg:py-7 lg:pl-9">
              <p className="text-blue-700 text-sm bg-blue-100 w-fit border border-blue-700 py-[6px] px-4 rounded-lg font-medium lg:text-base">ETL</p>
              <h1 className="font-semibold text-2xl text-blue-700 lg:text-[28px]">Bring data into your data warehouse</h1>
              <p className="text-gray-600 font-normal text-sm lg:text-[14.9px]">Extracting, Transforming, and Loading (ETL) data from Helicone into your personal data warehouse.</p>
              <p className="text-blue-700 font-semibold text-sm lg:text-lg">View docs <PiArrowUpRightLight className="text-blue-700 inline h-5 w-5 md:hidden" /> <FiArrowRight className="text-blue-700 md:inline h-6 w-6 hidden" /> </p>
            </div>
            <div className="hidden md:block  ">
              <Image
                src={"/static/enterprise/etl-custportal.webp"}
                alt="cust-exp"
                width={310}
                height={400}
                className="translate-x-20 translate-y-1 border rounded-lg shadow-2xl scale-95"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enterprise;
