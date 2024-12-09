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
  MessageCircleQuestionIcon,
  NotepadTextIcon,
  SheetIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";
import { BeakerIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { OnboardingPopoverAccordion } from "../templates/onboarding/OnboardingPopoverMore";
import { DiffHighlight } from "../templates/welcome/diffHighlight";
import { useOrg } from "./organizationContext";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

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
  delayBoxShiftMs?: number;
  popoverData: {
    icon?: React.ReactNode;
    title?: string;
    stepNumber: number;
    description?: string | React.ReactNode;
    additionalData?: React.ReactNode;
  };
}

const HELICONE_SESSIONS_JS_CODE = `
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": \`Bearer ${process.env.HELICONE_API_KEY}\`,
  },
});

const session = randomUUID();

openai.chat.completions.create(
  {
    messages: [
      {
        role: "user",
        content: "Generate an abstract for a course on space.",
      },
    ],
    model: "gpt-4",
  },
  {
    headers: {
      "Helicone-Session-Id": session,
      "Helicone-Session-Path": "/abstract",
      "Helicone-Session-Name": "Course Plan",
    },
  }
);
`;

const HELICONE_PROMPTS_JS_CODE = `
// 1. Add these lines
import { hpf, hpstatic } from "@helicone/prompts";

const chatCompletion = await openai.chat.completions.create(
  {
    messages: [
      {
        role: "system",
        // 2. Use hpstatic for static prompts
        content: hpstatic\`You are a creative storyteller.\`,
      },
      {
        role: "user",
        // 3: Add hpf to any string, and nest any variable in additional brackets \`{}\`
        content: hpf\`Write a story about \${{ character }}\`,
      },
    ],
    model: "gpt-3.5-turbo",
  },
  {
    // 3. Add Prompt Id Header
    headers: {
      "Helicone-Prompt-Id": "prompt_story",
    },
  }
);

`;

