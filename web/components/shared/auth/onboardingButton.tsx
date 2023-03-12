import { useState } from "react";
import { clsx } from "../clsx";
import ThemedModal from "../themed/themedModal";
import Login from "./login";

interface OnboardingButtonProps {
  title: string;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  full?: boolean;
}

const OnboardingButton = (props: OnboardingButtonProps) => {
  const { variant = "primary", onClick, full = false, title } = props;

  const [openOnboarding, setOpenOnboarding] = useState(false);

  const handleClick = () => {
    setOpenOnboarding(true);
    onClick && onClick();
  };

  return (
    <>
      {variant === "primary" ? (
        <button
          onClick={handleClick}
          className={clsx(
            full ? "w-full" : "w-auto",
            "inline-flex items-center justify-center whitespace-nowrap rounded-md border border-transparent bg-gradient-to-r from-sky-600 to-indigo-500 bg-origin-border px-4 py-2 text-base font-medium text-white shadow-sm hover:from-sky-700 hover:to-indigo-600"
          )}
        >
          {title}
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={clsx(
            full ? "w-full" : "w-auto",
            "w-full flex items-center justify-center rounded-md border border-transparent bg-white px-4 py-3 text-base font-medium text-sky-700 shadow-sm hover:bg-indigo-50 sm:px-8"
          )}
        >
          {title}
        </button>
      )}

      <ThemedModal open={openOnboarding} setOpen={setOpenOnboarding}>
        <Login formState="signup" />
      </ThemedModal>
    </>
  );
};

export default OnboardingButton;
