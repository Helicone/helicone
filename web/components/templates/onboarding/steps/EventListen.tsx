import { Result } from "@/lib/result";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import * as Listening from "../../../../public/lottie/Listening.json";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import * as PartyParrot from "../../../../public/lottie/PartyParrot.json";
import { ArrowUpRightIcon, MessageCircleQuestionIcon } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useJawnClient } from "@/lib/clients/jawnHook";
import { useState } from "react";
import Link from "next/link";
const Lottie = dynamic(() => import("react-lottie"), { ssr: false });

const EventListen = ({
  setCurrentStep,
  close,
}: {
  setCurrentStep: (step: number) => void;
  close: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const { data, isSuccess } = useQuery<Result<boolean, string>, Error>(
    ["hasOnboarded"],
    async () => {
      const response = await fetch("/api/user/checkOnboarded", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const jsonData = await response.json();

      if (!response.ok) {
        return null;
      }

      return jsonData;
    },
    {
      refetchOnWindowFocus: false,
      refetchInterval: 3000,
      enabled: true,
    }
  );

  const jawn = useJawnClient();

  const skipOnboarding = async () => {
    setLoading(true);
    await jawn.POST("/v1/organization/onboard", {
      body: {},
      headers: {
        "Content-Type": "application/json",
      },
    });

    org?.refreshCurrentOrg();
    close();
  };

  const org = useOrg();
  const router = useRouter();

  return (
    <div className="flex flex-col h-full">
      {data && data.data ? (
        <div className="bg-gray-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center h-full">
          <LoadingAnimation animation={PartyParrot} height={75} width={75} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="w-full h-[100px] dark:border-slate-800 rounded-lg flex flex-col items-center justify-center overflow-hidden">
            <div className="w-[300px] h-full">
              <Lottie
                height="100%"
                width="100%"
                isClickToPauseDisabled={true}
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: Listening,
                  rendererSettings: {
                    preserveAspectRatio: "xMidYMid slice",
                  },
                }}
              />
            </div>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-md p-4 flex flex-col gap-2 border border-slate-200 dark:border-slate-800">
            <div className="flex gap-2 items-center">
              <MessageCircleQuestionIcon className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Help me troubleshoot
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="https://docs.helicone.ai/getting-started/quick-start"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center py-2.5 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <p className="text-[13px] text-slate-500 font-medium">
                  Check out our quick start guide
                </p>
                <div className="flex gap-2 items-center">
                  <p className="text-[13px] font-medium text-slate-500">Docs</p>
                  <ArrowUpRightIcon className="w-4 h-4 text-slate-500" />
                </div>
              </Link>
              <Link
                href="https://discord.gg/2TkeWdXNPQ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center py-2.5 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <p className="text-[13px] text-slate-500 font-medium">
                  Need help? Join our Discord community
                </p>
                <div className="flex gap-2 items-center">
                  <p className="text-[13px] font-medium text-slate-500">
                    Discord
                  </p>
                  <ArrowUpRightIcon className="w-4 h-4 text-slate-500" />
                </div>
              </Link>
              <Link
                href="https://www.helicone.ai/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="flex justify-between items-center py-2.5 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                <p className="text-[13px] text-slate-500 font-medium">
                  Schedule a call with us
                </p>
                <div className="flex gap-2 items-center">
                  <p className="text-[13px] font-medium text-slate-500">
                    Contact
                  </p>
                  <ArrowUpRightIcon className="w-4 h-4 text-slate-500" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
      <DialogFooter className="mt-10">
        {!(data && data.data) && (
          <Button variant={"ghost"} onClick={() => skipOnboarding()}>
            Skip
          </Button>
        )}
        <Button variant={"outline"} onClick={() => setCurrentStep(2)}>
          Go Back
        </Button>
        <Button
          disabled={!(data && data.data)}
          onClick={() => {
            router.push("/requests");
            org?.refreshCurrentOrg();
          }}
        >
          {data && data.data ? "Done! Show me the requests" : "Loading..."}
        </Button>
      </DialogFooter>
    </div>
  );
};

export default EventListen;
