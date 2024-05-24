import AlertBanners from "./panels/alertBanners";
import KafkaSettings from "./panels/kafkaSettings";
import OrgMember from "./panels/orgMember";

interface AdminPageProps {}

const AdminPage = (props: AdminPageProps) => {
  const {} = props;

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <ul className="flex flex-col space-y-8 max-w-4xl">
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-500 p-4 space-y-4">
          <AlertBanners />
        </li>
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-500 p-4 space-y-4">
          <OrgMember />
        </li>
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-500 p-4 space-y-4">
          <KafkaSettings />
        </li>
      </ul>
    </div>
  );
};

export default AdminPage;
