import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Lottie from "react-lottie";
import { Result } from "../../../../lib/result";
import { clsx } from "../../../shared/clsx";
import * as Listening from "../../../../public/lottie/Listening.json";

interface EventListenProps {
  nextStep: () => void;
}

const EventListen = (props: EventListenProps) => {
  const { nextStep } = props;

  const [loaded, setLoaded] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);
  const [notification, setNotification] = useState("");

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
      enabled: shouldFetch,
    }
  );

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500); // delay of 500ms
    return () => clearTimeout(timer); // this will clear Timeout
    // when component unmount like in willComponentUnmount
  }, []);

  useEffect(() => {
    if (isSuccess && data?.data === true) {
      setShouldFetch(false);
    }
  }, [isSuccess, data]);

  return (
    <div
      className={clsx(
        `transition-all duration-700 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`,
        "flex flex-col items-center w-full px-2"
      )}
    >
      {data === undefined || data?.data === false ? (
        <>
          <p className="text-2xl md:text-5xl font-semibold text-center">
            Listening for Events
          </p>
          <p className="text-md md:text-lg text-gray-700 font-light mt-5 text-center">
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
      ) : (
        <>
          <p className="text-2xl md:text-5xl font-semibold text-center">
            Successfully received an event
          </p>
          <p className="text-md md:text-lg text-gray-700 font-light mt-5 text-center">
            You&apos;re all set to use Helicone! Click below to get started.
          </p>
          <button
            onClick={nextStep}
            className="px-28 py-3 bg-gray-900 hover:bg-gray-700 font-medium text-white rounded-xl mt-8"
          >
            View Dashboard
          </button>
        </>
      )}
    </div>
  );
};

export default EventListen;
