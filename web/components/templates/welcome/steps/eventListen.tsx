import { useQuery } from "@tanstack/react-query";
const Lottie = dynamic(() => import("react-lottie"), { ssr: false });
import { Result } from "../../../../lib/result";
import * as Listening from "../../../../public/lottie/Listening.json";
import LoadingAnimation from "../../../shared/loadingAnimation";
import * as PartyParrot from "../../../../public/lottie/PartyParrot.json";
import dynamic from "next/dynamic";
import HcButton from "../../../ui/hcButton";
import { DemoGame } from "../../../shared/themed/demo/demoGame";
import { useState } from "react";
import ThemedBubbleModal from "../../../shared/themed/themedBubbleModal";
import { useLocalStorage } from "../../../../services/hooks/localStorage";

interface EventListenProps {
  previousStep: () => void;
  nextStep: () => void;
}

const EventListen = (props: EventListenProps) => {
  const { previousStep, nextStep } = props;
  const [openDemo, setOpenDemo] = useState(false);
  const [removedDemo, setRemovedDemo] = useLocalStorage("removedDemo", true);

  const nextStepHandler = async () => {
    nextStep();
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
      <div className="flex justify-center mt-8">
        <div className="max-w-xl w-full p-4 bg-sky-50 border border-sky-100 rounded-lg shadow-sm">
          <div className="flex items-center mb-2">
            <svg
              className="w-5 h-5 mr-2 text-sky-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">
              Not sure how to send an event?
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Try our interactive demo to see how Helicone works!
          </p>
          <button
            onClick={() => setOpenDemo(true)}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center transition duration-150 ease-in-out"
          >
            <span>Launch Interactive Demo</span>
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>
      <ThemedBubbleModal
        open={openDemo}
        setOpen={setOpenDemo}
        setRemoved={setRemovedDemo}
        removed={removedDemo}
      >
        <DemoGame setOpenDemo={setOpenDemo} />
      </ThemedBubbleModal>
    </div>
  );
};

export default EventListen;
