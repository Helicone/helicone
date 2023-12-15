import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import useNotification from "../components/shared/notification/useNotification";
import AuthForm from "../components/templates/auth/authForm";

interface ResetPasswordProps {}

const ResetPassword = (props: ResetPasswordProps) => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { setNotification } = useNotification();
  const user = useUser();

  return (
    <>
      <AuthForm
        handleEmailSubmit={async (email: string, password: string) => {
          const { data, error } = await supabase.auth.updateUser({
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
    </>
  );
};

export default ResetPassword;
