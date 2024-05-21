import { TextInput } from "@tremor/react";
import { title } from "process";
import { SimpleTable } from "../../shared/table/simpleTable";
import { ThemedSwitch } from "../../shared/themed/themedSwitch";
import { getUSDate } from "../../shared/utils/utils";
import HcButton from "../../ui/hcButton";
import { useState } from "react";
import {
  useAlertBanners,
  useCreateAlertBanner,
  useUpdateAlertBanner,
} from "../../../services/hooks/admin";
import useNotification from "../../shared/notification/useNotification";
import AlertBanners from "./panels/alertBanners";
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
      </ul>
    </div>
  );
};

export default AdminPage;
