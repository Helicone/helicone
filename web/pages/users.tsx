import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";

interface UsersProps {}

const Users = (props: UsersProps) => {
  const {} = props;

  return (
    <MetaData title="Users">
      <AuthLayout>
        <h1>Hello Users</h1>
      </AuthLayout>
    </MetaData>
  );
};

export default Users;
