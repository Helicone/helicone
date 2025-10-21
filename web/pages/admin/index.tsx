import { GetServerSideProps } from "next";
import { withAdminSSR } from "../../lib/api/handlerWrappers";

export default function Admin() {
  return null;
}

// Wrap with admin SSR check, then redirect
export const getServerSideProps: GetServerSideProps = async (context) => {
  // First check admin auth
  const adminCheck = await withAdminSSR(context);

  // If admin check failed (redirect), return that
  if ("redirect" in adminCheck) {
    return adminCheck;
  }

  // Admin is authenticated, redirect to HQL
  return {
    redirect: {
      destination: "/admin/hql",
      permanent: false,
    },
  };
};
