import Footer from "@/components/layout/footer";
import NavBar from "@/components/layout/navbar";
import Banner from "@/components/home/Banner";

export const Layout = async ({
  children,
  hideFooter,
}: {
  children: React.ReactNode;
  hideFooter?: boolean;
}) => {
  const githubResponse = await fetch(
    "https://api.github.com/repos/helicone/helicone"
  );
  const githubData = await githubResponse.json();
  const stars = githubData.stargazers_count;

  return (
    <>
      <Banner />
      <NavBar stars={stars} />
      {children}
      {!hideFooter && <Footer />}
    </>
  );
};
