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
