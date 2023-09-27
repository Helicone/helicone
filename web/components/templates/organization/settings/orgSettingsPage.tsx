import { Database } from "../../../../supabase/database.types";
import { clsx } from "../../../shared/clsx";
import CreateOrgForm from "../createOrgForm";

interface OrgSettingsPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
}

const OrgSettingsPage = (props: OrgSettingsPageProps) => {
  const { org } = props;

  return (
    <div className="py-4 flex flex-col text-gray-900 w-full max-w-2xl">
      <div className="text-sm pb-8 w-[450px]">
        <label
          htmlFor="org-id"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Organization Id
        </label>
        <input
          type="text"
          name="org-id"
          id="org-id"
          value={org.id}
          className={clsx(
            "block w-full rounded-md border border-gray-300 bg-gray-200 text-gray-500 shadow-sm p-2 text-sm"
          )}
          placeholder={"Your shiny new org name"}
          disabled
        />
      </div>
      <div className="w-[450px]">
        <CreateOrgForm
          initialValues={{
            id: org.id,
            name: org.name,
            color: org.color || "",
            icon: org.icon || "",
          }}
        />
      </div>
    </div>
  );
};

export default OrgSettingsPage;
