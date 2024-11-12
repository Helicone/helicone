// Inspired by https://github.com/uixmat/onborda

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";
import { motion } from "framer-motion";
import {
  HomeIcon,
  NotepadTextIcon,
  SheetIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";
import { BeakerIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

// type OnboardingStepLabel =
//   | "REQUESTS_TABLE"
//   | "REQUESTS_DRAWER"
//   | "SESSIONS_PAGE"
//   | "SESSIONS_CULPRIT"
//   | "PROMPTS_PAGE"
//   | "PROMPTS_EXPERIMENT"
//   | "EXPERIMENTS_TABLE"
//   | "EXPERIMENTS_ORIGINAL"
//   | "EXPERIMENTS_ADD"
//   | "EXPERIMENTS_ADD_CHANGE_PROMPT"
//   | "EXPERIMENTS_ADD_SAVE"
//   | "EXPERIMENTS_FIND_EXPERIMENT"
//   | "EXPERIMENTS_ADD_TEST_CASES"
//   | "EXPERIMENTS_RUN_EXPERIMENTS"
//   | "EXPERIMENTS_CLICK_SHOW_SCORES"
//   | "EXPERIMENTS_CLICK_ADD_EVAL"
//   | "EXPERIMENTS_SPECIFIC_EVAL"
//   | "EXPERIMENTS_RUN_EVAL"
//   | "EXPERIMENTS_BETTER_PROMPT"
//   | "DASHBOARD_SUCCESS";

export const ONBOARDING_STEP_LABELS = [
  "REQUESTS_TABLE",
  "REQUESTS_DRAWER",
  "SESSIONS_PAGE",
  "SESSIONS_CULPRIT",
  "PROMPTS_PAGE",
  "PROMPTS_EXPERIMENT",
  "EXPERIMENTS_TABLE",
  "EXPERIMENTS_ORIGINAL",
  "EXPERIMENTS_ADD",
  "EXPERIMENTS_ADD_CHANGE_PROMPT",
  "EXPERIMENTS_ADD_SAVE",
  "EXPERIMENTS_FIND_EXPERIMENT",
  "EXPERIMENTS_ADD_TEST_CASES",
  "EXPERIMENTS_RUN_EXPERIMENTS",
  "EXPERIMENTS_CLICK_SHOW_SCORES",
  "EXPERIMENTS_CLICK_ADD_EVAL",
  "EXPERIMENTS_SPECIFIC_EVAL",
  "EXPERIMENTS_RUN_EVAL",
  "EXPERIMENTS_BETTER_PROMPT",
  "DASHBOARD_SUCCESS",
] as const;

export type OnboardingStepLabel = (typeof ONBOARDING_STEP_LABELS)[number];

interface OnboardingStep {
  stepNumber: number;
  popoverData: {
    icon?: React.ReactNode;
    title?: string;
    stepNumber: number;
    description?: string | React.ReactNode;
    additionalData?: React.ReactNode;
  };
}

export const ONBOARDING_STEPS: Record<OnboardingStepLabel, OnboardingStep> = {
  REQUESTS_TABLE: {
    stepNumber: 0,
    popoverData: {
      icon: <SheetIcon className="h-4 w-4" />,
      title: "Welcome to Requests!",
      stepNumber: 1,
      description:
        "Here is where your request and response data lives. Simply add one line of code to track requests from any providers.",
    },
  },
  REQUESTS_DRAWER: {
    stepNumber: 1,
    popoverData: {
      icon: <SheetIcon className="h-4 w-4" />,
      title: "Let’s dive deeper",
      stepNumber: 1,
      description:
        "Here you can view the additional metadata and the LLM messages. You might have noticed that the response doesn’t look quite right. Let’s dive deeper to see what might have gone wrong.",
    },
  },
  SESSIONS_PAGE: {
    stepNumber: 2,
    popoverData: {
      icon: <WorkflowIcon className="h-6 w-6" />,
      title: "We are in the travel planning session",
      stepNumber: 2,
      description:
        "The goal is to figure out where the original failure occurred.",
    },
  },
  SESSIONS_CULPRIT: {
    stepNumber: 3,
    popoverData: {
      icon: <WorkflowIcon className="h-6 w-6" />,
      title: "The Culprit",
      stepNumber: 2,
      description:
        "Tracing the session made it clear that the problem happened during the “extract-travel-plan” step. Let’s go improve this prompt. ",
    },
  },
  PROMPTS_PAGE: {
    stepNumber: 4,
    popoverData: {
      icon: <NotepadTextIcon className="h-6 w-6" />,
      title: "Welcome to Prompts!",
      stepNumber: 3,
      description: (
        <>
          Here, you can view the latest <strong>“extract-travel-plan”</strong>
          prompt in production, view its version history and previous requests.
        </>
      ),
    },
  },
  PROMPTS_EXPERIMENT: {
    stepNumber: 5,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Let’s iterate on this prompt",
      stepNumber: 3,
      description:
        "The goal is to converge to 100% accuracy while preventing regressions.",
    },
  },
  EXPERIMENTS_TABLE: {
    stepNumber: 6,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "A playground for prompts",
      stepNumber: 4,
      description:
        "This is your playground to experiment on the original prompt. Seamlessly iterate, test and evaluate the output at scale. ",
    },
  },
  EXPERIMENTS_ORIGINAL: {
    stepNumber: 7,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Here’s your original prompt",
      stepNumber: 4,
      description: (
        <>
          This is your <strong>“extract-travel-plan”</strong> production prompt.
          Let&apos;s experiment on this.{" "}
        </>
      ),
    },
  },
  EXPERIMENTS_ADD: {
    stepNumber: 8,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Add an experiment",
      stepNumber: 4,
      description: "Click here to create a new variation of your prompt.",
    },
  },
  EXPERIMENTS_ADD_CHANGE_PROMPT: {
    stepNumber: 9,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Change the prompt",
      stepNumber: 4,
      description:
        "Let’s prompt the model to generate step-by-step reasoning, which will help the model better extract the user’s travel plan. ",
    },
  },
  EXPERIMENTS_ADD_SAVE: {
    stepNumber: 10,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Save changes",
      stepNumber: 4,
      description:
        "We already picked a model for you. Go ahead and save your prompt. ",
    },
  },
  EXPERIMENTS_FIND_EXPERIMENT: {
    stepNumber: 11,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "You can find your experiment here",
      stepNumber: 4,
      description:
        "Now let’s test it on some production inputs. This is a crucial step to make sure our new prompt didn’t regress.  ",
    },
  },
  EXPERIMENTS_ADD_TEST_CASES: {
    stepNumber: 12,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Add infinite test cases",
      stepNumber: 4,
      description:
        "Testing with real data is always more reliable than testing on mock data, as it contains more realistic user queries. ",
    },
  },
  EXPERIMENTS_RUN_EXPERIMENTS: {
    stepNumber: 13,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Run experiments",
      stepNumber: 4,
      description:
        "Sometimes it takes multiple experiments to achieve the highest prompt accuracy. Add as many as you need. ",
    },
  },
  EXPERIMENTS_CLICK_SHOW_SCORES: {
    stepNumber: 14,
    popoverData: {
      stepNumber: 4,
    },
  },
  EXPERIMENTS_CLICK_ADD_EVAL: {
    stepNumber: 15,
    popoverData: {
      stepNumber: 4,
    },
  },
  EXPERIMENTS_SPECIFIC_EVAL: {
    stepNumber: 16,
    popoverData: {
      icon: <SparklesIcon className="h-6 w-6" />,
      title: "Evaluate your output",
      stepNumber: 4,
      description:
        "Let’s attach an LLM-as-a-judge evaluator that assesses the output to make sure the user’s travel plan is successfully extracted. ",
    },
  },
  EXPERIMENTS_RUN_EVAL: {
    stepNumber: 17,
    popoverData: {
      icon: <SparklesIcon className="h-6 w-6" />,
      title: "Run evaluator",
      stepNumber: 4,
      description:
        "Running evaluators will quantify the output quality and make sure it didn’t regress. ",
    },
  },
  EXPERIMENTS_BETTER_PROMPT: {
    stepNumber: 18,
    popoverData: {
      stepNumber: 4,
    },
  },
  DASHBOARD_SUCCESS: {
    stepNumber: 19,
    popoverData: {
      icon: <HomeIcon className="h-6 w-6" />,
      title: "Congrats! You resolved the issue",
      stepNumber: 5,
      description:
        "Now you can monitor the error rates, latency, and cost over time, and watch out for any anomalies that could suggest new issues. ",
    },
  },
};

