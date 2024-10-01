import { GetServerSidePropsContext } from "next";

import PublicMetaData from "../components/layout/public/publicMetaData";

export const Home = () => {
  return (
    <>
      <PublicMetaData
        description={
          "Meet the open-source observability platform built for LLM-developers. Whether you use OpenAI, Anthropic, or open-source models like Llama3, easily monitor your requests and prompts in real-time."
        }
        ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
      >
        Should not be here
      </PublicMetaData>
    </>
  );
};

export default Home;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  return {
    redirect: {
      destination: "/signin",
      permanent: false,
    },
  };
};
