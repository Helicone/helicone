import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "../layout/onboardingContext";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { LinkIcon, NotepadTextIcon } from "lucide-react";
import { Button } from "./button";

interface HcBreadcrumbProps {
  pages: { name: string; href: string }[];
  "data-onboarding-step"?: number;
}

const CubeSVG = () => (
  <svg
    className="absolute bottom-0 right-0"
    width="247.2"
    height="130.8"
    viewBox="0 0 206 109"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M150.324 3.52046C151.082 3.18866 151.945 3.18866 152.703 3.52046L229.664 37.1909L169.058 63.7062L151.514 71.3817L94.2962 46.3491L73.363 37.1909L150.324 3.52046Z"
      fill="#0CA5E9"
    />
    <path
      d="M94.2962 46.3491L151.514 71.3817L151.514 79.0572L151.514 134.181L94.2962 46.3491Z"
      fill="#0CA5E9"
    />
    <path
      d="M151.514 134.181L151.514 159.999L134.069 152.678L103.716 104.006L73.363 55.3329L73.363 37.1909L94.2962 46.3491L151.514 134.181Z"
      fill="#C2FCF6"
    />
    <path
      d="M134.069 152.678L75.1825 127.967C74.0802 127.505 73.363 126.426 73.363 125.23L73.363 55.3329L103.716 104.006L134.069 152.678Z"
      fill="#F8FEFF"
    />
    <path
      d="M151.514 159.999L151.514 134.181L151.514 79.0572L151.514 71.3817L169.058 63.7062L229.664 37.1909L229.664 107.666L229.664 125.23C229.664 126.426 228.947 127.505 227.845 127.967L222.686 130.132L151.514 159.999Z"
      fill="#0CA5E9"
    />
    <path
      d="M229.664 37.1909L152.703 3.52046C151.945 3.18866 151.082 3.18866 150.324 3.52046L73.363 37.1909M229.664 37.1909L229.664 107.666L229.664 125.23C229.664 126.426 228.947 127.505 227.845 127.967L222.686 130.132L151.514 159.999M229.664 37.1909L169.058 63.7062L151.514 71.3817M73.363 37.1909L94.2962 46.3491M73.363 37.1909L73.363 55.3329M151.514 159.999L151.514 134.181M151.514 159.999L134.069 152.678M151.514 71.3817L94.2962 46.3491M151.514 71.3817L151.514 79.0572L151.514 134.181M151.514 134.181L94.2962 46.3491M134.069 152.678L75.1825 127.967C74.0802 127.505 73.363 126.426 73.363 125.23L73.363 55.3329M134.069 152.678L103.716 104.006L73.363 55.3329"
      stroke="#1E1E1E"
      stroke-width="5.93602"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M30.9515 75.8222C32.1329 75.9427 33.091 76.6134 33.6422 77.5291C34.0097 78.1395 34.2349 78.9742 34.1341 79.7278C33.6916 83.5979 34.1045 87.5076 35.2503 91.2532C35.8232 93.126 34.8078 95.1233 32.9349 95.6962C31.0621 96.2691 29.0648 95.2537 28.4919 93.3809C27.0597 88.6988 26.625 83.832 27.1476 78.9435C27.2671 77.0697 28.9147 75.6622 30.9515 75.8222Z"
      fill="#D0DEE8"
    />
    <path
      d="M34.8362 65.323C35.8509 67.0087 35.307 69.1978 33.6213 70.2125C31.9356 71.2272 29.7465 70.6832 28.7318 68.9975C27.7171 67.3118 28.2611 65.1227 29.9468 64.1081C31.6325 63.0934 33.8215 63.6373 34.8362 65.323Z"
      fill="#D0DEE8"
    />
    <path
      d="M21.2973 61.3976C22.0104 61.6613 22.5814 62.1493 22.9488 62.7597C23.5 63.6754 23.7055 64.9378 23.1977 65.9364C19.5035 74.536 18.7231 84.2922 20.9762 93.3314C21.4474 95.2654 20.269 97.2222 18.4366 97.6321C16.5026 98.1033 14.5458 96.9249 14.1359 95.0926C11.4936 84.4858 12.3737 73.2835 16.6972 63.1963C17.4074 61.3828 19.4225 60.5856 21.2973 61.3976Z"
      fill="#D0DEE8"
    />
    <path
      d="M99.6011 51.9367C108.305 54.8658 111.945 57.6322 116.655 64.4063C117.526 58.8347 117.837 45.3265 104.389 41.0681C101.963 45.6702 100.976 48.0535 99.6011 51.9367Z"
      fill="#1E1E1E"
      stroke="black"
      stroke-width="3.63187"
    />
    <path
      d="M64.6818 45.4595C64.8728 43.8169 62.8732 40.917 62.5771 37.6374C52.03 41.7131 51.2203 44.4665 50.7909 49.4727C53.8539 46.3248 64.4908 47.1022 64.6818 45.4595Z"
      fill="#1E1E1E"
      stroke="black"
      stroke-width="3.63187"
    />
    <path
      d="M54.3184 71.2669C53.4233 76.9575 54.3559 82.3128 56.5013 86.3595C58.6464 90.4056 61.9336 93.0449 65.7732 93.6488C69.6129 94.2528 73.5516 92.7502 76.8352 89.558C80.1194 86.3653 82.6511 81.555 83.5462 75.8644C84.4413 70.1738 83.5086 64.8186 81.3632 60.7718C79.2181 56.7257 75.931 54.0865 72.0913 53.4825C68.2516 52.8785 64.313 54.3812 61.0293 57.5734C57.7452 60.766 55.2135 65.5764 54.3184 71.2669Z"
      fill="white"
      stroke="black"
      stroke-width="3.63187"
    />
    <path
      d="M71.4012 81.7359C70.3049 81.4504 69.6187 80.4102 69.3062 79.1633C68.989 77.8977 69.0187 76.3032 69.4441 74.6698C69.8695 73.0365 70.6213 71.63 71.5155 70.6799C72.3965 69.7438 73.503 69.1705 74.5992 69.456C75.6955 69.7415 76.3817 70.7817 76.6942 72.0286C77.0114 73.2942 76.9817 74.8887 76.5563 76.5221C76.1309 78.1554 75.3791 79.5619 74.4849 80.512C73.6039 81.448 72.4974 82.0214 71.4012 81.7359Z"
      fill="#0E8EE0"
      stroke="#1C528D"
      stroke-width="0.907968"
    />
    <ellipse
      cx="1.71082"
      cy="3.32557"
      rx="1.71082"
      ry="3.32557"
      transform="matrix(-0.96459 -0.263756 -0.263756 0.96459 75.8398 72.7969)"
      fill="#0F57A5"
    />
    <circle
      cx="0.692064"
      cy="0.692064"
      r="0.692064"
      transform="matrix(-0.987854 -0.155387 -0.155387 0.987854 75.8906 72.4883)"
      fill="#FCFEFD"
    />
    <circle
      cx="0.346032"
      cy="0.346032"
      r="0.346032"
      transform="matrix(-0.987854 -0.155387 -0.155387 0.987854 75.5664 74.5391)"
      fill="#FCFEFD"
    />
    <path
      d="M80.4405 79.7257C79.394 86.3789 80.3924 92.632 82.7622 97.3495C85.1337 102.071 88.7915 105.122 93.0669 105.795C97.3422 106.467 101.76 104.686 105.467 100.921C109.17 97.1586 112.04 91.5141 113.087 84.8608C114.133 78.2075 113.135 71.9545 110.765 67.2369C108.393 62.5159 104.736 59.4643 100.46 58.7918C96.185 58.1193 91.7669 59.9006 88.0606 63.6656C84.357 67.4278 81.4871 73.0724 80.4405 79.7257Z"
      fill="white"
      stroke="black"
      stroke-width="3.63187"
    />
    <path
      d="M102.632 92.1801C101.371 91.8515 100.591 90.6076 100.245 89.0958C99.8937 87.5595 99.9505 85.6107 100.473 83.6037C100.996 81.5967 101.897 79.8679 102.953 78.6981C103.992 77.5469 105.28 76.8415 106.541 77.1701C107.803 77.4987 108.583 78.7426 108.929 80.2544C109.28 81.7908 109.223 83.7395 108.701 85.7465C108.178 87.7535 107.277 89.4823 106.221 90.6522C105.182 91.8033 103.894 92.5087 102.632 92.1801Z"
      fill="#0E8EE0"
      stroke="#1C528D"
      stroke-width="0.907968"
    />
    <ellipse
      cx="2.07619"
      cy="3.9768"
      rx="2.07619"
      ry="3.9768"
      transform="matrix(-0.96459 -0.263756 -0.263756 0.96459 107.664 80.6953)"
      fill="#0F57A5"
    />
    <circle
      cx="1.0381"
      cy="1.0381"
      r="1.0381"
      transform="matrix(-0.987854 -0.155387 -0.155387 0.987854 107.625 80.9258)"
      fill="#FCFEFD"
    />
    <circle
      cx="0.692064"
      cy="0.692064"
      r="0.692064"
      transform="matrix(-0.987854 -0.155387 -0.155387 0.987854 107.199 83.6602)"
      fill="#FCFEFD"
    />
  </svg>
);

