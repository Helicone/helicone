import Footer from "../../components/layout/footer";
import NavBarV2 from "../../components/layout/navbar/navBarV2";
import MetaData from "../../components/layout/public/authMetaData";
import BlogPage from "../../components/templates/blog/blogPage";

const Blog = () => {
  return (
    <MetaData title="Blog">
      <NavBarV2 />
      <BlogPage />
      <Footer />
    </MetaData>
  );
};

export default Blog;
