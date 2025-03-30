import { User } from "@supabase/auth-helpers-nextjs";
import { ReactElement } from "react";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import AdminLayout from "../../components/layout/admin/adminLayout";
import AdminPage from "../../components/templates/admin/adminPage";
import { getSupabaseServer } from "../../lib/supabaseServer";

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

  const { data, error } = await getSupabaseServer().from("admins").select("*");

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
