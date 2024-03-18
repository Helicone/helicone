/* eslint-disable @next/next/no-img-element */
import { BsGoogle, BsGithub } from "react-icons/bs";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { CustomerPortalContent } from "../../../pages/signin";
import { useRouter } from "next/router";

interface AuthFormProps {
  handleEmailSubmit: (email: string, password: string) => void;
  handleGoogleSubmit?: () => void;
  handleGithubSubmit?: () => void;
  authFormType: "signin" | "signup" | "reset" | "reset-password";
  customerPortalContent?: CustomerPortalContent;
}

const AuthForm = (props: AuthFormProps) => {
  const {
    handleEmailSubmit,
    handleGoogleSubmit,
    handleGithubSubmit,
    authFormType,
    customerPortalContent,
  } = props;

  const router = useRouter();
  useEffect(() => {
    if (router.query.url && router.asPath) {
      const fullUrl = window.location.href;
      const startIndex = fullUrl.indexOf("url=");
      const urlParam = fullUrl.substring(startIndex + 4);
      const decodedUrl = decodeURIComponent(urlParam);

      window.location.href = decodedUrl as string;
    }
  }, [router.query, router.asPath]);

  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmitHandler = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setIsLoading(true);
    const email = event.currentTarget.elements.namedItem(
      "email"
    ) as HTMLInputElement;
    const password = event.currentTarget.elements.namedItem(
      "password"
    ) as HTMLInputElement;

    await handleEmailSubmit(email?.value || "", password?.value || "");
    setIsLoading(false);
  };

  // check for the localStorage mfs item
  let mfsEmail: string | null = null;

  if (typeof window !== "undefined") {
    const mfs = window.localStorage.getItem("mfs-email");
    mfsEmail = mfs;
  }

  return (
    <div className="bg-white">
      <div className="h-screen flex flex-1 flex-col sm:flex-row justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 relative">
        <div className="flex flex-col sm:flex-row w-full h-[70vh] my-auto justify-center items-center max-w-6xl">
          <div className="flex sm:hidden w-full h-full">
            <Link href="/" className="-ml-12 -mt-24 px-4">
              <span className="sr-only">Helicone</span>
              <Image
                src={"/static/logo.svg"}
                alt={""}
                height={300}
                width={300}
                priority={true}
              />
            </Link>
          </div>
          <div className="w-full h-full hidden sm:flex flex-col space-y-8 p-8 sm:p-16 justify-start items-start text-start">
            <Link href="/" className="-ml-12 -my-8">
              <span className="sr-only">Helicone</span>
              <Image
                src={"/static/logo.svg"}
                alt={""}
                height={350}
                width={350}
                priority={true}
              />
            </Link>
            <h2 className="text-lg lg:text-xl font-semibold leading-9 tracking-tight text-gray-900">
              Trusted by startups and enterprises of all sizes
            </h2>
            <div className="flex flex-col pt-8">
              <dt className="text-gray-500 text-md">
                Requests logged per month
              </dt>

              <dd className="text-gray-900 text-4xl font-semibold">125M+</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-gray-500 text-md">Total Requests Logged</dt>

              <dd className="text-gray-900 text-4xl font-semibold">1B+</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-gray-500 text-md">Total Users</dt>

              <dd className="text-gray-900 text-4xl font-semibold">5,000+</dd>
            </div>
          </div>
          <div className="bg-white h-fit mx-auto w-full p-8 sm:p-16 rounded-xl shadow-xl border border-gray-200">
            <div>
              <h2 className="text-2xl lg:text-3xl font-semibold leading-9 tracking-tight text-gray-900">
                {authFormType === "signin"
                  ? "Welcome back! Sign in below"
                  : authFormType === "signup"
                  ? "Create an account"
                  : "Reset your password"}
              </h2>
              {authFormType === "signup" ? (
                <p className="mt-2 text-sm lg:text-md leading-6 text-gray-500">
                  Already have an account? Click{" "}
                  <Link href={"/signin"} className="underline text-blue-500">
                    here
                  </Link>{" "}
                  to sign in
                </p>
              ) : (
                <p className="mt-2 text-sm lg:text-md leading-6 text-gray-500">
                  Don&apos;t have an account? Click{" "}
                  <Link href={"/signup"} className="underline text-blue-500">
                    here
                  </Link>{" "}
                  to sign up
                </p>
              )}
            </div>
            <div className="mt-10">
              <div>
                <form
                  action="#"
                  method="POST"
                  className="space-y-4"
                  onSubmit={handleEmailSubmitHandler}
                >
                  {authFormType !== "reset-password" && (
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                      >
                        Email address
                      </label>
                      <div className="mt-1">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          placeholder={mfsEmail !== null ? mfsEmail : ""}
                          className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col space-y-2">
                    {authFormType !== "reset" && (
                      <div>
                        <label
                          htmlFor="password"
                          className="block text-sm lg:text-md  font-medium leading-6 text-gray-900"
                        >
                          Password
                        </label>
                        <div className="mt-1">
                          <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                          />
                        </div>
                      </div>
                    )}
                    {authFormType === "signin" && (
                      <div className="flex items-center justify-end">
                        <div className="text-sm lg:text-md leading-6">
                          <Link
                            href={"/reset"}
                            className="font-medium text-blue-500 hover:text-blue-400 focus:outline-none focus:underline transition ease-in-out duration-150"
                          >
                            Forgot your password?
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="flex w-full justify-center rounded-md bg-black px-3 py-1.5 text-sm lg:text-md  font-semibold leading-6 text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
                    >
                      {isLoading ? (
                        <div className="flex flex-row gap-1 items-center">
                          <ArrowPathIcon className="animate-spin h-5 w-5 mr-3 text-white" />
                          <span>Authenticating...</span>
                        </div>
                      ) : authFormType === "signin" ? (
                        "Sign in with email"
                      ) : authFormType === "signup" ? (
                        "Sign up with email"
                      ) : authFormType === "reset" ? (
                        "Reset password"
                      ) : (
                        "Update password"
                      )}
                    </button>
                  </div>
                </form>
              </div>
              {handleGoogleSubmit && (
                <div className="mt-6">
                  <div className="relative">
                    <div
                      className="absolute inset-0 flex items-center"
                      aria-hidden="true"
                    >
                      <div className="w-full border-t border-gray-400" />
                    </div>
                    <div className="relative flex justify-center text-sm lg:text-md  font-medium leading-6">
                      <span className="px-4 text-gray-600 bg-white">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-4">
                    <button
                      onClick={() => handleGoogleSubmit()}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white hover:bg-gray-200 px-3 py-1.5 text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                      <BsGoogle />
                      <span className="text-sm lg:text-md font-semibold leading-6">
                        Google
                      </span>
                    </button>
                  </div>
                </div>
              )}
              {handleGithubSubmit && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => handleGithubSubmit()}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white hover:bg-gray-200 px-3 py-1.5 text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                      <BsGithub />
                      <span className="text-sm lg:text-md font-semibold leading-6">
                        GitHub
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            {customerPortalContent && (
              <div className="text-xs text-gray-500 flex flex-col text-right mt-4 italic">
                Powered by Helicone
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
