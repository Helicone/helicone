import { User } from "@supabase/auth-helpers-nextjs";
import { ReactElement, useState } from "react";
import { withAuthSSR } from "../../lib/api/handlerWrappers";
import AdminLayout from "../../components/layout/admin/adminLayout";
import { SimpleTable } from "../../components/shared/table/simpleTable";
import HcButton from "../../components/ui/hcButton";
import { ThemedSwitch } from "../../components/shared/themed/themedSwitch";
import { getUSDate } from "../../components/shared/utils/utils";
import { TextInput } from "@tremor/react";
import useNotification from "../../components/shared/notification/useNotification";
import {
  useAlertBanners,
  useCreateAlertBanner,
  useUpdateAlertBanner,
} from "../../services/hooks/admin";

interface AdminProps {
  user: User;
}

const Admin = (props: AdminProps) => {
  const { user } = props;

  const { setNotification } = useNotification();

  const { alertBanners, isAlertBannersLoading, refetch } = useAlertBanners();

  const { createBanner, isCreatingBanner } = useCreateAlertBanner(() => {
    refetch();
    setTitle("");
    setMessage("");
    setNotification("Alert banner created successfully", "success");
  });

  const { isUpdatingBanner, updateBanner } = useUpdateAlertBanner(() => {
    refetch();
    setNotification("Alert banner updated successfully", "success");
  });

  // states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <ul className="flex flex-col space-y-8 max-w-4xl">
        <li className="w-full h-full rounded-lg flex flex-col bg-gray-500 p-4 space-y-4">
          <h2 className="text-lg text-white font-semibold">Alert Banners</h2>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
              <TextInput
                placeholder="Title"
                value={title}
                onValueChange={setTitle}
              />
            </div>
            <div className="col-span-2">
              <TextInput
                placeholder="Message"
                value={message}
                onValueChange={setMessage}
              />
            </div>
            <div className="col-span-1">
              <HcButton
                variant={"primary"}
                size={"xs"}
                onClick={async () => {
                  if (!title || !message) {
                    setNotification("Title and message are required", "error");
                    return;
                  }
                  createBanner({ title, message });
                }}
                loading={isCreatingBanner}
                title={"Create new alert"}
              />
            </div>
          </div>
          <div className="text-black flex flex-col space-y-2">
            <SimpleTable
              data={alertBanners?.data || []}
              columns={[
                {
                  key: "title",
                  header: "Title",
                  render: (row) => (
                    <div className="font-semibold text-black">{row.title}</div>
                  ),
                },
                {
                  key: "message",
                  header: "Message",
                  render: (row) => (
                    <div className="text-wrap">{row.message}</div>
                  ),
                },
                {
                  key: "created_at",
                  header: "Created At",
                  render: (row) => (
                    <div className="">
                      {getUSDate(new Date(row.created_at))}
                    </div>
                  ),
                },
                {
                  key: "active",
                  header: "Active",
                  render: (row) => (
                    <ThemedSwitch
                      checked={row.active}
                      onChange={function (checked: boolean): void {
                        updateBanner({ id: row.id, active: checked });
                      }}
                    />
                  ),
                },
              ]}
            />
          </div>
        </li>
      </ul>
    </div>
  );
};

Admin.getLayout = function getLayout(page: ReactElement) {
  return <AdminLayout>{page}</AdminLayout>;
};

export default Admin;

export const getServerSideProps = withAuthSSR(async (options) => {
  const {
    userData: { user },
  } = options;

  if (
    ![
      "scott@helicone.ai",
      "justin@helicone.ai",
      "cole@helicone.ai",
      "stefan@helicone.ai",
      "test@helicone.ai",
    ].includes(user?.email || "")
  ) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
});
