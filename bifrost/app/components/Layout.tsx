import Footer from "@/components/layout/footer";
import NavBar from "@/components/layout/navbar";
import Banner from "@/components/home/Banner";
import { getMetadata } from "@/components/templates/blog/getMetaData";
import { BLOG_CONTENT } from "../blog/page";

export const Layout = async ({
  children,
  hideFooter,
  noNavbarMargin,
}: {
  children: React.ReactNode;
  hideFooter?: boolean;
  noNavbarMargin?: boolean;
}) => {
  const githubResponse = await fetch(
    "https://api.github.com/repos/helicone/helicone",
  );
  const githubData = await githubResponse.json();
  const stars = githubData.stargazers_count;

  const featuredBlogFolderName = (BLOG_CONTENT[0] as any)?.dynmaicEntry
    ?.folderName;
  const featuredBlogMetadata = await getMetadata(featuredBlogFolderName);

  return (
    <>
      <Banner />

      <NavBar
        stars={stars}
        featuredBlogMetadata={
          featuredBlogMetadata || {
            title: "Check out our latest blog",
            description:
              "Open-source LLM observability and monitoring platform for developers",
          }
        }
        featuredBlogFolderName={featuredBlogFolderName}
        noMargin={noNavbarMargin}
      />
      {children}
      {!hideFooter && <Footer />}
    </>
  );
};
