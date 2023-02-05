import BasePage from "../components/shared/layout/basePage";
import MetaData from "../components/shared/metaData";
import Footer from "../components/templates/home/footer";

interface TermsProps {}

const Terms = (props: TermsProps) => {
  const {} = props;

  return (
    <MetaData title="Terms of Use">
      <BasePage full variant="secondary">
        <h1 className="h-screen">Hello Terms</h1>
        <h1 className="h-screen">Hello Terms</h1>
      </BasePage>
      <Footer />
    </MetaData>
  );
};

export default Terms;
