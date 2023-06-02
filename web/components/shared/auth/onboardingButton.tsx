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
          className="px-4 py-2 bg-gray-800 font-semibold text-white rounded-xl"
        >
          {title}
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={clsx(
            full ? "w-full" : "w-auto",
            "whitespace-nowrap rounded-md bg-sky-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
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
