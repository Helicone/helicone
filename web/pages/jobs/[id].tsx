import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../../components/shared/layout/authLayout";
import MetaData from "../../components/shared/metaData";
import SingleJobPage from "../../components/templates/jobs/single/singleJobPage";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";

interface SingleJobPageProps {
  user: User;
  jobId: string | null;
}

const SingleJob = (props: SingleJobPageProps) => {
  const { user, jobId } = props;

  return (
    <MetaData title={"Requests"}>
      <AuthLayout user={user}>
        <SingleJobPage jobId={jobId} />
      </AuthLayout>
    </MetaData>
  );
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
