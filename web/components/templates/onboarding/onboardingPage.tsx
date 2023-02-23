import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Router, useRouter } from "next/router";
import { useEffect, useState } from "react";
import { middleTruncString } from "../../../lib/stringHelpers";
import { hashAuth } from "../../../lib/supabaseClient";
import { supabaseServer } from "../../../lib/supabaseServer";
import AddAPIKey from "./addAPIKey";
import ConfirmEmail from "./ConfirmEmail";
import CreateAccount from "./createAccount";
import OneLineChange from "./oneLineChange";
import ProgressBar from "../home/progressBar";
import { NextRequest } from "next/server";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import BasePageV2 from "../../shared/layout/basePageV2";

interface OnboardingPageProps {
  origin: string;
  step?: number;
}

const OnboardingPage = (props: OnboardingPageProps) => {
  const { origin, step: currentStep } = props;

  const supabaseClient = useSupabaseClient();

  const [step, setStep] = useState<number>(currentStep || 1);
  const [authError, setAuthError] = useState<string>();
  const router = useRouter();
  const {
    query: { step: stepQuery },
  } = router;
  if (stepQuery && typeof stepQuery === "string") {
    const step = parseInt(stepQuery);
    if (step !== currentStep) {
      setStep(step);
    }
  }

  const previousStep = () => {
    setStep(step - 1);
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const signUpHandler = async (email: string, password: string) => {
    const { data: user, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `https://${origin}/keys`,
      },
    });

    if (authError) {
      setAuthError(authError.message);
      return;
    }

    nextStep();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <OneLineChange
            onBackHandler={previousStep}
            onNextHandler={nextStep}
          />
        );
      case 2:
        return (
          <CreateAccount
            onNextHandler={signUpHandler}
            onBackHandler={previousStep}
            authError={authError}
          />
        );

      case 3:
        return (
          <ConfirmEmail onBackHandler={previousStep} onNextHandler={nextStep} />
        );
      default:
        return (
          <OneLineChange
            onBackHandler={previousStep}
            onNextHandler={nextStep}
          />
        );
    }
  };

  return (
    <BasePageV2>
      <div className="h-full justify-center align-middle items-center flex flex-col space-y-6 sm:space-y-12">
        <ProgressBar currentStep={step} />
        {renderStep()}
      </div>
    </BasePageV2>
  );
};

export default OnboardingPage;
