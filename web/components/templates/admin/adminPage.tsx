"use client";

import AlertBanners from "./panels/alertBanners";
import CostBackfiller from "./panels/costBackfiller";
import KafkaSettings from "./panels/kafkaSettings";
import OrgMember from "./panels/orgMember";

interface AdminPageProps {}

const AdminPage = (props: AdminPageProps) => {
  const {} = props;

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <ul className="flex max-w-4xl flex-col space-y-8">
        <li className="flex h-full w-full flex-col space-y-4 rounded-lg bg-gray-500 p-4">
          <AlertBanners />
        </li>
        <li className="flex h-full w-full flex-col space-y-4 rounded-lg bg-gray-500 p-4">
          <OrgMember />
        </li>
        <li className="flex h-full w-full flex-col space-y-4 rounded-lg bg-gray-500 p-4">
          <KafkaSettings />
        </li>
        <li className="flex h-full w-full flex-col space-y-4 rounded-lg bg-gray-500 p-4">
          <CostBackfiller />
        </li>
      </ul>
    </div>
  );
};

export default AdminPage;
