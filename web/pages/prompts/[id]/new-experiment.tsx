import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";

import { ReactElement } from "react";
import AuthLayout from "../../../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import PromptNewExperimentPage from "../../../components/templates/prompts/id/newExperiment/promptNewExperiment";

interface PlaygroundProps {
  user: User;
  id: string;
}

const NewExperiment = (props: PlaygroundProps) => {
  const { user, id } = props;

  return <PromptNewExperimentPage id={id} />;
};

export default NewExperiment;

NewExperiment.getLayout = function getLayout(page: ReactElement) {
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
