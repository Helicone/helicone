import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ArrowRightIcon } from "@heroicons/react/20/solid";
import {
  BuildingStorefrontIcon,
  ChartPieIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import usePortalPage from "../../../../services/hooks/enterprise/portal/usePortalPage";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import CreateOrgForm from "../../organization/createOrgForm";
import CustomerRow from "./customerRow";

interface PortalPageProps {}

const PortalPage = (props: PortalPageProps) => {
  const {} = props;

  const [currentSearch, setCurrentSearch] = useState<string>("");
  const [addCustomerModalOpen, setAddCustomerModalOpen] = useState(false);

  const { data, refetch } = usePortalPage();

  const filteredData = data?.data?.data?.filter((org) => {
    if (currentSearch === null) {
      return true;
    }

    return org.name.toLowerCase().includes(currentSearch.toLowerCase());
  });

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-3xl font-semibold text-black dark:text-white">
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
            <div className="mt-8 flex flex-col">
              <div className="mb-4 flex flex-row items-center justify-between">
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
                <div className="flex flex-row items-center space-x-2">
                  <button
                    onClick={() => {
                      setAddCustomerModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-black px-2.5 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Customer
                  </button>
                </div>
              </div>
              {data?.data?.data?.length === 0 ? (
                <div className="flex h-96 w-full flex-col items-center justify-center">
                  <div className="flex w-2/5 flex-col">
                    <UserGroupIcon className="h-12 w-12 rounded-lg border border-gray-300 bg-white p-2 text-gray-900 dark:border-gray-700 dark:bg-black dark:text-gray-100" />
                    <p className="mt-8 text-xl font-semibold text-black dark:text-white">
                      No customers exist!
                    </p>
                    <p className="mt-2 max-w-sm text-sm text-gray-500">
                      Create a new customer to get started or reach out to our
                      support team for help getting started.
                    </p>
                    <div className="mt-2 flex flex-row items-center justify-between">
                      <a
                        href="mailto:engineering@helicone.ai"
                        className="flex items-center space-x-1 text-xs font-semibold text-blue-500 underline"
                      >
                        Contact Support
                        <ArrowRightIcon className="inline h-3 w-3" />
                      </a>
                    </div>
                    <div className="mt-8 flex flex-row items-center justify-between">
                      <button
                        onClick={() => {
                          setAddCustomerModalOpen(true);
                        }}
                        className="flex items-center rounded-md bg-black px-2 py-1 text-xs font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white dark:text-black dark:hover:bg-gray-200"
                      >
                        <PlusIcon className="mr-2 h-5 w-5" />
                        Add Customer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex w-full flex-col space-y-4">
                  <Card>
                    <CardContent className="px-4 py-2">
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
                          {filteredData?.map((org) => (
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
            <div className="flex h-96 w-full flex-col items-center justify-center">
              <div className="flex w-2/5 flex-col">
                <ChartPieIcon className="h-12 w-12 rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-black dark:text-white" />
                <p className="mt-8 text-xl font-semibold text-black dark:text-white">
                  Analytics coming soon!
                </p>
                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  You will soon be able to get an understanding of how your
                  customers are using your product and how you can improve their
                  experience.
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="branding">
            <div className="flex h-96 w-full flex-col items-center justify-center">
              <div className="flex w-2/5 flex-col">
                <BuildingStorefrontIcon className="h-12 w-12 rounded-lg border border-gray-300 bg-white p-2 text-black dark:border-gray-700 dark:bg-black dark:text-white" />
                <p className="mt-8 text-xl font-semibold text-black dark:text-white">
                  Branding coming soon!
                </p>
                <p className="mt-2 max-w-sm text-sm text-gray-500">
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
          <p className="border-b border-gray-300 py-4 text-2xl font-semibold text-black dark:border-gray-700 dark:text-white">
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
