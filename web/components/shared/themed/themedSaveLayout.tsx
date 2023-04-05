import React, { useState } from "react";
import { ColumnFormatted } from "./themedTableV3";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { UIFilterRow } from "./themedAdvancedFilters";
import { NextApiRequest, NextApiResponse } from "next";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database, Json } from "../../../supabase/database.types";
import { clsx } from "../clsx";
import { HomeModernIcon, PlusIcon } from "@heroicons/react/24/outline";
import ThemedModal from "./themedModal";

export interface Layout {
  id: number;
  column_sizes: string;
  column_order: string;
  user_id: string;
}

interface SaveLayoutButtonProps {
  saveLayout: (name: string) => void;
}

const SaveLayoutButton: React.FC<SaveLayoutButtonProps> = ({ saveLayout }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-medium border border-gray-300 hover:bg-sky-50 text-gray-900 shadow-sm hover:text-sky-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
      >
        <HomeModernIcon className="w-4 h-4 inline mr-2" />
        Create Layout
      </button>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col space-y-4 sm:space-y-8 min-w-[25rem]">
          <div className="flex flex-col space-y-2">
            <p className="text-sm sm:text-md font-semibold text-gray-900">
              Save Layout
            </p>
            <p className="text-sm sm:text-md text-gray-500">
              Save your current layout to be used later.
            </p>
          </div>

          <input
            type="text"
            onChange={(e) => setName(e.target.value)}
            placeholder={"Layout Name..."}
            value={name}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm"
          />
          <div className="w-full flex justify-end text-sm">
            <button
              className="items-center rounded-md bg-black px-3 py-1.5 text-md flex font-normal text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              onClick={() => {
                saveLayout(name);
                setOpen(false);
              }}
            >
              <PlusIcon className="h-4 w-4 inline" />
              Add Layout
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default SaveLayoutButton;
