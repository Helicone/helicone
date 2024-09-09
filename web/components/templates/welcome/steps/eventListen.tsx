import { useQuery } from "@tanstack/react-query";
const Lottie = dynamic(() => import("react-lottie"), { ssr: false });
import { Result } from "../../../../lib/result";
import * as Listening from "../../../../public/lottie/Listening.json";
import LoadingAnimation from "../../../shared/loadingAnimation";
import * as PartyParrot from "../../../../public/lottie/PartyParrot.json";
import dynamic from "next/dynamic";
import HcButton from "../../../ui/hcButton";
import { DemoGame } from "../../../shared/themed/demo/demoGame";
import { useEffect, useState } from "react";
import ThemedBubbleModal from "../../../shared/themed/themedBubbleModal";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { openSupportModal } from "../../../../utils/support";

interface EventListenProps {
  previousStep: () => void;
  nextStep: () => void;
}

const EventListen = (props: EventListenProps) => {
  const { previousStep, nextStep } = props;
  const [openDemo, setOpenDemo] = useLocalStorage("openDemo", false);
  const [removedDemo, setRemovedDemo] = useLocalStorage("removedDemo", false);
  const [showWarning, setShowWarning] = useState(false);

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

  useEffect(() => {
    if (openDemo) {
      setOpenDemo(true);
    }
  }, [openDemo, setOpenDemo]);

  useEffect(() => {
    const timer = setTimeout(() => setShowWarning(true), 30000);
    return () => clearTimeout(timer);
  }, []);

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
          title={"Launch Interactive Demo"}
          onClick={() => {
            setOpenDemo(true);
            setRemovedDemo(false);
          }}
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
      <div className="mt-8 max-w-xl mx-auto p-4 bg-sky-50 border border-sky-100 rounded-lg shadow-sm">
        <p className="text-sm text-gray-600 mb-4">
          Not sure how to send an event? Try our interactive demo to see how Helicone works!
        </p>
        <p className="text-center mt-4">
          <a
            href="https://docs.helicone.ai/troubleshooting/my-event-isnt-registered"
            className="text-blue-500 hover:text-blue-600 italic"
            target="_blank"
            rel="noopener noreferrer"
          >
            Troubleshoot &gt; My event isn't registered
          </a>
        </p>
      </div>
      {showWarning && (
        <div className="mt-8 p-4 bg-orange-100 border border-orange-200 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            Do you need extra help?
          </h3>
          <p className="text-orange-700 mb-4">
            If you're having trouble, our support team is here to assist you.
          </p>
          <HcButton
            variant="primary"
            size="sm"
            title="Ask Support"
            onClick={openSupportModal}
          />
        </div>
      )}
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
