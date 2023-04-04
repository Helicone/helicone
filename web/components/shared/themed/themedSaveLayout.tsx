import React from "react";
import { ColumnFormatted } from "./themedTableV3";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { UIFilterRow } from "./themedAdvancedFilters";
import { NextApiRequest, NextApiResponse } from "next";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "../../../supabase/database.types";

export interface Layout {
  id: number;
  column_sizes: string;
  column_order: string;
  user_id: string;
}

interface SaveLayoutButtonProps {
  columns: ColumnFormatted[];
  advancedFilters: UIFilterRow[];
  timeFilter: FilterNode;
}

const SaveLayoutButton: React.FC<SaveLayoutButtonProps> = ({
  columns,
  advancedFilters,
  timeFilter,
}) => {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();

  const handleSaveLayout = async () => {
    if (!user) {
      return;
    }
    supabase
      .from("layout")
      .insert({
        user_id: user?.id,
        columns: JSON.stringify(columns),
        filters: JSON.stringify({ advancedFilters, timeFilter }),
        name: "test",
      })
      .then(console.log);
  };

  const getLayouts = async () => {
    supabase.from("layout").select("*").then(console.log);
  };

  return (
    <button type="button" onClick={handleSaveLayout}>
      Save Layout
    </button>
  );
};

export default SaveLayoutButton;
