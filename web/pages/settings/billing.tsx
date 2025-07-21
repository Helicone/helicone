import { ReactElement } from "react";
import AuthLayout from "../../components/layout/auth/authLayout";
import BillingPlanPage from "@/components/templates/organization/plan/billingPage";
import { GetServerSidePropsContext } from "next";
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

export const getServerSideProps = async (
  context: GetServerSidePropsContext,
) => {
  return {
    props: {},
  };
};
