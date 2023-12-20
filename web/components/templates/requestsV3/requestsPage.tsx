import { useRouter } from "next/router";
import AuthHeader from "../../shared/authHeader";
import FilterBadge from "../../ui/filters/filterBadge";
import { clsx } from "../../shared/clsx";
import {
  NumberInput,
  SearchSelect,
  SearchSelectItem,
  Select,
  SelectItem,
} from "@tremor/react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";
import TimeFilterBadge from "./filters/timeFilterBadge";
import ModelFilterBadge from "./filters/modelFilterBadge";
import StatusFilterBadge from "./filters/statusFilterBadge";
import TokenFilterBadge from "./filters/tokenFilterBadge";
import TextFilterBadge from "./filters/shared/textFilterBadge";

interface RequestsPageProps {}

const RequestsPage = (props: RequestsPageProps) => {
  const {} = props;

  const router = useRouter();

  return (
    <>
      <AuthHeader title={"Requests"} />
      <div className="flex flex-col space-y-4 pb-36">
        <div className="flex flex-row space-x-2 items-center w-full">
          <TimeFilterBadge />
          <ModelFilterBadge />
          <StatusFilterBadge />
          <TokenFilterBadge />
          <TextFilterBadge title={"User"} filterKey={"user"} />
          <FilterBadge title="More" showTitle={false}>
            <ul className="flex flex-col space-y-2 w-full">
              <li className="w-full">
                <button className="hover:bg-gray-200 rounded-lg w-full flex items-center text-sm py-1 space-x-1 px-1">
                  <PlusCircleIcon className="w-4 h-4 text-gray-500" />
                  <p>Feedback</p>
                </button>
              </li>
              <li className="w-full">
                <button className="hover:bg-gray-200 rounded-lg w-full flex items-center text-sm py-1 space-x-1 px-1">
                  <PlusCircleIcon className="w-4 h-4 text-gray-500" />
                  <p>cp - 1</p>
                </button>
              </li>
              <li className="w-full">
                <button className="hover:bg-gray-200 rounded-lg w-full flex items-center text-sm py-1 space-x-1 px-1">
                  <PlusCircleIcon className="w-4 h-4 text-gray-500" />
                  <p>cp -2</p>
                </button>
              </li>
            </ul>
          </FilterBadge>
        </div>

        <button
          onClick={() => {
            // add t as a query param
            router.push({
              pathname: router.pathname,
              query: { ...router.query, t: "1m" },
            });
          }}
        >
          Click Me 2
        </button>
      </div>
    </>
  );
};

export default RequestsPage;
