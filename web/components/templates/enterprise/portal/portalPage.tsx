import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

import {
  BuildingStorefrontIcon,
  ChartPieIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import CustomerRow from "./customerRow";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
import ThemedDrawer from "../../../shared/themed/themedDrawer";

import ExportCustomerButton from "./exportCustomerButton";
import usePortalPage from "../../../../services/hooks/enterprise/portal/usePortalPage";
import CreateOrgForm from "../../organization/createOrgForm";

interface PortalPageProps {}

const PortalPage = (props: PortalPageProps) => {
  const {} = props;

  const router = useRouter();
  const [currentSearch, setCurrentSearch] = useState<string>("");
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);

  const { data, isLoading, refetch } = usePortalPage();

  const filteredData = data?.filter((org) => {
    if (currentSearch === null) {
      return true;
    }

    return org.name.toLowerCase().includes(currentSearch.toLowerCase());
  });

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-row items-center justify-between">
          <h1 className="font-semibold text-3xl text-black dark:text-white">
            Customer Portal
          </h1>
        </div>
        <Tabs defaultValue="customers">
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
          </TabsList>
          <TabsContent value="customers">
            <div className="flex flex-col mt-8">
              <div className="flex flex-row justify-between items-center mb-4">
                <div className="max-w-sm">
                  <Input
                    type="search"
                    placeholder="Search Customer Name..."
                    onChange={(e) => {
                      const search = e.target.value as string;
                      setCurrentSearch(search);
                      refetch();
                    }}
                  />
                </div>
                <div className="flex flex-row space-x-2 items-center">
                  <ExportCustomerButton searchQuery={currentSearch} />
                  <button
                    onClick={() => {
                      setAddCustomerModalOpen(true);
                    }}
                    className="items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Customer
                  </button>
                </div>
              </div>
              {data?.length === 0 ? (
                <div className="flex flex-col w-full h-96 justify-center items-center">
                  <div className="flex flex-col w-2/5">
                    <UserGroupIcon className="h-12 w-12 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                    <p className="text-xl text-black dark:text-white font-semibold mt-8">
                      No customers exist!
                    </p>
                    <p className="text-sm text-gray-500 max-w-sm mt-2">
                      Create a new customer to get started or reach out to our
                      support team for help getting started.
                    </p>
                    <div className="flex flex-row items-center justify-between mt-2">
                      <a
                        href="mailto:engineering@helicone.ai"
                        className="font-semibold text-blue-500 underline text-xs flex items-center space-x-1"
                      >
                        Contact Support
                        <ArrowRightIcon className="h-3 w-3 inline" />
                      </a>
                    </div>
                    <div className="flex flex-row items-center justify-between mt-8">
                      <button
                        onClick={() => {
                          setAddCustomerModalOpen(true);
                        }}
                        className="items-center rounded-md bg-black dark:bg-white px-2 py-1 text-xs flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Add Customer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col w-full space-y-4">
                  <Card>
                    <CardContent className="py-2 px-4">
                      <Table>
                        <TableHeader className="border-b border-gray-300 dark:border-gray-700">
                          <TableRow>
                            <TableHead className="w-8"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Members</TableHead>
                            <TableHead>Requests (30 days)</TableHead>
                            <TableHead />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredData?.map((org, index) => (
                            <CustomerRow
                              org={org}
                              key={org.id}
                              refetchCustomerOrgs={refetch}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="analytics">
            <div className="flex flex-col w-full h-96 justify-center items-center">
              <div className="flex flex-col w-2/5">
                <ChartPieIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                <p className="text-xl text-black dark:text-white font-semibold mt-8">
                  Analytics coming soon!
                </p>
                <p className="text-sm text-gray-500 max-w-sm mt-2">
                  You will soon be able to get an understanding of how your
                  customers are using your product and how you can improve their
                  experience.
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="branding">
            <div className="flex flex-col w-full h-96 justify-center items-center">
              <div className="flex flex-col w-2/5">
                <BuildingStorefrontIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                <p className="text-xl text-black dark:text-white font-semibold mt-8">
                  Branding coming soon!
                </p>
                <p className="text-sm text-gray-500 max-w-sm mt-2">
                  Customize your branding and make your portal your own. Your
                  customers will be able to see your logo and colors along with
                  your own domain.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <ThemedDrawer
        open={addCustomerModalOpen}
        setOpen={setAddCustomerModalOpen}
      >
        <div className="flex flex-col space-y-4">
          <p className="text-2xl font-semibold text-black dark:text-white border-b border-gray-300 dark:border-gray-700 py-4">
            Add New Customer
          </p>
          <CreateOrgForm
            variant="reseller"
            onSuccess={() => {
              setAddCustomerModalOpen(false);
              refetch();
            }}
          />
        </div>
      </ThemedDrawer>
    </>
  );
};

export default PortalPage;
