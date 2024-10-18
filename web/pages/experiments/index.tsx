import { GetServerSidePropsContext } from "next";
import { User, useUser } from "@supabase/auth-helpers-react";
import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import { SupabaseServerWrapper } from "../../lib/wrappers/supabase";
import ExperimentsPage from "../../components/templates/prompts/experiments/table/experimentsPage";
import { useOrg } from "../../components/layout/organizationContext";
import { useFeatureFlags } from "../../services/hooks/featureFlags";
import { ContactUsSection } from "../developer";
import { IslandContainer } from "../../components/ui/islandContainer";

interface ExperimentPage {
  user: User;
}

const Experiments = (props: ExperimentPage) => {
  const orgContext = useOrg();

  const { hasFlag } = useFeatureFlags(
    "experiment",
    orgContext?.currentOrg?.id || ""
  );

  return hasFlag ? (
    <ExperimentsPage />
  ) : (
    <IslandContainer>
      <ContactUsSection feature="experiments" />
    </IslandContainer>
  );
};

export default Experiments;

Experiments.getLayout = function getLayout(page: ReactElement) {
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
  return {
    props: {
      user: session.user,
    },
  };
};
