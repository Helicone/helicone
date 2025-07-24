import OrgMember from "./panels/orgMember";
import TopOrgs from "./panels/topOrgs";

interface AdminStatsProps {}

const AdminStats = (props: AdminStatsProps) => {
  const {} = props;

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <ul className="flex max-w-6xl flex-col space-y-8">
        <li className="flex h-full w-full flex-col space-y-4 rounded-lg bg-gray-500 p-4">
          <OrgMember />
          <TopOrgs />
        </li>
      </ul>
    </div>
  );
};

export default AdminStats;
