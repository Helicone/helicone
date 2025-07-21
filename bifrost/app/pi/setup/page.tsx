"use client";

import { JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import { useHeliconeLogin } from "../useHeliconeLogin";
import { useTestAPIKey } from "../first_page/useTestApiKey";
import { Suspense } from "react";
import Link from "next/link";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

const PiPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKey, sessionUUID, countDown } = useHeliconeLogin(
    searchParams.get("invalid_api_key") === "true"
  );
  const { data, isLoading } = useTestAPIKey(apiKey.data ?? "");

  if (apiKey.data && data && !isLoading && !apiKey.isLoading) {
    router.push("/pi/total-requests");
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-[100vh] w-full flex-col items-center justify-center">
      <h1
        className={`max-w-[80vw] truncate text-3xl font-extrabold ${jetbrainsMono.className} py-2`}
      >
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
        Scan the QR code to start - Link will expire in {countDown} seconds.
        <br />
        {sessionUUID}
        <br />
        <Link href={`/pi`} className="text-blue-500">
          Cancel
        </Link>
        <div className="absolute left-1/2 top-1/2 -translate-y-[110px] translate-x-[20px] transform bg-blue-500 bg-opacity-60 font-bold text-white">
          <QRCode
            value={`https://helicone.ai/signin?pi_session=${sessionUUID}`}
            size={75}
          />
        </div>
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
