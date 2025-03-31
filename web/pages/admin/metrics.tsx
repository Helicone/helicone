import { dbExecute } from "@/lib/api/db/dbExecute";
import { ReactElement } from "react";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminMetrics from "../../components/templates/admin/adminMetrics";
import { withAuthSSR } from "../../lib/api/handlerWrappers";

interface AdminProps {}

const Admin = (props: AdminProps) => {
  return <AdminMetrics />;
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user },
  } = options;

  const { data, error } = await dbExecute<{ user_id: string }>(
    "SELECT user_id FROM admins WHERE user_id = $1",
    [user?.id]
  );

  const admins = data?.map((admin) => admin.user_id || "") || [];

  if (error) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  if (!admins.includes(user?.id || "")) {
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
