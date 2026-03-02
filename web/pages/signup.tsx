import { useRouter } from "next/router";
import { useEffect } from "react";
import PublicMetaData from "../components/layout/public/publicMetaData";
import { GetServerSidePropsContext } from "next";
import { env } from "next-runtime-env";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { DEMO_EMAIL } from "../lib/constants";
import Link from "next/link";
import Image from "next/image";
import { AuthBrandingPanel } from "../components/templates/auth/AuthBrandingPanel";

const SignUp = () => {
  const heliconeAuthClient = useHeliconeAuthClient();
  const router = useRouter();

  useEffect(() => {
    if (
      heliconeAuthClient.user &&
      heliconeAuthClient.user.id &&
      heliconeAuthClient.user.email &&
      heliconeAuthClient.user.email !== DEMO_EMAIL
    ) {
      router.push(`/welcome`);
    }
  }, [heliconeAuthClient.user, router]);

  return (
    <PublicMetaData
      description={
        "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box. "
      }
      ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
    >
      <div className="flex h-screen w-full">
        <AuthBrandingPanel />

        <div className="flex w-full flex-col items-center justify-center bg-white p-6 md:w-1/2 md:p-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center md:hidden">
              <Link href="https://www.helicone.ai/" className="flex">
                <Image
                  src={"/static/logo.svg"}
                  alt="Helicone"
                  height={80}
                  width={80}
                  priority={true}
                />
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Signups are temporarily paused
              </h2>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                Due to an influx of new customers, we&apos;ve temporarily paused
                new signups so we can ensure the best experience for our
                existing users. We&apos;re unable to support and onboard
                additional customers at this time.
              </p>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                We&apos;re working hard to expand our capacity and plan to
                reopen signups soon. In the meantime, please reach out to our
                team if you&apos;d like to be notified when signups are
                available again.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                href="/contact"
                className="flex w-full items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Contact us to join the waitlist
              </Link>
              <Link
                href="/signin"
                className="flex w-full items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PublicMetaData>
  );
};

export default SignUp;

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  if (env("NEXT_PUBLIC_IS_ON_PREM") === "true") {
    return {
      props: {},
    };
  }

  // if the base path contains localhost or vercel, do nothing
  if (
    context.req.headers.host?.includes("localhost") ||
    context.req.headers.host?.includes("vercel")
  ) {
    return {
      props: {},
    };
  }

  // if the base path contains us or eu in the basepath, do nothing
  if (
    context.req.headers.host?.includes("us") ||
    context.req.headers.host?.includes("eu")
  ) {
    return {
      props: {},
    };
  }

  // default to the configured app URL signin if no other conditions are met
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://us.helicone.ai");
  return {
    redirect: {
      destination: `${appUrl}/signin`,
      permanent: true,
    },
  };
};
