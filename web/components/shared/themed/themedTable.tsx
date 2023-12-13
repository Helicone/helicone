import {
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
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

export interface ThemedTableProps {
  columns: {
    name: string;
    key: string;
    hidden: boolean;
    secret?: boolean;
    render?: (row: any) => JSX.Element;
    className?: string;
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
      {isUserAdmin ? (
        <div className="flex flex-row space-x-1">
          <button
            className="hover:cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md p-1"
            onClick={() => setShow(!show)}
          >
            {show ? (
              <EyeSlashIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
            ) : (
              <EyeIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
            )}
          </button>
          <div className="flex w-full min-w-[10rem]">
            {show ? (
              <Tooltip title="Click to Copy" placement="top" arrow>
                <button
                  id="secret-key"
                  onClick={() => {
                    navigator.clipboard.writeText(value);
                    setNotification("Copied to clipboard", "success");
                  }}
                  className={clsx(
                    "bg-gray-200 dark:bg-gray-800 text-xs hover:cursor-pointer",
                    "flex w-[200px] rounded-md border-0 h-8 text-gray-900 dark:text-gray-100 text-left p-2 truncate"
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
                value={"***************************************************"}
                disabled
                className={clsx(
                  "text-md",
                  "block w-fit rounded-md border-0 h-8 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900"
                )}
              />
            )}
          </div>
        </div>
      ) : (
        <input
          id="secret-key"
          name="secret-key"
          type={clsx(show ? "text" : "password")}
          required
          value={"***************************************************"}
          disabled
          className={clsx(
            "text-md",
            "block w-fit rounded-md border-0 h-8 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-900"
          )}
        />
      )}
    </div>
  );
};

const ThemedTable = (props: ThemedTableProps) => {
  const { columns, rows, viewHandler, editHandler, deleteHandler } = props;

  return (
    <div className="ring-1 ring-gray-300 rounded-lg bg-white dark:bg-black dark:ring-gray-700 overflow-auto">
      <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
        <thead>
          <tr>
            {columns.map((col, idx) => {
              if (idx === 0) {
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-6"
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
                      `px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 lg:table-cell`
                    )}
                  >
                    {col.name}
                  </th>
                );
              }
            })}
            <th
              scope="col"
              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 lg:table-cell"
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
                        <div className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-[300px]">
                          {row[col.key] || "n/a"}
                        </div>
                        {rowIdx !== 0 ? (
                          <div className="absolute right-0 left-6 -top-px h-px bg-gray-200 dark:bg-gray-800" />
                        ) : null}
                      </td>
                    );
                  } else {
                    return (
                      <td
                        key={colIdx}
                        className={clsx(
                          rowIdx === 0
                            ? ""
                            : "border-t border-gray-200 dark:border-gray-800",
                          col.hidden ? "hidden" : "",
                          "max-w-[150px]",
                          "px-3 py-2.5 text-sm text-gray-500 lg:table-cell truncate",
                          col.className
                        )}
                      >
                        {col.secret === true ? (
                          <SecretInput value={row[col.key]} />
                        ) : col.render !== undefined ? (
                          col.render(row)
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
                    "relative py-2.5 pl-3 pr-4 sm:pr-6 text-right items-center"
                  )}
                >
                  {viewHandler && (
                    <button
                      type="button"
                      className="ml-3 inline-flex items-center rounded-md bg-gray-700 dark:bg-gray-300 p-1.5 text-xs text-white dark:text-black shadow-sm hover:bg-gray-900 dark:hover:bg-gray-100 focus:outline-none  disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => viewHandler(row)}
                    >
                      <EyeIcon className="h-3 w-3" />
                    </button>
                  )}
                  {editHandler && (
                    <button
                      type="button"
                      className="ml-3 inline-flex items-center rounded-md bg-gray-700 dark:bg-gray-300 p-1.5 text-xs text-white dark:text-black shadow-sm hover:bg-gray-900 dark:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => editHandler(row)}
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                  )}
                  {deleteHandler && (
                    <button
                      type="button"
                      className="ml-3 inline-flex items-center rounded-md bg-red-700 p-1.5 text-xs text-white shadow-sm hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => deleteHandler(row)}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  )}

                  {rowIdx !== 0 ? (
                    <div className="absolute right-6 left-0 -top-px h-px bg-gray-200 dark:bg-gray-800" />
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
