import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
import { clsx } from "../../shared/clsx";

interface TableFooterProps {
  currentPage: number;
  pageSize: number;
  count: number;
  isCountLoading: boolean;
  onPageChange: (newPageNumber: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  pageSizeOptions: number[];
}

const TableFooter = (props: TableFooterProps) => {
  const {
    currentPage,
    pageSize,
    count,
    isCountLoading,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions,
  } = props;

  const router = useRouter();

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="flex flex-row justify-between text-sm items-center">
      <div className="flex flex-row gap-16 items-center justify-between w-full">
        <div className="flex flex-row gap-2 items-center">
          <p className="text-gray-700 font-medium hidden sm:block">
            Rows per page
          </p>
          <select
            id="location"
            name="location"
            className="block w-fit rounded-md border-gray-300 py-1.5 pl-3 pr-6 text-base focus:border-sky-500 hover:cursor-pointer focus:outline-none focus:ring-sky-500 sm:text-sm"
            defaultValue={router.query.page_size}
            onChange={(e) => {
              router.query.page_size = e.target.value;
              router.push(router);
              onPageSizeChange(parseInt(e.target.value, 10));
            }}
            value={router.query.page_size}
          >
            {pageSizeOptions?.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>
        <p className="text-gray-700 font-medium">{`Page ${currentPage} of ${
          isCountLoading
            ? "..."
            : Math.ceil((count as number) / Number(pageSize || 10))
        }`}</p>
        <div className="flex flex-row gap-2 items-center">
          <button
            disabled={currentPage <= 1}
            onClick={() => {
              router.query.page = "1";
              router.push(router);
              onPageChange(1);
            }}
            className={clsx(
              currentPage <= 1
                ? "border-gray-200 bg-gray-50 hover:cursor-not-allowed text-gray-300"
                : "border-gray-300 bg-white hover:cursor-pointer text-gray-700",
              "hidden sm:block w-fit rounded-md border p-1.5 focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm "
            )}
          >
            <ChevronDoubleLeftIcon className="h-5 w-5" />
          </button>
          <button
            disabled={currentPage <= 1}
            onClick={() => {
              router.query.page = (currentPage - 1).toString();
              router.push(router);
              onPageChange(currentPage - 1);
            }}
            className={clsx(
              currentPage <= 1
                ? "border-gray-200 bg-gray-50 hover:cursor-not-allowed text-gray-300"
                : "border-gray-300 bg-white hover:cursor-pointer text-gray-700",
              "block w-fit rounded-md border p-1.5 focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
            )}
          >
            <ChevronLeftIcon className="h-5 w-5 " />
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => {
              router.query.page = (currentPage + 1).toString();
              router.push(router);
              onPageChange(currentPage + 1);
            }}
            className={clsx(
              currentPage >= totalPages
                ? "border-gray-200 bg-gray-50 hover:cursor-not-allowed text-gray-300"
                : "border-gray-300 bg-white hover:cursor-pointer text-gray-700",
              "block w-fit rounded-md border p-1.5 focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
            )}
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => {
              router.query.page = Math.ceil(
                (count as number) / Number(pageSize || 10)
              ).toString();
              router.push(router);
              onPageChange(
                Math.ceil((count as number) / Number(pageSize || 10))
              );
            }}
            className={clsx(
              currentPage >= totalPages
                ? "border-gray-200 bg-gray-50 hover:cursor-not-allowed text-gray-300"
                : "border-gray-300 bg-white hover:cursor-pointer text-gray-700",
              "hidden sm:block w-fit rounded-md border p-1.5 focus:border-sky-500 focus:outline-none focus:ring-sky-500 sm:text-sm"
            )}
          >
            <ChevronDoubleRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableFooter;
