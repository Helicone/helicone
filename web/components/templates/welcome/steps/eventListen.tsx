import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
const Lottie = dynamic(() => import("react-lottie"), { ssr: false });
import { Result } from "../../../../lib/result";
import * as Listening from "../../../../public/lottie/Listening.json";
import LoadingAnimation from "../../../shared/loadingAnimation";
import * as PartyParrot from "../../../../public/lottie/PartyParrot.json";
import dynamic from "next/dynamic";
import HcButton from "../../../ui/hcButton";

interface EventListenProps {
  previousStep: () => void;
  nextStep: () => void;
}

const EventListen = (props: EventListenProps) => {
  const { previousStep, nextStep } = props;

  // const [shouldFetch, setShouldFetch] = useState(true);
  const [notification, setNotification] = useState<string>();
  const [loading, setLoading] = useState(false);

  const nextStepHandler = async () => {
    setLoading(true);
    nextStep();
    setLoading(false);
  };

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
        setNotification(
          "An error occurred while fetching data and we couldn't complete your onboarding. Please contact help@helicone.ai and we'll get you onboarded right away!"
        );
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

  return (
    <div id="content" className="w-full flex flex-col">
      <div className="flex flex-col p-4 pb-16">
        {data && data.data ? (
          <>
            <LoadingAnimation animation={PartyParrot} height={75} width={75} />
            <p className="text-lg md:text-xl font-semibold text-center mt-4">
              Successfully received an event
            </p>
            <p className="text-md md:text-lg text-gray-500 font-light mt-5 text-center">
              You&apos;re all set to use Helicone! Click below to get started.
            </p>
          </>
        ) : (
          <>
            <p className="text-lg md:text-xl font-semibold text-center">
              Listening for Events
            </p>
            <p className="text-md md:text-lg text-gray-500 font-light mt-4 text-center">
              Send your first event through Helicone to view your dashboard
            </p>
            {notification && (
              <p className="text-md md:text-lg text-red-500 font-light mt-4 text-center">
                {notification}
              </p>
            )}
            <div className="flex flex-col w-full">
              <Lottie
                options={{
                  loop: true,
                  autoplay: true,
                  animationData: Listening,
                  rendererSettings: {
                    preserveAspectRatio: "xMidYMid slice",
                  },
                }}
                height={250}
                width={250}
                isStopped={false}
                isPaused={false}
                style={{
                  pointerEvents: "none",
                  background: "transparent",
                }}
              />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center justify-between p-4">
        <HcButton
          variant={"secondary"}
          size={"sm"}
          title={"Back"}
          onClick={previousStep}
        />
        <HcButton
          variant={"primary"}
          size={"sm"}
          title={"Go to Dashboard"}
          onClick={() => {
            if (data && data.data) {
              nextStepHandler();
            }
          }}
          disabled={!isSuccess}
        />
      </div>
    </div>
  );
};

export default EventListen;
