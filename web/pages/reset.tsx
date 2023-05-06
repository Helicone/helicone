import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import AuthenticationForm from "../components/shared/AuthenticationForm";
import { SSRContext, SupabaseServerWrapper } from "../lib/wrappers/supabase";

const Login = () => {
  const supabaseClient = useSupabaseClient();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const user = useUser();

  if (user) {
    return (
      <AuthenticationForm
        formType="resetPassword"
        onSubmit={(state) => {
          supabaseClient.auth
            .updateUser({
              email: user.email,
              password: state.password,
            })
            .then((res) => {
              if (res.error) {
                setError(res.error.message);
              } else {
                setError(
                  "Password successfully reset, redirecting to dashboard in 3 seconds..."
                );
                setTimeout(() => {
                  router.push("/");
                }, 3000);
              }
            });
        }}
        error={error}
        resetEmail={user.email}
      />
    );
  } else {
    return (
      <AuthenticationForm
        formType="reset"
        onSubmit={(state) => {
          supabaseClient.auth
            .resetPasswordForEmail(state.email, {
              redirectTo: `${window.location.origin}/reset`,
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
  }
};

export const getServerSideProps = async (ctx: SSRContext<any>) => {
  const supabase = new SupabaseServerWrapper(ctx).getClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.user.email === "heliconedemo@gmail.com") {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }
  return {
    props: {},
  };
};

export default Login;
