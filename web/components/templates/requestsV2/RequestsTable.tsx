import React from "react";
import { useTable, useSortBy, usePagination } from "react-table";

interface Request {
  request_id: string;
  created_at: string;
  status: string;
  user: string;
  cost: string;
  model: string;
  request_text: string;
  response_text: string;
  prompt_tokens: number;
}

interface RequestsTableProps {
  requests: Request[];
}

const RequestsTable: React.FC<RequestsTableProps> = ({ requests }) => {
  const data = React.useMemo(() => requests, [requests]);

  const columns = React.useMemo(
    () => [
      {
        Header: "Created At",
        accessor: "created_at",
      },
      {
        Header: "Status",
        accessor: "status",
      },
      {
        Header: "User",
        accessor: "user",
      },
      {
        Header: "Cost",
        accessor: "cost",
      },
      {
        Header: "Model",
        accessor: "model",
        Cell: ({ cell: { value } }) => value || "Unsupported",
      },
      {
        Header: "Request",
        accessor: "request_text",
      },
      {
        Header: "Response",
        accessor: "response_text",
      },
      {
        Header: "Prompt Tokens",
        accessor: "prompt_tokens",
      },
    ],
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0 },
    },
    useSortBy,
    usePagination
  );

  return (
    <div>
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup, index) => (
            <tr
              {...headerGroup.getHeaderGroupProps()}
              key={`header-group-${index}`}
            >
              {headerGroup.headers.map((column, columnIndex) => (
                <th
                  {...column.getHeaderProps(column.getSortByToggleProps())}
                  key={`header-${columnIndex}`}
                >
                  {column.render("Header")}
                  <span>
                    {column.isSorted
                      ? column.isSortedDesc
                        ? " 🔽"
                        : " 🔼"
                      : ""}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, rowIndex) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()} key={`row-${rowIndex}`}>
                {row.cells.map((cell, cellIndex) => {
                  return (
                    <td {...cell.getCellProps()} key={`cell-${cellIndex}`}>
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {"<<"}
        </button>{" "}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {"<"}
        </button>{" "}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {">"}
        </button>{" "}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {">>"}
        </button>{" "}
        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
        <span>
          | Go to page:{" "}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: "100px" }}
          />
        </span>{" "}
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map((pageSize) => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div>

      <style jsx>{`
        .pagination {
          padding: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default RequestsTable;
