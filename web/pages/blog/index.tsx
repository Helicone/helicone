import Footer from "../../components/shared/layout/footer";
import NavBarV2 from "../../components/shared/layout/navbar/navBarV2";
import MetaData from "../../components/shared/metaData";
import BlogPage from "../../components/templates/blog/blogPage";

interface BlogProps {}

const Blog = (props: BlogProps) => {
  const {} = props;

  return (
    <MetaData title="Blog">
      <NavBarV2 />
      <BlogPage />
      <Footer />
    </MetaData>
  );
};

export default Blog;
