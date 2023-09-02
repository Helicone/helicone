import Footer from "../../components/shared/layout/footer";
import NavBarV2 from "../../components/shared/layout/navbar/navBarV2";
import MetaData from "../../components/shared/metaData";
import BlogPageV2 from "../../components/templates/blog/blogPageV2";

interface BlogProps {}

const Blog = (props: BlogProps) => {
  const {} = props;

  return (
    <MetaData title="Blog">
      <NavBarV2 />

      <BlogPageV2 />
      <Footer />
    </MetaData>
  );
};

export default Blog;
