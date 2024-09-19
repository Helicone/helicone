import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import BillingPlanPage from "@/components/templates/organization/plan/billingPage";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import { NextPageWithLayout } from "../_app";
import SettingsLayout from "@/components/templates/settings/settingsLayout";

const PlanSettings: NextPageWithLayout = () => {
  return <BillingPlanPage />;
};

PlanSettings.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthLayout>
      <SettingsLayout>{page}</SettingsLayout>
    </AuthLayout>
  );
};

export default PlanSettings;

export const getServerSideProps = withAuthSSR(async (options) => {
  return {
    props: {
      user: options.userData.user,
    },
  };
});
