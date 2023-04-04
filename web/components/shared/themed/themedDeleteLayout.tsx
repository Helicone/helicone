import React, { useState } from "react";
import { ColumnFormatted } from "./themedTableV3";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { UIFilterRow } from "./themedAdvancedFilters";
import { NextApiRequest, NextApiResponse } from "next";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database, Json } from "../../../supabase/database.types";
import { clsx } from "../clsx";
import {
  HomeModernIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import ThemedModal from "./themedModal";
import useNotification from "../notification/useNotification";
import { useLayouts } from "../../../services/hooks/useLayouts";

export interface Layout {
  id: number;
  column_sizes: string;
  column_order: string;
  user_id: string;
}

interface DeleteLayoutButtonProps {
  layoutId: number;
  layoutName: string;
}

const DeleteLayoutButton: React.FC<DeleteLayoutButtonProps> = ({
  layoutId,
  layoutName,
}) => {
  const [open, setOpen] = useState(false);
  const supabaseClient = useSupabaseClient();
  const { setNotification } = useNotification();
  const { refetch: refetchLayouts } = useLayouts();

  const onDeleteHandler = async () => {
    const { error } = await supabaseClient
      .from("layout")
      .delete()
      .eq("id", layoutId);

    if (error) {
      setNotification("Error deleting layout", "error");
      setOpen(false);
      return;
    }
    setOpen(false);
    setNotification("Layout deleted", "success");
    refetchLayouts();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-medium border border-gray-300 hover:bg-red-50 text-red-700 shadow-sm hover:text-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
      >
        <TrashIcon className="w-4 h-4 inline mr-2" />
        Delete Layout
      </button>
      {open && (
        <ThemedModal open={open} setOpen={setOpen}>
          <div className="flex flex-col space-y-4 sm:space-y-8 min-w-[25rem]">
            <div className="flex flex-col space-y-2">
              <p className="text-sm sm:text-md font-semibold text-gray-900">
                Delete Layout
              </p>
              <p className="text-sm sm:text-md text-gray-500">
                Are you sure you want to delete layout: {layoutName}?
              </p>
            </div>

            <div className="w-full flex justify-end text-sm space-x-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-medium border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Cancel
              </button>
              <button
                className="flex flex-row items-center rounded-md bg-red-500 px-4 py-2 text-sm font-medium border border-red-500 hover:bg-red-700 text-gray-50 shadow-sm  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                onClick={onDeleteHandler}
              >
                Delete Layout
              </button>
            </div>
          </div>
        </ThemedModal>
      )}
    </>
  );
};

export default DeleteLayoutButton;
