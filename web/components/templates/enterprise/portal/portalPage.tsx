import { useSupabaseClient } from "@supabase/auth-helpers-react";
import {
  Badge,
  Button,
  Card,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@tremor/react";
import { useOrg } from "../../../shared/layout/organizationContext";
import { useQuery } from "@tanstack/react-query";
import { Database } from "../../../../supabase/database.types";
import { EllipsisHorizontalIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Link from "next/link";
import { clsx } from "../../../shared/clsx";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { UserGroupIcon } from "@heroicons/react/20/solid";
import CustomerRow from "./customerRow";

interface PortalPageProps {}

const PortalPage = (props: PortalPageProps) => {
  const {} = props;

  const supabase = useSupabaseClient();

  const org = useOrg();

  const { data, isLoading } = useQuery<
    Database["public"]["Tables"]["organization"]["Row"][]
  >(["orgs", org?.currentOrg.id], async (query) => {
    const orgId = query.queryKey[1];
    const { data, error } = await supabase
      .from("organization")
      .select("*")
      .eq("reseller_id", orgId);

    if (error) {
      return [];
    }

    return data as Database["public"]["Tables"]["organization"]["Row"][];
  });

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-row items-center justify-between">
        <h1 className="font-semibold text-3xl text-black dark:text-white">
          Customer Portal
        </h1>
        <button
          onClick={() => {}}
          className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Customer
        </button>
      </div>
      <TabGroup>
        <TabList className="font-semibold" variant="line">
          <Tab>Customers</Tab>
          <Tab>Analytics</Tab>
          <Tab>Branding</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className="mt-8 flex">
              {isLoading ? (
                <div>Loading...</div>
              ) : (
                <Card>
                  <Table className="overflow-auto lg:overflow-visible">
                    <TableHead className="border-b border-gray-300 dark:border-gray-700 ">
                      <TableRow>
                        <TableHeaderCell className="w-16"></TableHeaderCell>
                        <TableHeaderCell className="text-black">
                          Name
                        </TableHeaderCell>
                        <TableHeaderCell className="text-black">
                          Created At
                        </TableHeaderCell>
                        <TableHeaderCell className="text-black">
                          Status
                        </TableHeaderCell>
                        <TableHeaderCell className="text-black">
                          Members
                        </TableHeaderCell>
                        <TableHeaderCell className="text-black">
                          Requests (30 days)
                        </TableHeaderCell>
                        <TableHeaderCell></TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data?.map((org, index) => (
                        <CustomerRow org={org} key={index} />
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </TabPanel>
          <TabPanel>
            <div className="mt-8">yessir</div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default PortalPage;
