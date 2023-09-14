import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { clsx } from "../clsx";
import { useState } from "react";
import { Tooltip } from "@mui/material";
import useNotification from "../notification/useNotification";
import {
  useGetOrgMembers,
  useGetOrgOwner,
} from "../../../services/hooks/organizations";
import { useOrg } from "../layout/organizationContext";
import { useUser } from "@supabase/auth-helpers-react";

interface ThemedTableProps {
  columns: {
    name: string;
    key: string;
    hidden: boolean;
    secret?: boolean;
  }[]; // hidden will hide this column on mobile
  rows?: any[];
  viewHandler?: (row: any) => void;
  editHandler?: (row: any) => void;
  deleteHandler?: (row: any) => void;
}

const SecretInput = (props: { value: string }) => {
  const { value } = props;
  const [show, setShow] = useState(false);
  const { setNotification } = useNotification();

  const user = useUser();

  const org = useOrg();

  const { data, isLoading, refetch } = useGetOrgMembers(
    org?.currentOrg.id || ""
  );

  const { data: orgOwner, isLoading: isOrgOwnerLoading } = useGetOrgOwner(
    org?.currentOrg.id || ""
  );

  const isOwner = org?.currentOrg.owner === user?.id;

  const members = data?.data
    ? data?.data.map((d) => {
        return {
          ...d,
          isOwner: false,
        };
      })
    : [];

  const orgMembers = [
    {
      email: orgOwner?.data?.at(0)?.email,
      member: "",
      isOwner: true,
      org_role: "admin",
    },
    ...members,
  ];

  const isUserAdmin =
    isOwner ||
    orgMembers.find((m) => m.member === user?.id)?.org_role === "admin";

  return (
    <div className="flex flex-row items-center">
      {isUserAdmin && (
        <button
          className="hover:cursor-pointer hover:bg-gray-200 rounded-md p-1"
          onClick={() => setShow(!show)}
        >
          {show ? (
            <EyeSlashIcon className="h-5 w-5 text-gray-900" />
          ) : (
            <EyeIcon className="h-5 w-5 text-gray-900" />
          )}
        </button>
      )}

      {show ? (
        <Tooltip title="Click to Copy" placement="top" arrow>
          <button
            id="secret-key"
            onClick={() => {
              navigator.clipboard.writeText(value);
              setNotification("Copied to clipboard", "success");
            }}
            className={clsx(
              "bg-gray-200 text-xs ml-2 hover:cursor-pointer",
              "block w-full rounded-md border-0 h-8 text-gray-900 text-left p-2 text-ellipsis overflow-hidden"
            )}
          >
            {value}
          </button>
        </Tooltip>
      ) : (
        <input
          id="secret-key"
          name="secret-key"
          type={clsx(show ? "text" : "password")}
          required
          value={value}
          disabled
          className={clsx(
            "text-md",
            "block w-full rounded-md border-0 h-8 text-gray-900"
          )}
        />
      )}
    </div>
  );
};

const ThemedTable = (props: ThemedTableProps) => {
  const { columns, rows, viewHandler, editHandler, deleteHandler } = props;

  return (
    <div className="ring-1 ring-gray-300 rounded-lg bg-white">
      <table className="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            {columns.map((col, idx) => {
              if (idx === 0) {
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    {col.name}
                  </th>
                );
              } else {
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className={clsx(
                      col.hidden ? "hidden" : "",
                      `px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell`
                    )}
                  >
                    {col.name}
                  </th>
                );
              }
            })}
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell"
            >
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows &&
            rows.map((row, rowIdx) => (
              <tr key={row.id}>
                {columns.map((col, colIdx) => {
                  if (colIdx === 0) {
                    return (
                      <td
                        key={colIdx}
                        className={clsx(
                          rowIdx === 0 ? "" : "border-t border-transparent",
                          viewHandler ? "cursor-pointer underline" : "",
                          "relative py-2.5 pl-4 sm:pl-6 pr-3 text-sm"
                        )}
                        onClick={() => viewHandler && viewHandler(row)}
                      >
                        <div className="font-medium text-gray-900 truncate max-w-[300px]">
                          {row[col.key] || "n/a"}
                        </div>
                        {rowIdx !== 0 ? (
                          <div className="absolute right-0 left-6 -top-px h-px bg-gray-200" />
                        ) : null}
                      </td>
                    );
                  } else {
                    return (
                      <td
                        key={colIdx}
                        className={clsx(
                          rowIdx === 0 ? "" : "border-t border-gray-200",
                          col.hidden ? "hidden" : "",
                          "px-3 py-2.5 text-sm text-gray-500 lg:table-cell truncate max-w-[150px]"
                        )}
                      >
                        {col.secret === true ? (
                          <SecretInput value={row[col.key]} />
                        ) : (
                          <span>{row[col.key] || "n/a"}</span>
                        )}
                      </td>
                    );
                  }
                })}
                <td
                  scope="col"
                  className={clsx(
                    rowIdx === 0 ? "" : "border-t border-transparent",
                    "relative py-2.5 pl-3 pr-4 sm:pr-6 text-right"
                  )}
                >
                  {viewHandler && (
                    <button
                      type="button"
                      className="ml-4 inline-flex items-center rounded-md bg-gray-700 px-2 py-1 text-xs text-white shadow-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => viewHandler(row)}
                    >
                      View
                    </button>
                  )}
                  {editHandler && (
                    <button
                      type="button"
                      className="ml-4 inline-flex items-center rounded-md bg-gray-700 px-2 py-1 text-xs text-white shadow-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => editHandler(row)}
                    >
                      Edit
                    </button>
                  )}
                  {deleteHandler && (
                    <button
                      type="button"
                      className="ml-4 inline-flex items-center rounded-md bg-red-600 px-2 py-1 text-xs text-white shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => deleteHandler(row)}
                    >
                      Delete
                    </button>
                  )}

                  {rowIdx !== 0 ? (
                    <div className="absolute right-6 left-0 -top-px h-px bg-gray-200" />
                  ) : null}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default ThemedTable;
