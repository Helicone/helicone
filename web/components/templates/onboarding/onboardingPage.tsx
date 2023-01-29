import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Router, useRouter } from "next/router";
import { useEffect, useState } from "react";
import { middleTruncString } from "../../../lib/stringHelpers";
import { hashAuth } from "../../../lib/supabaseClient";
import { supabaseServer } from "../../../lib/supabaseServer";
import NavBar from "../../shared/navBar";
import AddAPIKey from "./addAPIKey";
import ConfirmEmail from "./ConfirmEmail";
import CreateAccount from "./createAccount";
import OneLineChange from "./oneLineChange";
import ProgressBar from "./progressBar";
import { NextRequest } from "next/server";
import { ArrowPathIcon } from "@heroicons/react/24/solid";
import BasePage from "../../shared/basePage";

interface OnboardingPageProps {
  origin: string;
  step?: number;
}

const OnboardingPage = (props: OnboardingPageProps) => {
  const { origin, step: currentStep } = props;
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();

  const [step, setStep] = useState<number>(currentStep || 1);
  const [authError, setAuthError] = useState<string>();
  const [keyError, setKeyError] = useState<string>(); // add api key error callback

  const previousStep = () => {
    setStep(step - 1);
  };

  const nextStep = () => {
    setStep(step + 1);
  };

  const stepOneNextHandler = async (email: string, password: string) => {
    // create an account
    const { data: user, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `https://${origin}/onboarding?step=3`,
      },
    });

    // if there is an error, redirect to the onboarding page (maybe change this to an error message)
    if (authError) {
      setAuthError(authError.message);
      router.push("/onboarding");
      return;
    }

    nextStep();
  };

  const onCompleteOnboarding = async (apiKey: string) => {
    if (!user) {
      setKeyError("You must be logged in to add an API key.");
      previousStep();
      return;
    }

    nextStep();

    // hash the api key and attach it to the created user
    const hashedApiKey = await hashAuth(apiKey);
    const { data, error } = await supabaseClient.from("user_api_keys").insert({
      api_key_preview: middleTruncString(apiKey, 8),
      user_id: user.id,
      api_key_hash: hashedApiKey,
    });

    // if there is an error, tell the user that their api key was not saved
    if (error) {
      setKeyError(error.message);
      return;
    }

    // redirect to the dashboard
    router.push("/dashboard");
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <CreateAccount
            onNextHandler={stepOneNextHandler}
            authError={authError}
          />
        );
      case 2:
        return (
          <ConfirmEmail onBackHandler={previousStep} onNextHandler={nextStep} />
        );
      case 3:
        return (
          <OneLineChange
            onBackHandler={previousStep}
            onNextHandler={nextStep}
          />
        );
      case 4:
        return (
          <AddAPIKey
            onBackHandler={previousStep}
            onNextHandler={onCompleteOnboarding}
            keyError={keyError}
          />
        );
      case 5:
        return (
          <div className="mt-4 text-2xl flex flex-col items-center space-y-12">
            <ArrowPathIcon className="w-16 h-16 animate-spin" />
            <p>Bringing you to your dashboard...</p>
          </div>
        );
      default:
        return <CreateAccount onNextHandler={stepOneNextHandler} />;
    }
  };

  return (
    <BasePage>
      <div className="h-full justify-center align-middle items-center flex flex-col space-y-6 sm:space-y-12">
        <ProgressBar currentStep={step} />
        {renderStep()}
      </div>
    </BasePage>
  );
};

export default OnboardingPage;
