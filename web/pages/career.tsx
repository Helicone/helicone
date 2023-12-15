const Dashboard = () => {
  return "hello";
};

export default Dashboard;

export const getServerSideProps = async () => {
  return {
    redirect: {
      destination: "https://bit.ly/helicone-jobs",
      permanent: false,
    },
  };
};
