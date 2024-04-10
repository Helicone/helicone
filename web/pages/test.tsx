import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";

import { ReactElement } from "react";
import { NextPageWithLayout } from "./_app";
import AuthLayout from "../components/layout/authLayout";
import { SupabaseServerWrapper } from "../lib/wrappers/supabase";

const Test: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = (props) => {
  return (
    <div className="h-screen w-full flex flex-col">
      <div className="bg-green-500 w-full p-4">
        <p className="text-white text-2xl"> THIS IS A TEST PAGE</p>
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
