// Inspired by https://github.com/uixmat/onborda

import { createContext, useContext, useCallback, useState } from "react";

export type OnboardingContextType = {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  closeOnboarding: () => void;
  startOnboarding: () => void;
  isOnboardingVisible: boolean;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

const useOnboardingContext = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error(
      "useOnboardingContext must be used within an OnboardingProvider"
    );
  }
  return context;
};

export const OnboardingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [currentStep, setCurrentStepState] = useState(0);
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);

  const setCurrentStep = useCallback((step: number, delay?: number) => {
    if (delay) {
      setTimeout(() => {
        setCurrentStepState(step);
        setIsOnboardingVisible(true);
      }, delay);
    } else {
      setCurrentStepState(step);
      setIsOnboardingVisible(true);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    setIsOnboardingVisible(true);
    setCurrentStep(0);
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        closeOnboarding: () => setIsOnboardingVisible(false),
        startOnboarding,
        isOnboardingVisible,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export default useOnboardingContext;
