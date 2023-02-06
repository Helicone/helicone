import { DocumentDuplicateIcon } from "@heroicons/react/24/solid";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { truncString } from "../../../lib/stringHelpers";
import { UsersCSVDownloadButton } from "./usersCsvDownload";

interface UserMetricsDB {
  user_id: string;
  first_active: string;
  last_active: string;
  total_requests: string;
  average_requests_per_day_active: string;
  average_tokens_per_request: string;
}

interface UserRow {
  user_id: string;
  active_for: string;
  last_active: string;
  total_requests: string;
  average_requests_per_day_active: string;
  average_tokens_per_request: string;
}

export function GetTableData({
  client,
  limit,
}: {
  client: SupabaseClient;
  limit?: number;
}): UserRow[] {
  const [data, setData] = useState<UserMetricsDB[]>([]);
  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await client
        .from("user_metrics_rbac")
        .select("*")
        .limit(100);
      if (error) {
        console.log(error);
      } else {
        console.log(data);
        setData(data);
      }
    };
    fetch();
  }, [client]);

  return data.map((row, i) => {
    return {
      user_id: row.user_id ? truncString(row.user_id, 11) : "NULL",
      active_for: (
        (new Date().getTime() - new Date(row.first_active).getTime()) /
        (1000 * 3600 * 24)
      ).toFixed(2),
      last_active: new Date(row.last_active).toLocaleString(),
      total_requests: row.total_requests,
      average_requests_per_day_active: (
        +row.total_requests /
        Math.ceil(
          (new Date().getTime() - new Date(row.first_active).getTime()) /
            (1000 * 3600 * 24)
        )
      ).toFixed(2),
      average_tokens_per_request: row.average_tokens_per_request
        ? (+row.average_tokens_per_request).toFixed(2)
        : "{{ no tokens found }}",
    };
  });
}

export function UserTable({ client }: { client: SupabaseClient }) {
  const data = GetTableData({ client, limit: 100 });

  return (
    <div className="h-full">
      <div>
        <span>Showing the most recent {} </span>
        <span className="font-thin text-xs">(max 100)</span>
        {data.length > 0 ? (
          <span
            className="text-xs items-center text-center px-4 btn btn-primary bg-gray-300 rounded-full py-1 cursor-pointer text-right text-xs"
            style={{ float: "right" }}
          >
            <UsersCSVDownloadButton client={client} />
          </span>
        ) : null}
      </div>
      <div className="h-full overflow-y-auto mt-3">
        <table className="w-full mt-5 table-auto ">
          <thead>
            <tr className="text-black">
              <th className="text-left">User ID</th>
              <th className="text-left">Active for</th>
              <th className="text-left">Last Active</th>
              <th className="text-left">Total requests</th>
              <th className="text-left">AVG(requests/day)</th>
              <th className="text-left">AVG(tokens/request)</th>
              <th className="text-left">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                className="text-black"
                key={row.user_id ? truncString(row.user_id, 11) : "NULL"}
              >
                <td>{row.user_id}</td>
                <td>{row.active_for} days</td>
                <td>{row.last_active}</td>
                <td>{row.total_requests}</td>
                <td>{row.average_requests_per_day_active}</td>
                <td>{row.average_tokens_per_request}</td>
                <td>$ TBD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
