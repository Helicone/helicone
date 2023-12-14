import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import useNotification from "../components/shared/notification/useNotification";
import AuthForm from "../components/templates/auth/authForm";

const ResetPassword = () => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { setNotification } = useNotification();

  return (
    <AuthForm
      handleEmailSubmit={async (email: string, password: string) => {
        const { error } = await supabase.auth.updateUser({
          password: password,
        });

        if (error) {
          setNotification("Error updating user. Please try again.", "error");
          console.error(error);
          return;
        }
        setNotification("Success. Redirecting...", "success");
        router.push("/dashboard");
      }}
      authFormType={"reset-password"}
    />
  );
};

export default ResetPassword;
