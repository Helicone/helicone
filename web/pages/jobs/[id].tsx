import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../../components/layout/authLayout";
import SingleJobPage from "../../components/templates/jobs/single/singleJobPage";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import { ReactElement } from "react";

interface SingleJobPageProps {
  user: User;
  jobId: string | null;
}

const SingleJob = (props: SingleJobPageProps) => {
  const { user, jobId } = props;

  return <SingleJobPage jobId={jobId} />;
};

SingleJob.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default SingleJob;

export const getServerSideProps = async (
  context: GetServerSidePropsContext<{ id: string }>
) => {
  const supabase = new SupabaseServerWrapper(context).getClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };

  const jobId = context.params?.id;

  return {
    props: {
      user: user,
      jobId: jobId,
    },
  };
};
