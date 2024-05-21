import { User } from "@supabase/auth-helpers-nextjs";
import { ReactElement, useState } from "react";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import AdminLayout from "../../components/layout/admin/adminLayout";
import { SimpleTable } from "../../components/shared/table/simpleTable";
import HcButton from "../../components/ui/hcButton";
import { ThemedSwitch } from "../../components/shared/themed/themedSwitch";
import { getUSDate } from "../../components/shared/utils/utils";
import { TextInput } from "@tremor/react";
import useNotification from "../../components/shared/notification/useNotification";
import {
  useAlertBanners,
  useCreateAlertBanner,
  useUpdateAlertBanner,
} from "../../services/hooks/admin";
import AdminPage from "../../components/templates/admin/adminPage";

interface AdminProps {
  user: User;
}

const Admin = (props: AdminProps) => {
  const { user } = props;

  return <AdminPage />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user },
  } = options;

  if (
    ![
      "scott@helicone.ai",
      "justin@helicone.ai",
      "cole@helicone.ai",
      "stefan@helicone.ai",
      "test@helicone.ai",
    ].includes(user?.email || "")
  ) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
});
