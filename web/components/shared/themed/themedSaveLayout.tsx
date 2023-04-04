import React, { useState } from "react";
import { ColumnFormatted } from "./themedTableV3";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { UIFilterRow } from "./themedAdvancedFilters";
import { NextApiRequest, NextApiResponse } from "next";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database, Json } from "../../../supabase/database.types";
import { clsx } from "../clsx";
import { HomeModernIcon } from "@heroicons/react/24/outline";
import ThemedModal from "./themedModal";

export interface Layout {
  id: number;
  column_sizes: string;
  column_order: string;
  user_id: string;
}

interface SaveLayoutButtonProps {
  saveLayout: () => void;
}

const SaveLayoutButton: React.FC<SaveLayoutButtonProps> = ({ saveLayout }) => {
  return (
    <>
      <button
        type="button"
        onClick={saveLayout}
        className="flex flex-row items-center rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold border border-gray-300 hover:bg-sky-50 text-gray-900 shadow-sm hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        <HomeModernIcon className="w-4 h-4 inline mr-2" />
        Save Layout
      </button>
      <ThemedModal
        open={false}
        setOpen={function (open: boolean): void {
          throw new Error("Function not implemented.");
        }}
      >
        <h1>hello</h1>
      </ThemedModal>
    </>
  );
};

export default SaveLayoutButton;
