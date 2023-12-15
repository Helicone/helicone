import { GetServerSidePropsContext } from "next";

const Dashboard = () => {
  return "hello";
};

export default Dashboard;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  return {
    redirect: {
      destination: "https://bit.ly/helicone-jobs",
      permanent: false,
    },
  };
};
