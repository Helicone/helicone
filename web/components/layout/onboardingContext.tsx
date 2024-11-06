// Inspired by https://github.com/uixmat/onborda

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { motion } from "framer-motion";
import { Portal } from "@radix-ui/react-portal";

export type OnboardingContextType = {
  currentStep: number;
  setCurrentStep: (step: number, delay?: number) => void;
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

  const setCurrentStep = useCallback((step: number, delayMs?: number) => {
    if (delayMs) {
      setTimeout(() => {
        setCurrentStepState(step);
        setIsOnboardingVisible(true);
      }, delayMs);
    } else {
      setCurrentStepState(step);
      setIsOnboardingVisible(true);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    setIsOnboardingVisible(true);
    setCurrentStep(0);
  }, [setCurrentStep]);

  const getElementPosition = (element: Element) => {
    if (!element) return null;
    if (
      !element.getBoundingClientRect ||
      typeof element.getBoundingClientRect !== "function"
    )
      return null;
    const { top, left, width, height } = element.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    return {
      x: left + scrollLeft,
      y: top + scrollTop,
      width,
      height,
    };
  };

  const [elementPointerPosition, setElementPointerPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (isOnboardingVisible) {
      let timeout: NodeJS.Timeout;
      const observer = new MutationObserver(() => {
        const element = document.querySelector(
          `[data-onboarding-step="${currentStep}"]`
        );
        console.log({ element });
        if (element) {
          const position = getElementPosition(element);
          setElementPointerPosition(position);

          timeout = setTimeout(() => {
            updatePointerPosition();
          }, 1000);

          observer.disconnect();
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isOnboardingVisible]);

  const updatePointerPosition = () => {
    if (isOnboardingVisible) {
      const element = document.querySelector(
        `[data-onboarding-step="${currentStep}"]`
      );
      if (element) {
        const position = getElementPosition(element);
        setElementPointerPosition(position);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", updatePointerPosition);
    window.addEventListener("resize", updatePointerPosition);
    return () => {
      window.removeEventListener("scroll", updatePointerPosition);
      window.removeEventListener("resize", updatePointerPosition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isOnboardingVisible]);

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
      {isOnboardingVisible && (
        <Portal>
          <div className="fixed inset-0 z-[9998] pointer-events-auto">
            <motion.div
              className="absolute z-[9999] pointer-events-none"
              initial={
                elementPointerPosition
                  ? {
                      left: elementPointerPosition?.x,
                      top: elementPointerPosition?.y,
                      width: elementPointerPosition?.width,
                      height: elementPointerPosition?.height,
                    }
                  : {}
              }
              animate={
                elementPointerPosition
                  ? {
                      left: elementPointerPosition?.x,
                      top: elementPointerPosition?.y,
                      width: elementPointerPosition?.width,
                      height: elementPointerPosition?.height,
                    }
                  : {}
              }
              style={{
                boxShadow: "0 0 200vw 200vh rgba(0, 0, 0, 0.5)",
                zIndex: 9999,
              }}
            />
          </div>
        </Portal>
      )}
    </OnboardingContext.Provider>
  );
};

export default useOnboardingContext;
