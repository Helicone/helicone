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
      className={`flex h-[100vh] w-full flex-col items-center justify-center ${jetbrainsMono.className}`}
    >
      <h1 className={`max-w-[80vw] truncate py-2 text-3xl font-extrabold`}>
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
          className="absolute left-1/2 top-1/2 inline-flex h-[36.17px] origin-top-left -translate-y-[90px] translate-x-[16px] -rotate-1 transform flex-col items-start justify-start gap-[10.14px] border-2 border-b-4 border-l-2 border-r-4 border-t-2 border-black bg-white p-5 px-[12.17px] py-[6.08px] font-bold text-black"
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