export type OnboardingContextType = {
  currentStep: number;
  setCurrentStep: (step: number, delay?: number) => void;
  closeOnboarding: () => void;
  startOnboarding: () => void;
  elementPointerPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
  onClickElement: () => void;
  setOnClickElement: (onClickElement: () => void) => void;
  isOnboardingVisible: boolean;
  isOnboardingComplete: boolean;
  setIsOnboardingComplete: (isOnboardingComplete: boolean) => void;
  endOnboarding: () => void;
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
  sidebarRef,
  children,
}: {
  sidebarRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}) => {
  const [currentStep, setCurrentStepState] = useState(0);
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [onClickElement, setOnClickElement] = useState<() => void>(() => {});
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const setCurrentStep = useCallback((step: number, delayMs?: number) => {
    if (delayMs) {
      setTimeout(() => {
        setCurrentStepState(step);
      }, delayMs);
    } else {
      setCurrentStepState(step);
    }
  }, []);

  const startOnboarding = useCallback(() => {
    setIsOnboardingVisible(true);
    setCurrentStep(0);
  }, [setCurrentStep]);

  const endOnboarding = useCallback(() => {
    setCurrentStep(0);
    setIsOnboardingVisible(false);
    setIsOnboardingComplete(true);
  }, [setIsOnboardingComplete, setCurrentStep]);

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
      x: left + scrollLeft - (sidebarRef.current?.offsetWidth || 0),
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
          if (position) {
            setElementPointerPosition(position);
          }

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
        if (position) {
          setElementPointerPosition(position);
        }
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
        elementPointerPosition,
        onClickElement,
        setOnClickElement,
        isOnboardingComplete,
        setIsOnboardingComplete,
        endOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const OnboardingBackground = () => {
  const {
    isOnboardingVisible,
    elementPointerPosition,
    onClickElement,
    currentStep,
  } = useOnboardingContext();

  if (
    !isOnboardingVisible ||
    currentStep === ONBOARDING_STEPS.DASHBOARD_SUCCESS.stepNumber
  )
    return null;
  return (
    <div className="absolute inset-0 z-[9998] pointer-events-auto">
      <motion.div
        className={cn(
          "absolute z-[9999]",
          onClickElement !== null && onClickElement !== undefined
            ? "cursor-pointer"
            : ""
        )}
        onClick={onClickElement}
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
          boxShadow: "0 0 300vw 300vh rgba(0, 0, 0, 0.5)",
          zIndex: 9999,
        }}
      />
    </div>
  );
};

export default useOnboardingContext;
