import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { ArrowPathIcon, InboxArrowDownIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import { useState } from "react";
import { BsGoogle } from "react-icons/bs";

interface LoginProps {
  formState: "login" | "reset" | "signup";
}

const SignedUpConfirmation = ({ email }: { email: string }) => {
  return (
    <div className="flex max-w-[450px] flex-col items-center justify-center rounded-lg border border-black bg-gray-200 p-8 text-center text-lg text-black sm:text-lg">
      <InboxArrowDownIcon className="mb-4 h-12 w-12 animate-bounce" />
      <p>
        Check your email ({email}) for a confirmation link. If you don&apos;t
        see it, check your spam folder.
      </p>{" "}
    </div>
  );
};

const Login = (props: LoginProps) => {
  const { formState: defaultFormState } = props;
  const [formState, setFormState] = useState<"login" | "reset" | "signup">(
    defaultFormState,
  );
  const [authError, setAuthError] = useState<string>();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showSignedUpConfirmation, setShowSignedUpConfirmation] =
    useState<boolean>(false);
  const heliconeAuthClient = useHeliconeAuthClient();
  const router = useRouter();

  const signUpHandler = async (email: string, password: string) => {
    if (email === "") {
      setAuthError("Email is required");
      return;
    }
    if (password === "") {
      setAuthError("Password is required");
      return;
    }

    setLoading(true);

    const { data: user, error: authError } = await heliconeAuthClient.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `https://${origin}/welcome`,
      },
    });

    if (authError) {
      setAuthError(authError);
      setLoading(false);
      return;
    }

    setLoading(false);
    setShowSignedUpConfirmation(true);
  };

  if (showSignedUpConfirmation) {
    return <SignedUpConfirmation email={email} />;
  }

  return (
    <div className="flex w-full min-w-[300px] flex-col space-y-0 sm:min-w-[450px] sm:max-w-2xl">
      <div className="flex w-full flex-row items-center justify-between border-b border-gray-300 pb-2">
        <p className="w-full text-lg font-medium">
          {formState === "login"
            ? "Login"
            : formState === "reset"
              ? "Reset Password"
              : "Welcome to Helicone"}
        </p>
      </div>
      <div className="flex flex-col space-y-2">
        <div className="flex h-full w-full flex-col pt-2">
          <div className="w-full flex-auto pt-2">
            <div className="flex min-h-full items-center justify-center">
              {formState === "reset" ? (
                <div className="w-full max-w-md space-y-8">
                  <form className="space-y-4" action="#" method="POST">
                    <input type="hidden" name="remember" defaultValue="true" />
                    <div className="-space-y-px rounded-md shadow-sm">
                      <div>
                        <label htmlFor="email-address" className="sr-only">
                          Email address
                        </label>
                        <input
                          id="email-address"
                          name="email"
                          type="email"
                          autoComplete="email"
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="text-md relative block w-full appearance-none rounded-md border border-gray-300 p-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:p-4 sm:text-lg"
                          placeholder="Email address"
                        />
                      </div>
                    </div>
                    {authError && (
                      <div className="mt-4 w-full text-sm text-red-600">
                        <p>{authError}</p>
                      </div>
                    )}
                  </form>
                  <button
                    onClick={() => {
                      if (email === "") {
                        setAuthError("Email is required");
                        return;
                      }
                      setLoading(true);
                      heliconeAuthClient
                        .resetPassword({
                          email,
                          options: {
                            emailRedirectTo: `${window.location.origin}/reset`,
                          },
                        })
                        .then((res) => {
                          if (res.error) {
                            setAuthError(res.error);
                          } else {
                            setAuthError(
                              `If an account exists with email (${email}), you will receive an email with a link to reset your password.`,
                            );
                          }
                          setLoading(false);
                        });
                    }}
                    type="submit"
                    className="text-md flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-sky-600 to-indigo-500 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {loading ? (
                      <div className="flex flex-row items-center">
                        <ArrowPathIcon className="mr-1.5 h-4 w-4 animate-spin" />
                        Resetting...
                      </div>
                    ) : (
                      <div className="flex flex-row items-center">
                        Reset Email
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <div className="w-full max-w-md space-y-8">
                  <div className="space-y-4">
                    <input type="hidden" name="remember" defaultValue="true" />
                    <div className="-space-y-px rounded-md shadow-sm">
                      <div>
                        <label htmlFor="email-address" className="sr-only">
                          Email address
                        </label>
                        <input
                          id="email-address"
                          name="email"
                          type="email"
                          autoComplete="email"
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="text-md relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 p-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:p-4 sm:text-lg"
                          placeholder="Email address"
                        />
                      </div>
                      <div>
                        <label htmlFor="password" className="sr-only">
                          Password
                        </label>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          autoComplete="current-password"
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="text-md relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 p-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:p-4 sm:text-lg"
                          placeholder="Password"
                        />
                      </div>
                    </div>
                    {formState === "login" && (
                      <div className="flex items-center justify-end">
                        <div className="text-sm">
                          <button
                            type="button"
                            onClick={() => setFormState("reset")}
                            className="font-medium text-sky-600 hover:text-sky-500"
                          >
                            Forgot your password?
                          </button>
                        </div>
                      </div>
                    )}
                    {authError && (
                      <div className="mt-4 w-full text-sm text-red-600">
                        <p>{authError}</p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (formState === "login") {
                          if (email === "") {
                            return;
                          }
                          if (password === "") {
                            return;
                          }
                          setLoading(true);

                          heliconeAuthClient
                            .signInWithPassword({
                              email,
                              password,
                            })
                            .then((res) => {
                              if (res.error) {
                                setAuthError(res.error);
                              } else {
                                router.push("/dashboard");
                              }
                              setLoading(false);
                            });
                        } else if (formState === "signup") {
                          signUpHandler(email, password);
                        }
                      }}
                      type="button"
                      className="text-md flex w-full justify-center rounded-md border border-transparent bg-gradient-to-r from-sky-600 to-indigo-500 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      {loading ? (
                        <div className="flex flex-row items-center">
                          <ArrowPathIcon className="mr-1.5 h-4 w-4 animate-spin" />
                          Logging in...
                        </div>
                      ) : (
                        <div className="flex flex-row items-center">
                          Sign {formState === "signup" ? "Up" : "In"}
                        </div>
                      )}
                    </button>
                    {/* Sign in with Google */}
                    <button
                      onClick={async () => {
                        setLoading(true);
                        const { data, error } =
                          await heliconeAuthClient.signInWithOAuth({
                            provider: "google",
                          });
                        if (error) {
                          setAuthError(error);
                        }

                        setLoading(false);
                      }}
                      type="button"
                      className="text-md flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      <div className="flex flex-row items-center">
                        <BsGoogle className="mr-2 h-5 w-5" />
                        Sign {formState === "signup" ? "Up" : "In"} with Google
                      </div>
                    </button>
                    {formState === "signup" ? (
                      <div>
                        Already have an account?{" "}
                        <a
                          className="text-indigo-600 hover:cursor-pointer hover:text-indigo-500"
                          onClick={() => setFormState("login")}
                        >
                          Login
                        </a>
                      </div>
                    ) : (
                      <div>
                        don{"'"}t have an account?{" "}
                        <a
                          onClick={() => setFormState("signup")}
                          className="text-indigo-600 hover:cursor-pointer hover:text-indigo-500"
                        >
                          Sign Up
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
