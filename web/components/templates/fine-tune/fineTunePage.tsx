import {
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
  TextInput,
} from "@tremor/react";
import {
  BuildingStorefrontIcon,
  ChartPieIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useOrg } from "../../layout/organizationContext";
import { Database } from "../../../supabase/database.types";
import { getUSDateFromString } from "../../shared/utils/utils";
import { middleTruncString } from "../../../lib/stringHelpers";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import JobRow from "./jobRow";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedModal from "../../shared/themed/themedModal";
import FineTuneForm from "./fineTuneForm";

interface FineTuningPageProps {}

const FineTuningPage = (props: FineTuningPageProps) => {
  const {} = props;

  const [fineTuneOpen, setFineTuneOpen] = useState(false);
  const [jobOpen, setJobOpen] = useState(false);
  const [selectedJob, setSelectedJob] =
    useState<Database["public"]["Tables"]["finetune_job"]["Row"]>();

  const supabaseClient = useSupabaseClient<Database>();
  const orgContext = useOrg();

  const { data: jobs, isLoading: isJobsLoading } = useQuery({
    queryKey: ["fine-tune-jobs", orgContext?.currentOrg?.id],
    queryFn: async (query) => {
      const orgId = query.queryKey[1] as string;
      const { data, error } = await supabaseClient
        .from("finetune_job")
        .select("*")
        .eq("organization_id", orgId);

      if (error) {
        console.error(error);
        return [];
      }
      return data;
    },
    refetchOnWindowFocus: false,
  });

  return (
    <>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-row items-center justify-between">
          <h1 className="font-semibold text-3xl text-black dark:text-white">
            Fine-Tune
          </h1>
        </div>
        <TabGroup>
          <TabList className="font-semibold" variant="line">
            <Tab>Jobs</Tab>
            <Tab>Datasets</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <div className="flex flex-col mt-8">
                <div className="flex flex-row justify-between items-center mb-4">
                  <TextInput
                    icon={MagnifyingGlassIcon}
                    placeholder="Search Job Id..."
                    className="max-w-sm"
                    onChange={(e) => {
                      // // add this into query params as search
                      // const search = e.target.value as string;
                      // setCurrentSearch(search);
                      // if (search === "") {
                      //   // delete the query param from the url
                      //   delete router.query.q;
                      //   router.push({
                      //     pathname: router.pathname,
                      //     query: { ...router.query },
                      //   });
                      //   refetch();
                      //   return;
                      // }
                      // router.push({
                      //   pathname: router.pathname,
                      //   query: { ...router.query, q: search },
                      // });
                      // refetch();
                    }}
                  />
                  <div className="flex flex-row space-x-2 items-center">
                    <button
                      onClick={() => {
                        setFineTuneOpen(true);
                      }}
                      className="items-center rounded-lg bg-black dark:bg-white px-2.5 py-1.5 gap-2 text-sm flex font-medium text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Create
                    </button>
                  </div>
                </div>
                <div className="flex flex-col w-full space-y-4">
                  <Card className="py-1 px-2">
                    <Table className="overflow-auto lg:overflow-visible">
                      <TableHead className="border-b border-gray-300 dark:border-gray-700">
                        <TableRow>
                          <TableHeaderCell className="text-black dark:text-white">
                            {/* the fine-tune job id  */}
                            Job Id
                          </TableHeaderCell>
                          <TableHeaderCell className="text-black dark:text-white">
                            Status
                          </TableHeaderCell>
                          <TableHeaderCell className="text-black dark:text-white">
                            Created At
                          </TableHeaderCell>
                          <TableHeaderCell className="text-black dark:text-white">
                            Data Set
                          </TableHeaderCell>
                          <TableHeaderCell className="text-black dark:text-white">
                            Base Model
                          </TableHeaderCell>
                          <TableHeaderCell className="text-black dark:text-white">
                            Trained Tokens
                          </TableHeaderCell>
                          <TableHeaderCell />
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {isJobsLoading ? (
                          <TableRow></TableRow>
                        ) : (
                          jobs?.map((job, index) => (
                            <JobRow
                              job={job}
                              key={index}
                              onSelect={(job) => {
                                setSelectedJob(job);
                                setJobOpen(true);
                              }}
                            />
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </Card>
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <div className="flex flex-col w-full h-96 justify-center items-center">
                <div className="flex flex-col w-2/5">
                  <ChartPieIcon className="h-12 w-12 text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black p-2 rounded-lg" />
                  <p className="text-xl text-black dark:text-white font-semibold mt-8">
                    You do not have any data sets.
                  </p>
                  <p className="text-sm text-gray-500 max-w-sm mt-2">
                    Create a dataset to get started with fine-tuning
                  </p>
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
      <ThemedModal open={fineTuneOpen} setOpen={setFineTuneOpen}>
        <FineTuneForm
          onCancel={() => {
            setFineTuneOpen(false);
          }}
        />
      </ThemedModal>
      <ThemedDrawer open={jobOpen} setOpen={setJobOpen}>
        <div>{JSON.stringify(selectedJob)}</div>
      </ThemedDrawer>
    </>
  );
};

export default FineTuningPage;
