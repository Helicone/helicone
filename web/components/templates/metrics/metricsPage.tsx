import {
  ChatBubbleOvalLeftEllipsisIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { clsx } from "../../shared/clsx";
import ThemedTabs from "../../shared/themedTabs";
import { RequestTable } from "../dashboard/requestTable";
import RequestsTab from "./requestsTab";

interface MetricsPageProps {}

type TabType = "requests" | "users";

const MetricsPage = (props: MetricsPageProps) => {
  const {} = props;
  const [selectedTab, setSelectedTab] = useState<TabType>("requests");
  const client = useSupabaseClient();

  const tabs = [
    {
      name: "Requests",
      state: "requests",
      icon: ChatBubbleOvalLeftEllipsisIcon,
      current: selectedTab === "requests",
    },
    {
      name: "Users",
      state: "users",
      icon: UserCircleIcon,
      current: selectedTab === "users",
    },
  ];

  const renderTabContent = () => {
    switch (selectedTab) {
      case "requests":
        return <RequestsTab />;
      case "users":
        return <h1>Users</h1>;
    }
  };

  return (
    <>
      <div className="pb-4">
        <ThemedTabs
          tabs={tabs}
          onSelectHandler={(tab) => setSelectedTab(tab as TabType)}
        />
        {renderTabContent()}
      </div>
    </>
  );
};

export default MetricsPage;
