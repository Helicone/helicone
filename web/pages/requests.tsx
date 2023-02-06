import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import RequestsTab from "../components/templates/requests/requestsTab";

interface RequestsProps {}

const Requests = (props: RequestsProps) => {
  const {} = props;

  return (
    <MetaData title="Users">
      <AuthLayout>
        <RequestsTab />
      </AuthLayout>
    </MetaData>
  );
};

export default Requests;
