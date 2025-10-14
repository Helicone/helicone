import { GetServerSideProps } from "next";

export default function Admin() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  return {
    redirect: {
      destination: "/admin/hql",
      permanent: false,
    },
  };
};
