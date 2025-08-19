import useNotification from "../components/shared/notification/useNotification";
import AuthForm from "../components/templates/auth/authForm";
import { useState } from "react";
import ThemedModal from "../components/shared/themed/themedModal";
import { InboxArrowDownIcon } from "@heroicons/react/24/outline";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { logger } from "@/lib/telemetry/logger";

const Reset = () => {
  const heliconeAuthClient = useHeliconeAuthClient();

  const { setNotification } = useNotification();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AuthForm
        handleEmailSubmit={async (email: string) => {
          const { error } = await heliconeAuthClient.resetPassword({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/reset-password`,
            },
          });

          if (error) {
            setNotification(
              "Error resetting password. Please try again.",
              "error",
            );
            logger.error({ error }, "Error resetting password");
            return;
          }
          setOpen(true);
        }}
        authFormType={"reset"}
      />
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <InboxArrowDownIcon className="h-8 w-8 text-gray-900" />
          <h1 className="text-2xl font-semibold">Reset Password</h1>
          <p className="text-gray-700">
            Please check your email for a link to reset your password.
          </p>
        </div>
      </ThemedModal>
    </>
  );
};

export default Reset;
