import Image from "next/image";
import StepList from "./steps/stepList";
import CreateOrg from "./steps/createOrg";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import GenerateAPIKey from "./steps/generateAPIKey";
import Integrations from "./steps/integrations";
import Features from "./steps/features";
import EventListen from "./steps/eventListen";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useOrg } from "../../layout/organizationContext";
import { getJawnClient } from "../../../lib/clients/jawn";
import { InfoBanner } from "../../shared/themed/themedDemoBanner";

interface WelcomePageV2Props {
  currentStep: number;
}

const WelcomePageV2 = (props: WelcomePageV2Props) => {
  const { currentStep } = props;

  const [step, setStep] = useState<number>(currentStep);
  const [apiKey, setApiKey] = useState<string>("");
  const router = useRouter();
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const supabaseClient = useSupabaseClient();
  const orgContext = useOrg();

  useEffect(() => {
    const demoState = localStorage.getItem("openDemo");
    setIsDemo(demoState === "true");
  }, []);

  const handleStepChange = (step: number) => {
    router.replace(`/welcome?step=${step}`);
    setStep(step);
  };

  const stepArray = [
    <CreateOrg
      key={1}
      nextStep={function (): void {
        handleStepChange(2);
      }}
    />,
    <GenerateAPIKey
      key={2}
      apiKey={apiKey}
      setApiKey={setApiKey}
      previousStep={function (): void {
        handleStepChange(1);
      }}
      nextStep={function (): void {
        handleStepChange(3);
      }}
    />,
    <Integrations
      key={3}
      apiKey={apiKey}
      previousStep={function (): void {
        handleStepChange(2);
      }}
      nextStep={function (): void {
        handleStepChange(4);
      }}
    />,
    <Features
      key={4}
      previousStep={function (): void {
        handleStepChange(3);
      }}
      nextStep={function (): void {
        handleStepChange(5);
      }}
    />,
    <EventListen
      key={5}
      previousStep={function (): void {
        handleStepChange(4);
      }}
      nextStep={async function () {
        const jawn = getJawnClient(orgContext?.currentOrg?.id ?? "");
        await jawn.POST("/v1/organization/onboard", {
          body: {},
        });
        router.push("/dashboard");
      }}
    />,
  ];

  return (
    <div className="h-screen w-full bg-gray-50">
      {isDemo && <InfoBanner />}
      <div className="w-full max-w-7xl mx-auto h-full flex flex-col lg:flex-row p-4 lg:divide-x divide-gray-200">
        <section
          id="steps"
          className="w-full min-w-[22.5rem] max-w-[22.5rem] lg:flex-1 flex flex-col py-8 px-4"
        >
          <div className="flex items-center justify-between pb-8 text-gray-500">
            <button
              className="text-xs underline"
              onClick={() => {
                supabaseClient.auth.signOut().then(() => {
                  router.push("/");
                });
              }}
            >
              Log Out
            </button>
            <button
              className="text-xs underline"
              onClick={async () => {
                const jawn = getJawnClient(orgContext?.currentOrg?.id ?? "");
                await jawn.POST("/v1/organization/onboard", {
                  body: {},
                });
                await router.push("/dashboard");
                await router.reload();
              }}
            >
              Go to Dashboard
            </button>
          </div>
          <Image
            src={"/assets/pricing/bouncing-cube.png"}
            alt={""}
            width={150}
            height={75}
          />
          <h1 className="text-2xl font-bold text-black dark:text-white pt-8">
            Welcome to Helicone
          </h1>
          <p className="text-gray-500 text-sm">
            The LLM-observability platform for developers
          </p>
          <div className="pt-8 hidden lg:flex">
            <StepList
              currentStep={currentStep}
              setStep={(step) => {
                handleStepChange(step);
              }}
            />
          </div>
        </section>

        <div className="overflow-auto lg:pt-32 flex flex-auto">
          {stepArray[step - 1]}
        </div>
      </div>
    </div>
  );
};

export default WelcomePageV2;
