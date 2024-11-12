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
import { useOrg } from "@/components/layout/organizationContext";
const Lottie = dynamic(() => import("react-lottie"), { ssr: false });

const EventListen = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
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

  const org = useOrg();
  const router = useRouter();

  return (
    <div className="flex flex-col p-4 h-full">
      {data && data.data ? (
        <div className="bg-gray-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center h-full">
          <LoadingAnimation animation={PartyParrot} height={75} width={75} />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="bg-gray-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center">
            <Lottie
              height={300}
              options={{
                loop: true,
                autoplay: true,
                animationData: Listening,
              }}
            />
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-950 rounded-md p-4 flex flex-col gap-4 border border-slate-200 dark:border-slate-800">
            <div className="flex gap-2 items-center">
              <MessageCircleQuestionIcon className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                Help me troubleshoot
              </p>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
                <p className="text-[13px] text-slate-500 font-medium">
                  I already sent a request. Why is it not recieved?
                </p>
                <div className="flex gap-2 items-center">
                  <p className="text-[13px] font-medium text-slate-500">
                    See FAQ
                  </p>
                  <ArrowUpRightIcon className="w-4 h-4 text-slate-500" />
                </div>
              </div>
              <div className="flex justify-between items-center py-3">
                <p className="text-[13px] text-slate-500 font-medium">
                  Other questions?
                </p>
                <div className="flex gap-2 items-center">
                  <p className="text-[13px] font-medium text-slate-500">
                    Contact us
                  </p>
                  <ArrowUpRightIcon className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <DialogFooter className="mt-4">
        {!(data && data.data) && (
          <Button variant="outline" onClick={() => setOpen(false)}>
            Skip
          </Button>
        )}
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
