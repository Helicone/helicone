"use client";

import { useJawnClient } from "@/lib/clients/jawnHook";
import { JetBrains_Mono } from "next/font/google";
import Image from "next/image";
import QRCode from "react-qr-code";
import { useHeliconeLogin } from "./../useHeliconeLogin";
import { useTestAPIKey } from "./useTestApiKey";
import { useRouter } from "next/navigation";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] });

const PiPage = () => {
  const jawn = useJawnClient();

  const { apiKey, sessionUUID } = useHeliconeLogin();

  const { data, isLoading } = useTestAPIKey(apiKey.data ?? "");
  const router = useRouter();

  if ((!data && !isLoading) || !apiKey.data) {
    router.push("/pi?invalid_api_key=true");
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full flex flex-col justify-center items-center h-[100vh]">
      <h1
        className={`text-3xl font-extrabold truncate max-w-[80vw] ${jetbrainsMono.className} py-2`}
      >
        LOGGED IN! WOOOHOO
      </h1>
      {data && JSON.stringify(data).slice(0, 100)}
    </div>
  );
};

export default PiPage;
