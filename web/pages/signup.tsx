import { InboxArrowDownIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import LoadingAnimation from "../components/shared/loadingAnimation";
import useNotification from "../components/shared/notification/useNotification";
import ThemedModal from "../components/shared/themed/themedModal";
import AuthForm from "../components/templates/auth/authForm";
import { DEMO_EMAIL } from "../lib/constants";

interface SignUpProps {}

const SignUp = (props: SignUpProps) => {
  const {} = props;

  const supabase = useSupabaseClient();
  const { setNotification } = useNotification();
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  const user = useUser();
  const router = useRouter();

  if (user && user.email !== DEMO_EMAIL) {
    router.push("/welcome");
  }

  return (
    <>
      <AuthForm
        handleEmailSubmit={async (email: string, password: string) => {
          const origin = window.location.origin;

          const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              emailRedirectTo: `${origin}/welcome`,
            },
          });

          if (error) {
            setNotification(
              "Error creating your account. Please try again.",
              "error"
            );
            console.error(error);
          }

          setShowEmailConfirmation(true);
        }}
        handleGoogleSubmit={async () => {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
          });
          if (error) {
            setNotification(
              "Error creating your account. Please try again.",
              "error"
            );
            console.error(error);
            return;
          }
        }}
        authFormType={"signup"}
      />
      <ThemedModal
        open={showEmailConfirmation}
        setOpen={setShowEmailConfirmation}
      >
        <div className="flex flex-col space-y-4 w-full min-w-[300px] justify-center text-center items-center p-2">
          <h1 className="text-2xl font-semibold text-gray-900">
            Confirm your email
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Please check your email for a confirmation link.
          </p>
          <div className="pt-4">
            <InboxArrowDownIcon className="h-16 w-16 text-gray-700" />
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default SignUp;
