import { GetServerSidePropsContext } from "next";

import { isCustomerDomain } from "../lib/customerPortalHelpers";
import PublicMetaData from "../components/layout/public/publicMetaData";
import HomePage from "../components/templates/home/homePage";

export const Home = () => {
  return (
    <>
      <PublicMetaData
        description={
          "Meet the open-source observability platform built for LLM-developers. Whether you use OpenAI, Anthropic, or open-source models like Llama3, easily monitor your requests and prompts in real-time."
        }
        ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
      >
        <HomePage />
      </PublicMetaData>
    </>
  );
};

export default Home;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  if (isCustomerDomain(context.req.headers.host ?? "")) {
    return {
      redirect: {
        destination: "/signin",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
