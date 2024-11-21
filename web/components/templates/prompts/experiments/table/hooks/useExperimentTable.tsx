import { useOrg } from "@/components/layout/organizationContext";
import { getJawnClient } from "../../../../../../lib/clients/jawn";
import { placeAssetIdValues } from "../../../../../../services/lib/requestTraverseHelper";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ExperimentTable = {
  id: string;
  name: string;
  experimentId: string;
  metadata: Record<string, any>;
  columns: Column[];
};

export type Column = {
  id: string;
  cells: Cell[];
  metadata: Record<string, any>;
  columnName: string;
  columnType: ColumnType;
};

export type Cell = {
  id: string;
  value: string;
  status: CellStatus;
  metadata: Record<string, any>;
  rowIndex: number;
};

export type TableCell = {
  value: string | any | null;
  cellId: string;
  status: CellStatus;
  metadata?: Record<string, any>;
};

export type TableRow = {
  id: string;
  rowIndex: number;
  cells: Record<string, TableCell>; // columnId -> TableCell
  deleted?: boolean;
};

type ColumnType = "input" | "output" | "experiment";
type CellStatus = "initialized" | "success" | "running";

export const getRequestDataByIds = async (
  orgId: string,
  requestIds: string[]
) => {
  const jawnClient = getJawnClient(orgId);
  const res = await jawnClient.POST("/v1/request/query-ids", {
    body: { requestIds },
  });
  return res.data?.data ?? [];
};

export const fetchRequestResponseBody = async (request_response: any) => {
  if (!request_response.signed_body_url) return null;
  try {
    const contentResponse = await fetch(request_response.signed_body_url);
    if (contentResponse.ok) {
      const text = await contentResponse.text();
      let content = JSON.parse(text);
      if (request_response.asset_urls) {
        content = placeAssetIdValues(request_response.asset_urls, content);
      }
      return content;
    }
  } catch (error) {
    console.error("Error fetching response body:", error);
  }
  return null;
};

export const useExperimentRequestData = (requestId?: string) => {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;

  const { data: requestsData, isLoading: isRequestsLoading } = useQuery({
    queryKey: ["experimentRequestData", orgId, requestId],
    queryFn: async () => {
      if (!orgId || !requestId) return null;
      const requestsData = await getRequestDataByIds(orgId, [requestId]);

      const responseBody = await fetchRequestResponseBody(requestsData?.[0]);
      return { ...requestsData?.[0], responseBody };
    },
  });

  return { requestsData, isRequestsLoading };
};

export const useExperimentTable = (experimentTableId: string) => {
  const org = useOrg();
  const orgId = org?.currentOrg?.id;
  const queryClient = useQueryClient();

  const { data: experimentTableQuery, isLoading: isExperimentTableLoading } =
    useQuery({
      queryKey: ["experimentTable", orgId, experimentTableId],
      queryFn: async () => {
        if (!orgId || !experimentTableId) return null;

        const jawnClient = getJawnClient(orgId);
        const res = await jawnClient.GET("/v2/experiment/{experimentId}", {
          params: {
            path: {
              experimentId: experimentTableId,
            },
          },
        });

        return res.data?.data;
      },
    });

  const { data: promptVersionsData, isLoading: isPromptVersionsLoading } =
    useQuery({
      queryKey: ["experimentPromptVersions", orgId, experimentTableId],
      queryFn: async () => {
        if (!orgId || !experimentTableId) return null;

        const jawnClient = getJawnClient(orgId);
        const res = await jawnClient.GET(
          "/v2/experiment/{experimentId}/prompt-versions",
          {
            params: {
              path: {
                experimentId: experimentTableId,
              },
            },
          }
        );
        return res.data?.data;
      },
    });

  const { data: inputKeysData, isLoading: isInputKeysLoading } = useQuery({
    queryKey: ["experimentInputKeys", orgId, experimentTableId],
    queryFn: async () => {
      if (!orgId || !experimentTableId) return null;

      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.GET(
        "/v2/experiment/{experimentId}/input-keys",
        {
          params: {
            path: {
              experimentId: experimentTableId,
            },
          },
        }
      );
      return res.data?.data;
    },
  });

  const promptSubversionId = experimentTableQuery?.original_prompt_version;

  const {
    data: promptVersionTemplateData,
    isLoading: isPromptVersionTemplateLoading,
  } = useQuery(
    ["promptVersionTemplate", promptSubversionId],
    async () => {
      if (!orgId || !promptSubversionId) {
        return null;
      }
      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.GET("/v1/prompt/version/{promptVersionId}", {
        params: {
          path: {
            promptVersionId: promptSubversionId,
          },
        },
      });
      return res.data?.data;
    },
    {
      enabled: !!promptSubversionId,
    }
  );

  const addManualRow = useMutation({
    mutationFn: async ({ inputs }: { inputs: Record<string, string> }) => {
      const jawnClient = getJawnClient(orgId);

      await jawnClient.POST("/v2/experiment/{experimentId}/add-manual-row", {
        params: { path: { experimentId: experimentTableId } },
        body: { inputs },
      });
    },
  });

  const addExperimentTableRowInsertBatch = useMutation({
    mutationFn: async ({
      rows,
    }: {
      rows: {
        inputRecordId: string;
        inputs: Record<string, string>;
      }[];
    }) => {
      const jawnClient = getJawnClient(orgId);
      await jawnClient.POST("/v2/experiment/{experimentId}/row/insert/batch", {
        params: { path: { experimentId: experimentTableId } },
        body: { rows },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["experimentTable", orgId, experimentTableId],
      });
    },
  });

  const updateExperimentTableRow = useMutation({
    mutationFn: async ({
      inputRecordId,
      inputs,
    }: {
      inputRecordId: string;
      inputs: Record<string, string>;
    }) => {
      const jawnClient = getJawnClient(orgId);
      await jawnClient.POST("/v2/experiment/{experimentId}/row/update", {
        params: { path: { experimentId: experimentTableId } },
        body: { inputRecordId, inputs },
      });
    },
    onMutate: async (variables) => {
      queryClient.setQueryData(
        ["inputs", variables.inputRecordId],
        variables.inputs
      );
    },
  });

  const runHypothesis = useMutation({
    mutationFn: async ({
      promptVersionId,
      inputRecordId,
    }: {
      promptVersionId: string;
      inputRecordId: string;
    }) => {
      const jawnClient = getJawnClient(orgId);
      const res = await jawnClient.POST(
        "/v2/experiment/{experimentId}/run-hypothesis",
        {
          params: { path: { experimentId: experimentTableId } },
          body: { promptVersionId, inputRecordId },
        }
      );

      return res.data?.data;
    },
  });

  const wrapText = useQuery({
    queryKey: ["wrapText", experimentTableId],
    queryFn: async () => {
      return false;
    },
    refetchOnWindowFocus: false,
  });

  return {
    experimentTableQuery,
    isExperimentTableLoading,
    promptVersionsData,
    isPromptVersionsLoading,
    inputKeysData,
    isInputKeysLoading,
    promptVersionTemplateData,
    isPromptVersionTemplateLoading,
    addExperimentTableRowInsertBatch,
    updateExperimentTableRow,
    runHypothesis,
    addManualRow,
    wrapText,
  };
};
