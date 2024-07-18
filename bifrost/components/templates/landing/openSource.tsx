"use client"

import React from "react"
import { FaChevronRight } from "react-icons/fa6";
import Image from "next/image";

const profiles = [
  {
    name: "flexchar",
    image: (
      <div>
        <Image
          src={"static/opensource/flexchar.svg"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "umuthopeyildirim",
    image: (
      <div>
        <Image
          src={"static/opensource/umuthopeyildirim.svg"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "asim-shrestha",
    image: (
      <div>
        <Image
          src={"/static/opensource/asim-shrestha.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "h4r5h4",
    image: (
      <div>
        <Image
          src={"/static/opensource/h4r5h4.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "LevanKvirkvelia",
    image: (
      <div>
        <Image
          src={"/static/opensource/LevanKvirkvelia.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "skrish13",
    image: (
      <div>
        <Image
          src={"/static/opensource/skrish13.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "andrewtran10",
    image: (
      <div>
        <Image
          src={"/static/opensource/andrewtran10.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "fauh45",
    image: (
      <div>
        <Image
          src={"/static/opensource/fauh45.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "dapama",
    image: (
      <div>
        <Image
          src={"/static/opensource/dapama.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "crabsinger",
    image: (
      <div>
        <Image
          src={"/static/opensource/crabsinger.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "waynehamaadi",
    image: (
      <div>
        <Image
          src={"/static/opensource/waynehamaadi.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "joshcolts18",
    image: (
      <div>
        <Image
          src={"/static/opensource/joshcolts18.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "borel",
    image: (
      <div>
        <Image
          src={"static/opensource/borel.svg"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },
  {
    name: "beydogan",
    image: (
      <div>
        <Image
          src={"/static/opensource/beydogan.webp"}
          alt=""
          className="w-7 h-7 rounded-full border"
          height={50}
          width={50}
        />
      </div>
    ),
  },

]

export default function OpenSource() {
  return (
    <div>
      <div className="flex flex-col gap-6 lg:gap-24">
        <div className="flex flex-col gap-3 md:gap-6">
          <h1 className="font-bold text-[32px] md:text-5xl">Proudly {" "}
            <span className="text-sky-500">open-source</span>
          </h1>
          <p className="text-sm md:text-2xl font-light">We value transparency and we believe in the power of community. </p>
        </div>
        <div className="md:flex md:flex-row md:gap-5 flex flex-col gap-6 ">
          <div className=" w-full border rounded-lg items-start bg-sky-50 py-7 px-6 gap-3 overflow-hidden">
            <div className="flex flex-col gap-6 lg:text-left">
              <h1 className="font-bold text-2xl lg:text-[26.9px]">Join Our Community on Discord</h1>
              <p className="text-sm lg:text-lg text-gray-600">We appreciate all of Helicone’s contributors. You are welcome to join us on <span className="text-sky-500 font-semibold underline">Discord</span> or become a contributor!</p>
              <button className="border w-fit border-sky-800 rounded-lg bg-sky-500 text-white font-semibold px-3 py-[6px]">Fork Helicone <FaChevronRight className="inline w-3 h-4 pb-1" /> </button>
            </div>
            <div className="md:flex md:flex-row flex-wrap">
              <div className="flex flex-wrap gap-2 mt-4">
                {profiles.map((profile, index) => (
                  <div key={index} className="flex flex-wrap gap-3 w-fit items-center border rounded-full border-sky-500 px-3 py-2">
                    {profile.image}
                    <span className="text-[12px] text-gray-800 font-light">{profile.name}</span>
                  </div>
                ))}
              </div>
            </div>
              <Image
                src={"static/opensource/cube-design.svg"}
                alt="cube"
                height={150}
                width={150}
                className="md:-order-1 md:scale-125"
              />
          </div>
          <div className="flex flex-col border rounded-lg items-start bg-sky-50 py-7 px-6 gap-6 overflow-hidden lg:text-left">
            <h1 className="font-bold text-2xl lg:text-[26.9px]">Deploy On-Prem</h1>
            <p className="text-sm lg:text-lg text-gray-600">Cloud-host or deploy on-prem with our production-ready HELM chart for maximum security. Chat with us about other options.</p>
            <button className="border border-gray-300 rounded-lg text-gray-600 lg:text-[17.29px] font-semibold px-3 py-[6px]">Get in touch </button>
            <div>

              <Image
                src={"/static/opensource/promo-cube.webp"}
                alt="promo-cube"
                height={500}
                width={500}
                className="translate-x-20 translate-y-7 "
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}