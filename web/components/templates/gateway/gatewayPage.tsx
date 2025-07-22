import FoldedHeader from "@/components/shared/FoldedHeader";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import {
  ColumnConfig,
  SimpleTable,
} from "@/components/shared/table/simpleTable";
import { Input } from "@/components/ui/input";
import { Small } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { $JAWN_API } from "@/lib/clients/jawn";
import { components } from "@/lib/clients/jawnTypes/public";
import { TriangleAlertIcon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { formatTime } from "../prompts2025/timeUtils";
import { useRouter } from "next/router";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useOrg } from "@/components/layout/org/organizationContext";
import { PlusIcon } from "lucide-react";
import { useProvider } from "@/hooks/useProvider";
import Link from "next/link";

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
  const router = useRouter();
  const { data: routers, isLoading } = $JAWN_API.useQuery("get", "/v1/gateway");
  const org = useOrg();
  const { data: hasFeatureFlag } = useFeatureFlag(
    "ai_gateway",
    org?.currentOrg?.id ?? "",
  );

  const { providerKeys } = useProvider();

  if (!hasFeatureFlag) {
    return <div>You do not have access to the AI Gateway</div>;
  }

  return (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <FoldedHeader
        showFold={false}
        leftSection={
          <div className="flex items-center gap-1">
            <Small className="font-bold text-gray-500 dark:text-slate-300">
              AI Gateway
            </Small>
          </div>
        }
        rightSection={
          providerKeys.length === 0 && (
            <Badge
              variant="helicone"
              className="gap-2 bg-yellow-200/70 text-yellow-500 hover:bg-yellow-200/70"
            >
              <TriangleAlertIcon className="h-3 w-3" />
              <span>
                You have no provider keys set. Set them in the{" "}
                <Link href="/providers" className="underline">
                  providers
                </Link>{" "}
                page.
              </span>
            </Badge>
          )
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
            <Button onClick={() => router.push("/gateway/create")}>
              <PlusIcon className="h-4 w-4" />
              Create Router
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <LoadingAnimation />
          ) : (
            <SimpleTable
              data={
                // TODO: Move search to jawn
                search
                  ? ((routers?.data?.routers ?? []).filter((router) =>
                      router.name.toLowerCase().includes(search.toLowerCase()),
                    ) ?? [])
                  : (routers?.data?.routers ?? [])
              }
              columns={columns}
              emptyMessage="No routers found"
              onSelect={(gatewayRouter) => {
                router.push(`/gateway/${gatewayRouter.hash}`);
              }}
            />
          )}
        </div>
      </div>
    </main>
  );
};

export default GatewayPage;
