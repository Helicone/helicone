import { Dialog } from "@headlessui/react";
import {
  ClipboardDocumentIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { UserMetric } from "../../../lib/api/users/users";
import { useDebounce } from "../../../services/hooks/debounce";
import { useUsers } from "../../../services/hooks/users";
import {
  filterListToTree,
  filterUIToFilterLeafs,
} from "../../../services/lib/filters/filterDefs";
import { userTableFilters } from "../../../services/lib/filters/frontendFilterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import {
  SortDirection,
  SortLeafUsers,
} from "../../../services/lib/sorts/users/sorts";
import AuthHeader from "../../shared/authHeader";
import useNotification from "../../shared/notification/useNotification";
import ThemedTableV5 from "../../shared/themed/table/themedTableV5";
import { UIFilterRow } from "../../shared/themed/themedAdvancedFilters";
import ThemedModal from "../../shared/themed/themedModal";
import TableFooter from "../requestsV2/tableFooter";
import { INITIAL_COLUMNS } from "./initialColumns";
import { RenderBarChart } from "../../shared/metrics/barChart";
import UserModal from "./userModal";

function formatNumber(num: number) {
  const numParts = num.toString().split(".");

  if (numParts.length > 1) {
    const decimalPlaces = numParts[1].length;
    if (decimalPlaces < 2) {
      return num.toFixed(2);
    } else if (decimalPlaces > 6) {
      return num.toFixed(6);
    } else {
      return num;
    }
  } else {
    return num.toFixed(2);
  }
}
interface UsersPageV2Props {
  currentPage: number;
  pageSize: number;
  sort: {
    sortKey: string | null;
    sortDirection: SortDirection | null;
    isCustomProperty: boolean;
  };
}

const UsersPageV2 = (props: UsersPageV2Props) => {
  const { currentPage, pageSize, sort } = props;

  const [open, setOpen] = useState(false);

  const [advancedFilters, setAdvancedFilters] = useState<UIFilterRow[]>([]);
  const debouncedAdvancedFilters = useDebounce(advancedFilters, 2_000); // 2 seconds
  const [selectedUser, setSelectedUser] = useState<UserMetric>();

  const sortLeaf: SortLeafRequest =
    sort.sortKey && sort.sortDirection
      ? {
          [sort.sortKey]: sort.sortDirection,
        }
      : {
          last_active: "desc",
        };

  const { users, count, from, isLoading, to, refetch } = useUsers(
    currentPage,
    pageSize,
    sortLeaf,
    filterListToTree(
      filterUIToFilterLeafs(userTableFilters, debouncedAdvancedFilters),
      "and"
    )
  );
  const { setNotification } = useNotification();

  return (
    <>
      <AuthHeader title={"Users"} />
      <div className="flex flex-col space-y-4">
        <ThemedTableV5
          defaultData={users}
          defaultColumns={INITIAL_COLUMNS}
          tableKey="userColumnVisibility"
          dataLoading={isLoading}
          sortable={sort}
          advancedFilters={{
            filterMap: userTableFilters,
            filters: advancedFilters,
            setAdvancedFilters,
            searchPropertyFilters: async () => ({
              data: null,
              error: "Not implemented",
            }),
          }}
          exportData={users}
          onRowSelect={(row) => {
            setSelectedUser(row);
            setOpen(true);
          }}
        />
        <TableFooter
          currentPage={currentPage}
          pageSize={pageSize}
          isCountLoading={isLoading}
          count={count || 0}
          onPageChange={() => {
            refetch();
          }}
          onPageSizeChange={() => {
            refetch();
          }}
          pageSizeOptions={[25, 50, 100]}
          showCount={true}
        />
      </div>

      <UserModal open={open} setOpen={setOpen} user={selectedUser} />
    </>
  );
};

export default UsersPageV2;
