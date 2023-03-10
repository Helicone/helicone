import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import AuthenticationForm from "../components/shared/AuthenticationForm";
import MetaData from "../components/shared/metaData";
import { redirectIfLoggedIn } from "../lib/redirectIdLoggedIn";

interface LoginProps {}

const Login = (props: LoginProps) => {
  const supabaseClient = useSupabaseClient();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {} = props;

  return (
    <MetaData title="Login">
      <AuthenticationForm
        formType="login"
        onSubmit={(state) => {
          supabaseClient.auth
            .signInWithPassword({
              email: state.email,
              password: state.password,
            })
            .then((res) => {
              if (res.error) {
                setError(res.error.message);
              } else {
                router.push("/dashboard");
              }
            });
        }}
        error={error}
        onPasswordReset={function (): void {
          router.push("/reset");
        }}
      />
    </MetaData>
  );
};

export default Login;

export const getServerSideProps = redirectIfLoggedIn("/dashboard", async () => {
  return {
    props: {},
  };
});
