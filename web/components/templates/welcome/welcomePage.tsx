import Image from "next/image";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { clsx } from "../../shared/clsx";
import CodeIntegration from "./steps/codeIntegration";
import EventListen from "./steps/eventListen";
import Features from "./steps/features";
import GenerateAPIKey from "./steps/generateAPIKey";
import GetStarted from "./steps/getStarted";

interface WelcomePageProps {}

const WelcomePage = (props: WelcomePageProps) => {
  const {} = props;

  const router = useRouter();

  const [step, setStep] = useState<number>(0);
  const [apiKey, setApiKey] = useState<string>("");

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    if (step === 0) return;
    setStep(step - 1);
  };

  const stepArray = [
    <GetStarted key={0} nextStep={nextStep} />,
    <Features key={1} nextStep={nextStep} />,
    <GenerateAPIKey
      key={2}
      nextStep={nextStep}
      apiKey={apiKey}
      setApiKey={setApiKey}
    />,
    <CodeIntegration key={3} nextStep={nextStep} apiKey={apiKey} />,
    <EventListen
      key={4}
      nextStep={() => {
        router.push("/dashboard");
      }}
    />,
  ];

  return (
    <div className="bg-gray-200 h-screen w-screen overflow-hidden items-center justify-center align-middle flex flex-col text-gray-900 relative">
      {stepArray[step]}
      <div className="h-4 w-full mx-auto bottom-0 mb-8 absolute flex">
        <ul className="flex flex-row gap-6 items-center w-full mx-auto justify-center">
          {Array.from({ length: stepArray.length }).map((_, i) => (
            <li
              key={i}
              onClick={() => setStep(i)}
              className={clsx(
                step >= i ? "bg-gray-700" : "bg-gray-300",
                "h-2.5 w-2.5 rounded-full hover:cursor-pointer"
              )}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WelcomePage;
