import { Tooltip } from "@mui/material";
import ThemedModal from "../shared/themed/themedModal";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

interface ReferralModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ReferralModal = (props: ReferralModalProps) => {
  const { open, setOpen } = props;

  const supabaseClient = useSupabaseClient();

  const {} = supabaseClient.from("user_settings").select("referral_code");

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col space-y-4 w-[450px]">
        <h3 className="font-semibold text-black dark:text-white text-xl">
          Refer a friend - Get Helicone Pro for free!
        </h3>
        <p className="text-gray-500 text-md">
          If you refer a friend, you will receive 6 months of Helicone Pro for
          free! Give the following code to a friend and have them enter it when
          onboarding!
        </p>
        {/* <Tooltip title="Click to Copy" placement="top" arrow>
          <button
            id="secret-key"
            onClick={(e) => {
              navigator.clipboard.writeText(value);
              setNotification("Copied to clipboard", "success");
            }}
            className={clsx(
              variant === "primary"
                ? "bg-gray-200 dark:bg-gray-800 text-xs hover:cursor-pointer"
                : "hover:cursor-pointer text-xs bg-inherit",
              "flex w-[200px] rounded-md border-0 h-8 text-gray-900 dark:text-gray-100 text-left p-2 truncate"
            )}
          >
            {value}
          </button>
        </Tooltip> */}
      </div>
    </ThemedModal>
  );
};

export default ReferralModal;
