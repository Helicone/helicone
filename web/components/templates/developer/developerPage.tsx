import AuthHeader from "../../shared/authHeader";

interface DeveloperPageProps {
  title: string;
  children: React.ReactNode;
}

const DeveloperPage: React.FC<DeveloperPageProps> = ({ title, children }) => {
  return (
    <>
      <AuthHeader title={title} />
      {children}
    </>
  );
};

export default DeveloperPage;
