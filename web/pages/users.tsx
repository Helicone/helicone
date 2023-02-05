import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import UsersTab from "../components/templates/users/usersTab";

interface UsersProps {}

const Users = (props: UsersProps) => {
  const {} = props;

  return (
    <MetaData title="Users">
      <AuthLayout>
        <UsersTab />
      </AuthLayout>
    </MetaData>
  );
};

export default Users;
