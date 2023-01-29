import {
  CheckCircleIcon,
  InboxArrowDownIcon,
  QueueListIcon,
} from "@heroicons/react/24/solid";
import { useUser } from "@supabase/auth-helpers-react";
import { useEffect } from "react";
import { clsx } from "../../shared/clsx";

interface ConfirmEmailProps {
  onBackHandler: () => void;
  onNextHandler: () => void;
}

const ConfirmEmail = (props: ConfirmEmailProps) => {
  const { onBackHandler, onNextHandler } = props;

  const user = useUser();

  const isConfirmed = user?.confirmed_at !== undefined;

  // rerender the component if the confirm status changes
  useEffect(() => {}, [user?.confirmed_at]);

  return (
    <>
      <p className="font-mono text-md pb-4 mb-4 border-b border-black">
        Step 2: Confirm your email
      </p>
      {isConfirmed ? (
        <div className="flex flex-col border border-black rounded-lg p-8 items-center text-black text-lg sm:text-lg bg-gray-400">
          <CheckCircleIcon className="w-12 h-12 mb-4" />
          <p>Thank you for confirming your email</p>{" "}
          <p>Please continue throw our onboarding process</p>
        </div>
      ) : (
        <div className="flex flex-col border border-black rounded-lg p-8 items-center text-black text-lg sm:text-lg bg-gray-400">
          <InboxArrowDownIcon className="w-12 h-12 mb-4" />
          <p>Check your email for a confirmation link.</p>{" "}
          <p>If you don&apos;t see it, check your spam folder.</p>
        </div>
      )}

      <div className="mt-8 flex flex-row w-full sm:w-2/5 justify-between">
        <button
          onClick={onBackHandler}
          className="rounded-md bg-gray-100 text-black px-3.5 py-1.5 text-base font-semibold leading-7 shadow-sm hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Back
        </button>
        <button
          disabled={!isConfirmed}
          onClick={onNextHandler}
          className={clsx(
            !isConfirmed &&
              "opacity-50 cursor-not-allowed hover:cursor-pointer",
            "rounded-md bg-black px-3.5 py-1.5 text-base font-semibold leading-7 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          )}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default ConfirmEmail;
