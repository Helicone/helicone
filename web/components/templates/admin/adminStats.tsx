import TopOrgs from "./panels/topOrgs";

interface AdminStatsProps {}

const AdminStats = (props: AdminStatsProps) => {
  const {} = props;

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <ul className="flex flex-col space-y-8 max-w-4xl">
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-500 p-4 space-y-4">
          <TopOrgs />
        </li>
      </ul>
    </div>
  );
};

export default AdminStats;
