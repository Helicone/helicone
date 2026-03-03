import PublicMetaData from "../components/layout/public/publicMetaData";
import { GetServerSidePropsContext } from "next";
import { env } from "next-runtime-env";
import Link from "next/link";
import Image from "next/image";
import { AuthBrandingPanel } from "../components/templates/auth/AuthBrandingPanel";

const SignUp = () => {
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

            <div className="flex flex-col items-center text-center gap-4">
              <h2 className="text-2xl font-semibold text-gray-900">
                We&apos;ll be right back
              </h2>
              <p className="text-sm text-gray-600">
                New account registration is not available right now. Please check
                back soon.
              </p>
              <p className="mt-4 text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href={"/signin"}
                  className="text-sky-500 hover:text-sky-700"
                >
                  Sign in here.
                </Link>
              </p>
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
