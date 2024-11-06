// Inspired by https://github.com/uixmat/onborda

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { motion } from "framer-motion";
import { Portal } from "@radix-ui/react-portal";

export type OnboardingContextType = {
  currentStep: number;
  currentElementId: string;
  setCurrentStep: (step: number) => void;
  setCurrentElementId: (id: string) => void;
  closeOnboarding: () => void;
  startOnboarding: () => void;
  isOnboardingVisible: boolean;
};

// const onboardingSteps = [
//   {
//     id: "onboarding-row-1",
//     popoverCard: <div>Hello</div>,
//   },
// ];

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
  const [currentElementId, setCurrentElementIdState] = useState("");
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);

  const observeRef = useRef(null); // Ref for the observer element

  const setCurrentStep = useCallback((step: number) => {
    setCurrentStepState(step);
    setIsOnboardingVisible(true);
  }, []);

  const setCurrentElementId = useCallback((id: string) => {
    setCurrentElementIdState(id);
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

  // const [popoverPointerPosition, setPopoverPointerPosition] = useState<{
  //   x: number;
  //   y: number;
  //   width: number;
  //   height: number;
  // } | null>(null);

  useEffect(() => {
    if (currentElementId && isOnboardingVisible) {
      let timeout: NodeJS.Timeout;
      const observer = new MutationObserver(() => {
        const element = document.getElementById(currentElementId);
        if (element) {
          const position = getElementPosition(element);
          setElementPointerPosition(position);

          timeout = setTimeout(() => {
            updatePointerPosition();
          }, 1000);

          // const popover = document.getElementById(
          //   `${currentElementId}--popover`
          // );
          // if (popover) {
          //   const popoverPosition = getElementPosition(popover);
          //   setPopoverPointerPosition(popoverPosition);
          // }

          observer.disconnect();
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
      return () => clearTimeout(timeout);
    }
  }, [currentElementId, isOnboardingVisible]);

  const updatePointerPosition = () => {
    if (currentElementId && isOnboardingVisible) {
      const element = document.getElementById(currentElementId);
      // const popover = document.getElementById(`${currentElementId}--popover`);
      if (element) {
        const position = getElementPosition(element);
        setElementPointerPosition(position);
      }
      // if (popover) {
      //   const position = getElementPosition(popover);
      //   setPopoverPointerPosition(position);
      // }
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
  }, [currentElementId, isOnboardingVisible]);

  return (
    <OnboardingContext.Provider
      value={{
        currentStep,
        currentElementId,
        setCurrentStep,
        setCurrentElementId,
        closeOnboarding: () => setIsOnboardingVisible(false),
        startOnboarding,
        isOnboardingVisible,
      }}
    >
      {children}
      {isOnboardingVisible && (
        <Portal>
          <motion.div
            id="onboarding-pointer"
            className="absolute !pointer-events-none"
            // initial={{ opacity: 0 }}
            // animate={{ opacity: 1 }}
            // exit={{ opacity: 0 }}
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
        </Portal>
      )}
    </OnboardingContext.Provider>
  );
};

export default useOnboardingContext;
