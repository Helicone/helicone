import { Tooltip } from "@mui/material";
import ThemedModal from "../shared/themed/themedModal";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { clsx } from "../shared/clsx";
import useNotification from "../shared/notification/useNotification";
import { useQuery } from "@tanstack/react-query";
import { ClipboardIcon } from "@heroicons/react/24/outline";

interface ReferralModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ReferralModal = (props: ReferralModalProps) => {
  const { open, setOpen } = props;

  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const { setNotification } = useNotification();

  const { data, isLoading } = useQuery({
    queryKey: ["referralCode", user?.id],
    queryFn: async (query) => {
      const userId = query.queryKey[1];
      return supabaseClient
        .from("user_settings")
        .select("referral_code")
        .eq("user", userId)
        .single();
    },
    refetchOnWindowFocus: false,
  });

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col space-y-4 w-[450px]">
        <h3 className="font-semibold text-black dark:text-white text-xl">
          Refer a friend - Get Helicone Pro for free!
        </h3>
        <p className="text-gray-500 text-sm">
          If you refer a friend, you will receive{" "}
          <span className="font-semibold text-black dark:text-white">
            6 months of Helicone Pro for free!
          </span>{" "}
          Give the following code to a friend and have them enter it when
          onboarding!
        </p>
        <div className="pb-4">
          <Tooltip title="Click to Copy" placement="top" arrow>
            <button
              id="secret-key"
              onClick={(e) => {
                navigator.clipboard.writeText("123");
                setNotification("Copied to clipboard", "success");
              }}
              className={clsx(
                "mt-4 bg-gray-100 dark:bg-gray-900 text-md hover:cursor-pointer",
                "border border-gray-300 dark:border-gray-700 mx-auto flex items-center w-max rounded-md h-full text-gray-900 dark:text-gray-100 text-left px-4 py-2 truncate"
              )}
            >
              {data?.data?.referral_code}
              <ClipboardIcon className="h-4 w-4 ml-2 text-gray-500" />
            </button>
          </Tooltip>
        </div>
      </div>
    </ThemedModal>
  );
};

export default ReferralModal;
