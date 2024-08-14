import { ChartBarIcon } from "@heroicons/react/24/outline";

import {
  useGetHeliconeDatasetRows,
  useGetHeliconeDatasets,
} from "../../../services/hooks/dataset/heliconeDataset";
import HcBadge from "../../ui/hcBadge";
import HcBreadcrumb from "../../ui/hcBreadcrumb";
import HcButton from "../../ui/hcButton";
import { Col, Row } from "../../layout/common";
import RequestCard from "../requestsV2/requestCard";
import ThemedTable from "../../shared/themed/table/themedTable";

interface DatasetIdPageProps {
  id: string;
  currentPage: number;
  pageSize: number;
}

const DatasetIdPage = (props: DatasetIdPageProps) => {
  const { id, currentPage, pageSize } = props;
  const { rows, isLoading } = useGetHeliconeDatasetRows(id);
  const { datasets, isLoading: isLoadingDataset } = useGetHeliconeDatasets([
    id,
  ]);

  return (
    <>
      <div className="w-full h-full flex flex-col space-y-8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col items-start space-y-4 w-full">
            <HcBreadcrumb
              pages={[
                {
                  href: "/datasets",
                  name: "Datasets",
                },
                {
                  href: `/datasets/${id}`,
                  name: datasets?.[0]?.name || "Loading...",
                },
              ]}
            />
            <div className="flex justify-between w-full">
              <div className="flex gap-4 items-end">
                <h1 className="font-semibold text-4xl text-black dark:text-white">
                  {datasets?.[0]?.name}
                </h1>
                <HcBadge title={`${rows?.length || 0} rows`} size={"sm"} />
              </div>
            </div>
          </div>
        </div>
        {/* {
    id: string;
    origin_request_id: string;
    dataset_id: string;
    created_at: string;
    signed_url: components["schemas"]["Result_string.string_"];
} & {
    request_response_body?: any;
} */}
        <ThemedTable
          defaultColumns={[
            {
              header: "Created At",
              accessorKey: "created_at",
              minSize: 200,
              accessorFn: (row) => {
                return new Date(row.created_at ?? 0).toLocaleString();
              },
            },
            {
              header: "Request Body",
              accessorKey: "request_response_body",
              cell: ({ row }) => {
                return JSON.stringify(
                  row.original.request_response_body?.request
                );
              },
            },
          ]}
          defaultData={rows}
          dataLoading={isLoading}
          id="datasets"
          skeletonLoading={false}
          onRowSelect={(row) => {
            router.push(`/datasets/${row.id}`);
          }}
        />
        <Row className="">
          <div className="flex flex-col space-y-4 w-1/5">
            <h2 className="text-2xl font-semibold">Dataset</h2>
            <Col className="flex flex-col space-y-4">
              {rows?.map((row) => (
                <div key={row.id}>{row.id}</div>
              ))}
            </Col>
          </div>
          <div className="flex flex-col space-y-4 w-4/5">Hello</div>
        </Row>
      </div>
    </>
  );
};

export default DatasetIdPage;
