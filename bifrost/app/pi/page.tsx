"use client";

import { JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";
import { useHeliconeLogin } from "./useHeliconeLogin";
import { useTestAPIKey } from "./first_page/useTestApiKey";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

const PiPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKey, sessionUUID } = useHeliconeLogin(
    searchParams.get("invalid_api_key") === "true"
  );
  const { data, isLoading } = useTestAPIKey(apiKey.data ?? "");

  if (!apiKey.data && data) {
    router.push("/pi/first_page");
    return <div>Loading...</div>;
  }

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

        <div className=" bg-blue-500 bg-opacity-60 absolute top-1/2 left-1/2 transform translate-x-[20px] -translate-y-[110px] text-white font-bold">
          <QRCode
            value={`https://helicone.ai/signin?pi_session_id=${sessionUUID}`}
            size={75}
          />
        </div>
      </div>
    </div>
  );
};

export default PiPage;
