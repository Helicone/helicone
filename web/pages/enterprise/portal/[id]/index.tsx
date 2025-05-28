import { GetServerSidePropsContext } from "next";
import AuthLayout from "../../../../components/layout/auth/authLayout";
import MetaData from "../../../../components/layout/public/authMetaData";

import { ReactElement } from "react";
import PortalIdPage from "../../../../components/templates/enterprise/portal/id/portalIdPage";

interface PortalProps {
  orgId: string | null;
}

const Portal = (props: PortalProps) => {
  const { orgId } = props;

  return (
    <MetaData title="Customer Portal">
      <PortalIdPage orgId={orgId} />
    </MetaData>
  );
};

Portal.getLayout = function getLayout(page: ReactElement) {
  return <AuthLayout>{page}</AuthLayout>;
};

export default Portal;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  // get the query param q from the url
  const { id } = ctx.query;

  return {
    props: {
      orgId: id || null,
    },
  };
};
