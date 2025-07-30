import LoadingAnimation from "@/components/shared/loadingAnimation";
import {
  ColumnConfig,
  SimpleTable,
} from "@/components/shared/table/simpleTable";
import { Input } from "@/components/ui/input";
import { PlusIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { components } from "@/lib/clients/jawnTypes/public";
import { formatTime } from "../prompts2025/timeUtils";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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

const MyRouters = () => {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { data: routers, isLoading } = $JAWN_API.useQuery("get", "/v1/gateway");

  return (
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

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-md">
                ?
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>What is a router?</DialogTitle>
              </DialogHeader>
              <DialogDescription>
                You can create multiple independent routers with their own rate
                limiting, caching, load-balancing and retries configurations.{" "}
                <br />
                To know more about creating your own routers and the different
                configurations, refer to the{" "}
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  href="https://docs.helicone.ai/ai-gateway/router-quickstart"
                  className="text-primary underline"
                >
                  documentation
                </a>
                .
              </DialogDescription>
            </DialogContent>
          </Dialog>
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
  );
};

export default MyRouters;