export const ONBOARDING_STEPS: Record<OnboardingStepLabel, OnboardingStep> = {
  REQUESTS_TABLE: {
    stepNumber: 0,
    popoverData: {
      icon: <SheetIcon className="h-4 w-4" />,
      title: "Welcome to Requests!",
      stepNumber: 1,
      description:
        "View all your request and response data here after adding one line of code to your LLM app.",
      additionalData: (
        <OnboardingPopoverAccordion
          icon={<MessageCircleQuestionIcon className="h-4 w-4" />}
          title="How to send requests to Helicone? "
          button={{
            text: "Doc",
            link: "https://docs.helicone.ai/getting-started/quick-start",
          }}
        >
          <p>
            If you are using the proxy method (recommended), simply add one line
            of code to start sending requests to Helicone.{" "}
            <span className="text-blue-700">Available for any providers.</span>
          </p>
        </OnboardingPopoverAccordion>
      ),
    },
  },
  REQUESTS_DRAWER: {
    stepNumber: 1,
    popoverData: {
      icon: <SheetIcon className="h-4 w-4" />,
      title: "Let’s dive deeper",
      stepNumber: 1,
      description:
        "See the complete request with all messages exchanged with the LLM, metadata, and key metrics. Notice anything unusual in the response? Let's investigate what might have gone wrong.",
    },
  },
  SESSIONS_PAGE: {
    stepNumber: 2,
    popoverData: {
      icon: <WorkflowIcon className="h-6 w-6" />,
      title: "We are in the travel planning session",
      stepNumber: 2,
      description:
        "Each session shows you the complete chain of LLM calls and how they connect. Here you can trace through every step of the travel planning process to find where things started going wrong.",
    },
  },
  SESSIONS_CULPRIT: {
    stepNumber: 3,
    popoverData: {
      icon: <WorkflowIcon className="h-6 w-6" />,
      title: "The Culprit",
      stepNumber: 2,
      description: (
        <>
          The <strong>&quot;extract-travel-plan&quot;</strong> step is where
          things went wrong. Let&apos;s go improve this prompt.
        </>
      ),
      additionalData: (
        <OnboardingPopoverAccordion
          icon={<MessageCircleQuestionIcon className="h-4 w-4" />}
          title="How do I track sessions in Helicone? "
          button={{
            text: "Doc",
            link: "https://docs.helicone.ai/features/sessions",
          }}
        >
          <p>
            Depending on your library, you will need to add 3 headers to your
            request to start tracking your sessions and traces.
          </p>
          <DiffHighlight
            code={HELICONE_SESSIONS_JS_CODE}
            language="javascript"
            newLines={[22, 23, 24]}
            oldLines={[]}
          />
        </OnboardingPopoverAccordion>
      ),
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
          prompt in production, its version history and previous requests.
        </>
      ),
      additionalData: (
        <OnboardingPopoverAccordion
          icon={<MessageCircleQuestionIcon className="h-4 w-4" />}
          title="How do I track my prompts in Helicone? "
          button={{
            text: "Doc",
            link: "https://docs.helicone.ai/features/prompts",
          }}
        >
          <p>Here&apos;s an example:</p>
          <DiffHighlight
            code={HELICONE_PROMPTS_JS_CODE}
            language="javascript"
            newLines={[22, 23, 24]}
            oldLines={[]}
          />
        </OnboardingPopoverAccordion>
      ),
    },
  },
  PROMPTS_EXPERIMENT: {
    stepNumber: 5,
    delayBoxShiftMs: 700,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Let’s iterate on this prompt",
      stepNumber: 3,
      description:
        "Let's improve this prompt to give us better travel plan extractions. Click here to start experimenting.",
    },
  },
  EXPERIMENTS_TABLE: {
    stepNumber: 6,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "A playground for prompts",
      stepNumber: 4,
      description:
        "This is where you can create variations of your prompt, test them against real data, and measure which performs best.",
    },
  },
  EXPERIMENTS_ORIGINAL: {
    stepNumber: 7,
    delayBoxShiftMs: 700,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Here’s your original prompt",
      stepNumber: 4,
      description: (
        <>
          This is your <strong>“extract-travel-plan”</strong> production prompt.
          Let&apos;s create a new version to test against it.
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
    delayBoxShiftMs: 700,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Change the prompt",
      stepNumber: 4,
      description:
        "Try adding step-by-step reasoning to help the model better understand and extract travel plans.",
    },
  },
  EXPERIMENTS_ADD_SAVE: {
    stepNumber: 10,
    popoverData: {
      icon: <BeakerIcon className="h-6 w-6" />,
      title: "Save changes",
      stepNumber: 4,
      description:
        "We already picked a model for you. Go ahead and save your prompt.",
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
        "Test with real data from your users for more realistic results.",
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
        "Now you can monitor error rates, latency, and costs over time to catch anomalies that could suggest new issues.",
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
  updatePointerPosition: () => void;
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
  const router = useRouter();

  const startOnboarding = useCallback(() => {
    if (isOnboardingVisible) return;
    const setReady = async () => {
      const countResponse = await fetch("/api/request/ch/count", {
        method: "POST",
        body: JSON.stringify({ filter: {} }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const count = await countResponse.json();
      if (count.data && count.data > 6) {
        clearInterval(interval);
        setIsOnboardingVisible(true);
        setCurrentStep(0);
        router.push("/requests");
      }
    };

    const interval = setInterval(setReady, 1000);
    return () => clearInterval(interval);
  }, [setCurrentStep, isOnboardingVisible, router]);

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
        if (element) {
          const position = getElementPosition(element);
          if (
            ONBOARDING_STEPS[ONBOARDING_STEP_LABELS[currentStep]]
              .delayBoxShiftMs
          ) {
            setTimeout(() => {
              if (position) {
                setElementPointerPosition(position);
              }
            }, ONBOARDING_STEPS[ONBOARDING_STEP_LABELS[currentStep]].delayBoxShiftMs);
          } else if (position) {
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

  const org = useOrg();
  const pathname = usePathname();

  // useEffect(() => {
  //   if (
  //     !isOnboardingVisible &&
  //     org?.currentOrg?.tier === "demo" &&
  //     pathname !== "/dashboard"
  //   ) {
  //     router.push("/dashboard");
  //   }
  // }, [isOnboardingVisible, org, router]);

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
        updatePointerPosition,
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
