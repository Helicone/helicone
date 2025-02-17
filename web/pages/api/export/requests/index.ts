import { NextApiRequest, NextApiResponse } from "next";
import Papa from "papaparse";
import { getRequests } from "../../../../lib/api/request/request";
import { FilterNode } from "../../../../services/lib/filters/filterDefs";
import { SortLeafRequest } from "../../../../services/lib/sorts/requests/sorts";
import { SupabaseServerWrapper } from "../../../../lib/wrappers/supabase";

interface FlatObject {
  [key: string]: string | number | boolean | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const user = await new SupabaseServerWrapper({ req, res }).getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }
  const { filter, offset, limit, sort } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
    sort: SortLeafRequest;
  };
  const metrics = await getRequests(
    user.data.user.id,
    filter,
    offset,
    limit,
    sort
  );

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=export.csv");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  function flattenJSON(jsonObj: any, prefix = "", depth = 0): FlatObject {
    const flattened: FlatObject = {};

    for (const key in jsonObj) {
      if (jsonObj.hasOwnProperty(key)) {
        const newPrefix = prefix ? prefix + "." + key : key;

        if (
          typeof jsonObj[key] === "object" &&
          jsonObj[key] !== null &&
          depth < 3
        ) {
          Object.assign(
            flattened,
            flattenJSON(jsonObj[key], newPrefix, depth + 1)
          );
        } else {
          flattened[newPrefix] = jsonObj[key];
        }
      }
    }

    return flattened;
  }

  const flattened = metrics.data?.map((item) => flattenJSON(item));

  const csvData = Papa.unparse(flattened || []);

  res.status(metrics.error === null ? 200 : 500).send(csvData);
}
