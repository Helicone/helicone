import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";

import { ReactElement } from "react";
import PromptIdPage from "../../components/templates/prompts/id/promptIdPage";
import AuthLayout from "../../components/layout/authLayout";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";

interface PlaygroundProps {
  user: User;
  id: string;
}

const Prompts = (props: PlaygroundProps) => {
  const { user, id } = props;

  return <PromptIdPage id={id} />;
};

export default Prompts;

Prompts.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = new SupabaseServerWrapper(context).getClient();
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

  // get the id from the query params
  const id = context.params?.id as string;

  return {
    props: {
      initialSession: session,
      user: session.user,
      id,
    },
  };
};
