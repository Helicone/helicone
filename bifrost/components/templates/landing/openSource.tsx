"use client"

import React from "react"
import { FaChevronRight } from "react-icons/fa6";
import Image from "next/image";


export default function OpenSource() {
    return (
        <div>
            <div className="md:text-center flex flex-col gap-3">
                <div className="flex flex-col gap-3 md:gap-6">
                    <h1 className="font-bold text-[32px] md:text-5xl">Proudly {" "}
                        <span className="text-sky-500">open-source</span>
                    </h1>
                    <p className="text-sm md:text-2xl font-light">We value transparency and we believe in the power of community. </p>
                </div>
                <div className="flex flex-col border rounded-lg items-start bg-sky-50 py-7 px-6 gap-3">
                    <h1 className="font-bold text-2xl">Join our community on Discord</h1>
                    <p className="text-sm text-gray-600">We appreciate all of Helicone’s contributors. You are welcome to join us on <span className="text-sky-500 font-semibold underline">Discord</span> or become a contributor!</p>
                    <button className="border rounded-lg bg-sky-500 text-white font-semibold px-3 py-[6px]">Fork Helicone <FaChevronRight className="inline w-3 h-4 pb-1"/> </button>
                    <div>
                        <Image 
                        src={"static/opensource/cube-design.svg"}
                        alt="cube"
                        height={150}
                        width={150}
                        />
                    </div>
                </div>
                <div className="flex flex-col border rounded-lg items-start bg-sky-50 py-7 px-6 gap-3 overflow-hidden">
                    <h1 className="font-bold text-2xl">Deploy on-prem</h1>
                    <p className="text-sm text-gray-600">Cloud-host or deploy on-prem with our production-ready HELM chart for maximum security. Chat with us about other options.</p>
                    <button className="border rounded-lg text-gray-600 font-semibold px-3 py-[6px]">Get in touch </button>
                    <div>
                        <Image 
                        src={"static/opensource/promo-cube.svg"}
                        alt="promo-cube"
                        height={200}
                        width={200}
                        className="translate-x-24 translate-y-5 scale-125"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}