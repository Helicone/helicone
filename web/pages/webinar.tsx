const Dashboard = () => {
  return "hello";
};

export default Dashboard;

export const getServerSideProps = async () => {
  return {
    redirect: {
      destination:
        "https://www.eventbrite.com/e/empowering-developers-to-innovate-with-language-models-llms-in-your-org-tickets-802016060627?utm-campaign=social&utm-content=attendeeshare&utm-medium=discovery&utm-term=listing&utm-source=cp&aff=ebdsshcopyurl",
      permanent: false,
    },
  };
};
