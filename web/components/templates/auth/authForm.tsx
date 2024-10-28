/* eslint-disable @next/next/no-img-element */
import { BsGoogle, BsGithub } from "react-icons/bs";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CustomerPortalContent } from "../../../pages/signin";
import { useRouter } from "next/router";
import { Select, SelectItem, TextInput } from "@tremor/react";
import { Button } from "@/components/ui/button";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailSubmitHandler = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setIsLoading(true);

    await handleEmailSubmit(email, password);
    setIsLoading(false);
  };

  const handleRouting = (regionEvent: "us" | "eu") => {
    // check if the current path contains `localhost`. if it does, don't do anything
    const basePath = window.location.href;

    if (basePath.includes("localhost")) {
      return;
    }

    if (regionEvent === "us") {
      router.push("https://us.helicone.ai/" + authFormType);
    }
    if (regionEvent === "eu") {
      router.push("https://eu.helicone.ai/" + authFormType);
    }
  };

  const checkPath = () => {
    // check if the base path has `us` or `eu` in it
    // if the window does not exist (for example, during SSR), return `us`
    if (typeof window === "undefined") {
      return "us";
    }

    const basePath = window.location.href;
    if (basePath.includes("us")) {
      return "us";
    }
    if (basePath.includes("eu")) {
      return "eu";
    }
    return "us";
  };

  return (
    <div className="w-full bg-[#f8feff] h-full antialiased relative">
      <div className="h-screen flex flex-1 flex-col sm:flex-row justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 relative">
        <div className="flex flex-col w-full space-y-4 h-full justify-center items-center max-w-lg">
          <div className="w-full flex justify-between items-center">
            <Link href="https://www.helicone.ai/" className="-ml-6 flex">
              <span className="sr-only">Helicone</span>
              <Image
                src={"/static/logo.svg"}
                alt="Helicone - Open-source LLM observability and monitoring platform for developers"
                height={200}
                width={200}
                priority={true}
              />
            </Link>
          </div>

          <div className="bg-white h-fit mx-auto w-full p-4 sm:p-8 rounded-lg shadow-md border border-gray-100">
            <div>
              <h2 className="text-xl lg:text-2xl font-semibold leading-9 tracking-tight text-gray-900">
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
            <div className="mt-8">
              <div>
                <form
                  action="#"
                  method="POST"
                  className="space-y-4"
                  onSubmit={handleEmailSubmitHandler}
                >
                  <div className="flex flex-col space-y-1">
                    <label>
                      <span className="text-sm lg:text-md font-medium leading-6 text-gray-900">
                        Data region
                      </span>
                    </label>

                    <Select defaultValue={checkPath()}>
                      <SelectItem
                        value="us"
                        onClick={() => {
                          handleRouting("us");
                        }}
                      >
                        🇺🇸 United States
                      </SelectItem>
                      <SelectItem
                        value="eu"
                        onClick={() => {
                          handleRouting("eu");
                        }}
                      >
                        🇪🇺 European Union
                      </SelectItem>
                    </Select>
                  </div>

                  {authFormType !== "reset-password" && (
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                      >
                        Email
                      </label>
                      <div className="mt-1">
                        <TextInput
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          placeholder={"jane@acme.com"}
                          value={email}
                          onValueChange={setEmail}
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
                          <TextInput
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="***********"
                            required
                            value={password}
                            onValueChange={setPassword}
                          />
                        </div>
                      </div>
                    )}
                    {authFormType === "signin" && (
                      <div className="flex items-center justify-end">
                        <div className="text-xs leading-6">
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

                  <div className="pt-2 w-full flex">
                    <Button
                      size={"sm"}
                      disabled={isLoading}
                      type="submit"
                      className="w-full flex"
                    >
                      {authFormType === "signin"
                        ? "Sign in with email"
                        : authFormType === "signup"
                        ? "Sign up with email"
                        : authFormType === "reset"
                        ? "Reset password"
                        : "Update password"}
                    </Button>
                  </div>
                </form>
              </div>
              {(handleGoogleSubmit || handleGithubSubmit) && (
                <div className="pt-8">
                  <div className="relative">
                    <div
                      className="absolute inset-0 flex items-center"
                      aria-hidden="true"
                    >
                      <div className="w-full border-t border-dashed border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm lg:text-md  font-medium leading-6">
                      <span className="px-4 text-gray-400 bg-white">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <ul className="flex items-center justify-center gap-4 pt-8">
                    {handleGoogleSubmit && (
                      <li className="">
                        <button
                          onClick={() => handleGoogleSubmit()}
                          className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white hover:bg-gray-200 px-3 py-1.5 text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                        >
                          <BsGoogle />
                          <span className="text-sm lg:text-md font-semibold leading-6">
                            Google
                          </span>
                        </button>
                      </li>
                    )}
                    {handleGithubSubmit && (
                      <li className="">
                        <button
                          onClick={() => handleGithubSubmit()}
                          className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white hover:bg-gray-200 px-3 py-1.5 text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                        >
                          <BsGithub />
                          <span className="text-sm lg:text-md font-semibold leading-6">
                            GitHub
                          </span>
                        </button>
                      </li>
                    )}
                  </ul>
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
