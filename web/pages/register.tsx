import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import AuthenticationForm from "../components/shared/AuthenticationForm";
import { redirectIfLoggedIn } from "../lib/redirectIdLoggedIn";

interface LoginProps {}

const Login = (props: LoginProps) => {
  const supabaseClient = useSupabaseClient();
  const [error, setError] = useState<string | null>(null);
  const {} = props;

  return (
    <AuthenticationForm
      formType="register"
      onSubmit={(state) => {
        supabaseClient.auth
          .signUp({
            email: state.email,
            password: state.password,
            options: {
              emailRedirectTo: `${window.location.origin}`,
            },
          })
          .then((res) => {
            if (res.error) {
              setError(res.error.message);
            } else {
              setError("Check your email for the confirmation link.");
            }
          });
      }}
      error={error}
    />
  );
};

export default Login;

export const getServerSideProps = redirectIfLoggedIn("/dashboard", async () => {
  return {
    props: {},
  };
});
