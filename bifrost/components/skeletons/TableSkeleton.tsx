import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown } from "lucide-react";

export function TableSkeleton() {
  // Create an array of placeholder rows
  const placeholderRows = Array(8).fill(0);

  return (
    <div className="w-full overflow-x-auto rounded-lg shadow-sm">
      <div className="min-w-[1000px]">
        <div className="max-h-[calc(200vh-600px)] min-h-[300px] overflow-y-auto">
          <table className="w-full border-separate border-spacing-0 divide-y divide-slate-200">
            <thead className="sticky top-0 bg-slate-100">
              <tr>
                <th
                  scope="col"
                  className="w-1/6 border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500 first:rounded-tl-lg"
                >
                  Provider{" "}
                  <ChevronDown className="ml-1 inline-block h-4 w-4 text-slate-400" />
                </th>
                <th
                  scope="col"
                  className="w-1/6 border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Model{" "}
                  <ChevronDown className="ml-1 inline-block h-4 w-4 text-slate-400" />
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Input/1k <br />
                  Tokens{" "}
                  <ChevronDown className="ml-1 inline-block h-4 w-4 text-slate-400" />
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Output/1k <br />
                  Tokens{" "}
                  <ChevronDown className="ml-1 inline-block h-4 w-4 text-slate-400" />
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Input Cost{" "}
                  <ChevronDown className="ml-1 inline-block h-4 w-4 text-slate-400" />
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                >
                  Output Cost{" "}
                  <ChevronDown className="ml-1 inline-block h-4 w-4 text-slate-400" />
                </th>
                <th
                  scope="col"
                  className="border border-slate-200 bg-slate-100 p-[24px] text-left text-xs font-medium uppercase tracking-wider text-slate-500 last:rounded-tr-lg"
                >
                  Total Cost{" "}
                  <ChevronDown className="ml-1 inline-block h-4 w-4 text-slate-400" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {placeholderRows.map((_, index) => (
                <tr key={index}>
                  <td className="whitespace-nowrap border border-slate-200 p-0 text-sm">
                    <div className="px-6 py-2">
                      <Skeleton className="h-5 w-24" />
                    </div>
                  </td>
                  <td className="border border-slate-200 p-0 text-sm">
                    <div className="px-6 py-2">
                      <Skeleton className="h-5 w-36" />
                    </div>
                  </td>
                  <td className="whitespace-nowrap border border-slate-200 p-0 text-sm">
                    <div className="px-6 py-2">
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </td>
                  <td className="whitespace-nowrap border border-slate-200 p-0 text-sm">
                    <div className="px-6 py-2">
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </td>
                  <td className="whitespace-nowrap border border-slate-200 p-0 text-sm">
                    <div className="px-6 py-2">
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </td>
                  <td className="whitespace-nowrap border border-slate-200 p-0 text-sm">
                    <div className="px-6 py-2">
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </td>
                  <td className="whitespace-nowrap border border-slate-200 p-0 text-sm">
                    <div className="px-6 py-2">
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
