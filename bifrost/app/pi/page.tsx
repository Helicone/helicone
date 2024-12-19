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
    <div className="w-full flex flex-col justify-center items-center h-[100vh]">
      <h1
        className={`text-3xl font-extrabold truncate max-w-[80vw] ${jetbrainsMono.className} py-2`}
      >
        Welcome to Helicone!
      </h1>

      <div className="relative h-[80vh]">
        <Image
          src="/static/pi/intro-image.png"
          alt="Helicone Logo"
          width={460}
          height={360}
          className=""
        />

        <Link
          href="/pi/setup"
          className=" bg-blue-500 p-5 bg-opacity-60 absolute top-1/2 left-1/2 transform translate-x-[30px] -translate-y-[110px] text-white font-bold"
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
