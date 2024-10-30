import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import ThemedModal from "../../../shared/themed/themedModal";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useOrg } from "../../../layout/organizationContext";
import Papa from "papaparse";
import { Input } from "@/components/ui/input";

interface ExportCustomerButtonProps {
  searchQuery: string | null;
}

const ExportCustomerButton = (props: ExportCustomerButtonProps) => {
  const { searchQuery } = props;

  const [open, setOpen] = useState<boolean>(false);
  const supabase = useSupabaseClient();
  const org = useOrg();
  const [exportName, setExportName] = useState<string>("");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white hover:bg-sky-50 dark:bg-black dark:hover:bg-sky-900 flex flex-row items-center gap-2"
      >
        <ArrowDownTrayIcon
          className="h-5 w-5 text-gray-900 dark:text-gray-100"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
          Export
        </p>
      </button>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col w-[400px] space-y-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Export Customers
          </h3>
          <div className="flex flex-col space-y-2">
            <label className="text-xs text-gray-500">Export Name</label>
            <Input
              placeholder="customers.csv"
              onChange={(e) => {
                setExportName(e.target.value);
              }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                let response, error;

                if (searchQuery) {
                  ({ data: response, error } = await supabase
                    .from("organization")
                    .select(
                      "id, created_at, name, color, icon, tier, organization_type, logo_path"
                    )
                    .eq("reseller_id", org?.currentOrg?.id)
                    .ilike("name", `%${searchQuery}%`)
                    .csv());
                } else {
                  ({ data: response, error } = await supabase
                    .from("organization")
                    .select(
                      "id, created_at, name, color, icon, tier, organization_type, logo_path"
                    )
                    .eq("reseller_id", org?.currentOrg?.id)
                    .csv());
                }

                if (error || !response) {
                  console.error(error);
                  return;
                }

                // Assuming response is a CSV string. If it's not, additional parsing will be needed
                const csv =
                  typeof response === "string"
                    ? response
                    : Papa.unparse(response);

                // Create a Blob from the CSV String
                const blob = new Blob([csv], {
                  type: "text/csv;charset=utf-8;",
                });

                // Create a link element, use it to download the Blob, and remove the link
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.setAttribute("download", exportName || "customers.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Export
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default ExportCustomerButton;
