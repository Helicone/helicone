import AuthLayout from "../../components/layout/auth/authLayout";
import ClustersPage from "../../components/templates/clusters/clustersPage";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import { ReactElement } from "react";
import { IslandContainer } from "@/components/ui/islandContainer";

const Clusters = () => {
  return (
    <IslandContainer className="pt-8">
      <ClustersPage />
    </IslandContainer>
  );
};

Clusters.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Clusters;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user },
  } = options;

  return {
    props: {
      user,
    },
  };
});
