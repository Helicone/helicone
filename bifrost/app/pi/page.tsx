"use client";

import { JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import { useHeliconeLogin } from "./useHeliconeLogin";
import { useTestAPIKey } from "./first_page/useTestApiKey";
import { Suspense } from "react";
import Link from "next/link";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

const PiPageContent = () => {
  return (
    <div
      className={`w-full flex flex-col justify-center items-center h-[100vh] ${jetbrainsMono.className}`}
    >
      <h1 className={`text-3xl font-extrabold truncate max-w-[80vw]  py-2`}>
        Welcome to Helicone!
      </h1>

      <div className="relative h-[80vh]">
        <Image
          src="/static/pi/intro-image.webp"
          alt="Helicone Logo"
          width={460}
          height={360}
          className=""
        />

        <Link
          href="/pi/setup"
          className="p-5 border-2  absolute top-1/2 left-1/2 transform translate-x-[16px] -translate-y-[90px] text-black font-bold h-[36.17px] px-[12.17px] py-[6.08px] origin-top-left -rotate-1 bg-white border-l-2 border-r-4 border-t-2 border-b-4 border-black flex-col justify-start items-start gap-[10.14px] inline-flex"
        >
          Start
        </Link>
      </div>
    </div>
  );
};

const PiPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PiPageContent />
    </Suspense>
  );
};

export default PiPage;
