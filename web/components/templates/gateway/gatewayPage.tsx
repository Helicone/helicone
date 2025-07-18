import FoldedHeader from "@/components/shared/FoldedHeader";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import {
  ColumnConfig,
  SimpleTable,
} from "@/components/shared/table/simpleTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Small } from "@/components/ui/typography";
import { $JAWN_API } from "@/lib/clients/jawn";
import { components } from "@/lib/clients/jawnTypes/public";
import { PlusIcon, Search } from "lucide-react";
import { useState } from "react";
import { formatTime } from "../prompts2025/timeUtils";
import { useRouter } from "next/router";
import CreateRouterDialog from "./createRouterDialog";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useOrg } from "@/components/layout/org/organizationContext";

type Router = components["schemas"]["Router"];

const columns: ColumnConfig<Router>[] = [
  {
    key: "name",
    header: "Name",
    sortable: true,
    minSize: 250,
    render: (item) => (
      <span className="text-sm font-medium text-foreground">{item.name}</span>
    ),
  },
  {
    key: "hash",
    header: "Hash",
    sortable: true,
    minSize: 250,
    render: (item) => (
      <span className="text-sm font-medium text-foreground">{item.hash}</span>
    ),
  },
  {
    key: "lastUpdatedAt",
    header: "Last Updated",
    sortable: true,
    minSize: 250,
    render: (item) => (
      <span className="text-sm font-medium text-foreground">
        {formatTime(new Date(item.lastUpdatedAt), "")}
      </span>
    ),
  },
];

const GatewayPage = () => {
  const [search, setSearch] = useState("");
  const [isCreateRouterDialogOpen, setIsCreateRouterDialogOpen] =
    useState(false);
  const router = useRouter();
  const { data: routers, isLoading } = $JAWN_API.useQuery("get", "/v1/gateway");
  const org = useOrg();
  const { data: hasFeatureFlag } = useFeatureFlag(
    "ai_gateway",
    org?.currentOrg?.id ?? "",
  );

  if (!hasFeatureFlag) {
    return <div>You do not have access to the AI Gateway</div>;
  }

  return (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <FoldedHeader
        showFold={false}
        leftSection={
          <Small className="font-bold text-gray-500 dark:text-slate-300">
            AI Gateway
          </Small>
        }
      />
      <div className="flex h-full min-h-[calc(100vh-57px)] w-full flex-col border-t border-border">
        <div className="border-b border-border bg-background p-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                placeholder="Search routers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <CreateRouterDialog
              open={isCreateRouterDialogOpen}
              setOpen={setIsCreateRouterDialogOpen}
            />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <LoadingAnimation />
          ) : (
            <SimpleTable
              data={routers?.data?.routers ?? []}
              columns={columns}
              emptyMessage="No routers found"
              onSelect={(gatewayRouter) => {
                router.push(`/gateway/${gatewayRouter.id}`);
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default GatewayPage;
