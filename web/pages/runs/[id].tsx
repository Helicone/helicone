import { User } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../../components/shared/layout/authLayout";
import MetaData from "../../components/shared/metaData";
import { NormalizedRequest } from "../../components/templates/requestsV2/builder/abstractRequestBuilder";
import getRequestBuilder from "../../components/templates/requestsV2/builder/requestBuilder";
import RequestsPageV2 from "../../components/templates/requestsV2/requestsPageV2";
import { getRequests, HeliconeRequest } from "../../lib/api/request/request";
import { Result } from "../../lib/result";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import { FilterNode } from "../../services/lib/filters/filterDefs";
import {
  SortDirection,
  SortLeafRequest,
} from "../../services/lib/sorts/requests/sorts";
import RunsPage from "../../components/templates/runs/runsPage";
import SingleRunPage from "../../components/templates/runs/single/singleRunsPage";

interface SingleRunPageProps {
  user: User;
  jobId: string | null;
}

const SingleRun = (props: SingleRunPageProps) => {
  const { user, jobId } = props;

  return (
    <MetaData title={"Requests"}>
      <AuthLayout user={user}>
        <SingleRunPage jobId={jobId} />
      </AuthLayout>
    </MetaData>
  );
};

export default SingleRun;

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