export default function HcBreadcrumb(props: HcBreadcrumbProps) {
  const { pages, "data-onboarding-step": onboardingStep } = props;
  // rerender if pages changes

  const { isOnboardingVisible, currentStep, setCurrentStep } =
    useOnboardingContext();

  return (
    <nav
      className="flex"
      aria-label="Breadcrumb"
      data-onboarding-step={onboardingStep}
    >
      <ol role="list" className="flex items-center space-x-2">
        {pages.map((page, index) => (
          <li key={page.name}>
            <div className="flex items-center space-x-1">
              <Link
                href={page.href}
                className="text-sm font-medium text-slate-500 hover:text-slate-700 hover:underline"
              >
                {page.name}
              </Link>
              {index === pages.length - 1 ? null : (
                <ChevronRightIcon
                  className="h-4 w-4 flex-shrink-0 text-slate-400"
                  aria-hidden="true"
                />
              )}
            </div>
          </li>
        ))}
        {isOnboardingVisible &&
          currentStep ===
            ONBOARDING_STEPS.EXPERIMENTS_BETTER_PROMPT.stepNumber && (
            <Popover open={true}>
              <PopoverTrigger asChild>
                <LinkIcon
                  data-onboarding-step={
                    ONBOARDING_STEPS.EXPERIMENTS_BETTER_PROMPT.stepNumber
                  }
                  className="h-4 w-4 flex-shrink-0 text-slate-400"
                  aria-hidden="true"
                />
              </PopoverTrigger>
              <PopoverContent className="z-[10000] bg-white p-4 w-[calc(100vw-2rem)] sm:max-w-md flex flex-col gap-2 relative">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center text-slate-900 dark:text-slate-100">
                    <NotepadTextIcon className="h-4 w-4 flex-shrink-0" />
                    <h3 className="font-semibold text-base">
                      Woohoo! The new prompt is better.{" "}
                    </h3>
                  </div>
                  <div className="px-3 py rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium">
                    4 / 5
                  </div>
                </div>
                <p className="text-slate-500 text-[13px] leading-normal">
                  Copy the experiment URL and attach it to your GitHub PR.
                  Reviewers will verify the results before approving and merging
                  it to production.
                </p>
                <Button
                  className="w-auto self-start bg-[#29973E] text-white text-[13px] font-semibold leading-normal mt-6 mb-8"
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Squash and Merge
                </Button>
                <CubeSVG />
              </PopoverContent>
            </Popover>
          )}
      </ol>
    </nav>
  );
}
