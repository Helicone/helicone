import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, TextInput } from "@tremor/react";
import dateFormat from "dateformat";
import { useEffect, useState } from "react";
import { getJawnClient } from "../../../../lib/clients/jawn";
import useNotification from "../../../shared/notification/useNotification";
import { handleLogCostCalculation } from "../../../../utils/LogCostCalculation";
import { Button } from "@/components/ui/button";

interface TopOrgsProps {}

function formatBigNumberWithCommas(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const TopOrgs = (props: TopOrgsProps) => {
  const {} = props;

  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient();

  const [timeRange, setTimeRange] = useState<{
    startDate: Date;
    endDate: Date;
  } | null>(null);

  useEffect(() => {
    setTimeRange({
      // Default to a week

      startDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
  }, []);

  const [tier, setTier] = useState<
    "all" | "free" | "pro" | "enterprise" | "growth"
  >("all");

  const [orgName, setOrgName] = useState("");
  const [emailContains, setEmailContains] = useState("");

  const [searchQuery, setSearchQuery] = useState<{
    orgToSearch: string;
    emailContains: string;
  }>({
    orgToSearch: "",
    emailContains: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["top_orgs", timeRange, tier, searchQuery],
    queryFn: async (query) => {
      const timeRange = query.queryKey[1] as { startDate: Date; endDate: Date };
      const tier = query.queryKey[2] as
        | "all"
        | "free"
        | "pro"
        | "enterprise"
        | "growth";
      const searchQuery = query.queryKey[3] as {
        orgToSearch: string;
        emailContains: string;
      };
      if (!timeRange) return;
      const jawn = getJawnClient();

      return jawn.POST("/v1/admin/orgs/top", {
        body: {
          startDate: dateFormat(timeRange.startDate, "yyyy-mm-dd HH:MM:ss"),
          endDate: dateFormat(timeRange.endDate, "yyyy-mm-dd HH:MM:ss"),
          tier: tier,

          orgsNameContains: searchQuery.orgToSearch
            ? [searchQuery.orgToSearch]
            : undefined,
          emailContains: searchQuery.emailContains
            ? [searchQuery.emailContains]
            : undefined,
        },
      });
    },
    refetchOnWindowFocus: false,
  });

  const tiers = ["all", "free", "pro", "enterprise", "growth"];

  return (
    <>
      <h1 className="text-4xl font-semibold text-gray-200 mb-4 border-t-2 pt-2">
        Top Organizations
      </h1>
      <div className="flex flex-col space-y-2">
        <p className="text-sm">Organization Lookup by Name</p>
        <div className="grid grid-cols-5 gap-4">
          <div className="col-span-2">
            <TextInput
              placeholder="Organization Name"
              value={orgName}
              onValueChange={setOrgName}
            />
          </div>
          <div className="col-span-2">
            <TextInput
              placeholder="email search"
              value={emailContains}
              onValueChange={setEmailContains}
            />
          </div>
          <div className="col-span-1">
            <Button
              disabled={isLoading}
              onClick={async () => {
                setSearchQuery({
                  emailContains: emailContains,
                  orgToSearch: orgName,
                });
              }}
            >
              Search
            </Button>
          </div>
        </div>
      </div>
      <div className="text-black">
        <input
          type="datetime-local"
          value={timeRange?.startDate.toISOString().slice(0, 16)}
          onChange={(e) => {
            setTimeRange({
              ...timeRange!,
              startDate: new Date(e.target.value),
            });
          }}
        />
        <input
          type="datetime-local"
          value={timeRange?.endDate.toISOString().slice(0, 16)}
          onChange={(e) =>
            setTimeRange({
              ...timeRange!,
              endDate: new Date(e.target.value),
            })
          }
        />
      </div>
      <div>
        <button
          onClick={() => {
            setTimeRange({
              startDate: new Date(
                new Date().getTime() - 30 * 24 * 60 * 60 * 1000
              ),
              endDate: new Date(),
            });
          }}
          className="m-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          LAST 30 days
        </button>

        <button
          onClick={() => {
            setTimeRange({
              startDate: new Date(
                new Date().getTime() - 7 * 24 * 60 * 60 * 1000
              ),
              endDate: new Date(),
            });
          }}
          className="m-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          LAST 7 days
        </button>

        <button
          onClick={() => {
            setTimeRange({
              startDate: new Date(
                new Date().getTime() - 1 * 24 * 60 * 60 * 1000
              ),
              endDate: new Date(),
            });
          }}
          className="m-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          LAST 24 hours
        </button>

        <button
          onClick={() => {
            setTimeRange({
              startDate: new Date(new Date().getTime() - 1 * 60 * 60 * 1000),
              endDate: new Date(),
            });
          }}
          className="m-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          LAST 1 hour
        </button>
      </div>
      <div>
        {tiers.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTier(t as any);
            }}
            className={`m-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ${
              tier === t ? "bg-blue-700" : ""
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div>
        Local time:
        {timeRange?.startDate.toLocaleString()} -
        {timeRange?.endDate.toLocaleString()}
      </div>
      <div>
        Estimated total MRR:
        {data?.data
          ?.map((org, i) => handleLogCostCalculation(org.ct))
          .reduce((acc, curr) => acc + curr, 0)}
      </div>
      <h2>Top Organizations</h2>
      <div className="grid grid-cols-9">
        <div className="col-span-2">Org Id (click to copy)</div>
        <div className="col-span-2">Name</div>
        <div className="col-span-2">email</div>
        <div className="col-span-1">Tier</div>
        <div className="col-span-1">Count</div>
        <div className="col-span-1">Estimated spend</div>
      </div>
      <div className="grid grid-cols-8">
        {data?.data?.map((org, i) => (
          <>
            {/* Row 1 */}
            <div className="col-span-2 pl-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(org.organization_id);
                }}
              >
                {org.organization_id}
              </button>
            </div>
            <div className="col-span-2">{org.name}</div>
            <div className="col-span-2">{org.owner_email}</div>
            <div className="col-span-1">
              {formatBigNumberWithCommas(org.ct)}
            </div>

            <div className="col-span-1">{org.tier}</div>
            <div className="col-span-1">{handleLogCostCalculation(org.ct)}</div>
            {/* Row 2 */}
            <div className="col-span-9">
              <BarChart
                data={org.overTime.map((ot) => ({
                  dt: ot.dt,
                  count: +ot.count,
                }))}
                categories={["count"]}
                index={"dt"}
                showYAxis={true}
              />
            </div>
          </>
        ))}
      </div>
    </>
  );
};

export default TopOrgs;
