import { useSupabaseClient } from "@supabase/auth-helpers-react";
import useNotification from "../components/shared/notification/useNotification";
import AuthForm from "../components/templates/auth/authForm";
import { useState } from "react";
import ThemedModal from "../components/shared/themed/themedModal";
import { InboxArrowDownIcon } from "@heroicons/react/24/outline";

const Reset = () => {
  const supabase = useSupabaseClient();
  const { setNotification } = useNotification();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AuthForm
        handleEmailSubmit={async (email: string, password: string) => {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (error) {
            setNotification(
              "Error resetting password. Please try again.",
              "error"
            );
            console.error(error);
            return;
          }
          setOpen(true);
        }}
        authFormType={"reset"}
      />
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col items-center justify-center space-y-4">
          <InboxArrowDownIcon className="w-8 h-8 text-gray-900" />
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
