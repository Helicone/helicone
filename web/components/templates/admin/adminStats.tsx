import OrgMember from "./panels/orgMember";
import TopOrgs from "./panels/topOrgs";

interface AdminStatsProps {}

const AdminStats = (props: AdminStatsProps) => {
  const {} = props;

  return (
    <div className="flex flex-col space-y-8 w-full">
      <div className="space-y-8">
        <OrgMember />
        <TopOrgs />
      </div>
    </div>
  );
};

export default AdminStats;
