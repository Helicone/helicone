import { useQuery } from "@tanstack/react-query";
const Lottie = dynamic(() => import("react-lottie"), { ssr: false });
import { Result } from "../../../../lib/result";
import * as Listening from "../../../../public/lottie/Listening.json";
import LoadingAnimation from "../../../shared/loadingAnimation";
import * as PartyParrot from "../../../../public/lottie/PartyParrot.json";
import dynamic from "next/dynamic";
import HcButton from "../../../ui/hcButton";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import { DemoGame } from "../../../shared/themed/demo/demoGame";
import ThemedBubbleModal from "../../../shared/themed/themedBubbleModal";

interface EventListenProps {
  previousStep: () => void;
  nextStep: () => void;
}

const EventListen = (props: EventListenProps) => {
  const { previousStep, nextStep } = props;
  const [openDemo, setOpenDemo] = useLocalStorage("openDemo", false);
  const [removedDemo, setRemovedDemo] = useLocalStorage("removedDemo", false);

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
    <div id="content" className="w-full flex flex-col lg:pt-16">
      <div className="flex flex-col p-4 ">
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
            <p className="text-md md:text-lg text-gray-500 font-light mt-4 text-center -mb-4">
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
      <div className="flex justify-center h-full pb-4">
        <div className="max-w-2xl max-h-[225px] w-full px-4 py-6 bg-sky-50 border border-sky-100 rounded-xl shadow-sm ">
          <h2 className="text-xl font-semibold text-[#21496B] mb-4 flex items-center">
            <LightBulbIcon className="w-5 h-5 mr-2 text-[#1B91CD]" />
            Help me troubleshoot
          </h2>
          <div className="flex flex-col md:flex-row gap-6 items-stretch px-6">
            <div className="flex-1 mt-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                I already sent a request. Why is it not received?
              </h3>
              <button
                onClick={() => {
                  // Add logic to open docs
                }}
                className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 mt-4 rounded-md border border-[#D9D9D9] flex items-center justify-center transition duration-150 ease-in-out"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                Check out the docs
              </button>
            </div>

            <div className="hidden md:block w-px bg-[#D6EBF9] mx-3"></div>

            <div className="flex-1 mt-4">
              <h3 className="text-lg font-medium text-gray-700 mb-2 ">
                I don&apos;t know how to send a request.
              </h3>
              <button
                onClick={() => {
                  setOpenDemo(true);
                  setRemovedDemo(false);
                }}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 mt-4 rounded-md flex items-center justify-center transition duration-150 ease-in-out"
              >
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Launch demo
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="sticky bottom-0  p-4 flex items-center justify-between">
        <HcButton
          variant={"secondary"}
          size={"sm"}
          title={"Back"}
          onClick={previousStep}
        />
        <HcButton
          variant={"primary"}
          size={"sm"}
          title={"Next"}
          onClick={() => {
            if (data && data.data) {
              nextStepHandler();
            }
          }}
          loading={!data || !data.data}
          loadingText={"Next"}
          disabled={!isSuccess}
        />
      </div>
      <ThemedBubbleModal
        open={openDemo}
        setOpen={setOpenDemo}
        setRemoved={setRemovedDemo}
        removed={removedDemo}
        showButton={false}
      >
        <DemoGame setOpenDemo={setOpenDemo} />
      </ThemedBubbleModal>
    </div>
  );
};

export default EventListen;
