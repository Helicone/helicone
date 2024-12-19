import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";

import { ReactElement } from "react";
import { NextPageWithLayout } from "./_app";
import AuthLayout from "../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";
import getStripe from "../utlis/getStripe";
import { useOrg } from "../components/layout/org/organizationContext";
import { useUser } from "@supabase/auth-helpers-react";

const Test: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  const orgContext = useOrg();
  const user = useUser();
  async function handleGrowthCheckout() {
    const stripe = await getStripe();

    if (!stripe) {
      console.error("Stripe failed to initialize.");
      return;
    }

    const res = await fetch("/api/stripe/create_growth_subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orgId: orgContext?.currentOrg?.id,
        userEmail: user?.email,
      }),
    });
    const { sessionId } = await res.json();
    const result = await stripe.redirectToCheckout({ sessionId });
    if (result.error) {
      console.error(result.error.message);
    }
  }

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="bg-green-500 w-full p-4">
        <p className="text-white text-2xl"> THIS IS A TEST PAGE</p>
        <button
          onClick={() => handleGrowthCheckout()}
          className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Upgrade to Growth
        </button>
      </div>
    </div>
  );
};

Test.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Test;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // Create authenticated Supabase Client
  const supabase = new SupabaseServerWrapper(ctx).getClient();
  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  // check if the user email is scott@helicone.ai, justin@helicone.ai, and cole@helicone.ai
  const userEmail = session.user.email ?? "";
  const allowedEmails = [
    "scott@helicone.ai",
    "justin@helicone.ai",
    "cole@helicone.ai",
  ];

  if (!allowedEmails.includes(userEmail)) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      initialSession: session,
      user: session.user,
    },
  };
};
