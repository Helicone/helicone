import { DocumentDuplicateIcon } from "@heroicons/react/24/solid";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { truncString } from "../lib/stringHelpers";

interface UserMetricsDB {
  user_id: string;
  first_active: string;
  last_active: string;
  total_requests: string;
  average_requests_per_day_active: string;
  average_tokens_per_request: string;
}

export function UserTable({ client }: { client: SupabaseClient }) {
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

  return (
    <div className="h-full">
      <div>
        <span>Showing the most recent {} </span>
        <span className="font-thin text-xs">(max 100)</span>
      </div>
      <div className="h-full overflow-y-auto mt-3">
        <table className="w-full mt-5 table-auto ">
          <thead>
            <tr className="text-slate-300">
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
                className="text-slate-300"
                key={row.user_id ? truncString(row.user_id, 11) : "NULL"}
              >
                <td>{row.user_id ? truncString(row.user_id, 11) : "NULL"}</td>
                <td>
                  {(
                    (new Date().getTime() -
                      new Date(row.first_active).getTime()) /
                    (1000 * 3600 * 24)
                  ).toFixed(2)}{" "}
                  days
                </td>
                <td>{new Date(row.last_active).toLocaleString()}</td>
                <td>{row.total_requests}</td>
                <td>
                  {(
                    +row.total_requests /
                    Math.ceil(
                      (new Date().getTime() -
                        new Date(row.first_active).getTime()) /
                        (1000 * 3600 * 24)
                    )
                  ).toFixed(2)}
                </td>
                <td>
                  {row.average_tokens_per_request
                    ? (+row.average_tokens_per_request).toFixed(2)
                    : "{{ no tokens found }}"}
                </td>
                <td>$ TBD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
