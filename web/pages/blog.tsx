const Blog = () => {
  return "hello";
};

export default Blog;

export const getServerSideProps = async () => {
  return {
    redirect: {
      destination: "https://helicone.ai/blog",
      permanent: true,
    },
  };
};
