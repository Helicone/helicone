import { CSVDownload, CSVLink } from "react-csv";
import { SupabaseClient } from "@supabase/supabase-js";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { GetTableData } from "./userTable";

export function UsersCSVDownloadButton({ client }: { client: SupabaseClient }) {
  const data = GetTableData({ client });

  return (
    <CSVLink
      data={data}
      filename={"users.csv"}
      className="flex"
      target="_blank"
    >
      <span>
        <ArrowDownTrayIcon className="mr-1 flex-shrink-0 h-4 w-4" />
      </span>
      <span>Export to CSV</span>
    </CSVLink>
  );
}
